import { query, transaction } from '../database/connection.js';
import { format, addMinutes, parseISO, startOfDay, endOfDay, addDays } from 'date-fns';

export class AppointmentService {
  static async create(appointmentData) {
    const {
      master_id,
      client_id,
      service_id,
      appointment_date,
      start_time,
      notes,
      client_name,
      client_phone
    } = appointmentData;

    // Get service duration
    const serviceResult = await query(
      'SELECT duration_minutes FROM services WHERE id = $1',
      [service_id]
    );
    const duration = serviceResult.rows[0]?.duration_minutes || 60;

    // Calculate end time
    const [hours, minutes] = start_time.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    const endDate = addMinutes(startDate, duration);
    const end_time = format(endDate, 'HH:mm');

    return await transaction(async (client) => {
      // Check if slot is available
      const existing = await client.query(
        `SELECT * FROM appointments 
         WHERE master_id = $1 
         AND appointment_date = $2 
         AND status NOT IN ('cancelled', 'no_show')
         AND (
           (start_time <= $3 AND end_time > $3) OR
           (start_time < $4 AND end_time >= $4) OR
           (start_time >= $3 AND end_time <= $4)
         )`,
        [master_id, appointment_date, start_time, end_time]
      );

      if (existing.rows.length > 0) {
        throw new Error('Time slot is already booked');
      }

      // Create appointment
      const result = await client.query(
        `INSERT INTO appointments 
         (master_id, client_id, service_id, appointment_date, start_time, end_time, notes, client_name, client_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [master_id, client_id, service_id, appointment_date, start_time, end_time, notes, client_name, client_phone]
      );

      return result.rows[0];
    });
  }

  static async getById(id) {
    const result = await query(
      `SELECT a.*, 
        s.name as service_name, s.price, s.duration_minutes,
        u.first_name as master_first_name, u.last_name as master_last_name,
        mp.business_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN users u ON a.master_id = u.id
       LEFT JOIN master_profiles mp ON u.id = mp.user_id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getMasterAppointments(masterId, filters = {}) {
    const { date_from, date_to, status, limit = 50 } = filters;
    
    let sql = `
      SELECT a.*, 
        s.name as service_name, s.price, s.duration_minutes, s.color,
        u.first_name as client_first_name, u.last_name as client_last_name, u.phone as client_phone
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.client_id = u.id
      WHERE a.master_id = $1
    `;
    const params = [masterId];
    let paramIndex = 2;

    if (date_from) {
      sql += ` AND a.appointment_date >= $${paramIndex++}`;
      params.push(date_from);
    }

    if (date_to) {
      sql += ` AND a.appointment_date <= $${paramIndex++}`;
      params.push(date_to);
    }

    if (status) {
      sql += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ` ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT $${paramIndex++}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  static async getClientAppointments(clientId) {
    const result = await query(
      `SELECT a.*, 
        s.name as service_name, s.price, s.duration_minutes,
        u.first_name as master_first_name, u.last_name as master_last_name,
        mp.business_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN users u ON a.master_id = u.id
       LEFT JOIN master_profiles mp ON u.id = mp.user_id
       WHERE a.client_id = $1
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [clientId]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  static async cancel(id, reason) {
    const result = await query(
      `UPDATE appointments 
       SET status = 'cancelled', notes = COALESCE(notes, '') || ' | Cancelled: ' || $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reason, id]
    );
    return result.rows[0];
  }

  static async getTodayAppointments(masterId) {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.getMasterAppointments(masterId, { date_from: today, date_to: today });
  }

  static async getWeekAppointments(masterId) {
    const today = new Date();
    const weekEnd = addDays(today, 7);
    return this.getMasterAppointments(masterId, {
      date_from: format(today, 'yyyy-MM-dd'),
      date_to: format(weekEnd, 'yyyy-MM-dd')
    });
  }

  static async getAvailableSlots(masterId, date) {
    // Get master's working hours for this day
    const dayOfWeek = format(parseISO(date), 'EEEE').toLowerCase();
    const masterResult = await query(
      'SELECT working_hours FROM master_profiles WHERE user_id = $1',
      [masterId]
    );
    
    if (!masterResult.rows[0]) {
      return [];
    }

    const workingHours = masterResult.rows[0].working_hours;
    const daySchedule = workingHours[dayOfWeek];

    if (!daySchedule || !daySchedule.isWorking) {
      return [];
    }

    // Get existing appointments for this date
    const appointmentsResult = await query(
      `SELECT start_time, end_time 
       FROM appointments 
       WHERE master_id = $1 
       AND appointment_date = $2
       AND status NOT IN ('cancelled', 'no_show')`,
      [masterId, date]
    );

    const bookedSlots = appointmentsResult.rows;

    // Generate available slots (30-minute intervals)
    const slots = [];
    const [startHour, startMin] = daySchedule.start.split(':').map(Number);
    const [endHour, endMin] = daySchedule.end.split(':').map(Number);
    
    let currentTime = new Date(2000, 0, 1, startHour, startMin);
    const endTime = new Date(2000, 0, 1, endHour, endMin);

    while (currentTime < endTime) {
      const slotStart = format(currentTime, 'HH:mm');
      const slotEndDate = addMinutes(currentTime, 30);
      const slotEnd = format(slotEndDate, 'HH:mm');

      // Check if slot overlaps with any booked appointment
      const isBooked = bookedSlots.some(apt => {
        return (
          (apt.start_time <= slotStart && apt.end_time > slotStart) ||
          (apt.start_time < slotEnd && apt.end_time >= slotEnd) ||
          (apt.start_time >= slotStart && apt.end_time <= slotEnd)
        );
      });

      if (!isBooked) {
        slots.push({
          time: slotStart,
          available: true
        });
      }

      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  }

  static async getUpcomingAppointmentsForReminders() {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000); // 5 min buffer

    const result = await query(
      `SELECT a.*, 
        u.telegram_id as client_telegram_id,
        s.name as service_name,
        mu.telegram_id as master_telegram_id
       FROM appointments a
       JOIN users u ON a.client_id = u.id
       JOIN users mu ON a.master_id = mu.id
       JOIN services s ON a.service_id = s.id
       WHERE a.appointment_date = CURRENT_DATE
       AND a.start_time BETWEEN $1 AND $2
       AND a.status IN ('pending', 'confirmed')
       AND a.reminder_sent = false`,
      [format(twoHoursFromNow, 'HH:mm'), format(twoHoursLater, 'HH:mm')]
    );
    return result.rows;
  }

  static async markReminderSent(id) {
    await query(
      'UPDATE appointments SET reminder_sent = true WHERE id = $1',
      [id]
    );
  }
}
