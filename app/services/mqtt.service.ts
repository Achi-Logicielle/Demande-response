import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { gridTransactionService } from './gridTransaction.service';

class MQTTService {
  private client: MqttClient;
  private static instance: MQTTService;

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

  public static getInstance(): MQTTService {
    if (!MQTTService.instance) {
      MQTTService.instance = new MQTTService();
    }
    return MQTTService.instance;
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Connected to MQTT broker');
    });

    this.client.on('error', (error: Error) => {
      console.error('MQTT Error:', error);
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
    });
  }

  private setupSubscriptions() {
    // Subscribe to grid buy requests
    this.client.subscribe('grid/buy/request', (err) => {
      if (err) {
        console.error('Subscription error:', err);
        return;
      }
    });

    this.client.on('message', async (topic: string, message: Buffer) => {
      if (topic === 'grid/buy/request') {
        try {
          const { amount, price } = JSON.parse(message.toString());
          const result = await gridTransactionService.buyFromGrid(amount, price);
          this.client.publish('grid/transaction/response', JSON.stringify(result));
        } catch (error) {
          this.client.publish('grid/transaction/response', JSON.stringify({
            success: false,
            message: 'Failed to process buy request'
          }));
        }
      }
    });

    // Subscribe to grid sell requests
    this.client.subscribe('grid/sell/request', (err) => {
      if (err) {
        console.error('Subscription error:', err);
        return;
      }
    });

    this.client.on('message', async (topic: string, message: Buffer) => {
      console.log(JSON.parse(message.toString()))
      if (topic === 'grid/sell/request') {
        try {
          const { amount, price } = JSON.parse(message.toString());
          const result = await gridTransactionService.sellToGrid(amount, price);
          this.client.publish('grid/transaction/response', JSON.stringify(result));
        } catch (error) {
          this.client.publish('grid/transaction/response', JSON.stringify({
            success: false,
            message: 'Failed to process sell request'
          }));
        }
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
      if (topic === 'grid/status/request') {
        try {
          const result = await gridTransactionService.getGridStatus();
          this.client.publish('grid/status/response', JSON.stringify(result));
        } catch (error) {
          this.client.publish('grid/status/response', JSON.stringify({
            success: false,
            message: 'Failed to get grid status'
          }));
        }
      }
    });
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