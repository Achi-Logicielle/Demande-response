import { Schema, model, Document } from 'mongoose';

export interface ISmartMeter extends Document {
    meter_id: string;
    timestamp: Date;
    active_energy_kwh: number;
    reactive_energy_kvarh: number;
    voltage: number;
    current: number;
    power_factor: number;
}

const SmartMeterSchema = new Schema<ISmartMeter>({
    meter_id: { type: String, required: true },
    timestamp: { type: Date, required: true },
    active_energy_kwh: { type: Number, required: true },
    reactive_energy_kvarh: { type: Number, required: true },
    voltage: { type: Number, required: true },
    current: { type: Number, required: true },
    power_factor: { type: Number, required: true }
});

export default model<ISmartMeter>('SmartMeter', SmartMeterSchema);