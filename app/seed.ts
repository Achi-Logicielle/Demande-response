import mongoose from 'mongoose';
import Device from './models/device.model';
import dotenv from 'dotenv';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/microgrid';

async function seedDevices() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Optional: clear existing devices
  await Device.deleteMany({});
  console.log('🧹 Cleared existing devices');

  const devices = [
    {
      name: 'Critical Server',
      device_id: 'critical-001',
      deviceId: 'critical-001',
      type: 'computers',
      powerRating: 2000,
      priority: 1,
      isControllable: true,
      currentState: 'on',
      status: 'active',
      location: 'Server Room'
    },
    {
      name: 'HVAC Main',
      device_id: 'hvac-001',
      deviceId: 'hvac-001',
      type: 'hvac',
      powerRating: 3000,
      priority: 3,
      isControllable: true,
      currentState: 'on',
      status: 'active',
      location: 'Main Hall'
    },
    {
      name: 'Lighting Zone A',
      device_id: 'light-001',
      deviceId: 'light-001',
      type: 'lighting',
      powerRating: 500,
      priority: 4,
      isControllable: true,
      currentState: 'on',
      status: 'active',
      location: 'Zone A'
    },
    {
      name: 'Decorative Lights',
      device_id: 'decor-001',
      deviceId: 'decor-001',
      type: 'lighting',
      powerRating: 200,
      priority: 5,
      isControllable: true,
      currentState: 'on',
      status: 'active',
      location: 'Lobby'
    }
  ];

  await Device.insertMany(devices);
  console.log('🌱 Seeded devices successfully');
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

seedDevices().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
});