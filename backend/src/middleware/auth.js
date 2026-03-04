import jwt from '@fastify/jwt';
import { config } from '../config/index.js';

export async function authenticateToken(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = await request.jwtVerify();
    
    request.user = decoded;
  } catch (error) {
    return reply.status(403).send({ error: 'Invalid or expired token' });
  }
}

export function requireRole(roles) {
  return async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}

export const authMiddleware = {
  authenticate: authenticateToken,
  requireMaster: requireRole(['master']),
  requireClient: requireRole(['client']),
  requireAny: requireRole(['master', 'client'])
};
