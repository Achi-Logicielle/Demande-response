import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { gridTransactionService } from './gridTransaction.service';
import { EventLog } from '../models/eventLog.model';
import * as cbor from 'cbor';

class MQTTService {
  private client: MqttClient;
  private static instance: MQTTService;
  private readonly COMMAND_TOPIC = 'microgrid/commands';
  private readonly BATTERY_STATUS_TOPIC = 'microgrid/battery/status';
  private readonly USE_CBOR = true;

  private constructor() {
    const options: IClientOptions = {
      clientId: `demand-response-${Math.random().toString(16).slice(3)}`,
      username: 'admin',
      password: '$7$101$2KWvl9zHpWaYgcbG$ONaSwiDXEcN1o46BQ68QfRHOZeQZzn7lqf3XqGvNtM6oMVvvKFRh0uFLOUl96KDInyNhZS8vYIyN5KPZI5k1Cg==',
      clean: true,
      reconnectPeriod: 1000
    };

    this.client = mqtt.connect('mqtt://localhost:1883', options);
    this.setupEventHandlers();
    this.setupSubscriptions();
  }

  private async createEventLog(deviceId: string, eventType: string, severity: string, message: string) {
    try {
      const eventLog = new EventLog({
        device_id: deviceId,
        timestamp: new Date(),
        event_type: eventType,
        severity: severity,
        message: message,
        acknowledged: false
      });
      await eventLog.save();
      console.log(`Event logged: ${message}`);

      // Publish error events to MQTT
      if (severity === 'ERROR') {
        const errorEvent = {
          device_id: deviceId,
          timestamp: new Date(),
          event_type: eventType,
          severity: severity,
          message: message
        };

        if (this.USE_CBOR) {
          // Use CBOR for error events
          const compactEvent = {
            d: errorEvent.device_id,
            t: errorEvent.timestamp.getTime(),
            e: errorEvent.event_type,
            s: errorEvent.severity,
            m: errorEvent.message
          };
          const encoded = cbor.encode(compactEvent);
          this.client.publish('microgrid/events/error', encoded);
          console.log('Published CBOR error event to MQTT');
        } else {
          // Fallback to JSON
          this.client.publish('microgrid/events/error', JSON.stringify(errorEvent));
          console.log('Published JSON error event to MQTT');
        }
      }
    } catch (error) {
      console.error('Error creating event log:', error);
    }
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
    });

    this.client.on('error', (error) => {
      console.error('MQTT connection error:', error);
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
    });
  }

  private setupSubscriptions() {
    // Subscribe to optimization commands
    this.client.subscribe(this.COMMAND_TOPIC, (err) => {
      if (err) {
        console.error('Subscription error:', err);
        return;
      }
      console.log(`Subscribed to ${this.COMMAND_TOPIC}`);
    });

    // Subscribe to battery status updates
    this.client.subscribe(this.BATTERY_STATUS_TOPIC, (err) => {
      if (err) {
        console.error('Subscription error:', err);
        return;
      }
      console.log(`Subscribed to ${this.BATTERY_STATUS_TOPIC}`);
    });

    // Subscribe to grid buy requests
    this.client.subscribe('grid/buy/request', (err) => {
      if (err) {
        console.error('Subscription error:', err);
        return;
      }
    });

    // Subscribe to grid sell requests
    this.client.subscribe('grid/sell/request', (err) => {
      if (err) {
        console.error('Subscription error:', err);
        return;
      }
    });

    // Subscribe to grid status requests
    this.client.subscribe('grid/status/request', (err) => {
      if (err) {
        console.error('Subscription error:', err);
        return;
      }
    });

    this.client.on('message', async (topic: string, message: Buffer) => {
      try {
        if (topic === this.COMMAND_TOPIC) {
          const command = JSON.parse(message.toString());
          console.log('Received optimization command:', command);
          
          const result = await this.handleOptimizationCommand(command);
          
          // Publish command execution result
          this.client.publish(`${this.COMMAND_TOPIC}/response`, JSON.stringify({
            command_id: command._id,
            success: true,
            result: result,
            timestamp: new Date()
          }));
        }
        else if (topic === this.BATTERY_STATUS_TOPIC) {
          const batteryStatus = JSON.parse(message.toString());
          console.log('Received battery status update:', batteryStatus);
          
          // Log the battery status change
          await this.createEventLog('battery', 'BATTERY_STATUS_UPDATE', 'INFO',
              `Battery ${batteryStatus.battery_id} status changed from ${batteryStatus.old_status} to ${batteryStatus.new_status}`);
          
          // Handle battery status change
          if (batteryStatus.new_status === 'charging' || batteryStatus.new_status === 'discharging') {
            // If battery is charging or discharging, we might want to adjust grid operations
            const gridCommand = {
              _id: `grid-cmd-${Date.now()}`, // Add unique ID
              target_device_id: 'grid',
              command: {
                action: 'REQUEST_POWER',
                value: batteryStatus.new_status === 'charging' ? 5 : -5, // Example values
                unit: 'kW'
              },
              timestamp: new Date(),
              issued_by: 'demand-response'
            };
            
            try {
              // Execute grid command
              const result = await this.handleOptimizationCommand(gridCommand);
              console.log('Grid command executed successfully:', result);
            } catch (error:any) {
              console.error('Failed to execute grid command:', error);
              await this.createEventLog('grid', 'GRID_COMMAND_ERROR', 'ERROR',
                  `Failed to execute grid command for battery ${batteryStatus.battery_id}: ${error.message}`);
            }
          }
        }
        else if (topic === 'grid/buy/request') {
          const { amount, price } = JSON.parse(message.toString());
          const result = await gridTransactionService.buyFromGrid(amount, price);
          this.client.publish('grid/transaction/response', JSON.stringify(result));
        }
        else if (topic === 'grid/sell/request') {
          const { amount, price } = JSON.parse(message.toString());
          const result = await gridTransactionService.sellToGrid(amount, price);
          this.client.publish('grid/transaction/response', JSON.stringify(result));
        }
        else if (topic === 'grid/status/request') {
          const result = await gridTransactionService.getGridStatus();
          this.client.publish('grid/status/response', JSON.stringify(result));
        }
      } catch (error: any) {
        console.error('Error processing message:', error);
        if (topic === this.COMMAND_TOPIC) {
          const commandData = JSON.parse(message.toString());
          this.client.publish(`${this.COMMAND_TOPIC}/response`, JSON.stringify({
            command_id: commandData._id,
            success: false,
            error: error.message,
            timestamp: new Date()
          }));
        }
      }
    });
  }

  private async handleOptimizationCommand(command: any) {
    try {
      // Validate command format
      if (!command._id || !command.target_device_id || !command.command || !command.timestamp) {
        throw new Error('Invalid command format');
      }

      switch (command.target_device_id) {
        case 'grid':
          if (command.command.action === 'REQUEST_POWER') {
            const amount = command.command.value;
            const price = 0.15; // Default price, could be dynamic based on market conditions
            
            // Validate amount
            if (amount < 0) {
              throw new Error('Invalid power amount: cannot be negative');
            }

            const result = await gridTransactionService.buyFromGrid(amount, price);
            
            // Log the transaction
            await this.createEventLog('grid', 'GRID_TRANSACTION', 'INFO',
                `Executed grid transaction: Buy ${amount}${command.command.unit} at ${price}/kWh`);
            
            return {
              command_id: command._id,
              success: true,
              result: result
            };
          }
          break;

        case 'battery':
          if (command.command.action.startsWith('SET_BATTERY_')) {
            const action = command.command.action.replace('SET_BATTERY_', '').toLowerCase();
            const power = command.command.value;
            
            // Validate power value
            if (power < 0) {
              throw new Error('Invalid power value: cannot be negative');
            }

            // Validate action
            if (!['charging', 'discharging', 'idle'].includes(action)) {
              throw new Error(`Invalid battery action: ${action}`);
            }
            
            // Log the battery command
            await this.createEventLog('battery', 'BATTERY_COMMAND', 'INFO',
                `Executed battery command: ${action} with power ${power}${command.command.unit}`);
            
            // Here you would implement the actual battery control logic
            // For now, we'll just acknowledge the command
            return {
              command_id: command._id,
              success: true,
              result: {
                action: action,
                power: power,
                unit: command.command.unit,
                timestamp: new Date()
              }
            };
          }
          break;

        default:
          throw new Error(`Unknown device type: ${command.target_device_id}`);
      }
    } catch (error: any) {
      await this.createEventLog(command.target_device_id, 'COMMAND_ERROR', 'ERROR',
          `Failed to execute command: ${error.message}`);
      throw error;
    }
  }

  public static getInstance(): MQTTService {
    if (!MQTTService.instance) {
      MQTTService.instance = new MQTTService();
    }
    return MQTTService.instance;
  }

  public publish(topic: string, message: any) {
    this.client.publish(topic, JSON.stringify(message));
  }

  public disconnect() {
    if (this.client.connected) {
      this.client.end();
    }
  }
}

export const mqttService = MQTTService.getInstance();