import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
  name: String,
  device_id: { type: String, required: true, unique: true }, // Kept original field name
  deviceId: { type: String, unique: true }, // Alias for device_id if needed
  type: { 
    type: String, 
    enum: ['lighting', 'hvac', 'computers', 'kitchen', 'lab_equipment', 'other'],
    required: true
  },
  model: String,
  firmware_version: String,
  powerRating: Number, // in Watts
  priority: { 
    type: Number, 
    min: 1, // 1 = most critical
    max: 5, // 5 = least critical
    default: 3 
  },
  isControllable: Boolean,
  currentState: { type: String, enum: ['on', 'off', 'standby'], default: 'on' },
  status: String,
  location: String,
  registration_date: { type: Date, default: Date.now },
  lastUpdated: Date,
  configuration: {
    sampling_interval_sec: Number,
    calibration_date: String,
  },
});

const Device = mongoose.model('Device', DeviceSchema);
export default Device;
