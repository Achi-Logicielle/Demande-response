import dotenv from 'dotenv';
import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import indexRoutes from './routers/index.route';
import connectDB from './models/db';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
// Type extensions for JWT
dotenv.config();

const app: FastifyInstance = fastify({ logger: true });

// JWT Setup
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'default_secret_should_be_in_env', // Always provide fallback for TypeScript
  sign: {
    expiresIn: '1h' // Recommended to set expiration
  }
});

// Replace your current authenticate decorator with this:
app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }
    request.user = await app.jwt.verify(token);
  } catch (err:any) {
    reply.status(401).send({ error: 'Unauthorized', message: err.message });
  }
});
// Add this after your JWT setup but before route registration
app.addHook('onRequest', async (request, reply) => {
  // Skip authentication for certain routes (optional)
  const publicRoutes = ['/public', '/login', '/health'];
  if (publicRoutes.includes(request.url)) {
    return;
  }

  // Authenticate all other requests
  await app.authenticate(request, reply);
  
  // If authentication failed, the hook will stop here
  if (reply.statusCode === 401) {
    return;
  }
});
// Routes
app.register(indexRoutes, { prefix: '/' });

const start = async () => {
  try {
    // Database connection
    await connectDB(); // Make sure connectDB returns a Promise
    
    // CORS setup (consider restricting origin in production)
    await app.register(fastifyCors, {
      origin: process.env.NODE_ENV === 'development' ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || [],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true // If you need to send cookies/auth headers
    });

    // Server startup
    await app.listen({
      port: Number(process.env.PORT) || 3002,
      host: process.env.HOST || '0.0.0.0' // Important for Docker/containerization
    });

    const address = app.server.address();
    if (typeof address === 'string') {
      app.log.info(`Server listening on ${address}`);
    } else if (address && typeof address === 'object') {
      app.log.info(`Server listening on port ${address.port}`);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();