import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    user_id: string;
    username: string;
    role: 'admin' | 'user' | string;
    password_hash: string;
    created_at: Date;
}

const UserSchema = new Schema<IUser>({
    user_id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    password_hash: { type: String, required: true },
    created_at: { type: Date, required: true, default: Date.now }
});

export const UserModel = model<IUser>('User', UserSchema);