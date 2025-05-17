import mongoose from 'mongoose';
import Device from "../models/device.model";
import { EventLog } from "../models/eventLog.model";

interface GridTransaction {
  transactionId: string;
  type: 'buy' | 'sell';
  amount: number; // in kWh
  price: number; // price per kWh
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  deviceIds?: string[]; // devices involved in the transaction
}

interface GridTransactionResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  details?: any;
}

/**
 * Service for managing grid transactions including buying and selling power
 */
export class GridTransactionService {
  /**
   * Initiates a grid transaction to buy power from the grid
   * @param amount Amount of power to buy in kWh
   * @param price Price per kWh
   * @param deviceIds Optional array of device IDs involved in the transaction
   */
  async buyFromGrid(amount: number, price: number, deviceIds?: string[]): Promise<GridTransactionResponse> {
    try {
      const transaction: GridTransaction = {
        transactionId: new mongoose.Types.ObjectId().toString(),
        type: 'buy',
        amount,
        price,
        timestamp: new Date(),
        status: 'pending',
        deviceIds
      };

      // Log the transaction
      await EventLog.create({
        device_id: 'grid',
        timestamp: new Date(),
        event_type: 'gridTransaction',
        severity: 'info',
        message: `Grid buy transaction initiated: ${amount}kWh at $${price}/kWh`,
        acknowledged: false
      });

      // Here you would typically:
      // 1. Validate the transaction
      // 2. Check grid availability
      // 3. Execute the actual grid connection
      // 4. Update device states if needed

      return {
        success: true,
        transactionId: transaction.transactionId,
        message: 'Grid buy transaction initiated successfully',
        details: transaction
      };
    } catch (error: any) {
      await EventLog.create({
        device_id: 'grid',
        timestamp: new Date(),
        event_type: 'gridTransaction',
        severity: 'error',
        message: `Failed to initiate grid buy transaction: ${error.message}`,
        acknowledged: false
      });

      return {
        success: false,
        message: `Failed to initiate grid buy transaction: ${error.message}`
      };
    }
  }

  /**
   * Initiates a grid transaction to sell power to the grid
   * @param amount Amount of power to sell in kWh
   * @param price Price per kWh
   * @param deviceIds Optional array of device IDs involved in the transaction
   */
  async sellToGrid(amount: number, price: number, deviceIds?: string[]): Promise<GridTransactionResponse> {
    try {
      const transaction: GridTransaction = {
        transactionId: new mongoose.Types.ObjectId().toString(),
        type: 'sell',
        amount,
        price,
        timestamp: new Date(),
        status: 'pending',
        deviceIds
      };

      // Log the transaction
      await EventLog.create({
        device_id: 'grid',
        timestamp: new Date(),
        event_type: 'gridTransaction',
        severity: 'info',
        message: `Grid sell transaction initiated: ${amount}kWh at $${price}/kWh`,
        acknowledged: false
      });

      // Here you would typically:
      // 1. Validate the transaction
      // 2. Check available power
      // 3. Execute the actual grid connection
      // 4. Update device states if needed

      return {
        success: true,
        transactionId: transaction.transactionId,
        message: 'Grid sell transaction initiated successfully',
        details: transaction
      };
    } catch (error: any) {
      await EventLog.create({
        device_id: 'grid',
        timestamp: new Date(),
        event_type: 'gridTransaction',
        severity: 'error',
        message: `Failed to initiate grid sell transaction: ${error.message}`,
        acknowledged: false
      });

      return {
        success: false,
        message: `Failed to initiate grid sell transaction: ${error.message}`
      };
    }
  }

  /**
   * Updates the status of a grid transaction
   * @param transactionId ID of the transaction to update
   * @param status New status for the transaction
   */
  async updateTransactionStatus(transactionId: string, status: 'completed' | 'failed'): Promise<GridTransactionResponse> {
    try {
      // Here you would typically update the transaction in your database
      // For now, we'll just log the status update
      await EventLog.create({
        device_id: 'grid',
        timestamp: new Date(),
        event_type: 'gridTransaction',
        severity: 'info',
        message: `Grid transaction ${transactionId} status updated to: ${status}`,
        acknowledged: false
      });

      return {
        success: true,
        message: `Transaction status updated to ${status}`,
        details: { transactionId, status }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to update transaction status: ${error.message}`
      };
    }
  }

  /**
   * Gets the current grid status and available capacity
   */
  async getGridStatus(): Promise<GridTransactionResponse> {
    try {
      // Here you would typically:
      // 1. Check grid connection status
      // 2. Get available capacity
      // 3. Get current rates
      // For now, returning mock data
      return {
        success: true,
        message: 'Grid status retrieved successfully',
        details: {
          connected: true,
          availableCapacity: 1000, // kWh
          currentBuyRate: 0.15, // $/kWh
          currentSellRate: 0.12 // $/kWh
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to get grid status: ${error.message}`
      };
    }
  }
}

export const gridTransactionService = new GridTransactionService();
