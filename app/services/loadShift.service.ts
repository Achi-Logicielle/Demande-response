import Device from "../models/device.model";
import { EventLog } from "../models/eventLog.model";
import { priorityRules } from "./priorityRules.service";

/**
 * Automatically shifts the operation of controllable devices to reduce or delay their power consumption.
 *
 * How it works:
 * 1. Input:
 *    - shiftDetails: An object containing deviceTypes (array of types to shift), delayMinutes (how long to delay), and reductionPercent (optional percent power reduction).
 * 2. Device Selection:
 *    - Finds all controllable devices of the specified types that are currently ON and have priority >= 2 (does not shift critical devices).
 * 3. Shifting Loop:
 *    - For each eligible device that can be shifted (according to priorityRules):
 *      - Calculates the power reduction if a percentage is specified.
 *      - Prepares a "shift command" (delay or reduce power).
 *      - Updates the device's state in the database (e.g., sets to 'standby' and reduces powerRating if reductionPercent is given).
 *      - Tracks the shift command.
 * 4. Event Logging:
 *    - Logs the load shifting event in the EventLog collection, including details like delay, reduction, and affected devices.
 * 5. Return Value:
 *    - Returns an object indicating if any devices were shifted, how many, and the list of shift commands.
 *
 * In summary:
 * This function automates the process of delaying or reducing the power of devices to shift load,
 * updates device states, logs the event, and reports the outcome.
 */
export async function implementLoadShifting(shiftDetails:any) {
  const { deviceTypes, delayMinutes, reductionPercent } = shiftDetails;
  
  // Find devices matching the types and priority
  const devices = await Device
    .find({
      type: { $in: deviceTypes },
      isControllable: true,
      currentState: 'on',
      priority: { $gte: 2 } // Don't shift priority 1 devices
    })
    .exec();

  const shiftResults = [];
  
  for (const device of devices) {
    const rule = priorityRules[device.priority as keyof typeof priorityRules];
    
    if (rule.canShift) {
      // Calculate reduced power if percentage is specified
      const powerReduction = reductionPercent 
        ? (device.powerRating ?? 0) * (reductionPercent / 100)
        : 0;
      
      // Create shift command
      const shiftCommand = {
        deviceId: device.deviceId,
        action: 'shift',
        delayMinutes,
        powerReduction,
        priority: device.priority,
        timestamp: new Date()
      };
      
    //   // Send control command
    //   client.publish(`microgrid/device/${device.deviceId}/control`, JSON.stringify({
    //     command: 'shift',
    //     delay: delayMinutes,
    //     powerReduction: powerReduction
    //   }));
      
      // Update device state if needed
      if (reductionPercent > 0) {
        await Device.updateOne(
          { deviceId: device.deviceId },
          { $set: { 
            currentState: 'standby', 
            powerRating: (device.powerRating ?? 0) - powerReduction,
            lastUpdated: new Date() 
          }}
        );
      }
      
      shiftResults.push(shiftCommand);
    }
  }
  
// Log the shifting event using EventLog
await EventLog.create({
    device_id: 'system',
    timestamp: new Date(),
    event_type: 'loadShift',
    severity: 'info',
    message: `Load shifting initiated. Delay: ${delayMinutes}min, Reduction: ${reductionPercent ?? 0}%, Devices affected: ${shiftResults.map(d => d.deviceId).join(', ')}`,
    acknowledged: false
});
  
  
  return {
    success: shiftResults.length > 0,
    devicesShifted: shiftResults.length,
    shiftCommands: shiftResults
  };
}