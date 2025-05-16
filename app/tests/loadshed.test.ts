import { implementLoadShedding } from '../services/loadShed.service';
import Device from '../models/device.model';
import { EventLog } from '../models/eventLog.model';

// Mock the models
jest.mock('../models/device.model');
jest.mock('../models/eventLog.model');

describe('implementLoadShedding', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should shed loads correctly when sufficient devices are available', async () => {
    // Mock devices data
    const mockDevices = [
      {
        deviceId: 'device1',
        powerRating: 1500,
        priority: 5,
        isControllable: true,
        currentState: 'on',
        save: jest.fn()
      },
      {
        deviceId: 'device2',
        powerRating: 2000,
        priority: 4,
        isControllable: true,
        currentState: 'on',
        save: jest.fn()
      }
    ];

    // Mock Device.find() implementation
    (Device.find as jest.Mock).mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockDevices)
    }));

    // Mock EventLog.create
    (EventLog.create as jest.Mock).mockResolvedValue({});

    const result = await implementLoadShedding(3); // 3kW target

    expect(result.success).toBe(true);
    expect(result.remainingReductionNeeded).toBe(0);
    expect(result.shedCommands.length).toBe(2);
    expect(Device.find).toHaveBeenCalledWith({
      isControllable: true,
      currentState: 'on'
    });
    expect(EventLog.create).toHaveBeenCalled();
  });

  it('should handle insufficient devices for required reduction', async () => {
    const mockDevices = [
      {
        deviceId: 'device1',
        powerRating: 1000,
        priority: 5,
        isControllable: true,
        currentState: 'on',
        save: jest.fn()
      }
    ];

    (Device.find as jest.Mock).mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockDevices)
    }));

    const result = await implementLoadShedding(2); // 2kW target

    expect(result.success).toBe(false);
    expect(result.remainingReductionNeeded).toBe(1);
    expect(result.shedCommands.length).toBe(1);
  });

  it('should not shed critical loads (priority 1)', async () => {
    const mockDevices = [
      {
        deviceId: 'critical-device',
        powerRating: 5000,
        priority: 1,
        isControllable: true,
        currentState: 'on',
        save: jest.fn()
      },
      {
        deviceId: 'non-critical',
        powerRating: 1000,
        priority: 5,
        isControllable: true,
        currentState: 'on',
        save: jest.fn()
      }
    ];

    (Device.find as jest.Mock).mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockDevices)
    }));

    const result = await implementLoadShedding(2); // 2kW target

    expect(result.success).toBe(false);
    expect(result.remainingReductionNeeded).toBe(1);
    expect(result.shedCommands.length).toBe(1);
    expect(result.shedCommands[0].deviceId).toBe('non-critical');
  });

  it('should handle database errors gracefully', async () => {
    (Device.find as jest.Mock).mockImplementation(() => ({
      sort: jest.fn().mockRejectedValue(new Error('DB error'))
    }));

    await expect(implementLoadShedding(2)).rejects.toThrow('DB error');
  });
});