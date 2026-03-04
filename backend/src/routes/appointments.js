import { AppointmentService } from '../services/appointmentService.js';
import { UserService } from '../services/userService.js';

export async function appointmentRoutes(fastify, options) {
  // Get available time slots (public)
  fastify.get('/masters/:masterId/slots', async (request, reply) => {
    try {
      const { masterId } = request.params;
      const { date } = request.query;

      if (!date) {
        return reply.status(400).send({ error: 'Date parameter is required' });
      }

      const slots = await AppointmentService.getAvailableSlots(masterId, date);
      return { slots };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get available slots' });
    }
  });

  // Create appointment (client)
  fastify.post('/appointments', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { masterId, serviceId, appointmentDate, startTime, notes, clientName, clientPhone } = request.body;

      if (!masterId || !serviceId || !appointmentDate || !startTime) {
        return reply.status(400).send({ 
          error: 'Master ID, service ID, appointment date and start time are required' 
        });
      }

      const appointment = await AppointmentService.create({
        master_id: masterId,
        client_id: request.user.userId,
        service_id: serviceId,
        appointment_date: appointmentDate,
        start_time: startTime,
        notes,
        client_name: clientName || request.user.firstName,
        client_phone: clientPhone
      });

      // Get master info for notification
      const master = await UserService.findById(masterId);
      
      // Send notification to master via bot
      if (master && fastify.bot) {
        await fastify.bot.sendNewAppointmentNotification(master.telegram_id, appointment);
      }

      return { success: true, appointment };
    } catch (error) {
      fastify.log.error(error);
      if (error.message === 'Time slot is already booked') {
        return reply.status(409).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Failed to create appointment' });
    }
  });

  // Get my appointments (for both master and client)
  fastify.get('/my-appointments', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      let appointments;
      
      if (request.user.role === 'master') {
        appointments = await AppointmentService.getMasterAppointments(request.user.userId);
      } else {
        appointments = await AppointmentService.getClientAppointments(request.user.userId);
      }

      return { appointments };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get appointments' });
    }
  });

  // Get today's appointments (master only)
  fastify.get('/appointments/today', { preHandler: [fastify.authenticate, fastify.requireMaster] }, async (request, reply) => {
    try {
      const appointments = await AppointmentService.getTodayAppointments(request.user.userId);
      return { appointments };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get today appointments' });
    }
  });

  // Get week's appointments (master only)
  fastify.get('/appointments/week', { preHandler: [fastify.authenticate, fastify.requireMaster] }, async (request, reply) => {
    try {
      const appointments = await AppointmentService.getWeekAppointments(request.user.userId);
      return { appointments };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get week appointments' });
    }
  });

  // Get appointment by ID
  fastify.get('/appointments/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const appointment = await AppointmentService.getById(id);

      if (!appointment) {
        return reply.status(404).send({ error: 'Appointment not found' });
      }

      // Check if user has access to this appointment
      if (appointment.master_id !== request.user.userId && 
          appointment.client_id !== request.user.userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      return { appointment };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get appointment' });
    }
  });

  // Update appointment status (master only)
  fastify.patch('/appointments/:id/status', { preHandler: [fastify.authenticate, fastify.requireMaster] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;

      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({ error: 'Invalid status' });
      }

      const appointment = await AppointmentService.getById(id);
      if (!appointment || appointment.master_id !== request.user.userId) {
        return reply.status(404).send({ error: 'Appointment not found' });
      }

      const updated = await AppointmentService.updateStatus(id, status);
      
      // Notify client about status change
      if (updated.client_id && fastify.bot) {
        const client = await UserService.findById(updated.client_id);
        if (client) {
          await fastify.bot.sendStatusUpdateNotification(client.telegram_id, updated);
        }
      }

      return { success: true, appointment: updated };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update appointment status' });
    }
  });

  // Cancel appointment (both master and client)
  fastify.post('/appointments/:id/cancel', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { reason } = request.body;

      const appointment = await AppointmentService.getById(id);
      if (!appointment) {
        return reply.status(404).send({ error: 'Appointment not found' });
      }

      // Check if user has access to cancel this appointment
      if (appointment.master_id !== request.user.userId && 
          appointment.client_id !== request.user.userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const updated = await AppointmentService.cancel(id, reason || 'No reason provided');

      // Notify the other party
      if (fastify.bot) {
        if (request.user.role === 'master' && appointment.client_id) {
          const client = await UserService.findById(appointment.client_id);
          if (client) {
            await fastify.bot.sendCancellationNotification(client.telegram_id, updated, 'master');
          }
        } else if (request.user.role === 'client') {
          const master = await UserService.findById(appointment.master_id);
          if (master) {
            await fastify.bot.sendCancellationNotification(master.telegram_id, updated, 'client');
          }
        }
      }

      return { success: true, appointment: updated };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to cancel appointment' });
    }
  });
}
