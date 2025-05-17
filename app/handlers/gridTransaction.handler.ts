import { FastifyRequest, FastifyReply } from "fastify";
import { gridTransactionService } from "../services/gridTransaction.service";

interface BuyGridRequest {
  amount: number;
  price: number;
  deviceIds?: string[];
}

interface SellGridRequest {
  amount: number;
  price: number;
  deviceIds?: string[];
}

interface UpdateStatusRequest {
  transactionId: string;
  status: 'completed' | 'failed';
}

/**
 * Handler for buying power from the grid
 */
export async function buyFromGridHandler(
  request: FastifyRequest<{ Body: BuyGridRequest }>,
  reply: FastifyReply
) {
  try {
    const { amount, price, deviceIds } = request.body;
    const result = await gridTransactionService.buyFromGrid(amount, price, deviceIds);
    reply.status(200).send(result);
  } catch (error) {
    reply.status(500).send({ success: false, error: (error as Error).message });
  }
}

/**
 * Handler for selling power to the grid
 */
export async function sellToGridHandler(
  request: FastifyRequest<{ Body: SellGridRequest }>,
  reply: FastifyReply
) {
  try {
    const { amount, price, deviceIds } = request.body;
    const result = await gridTransactionService.sellToGrid(amount, price, deviceIds);
    reply.status(200).send(result);
  } catch (error) {
    reply.status(500).send({ success: false, error: (error as Error).message });
  }
}

/**
 * Handler for updating transaction status
 */
export async function updateTransactionStatusHandler(
  request: FastifyRequest<{ Body: UpdateStatusRequest }>,
  reply: FastifyReply
) {
  try {
    const { transactionId, status } = request.body;
    const result = await gridTransactionService.updateTransactionStatus(transactionId, status);
    reply.status(200).send(result);
  } catch (error) {
    reply.status(500).send({ success: false, error: (error as Error).message });
  }
}

/**
 * Handler for getting grid status
 */
export async function getGridStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await gridTransactionService.getGridStatus();
    reply.status(200).send(result);
  } catch (error) {
    reply.status(500).send({ success: false, error: (error as Error).message });
  }
} 