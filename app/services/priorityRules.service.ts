// Priority rules configuration
export const priorityRules = {
    1: { // Critical - Never turn off
      description: "Emergency systems, security, critical medical equipment",
      canShed: false,
      canShift: false
    },
    2: {
      description: "Important infrastructure (servers, network equipment)",
      canShed: false,
      canShift: true // Can delay startup or reduce power
    },
    3: {
      description: "Comfort systems (HVAC in occupied areas)",
      canShed: true,
      canShift: true,
      maxShedDuration: 30 // minutes
    },
    4: {
      description: "Non-essential lighting, recreational equipment",
      canShed: true,
      canShift: true,
      maxShedDuration: 120
    },
    5: {
      description: "Dispensable loads (decorative lighting, non-essential appliances)",
      canShed: true,
      canShift: true,
      maxShedDuration: 240
    }
  };