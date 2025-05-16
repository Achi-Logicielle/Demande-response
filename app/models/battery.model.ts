import { Schema, model, Document } from 'mongoose';

export interface IBattery extends Document {
    battery_id: string;
    timestamp: Date;
    soc: number;
    soh: number;
    temperature: number;
    status: 'charging' | 'discharging' | 'idle' | string;
}

const BatterySchema = new Schema<IBattery>({
    battery_id: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true },
    soc: { type: Number, required: true },
    soh: { type: Number, required: true },
    temperature: { type: Number, required: true },
    status: { type: String, required: true, enum: ['charging', 'discharging', 'idle'], default: 'idle' }
});

export const Battery = model<IBattery>('Battery', BatterySchema);