import { FastifyInstance } from "fastify";
import {
  buyFromGridHandler,
  sellToGridHandler,
  updateTransactionStatusHandler,
  getGridStatusHandler
} from "../handlers/gridTransaction.handler";

export default async function gridTransactionRoutes(fastify: FastifyInstance) {
  // Buy power from grid
  fastify.post('/grid/buy', buyFromGridHandler);

  // Sell power to grid
  fastify.post('/grid/sell', sellToGridHandler);

  // Update transaction status
  fastify.put('/grid/transaction/status', updateTransactionStatusHandler);

  // Get grid status
  fastify.get('/grid/status', getGridStatusHandler);
} 