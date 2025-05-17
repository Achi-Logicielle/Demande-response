import { FastifyInstance } from 'fastify';
import loadShedRoutes from './loadShed.route';
import loadShiftRoutes from './loadShift.route';
import gridTransactionRoutes from './gridTransaction.route';

// Register routers
export default async function indexRoutes(fastify: FastifyInstance) {
    fastify.register(loadShedRoutes);
    fastify.register(loadShiftRoutes);
    fastify.register(gridTransactionRoutes);
}
