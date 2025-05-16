import { Schema, model, Document } from 'mongoose';

export interface IGridTransaction extends Document {
    timestamp: Date;
    direction: 'export' | 'import';
    power_kw: number;
    tariff: number;
}

const GridTransactionSchema = new Schema<IGridTransaction>({
    timestamp: { type: Date, required: true },
    direction: { type: String, enum: ['export', 'import'], required: true },
    power_kw: { type: Number, required: true },
    tariff: { type: Number, required: true }
});

export const GridTransaction = model<IGridTransaction>('GridTransaction', GridTransactionSchema);