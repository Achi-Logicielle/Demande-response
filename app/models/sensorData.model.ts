import { Schema, model, Document } from 'mongoose';

export interface ISensorData extends Document {
    device_id: string;
    timestamp: Date;
    data: {
        voltage: number;
        current: number;
        temperature: number;
        humidity: number;
    };
}

const SensorDataSchema = new Schema<ISensorData>({
    device_id: { type: String, required: true },
    timestamp: { type: Date, required: true },
    data: {
        voltage: { type: Number, required: true },
        current: { type: Number, required: true },
        temperature: { type: Number, required: true },
        humidity: { type: Number, required: true },
    },
});

export const SensorData = model<ISensorData>('SensorData', SensorDataSchema);