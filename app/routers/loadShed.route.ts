import { FastifyInstance } from "fastify";
import { loadShedHandler } from "../handlers/loadShed.handler";

// Register the route
export default async function loadShedRoutes(fastify: FastifyInstance) {
    fastify.post('/load-shed', loadShedHandler);
}