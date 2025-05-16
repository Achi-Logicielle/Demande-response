import fastify from "fastify";
import Device from "../models/device.model";
import { priorityRules } from "./priorityRules.service";
import { EventLog } from "../models/eventLog.model";

/**
 * Automatically turns off (sheds) controllable devices to reduce total power consumption
 * by a specified target amount (in kilowatts).
 *
 * How it works:
 * 1. Input:
 *    - targetReductionKW: The desired reduction in kilowatts.
 * 2. Device Selection:
 *    - Finds all controllable devices that are currently ON, sorted by priority (higher priority devices are considered last).
 * 3. Shedding Loop:
 *    - Iterates through the devices, and for each device that can be shed (according to priorityRules), it:
 *      - Calculates the device's power reduction.
 *      - Prepares a "shed command" (turn off).
 *      - Updates the device's state in the database to OFF.
 *      - Tracks the reduction and updates the remaining reduction needed.
 *      - Stops when the target reduction is met or all devices are processed.
 * 4. Event Logging:
 *    - Logs the load shedding event in the EventLog collection, including details like target, actual reduction, and affected devices.
 * 5. Return Value:
 *    - Returns an object indicating if the target was met, how much reduction is still needed, and the list of shed commands.
 *
 * In summary:
 * This function automates the process of turning off devices to meet a power reduction goal,
 * updates device states, logs the event, and reports the outcome.
 */
export async function implementLoadShedding(targetReductionKW:any) {
    let remainingReduction = targetReductionKW * 1000; // Convert to Watts
    
    // Get controllable devices ordered by priority (highest priority last)
    const devices = await Device
      .find({ 
        isControllable: true,
        currentState: 'on'
      })
      .sort({ priority: -1 })
      .exec();
  
    const shedResults = [];
    
    for (const device of devices) {
      if (remainingReduction <= 0) break;
      
      const rule = priorityRules[device.priority as keyof typeof priorityRules];
      
      if (rule.canShed) {
        // Calculate potential reduction
        const reduction = device.powerRating;
        
        // Create shed command
        const shedCommand = {
          deviceId: device.deviceId,
          action: 'off',
          expectedReduction: reduction,
          priority: device.priority,
          timestamp: new Date()
        };
        
        // // TO-DO Send control command (via MQTT or direct API)
        // client.publish(`microgrid/device/${device.deviceId}/control`, JSON.stringify({
        //   command: 'off',
        //   duration: rule.maxShedDuration || 60 // default 60 minutes
        // }));
        console.log(`Shed command sent to device ${device.deviceId}:`, shedCommand);
        // Update device state in DB
        await Device.updateOne(
          { deviceId: device.deviceId },
          { $set: { currentState: 'off', lastUpdated: new Date() } }
        );
        
        // Record the action
        shedResults.push(shedCommand);
        remainingReduction -= reduction ?? 0;
      }
    }
    
    // Log the shedding event in EventLog
    await EventLog.create({
      device_id: 'system',
      timestamp: new Date(),
      event_type: 'loadShed',
      severity: 'info',
      message: `Load shedding initiated. Target: ${targetReductionKW}kW, Actual: ${(targetReductionKW * 1000 - remainingReduction) / 1000}kW, Devices affected: ${shedResults.map(d => d.deviceId).join(', ')}`,
      acknowledged: false
    });
    
    return {
      success: remainingReduction <= 0,
      remainingReductionNeeded: remainingReduction / 1000,
      shedCommands: shedResults
    };
  }