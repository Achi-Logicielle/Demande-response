import { Schema, model, Document } from 'mongoose';

export interface IForecast extends Document {
    forecast_type: string;
    timestamp: Date;
    predicted_value: number;
    unit: string;
    valid_until: Date;
    source: string;
}

const ForecastSchema = new Schema<IForecast>({
    forecast_type: { type: String, required: true },
    timestamp: { type: Date, required: true },
    predicted_value: { type: Number, required: true },
    unit: { type: String, required: true },
    valid_until: { type: Date, required: true },
    source: { type: String, required: true }
});

export const Forecast = model<IForecast>('Forecast', ForecastSchema);