import { UserService } from '../services/userService.js';
import { config } from '../config/index.js';

export async function authRoutes(fastify, options) {
  // Telegram WebApp authentication
  fastify.post('/telegram-auth', async (request, reply) => {
    try {
      const { initData } = request.body;
      
      // Verify Telegram WebApp initData
      // In production, you should validate the hash from Telegram
      const params = new URLSearchParams(initData);
      const userData = JSON.parse(params.get('user'));
      
      if (!userData || !userData.id) {
        return reply.status(400).send({ error: 'Invalid Telegram data' });
      }

      // Create or update user
      const user = await UserService.createOrUpdate({
        telegram_id: userData.id,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'client'
      });

      // Generate JWT token
      const token = fastify.jwt.sign({
        userId: user.id,
        telegramId: user.telegram_id,
        role: user.role,
        firstName: user.first_name
      });

      return {
        token,
        user: {
          id: user.id,
          telegramId: user.telegram_id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          role: user.role,
          phone: user.phone
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Authentication failed' });
    }
  });

  // Register as master
  fastify.post('/register-master', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { businessName, description, address, phone, workingHours } = request.body;

      // Update user role
      await UserService.updateRole(userId, 'master');

      // Create master profile
      const profile = await UserService.updateMasterProfile(userId, {
        business_name: businessName,
        description,
        address,
        phone,
        working_hours: workingHours
      });

      return { success: true, profile };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to register as master' });
    }
  });

  // Get current user
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = await UserService.findById(request.user.userId);
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      let profile = null;
      if (user.role === 'master') {
        profile = await UserService.getMasterProfile(user.id);
      }

      return {
        user: {
          id: user.id,
          telegramId: user.telegram_id,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          role: user.role,
          phone: user.phone
        },
        profile
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get user data' });
    }
  });

  // Update profile
  fastify.put('/profile', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const { phone, businessName, description, address, workingHours } = request.body;

      if (phone) {
        await UserService.updatePhone(userId, phone);
      }

      let profile = null;
      if (request.user.role === 'master') {
        profile = await UserService.updateMasterProfile(userId, {
          business_name: businessName,
          description,
          address,
          phone,
          working_hours: workingHours
        });
      }

      return { success: true, profile };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update profile' });
    }
  });
}
