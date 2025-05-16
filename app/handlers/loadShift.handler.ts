import Device from "../models/device.model";
import { EventLog } from "../models/eventLog.model";
import { implementLoadShifting } from "../services/loadShift.service";
import { priorityRules } from "../services/priorityRules.service";
import { FastifyRequest, FastifyReply } from "fastify";

/**
 * Handler to implement load shifting based on request body.
 * Expects: { deviceTypes: string[], delayMinutes: number, reductionPercent: number }
 */
export async function loadShiftHandler(
    request: FastifyRequest<{ Body: any }>,
    reply: FastifyReply
) {
    try {
        const shiftDetails = request.body;
        const result = await implementLoadShifting(shiftDetails);
        reply.status(200).send(result);
    } catch (error) {
        reply.status(500).send({ success: false, error: (error as Error).message });
    }
}
