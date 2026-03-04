import { query } from '../database/connection.js';

export class ServiceService {
  static async getByMasterId(masterId) {
    const result = await query(
      `SELECT * FROM services 
       WHERE master_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [masterId]
    );
    return result.rows;
  }

  static async getById(id) {
    const result = await query(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async create(serviceData) {
    const { master_id, name, description, price, duration_minutes, color } = serviceData;
    
    const result = await query(
      `INSERT INTO services (master_id, name, description, price, duration_minutes, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [master_id, name, description, price, duration_minutes, color]
    );
    return result.rows[0];
  }

  static async update(id, serviceData) {
    const { name, description, price, duration_minutes, color, is_active } = serviceData;
    
    const result = await query(
      `UPDATE services 
       SET name = $1, description = $2, price = $3, duration_minutes = $4, color = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, description, price, duration_minutes, color, is_active, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    // Soft delete
    const result = await query(
      'UPDATE services SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async getMasterServicesWithStats(masterId) {
    const result = await query(
      `SELECT s.*, 
        COUNT(a.id) as total_appointments,
        COALESCE(SUM(CASE WHEN a.status = 'completed' THEN s.price ELSE 0 END), 0) as total_revenue
       FROM services s
       LEFT JOIN appointments a ON s.id = a.service_id
       WHERE s.master_id = $1 AND s.is_active = true
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [masterId]
    );
    return result.rows;
  }
}
