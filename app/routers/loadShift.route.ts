import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { loadShiftHandler } from "../handlers/loadShift.handler";

export default async function loadShiftRoutes(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.post("/load-shift", loadShiftHandler);
}