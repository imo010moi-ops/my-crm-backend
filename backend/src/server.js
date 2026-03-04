import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config/index.js';
import { authRoutes } from './routes/auth.js';
import { serviceRoutes } from './routes/services.js';
import { appointmentRoutes } from './routes/appointments.js';
import { UserService } from './services/userService.js';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'warn' : 'info'
  }
});

// Register plugins
await fastify.register(cors, {
  origin: config.frontend.url,
  credentials: true
});

await fastify.register(jwt, {
  secret: config.jwt.secret
});

// Authentication decorator
fastify.decorate('authenticate', async function(request, reply) {
  try {
    const decoded = await request.jwtVerify();
    request.user = decoded;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

fastify.decorate('requireMaster', async function(request, reply) {
  if (request.user.role !== 'master') {
    reply.status(403).send({ error: 'Master access required' });
  }
});

fastify.decorate('requireClient', async function(request, reply) {
  if (request.user.role !== 'client') {
    reply.status(403).send({ error: 'Client access required' });
  }
});

// Bot instance decorator (will be set from bot service)
fastify.decorate('bot', null);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Get all masters (public endpoint)
fastify.get('/masters', async (request, reply) => {
  try {
    const masters = await UserService.getAllMasters();
    return { masters };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to get masters' });
  }
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(serviceRoutes, { prefix: '/api' });
await fastify.register(appointmentRoutes, { prefix: '/api' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send({ 
    error: config.nodeEnv === 'production' ? 'Internal server error' : error.message 
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 Server running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
