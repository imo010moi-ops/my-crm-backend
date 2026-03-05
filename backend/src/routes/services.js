import { ServiceService } from '../services/serviceService.js';

export async function serviceRoutes(fastify, options) {
  // Get all services for a master (public)
  fastify.get('/master/:masterId/services', async (request, reply) => {
    try {
      const { masterId } = request.params;
      const services = await ServiceService.getByMasterId(masterId);
      return { services };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get services' });
    }
  });

  // Get my services (master only)
  fastify.get('/services', async (request, reply) => {
  try {
    // Получаем вообще все услуги из базы для теста
    const services = await ServiceService.getAll(); 
    return { services };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to get services' });
  }
});
  fastify.get('/my-services', { preHandler: [fastify.authenticate, fastify.requireMaster] }, async (request, reply) => {
    try {
      const services = await ServiceService.getByMasterId(request.user.userId);
      return { services };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get services' });
    }
  });

  // Create service (master only)
  fastify.post('/services', { preHandler: [fastify.authenticate, fastify.requireMaster] }, async (request, reply) => {
    try {
      const { name, description, price, durationMinutes, color } = request.body;

      if (!name || !price || !durationMinutes) {
        return reply.status(400).send({ error: 'Name, price and duration are required' });
      }

      const service = await ServiceService.create({
        master_id: request.user.userId,
        name,
        description,
        price,
        duration_minutes: durationMinutes,
        color: color || '#3B82F6'
      });

      return { success: true, service };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create service' });
    }
  });

  // Update service (master only)
  fastify.put('/services/:id', { preHandler: [fastify.authenticate, fastify.requireMaster] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const service = await ServiceService.getById(id);

      if (!service || service.master_id !== request.user.userId) {
        return reply.status(404).send({ error: 'Service not found' });
      }

      const updated = await ServiceService.update(id, request.body);
      return { success: true, service: updated };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update service' });
    }
  });

  // Delete service (master only)
  fastify.delete('/services/:id', { preHandler: [fastify.authenticate, fastify.requireMaster] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const service = await ServiceService.getById(id);

      if (!service || service.master_id !== request.user.userId) {
        return reply.status(404).send({ error: 'Service not found' });
      }

      await ServiceService.delete(id);
      return { success: true, message: 'Service deleted' };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to delete service' });
    }
  });

  // Get service statistics (master only)
  fastify.get('/services/stats', { preHandler: [fastify.authenticate, fastify.requireMaster] }, async (request, reply) => {
    try {
      const services = await ServiceService.getMasterServicesWithStats(request.user.userId);
      return { services };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get service statistics' });
    }
  });
}
