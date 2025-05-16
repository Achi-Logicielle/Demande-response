import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { implementLoadShedding } from "../services/loadShed.service";


// Fastify route handler
export const loadShedHandler= async (request: FastifyRequest, reply: FastifyReply) => {
        const { targetReductionKW } = request.body as { targetReductionKW: number };
        if (typeof targetReductionKW !== 'number' || targetReductionKW <= 0) {
            return reply.status(400).send({ error: 'Invalid targetReductionKW' });
        }
        try {
            const result = await implementLoadShedding(targetReductionKW);
            return reply.send(result);
        } catch (err) {
            return reply.status(500).send({ error: 'Failed to perform load shedding' });
        }
    }