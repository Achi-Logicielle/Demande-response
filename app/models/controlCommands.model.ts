import { Schema, model, Document } from 'mongoose';

interface Command {
    action: string;
    value: number;
    unit: string;
}

export interface ControlCommandDocument extends Document {
    target_device_id: string;
    issued_by: string;
    timestamp: Date;
    command: Command;
    status: string;
}

const CommandSchema = new Schema<Command>(
    {
        action: { type: String, required: true },
        value: { type: Number, required: true },
        unit: { type: String, required: true },
    },
    { _id: false }
);

const ControlCommandSchema = new Schema<ControlCommandDocument>({
    target_device_id: { type: String, required: true },
    issued_by: { type: String, required: true },
    timestamp: { type: Date, required: true },
    command: { type: CommandSchema, required: true },
    status: { type: String, required: true },
});

export default model<ControlCommandDocument>('ControlCommand', ControlCommandSchema);