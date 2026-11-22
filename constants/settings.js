/**
 * Default platform settings (Build Specification §1, §3). Admins override them in
 * System settings; nothing here should be hard-coded anywhere else.
 */
export const DEFAULT_SETTINGS = {
  general: {
    // Marketing figures shown on the website — editable, never hard-coded (spec §1)
    marketing: {
      consultationFrom: 35,
      averageWaitMinutes: 15,
      doctorsCount: 120,
      countriesCount: 8,
      patientRating: 4.8,
      consultationsCount: 25000,
    },
    contact: {
      supportEmail: "care@clinicyza.com",
      phone: "+39 02 0000 0000",
      whatsapp: "+39 300 000 0000",
      address: "Via Example 1, 20121 Milan, Italy",
    },
    emergencyLine: "Medical emergency? Call 112. Clinicyza is for non-urgent care.",
    currency: "EUR",
    maintenanceMode: false,
  },
  booking: {
    holdMinutes: 10,
    leadTimeMinutes: 15,
    freeCancellationHours: 24,
    lateCancellationRefundPercent: 0,
    freeReschedules: 1,
    noShowAfterMinutes: 15,
    patientJoinMinutesBefore: 10,
  },
  commission: {
    defaultPercent: 35,
    minPercent: 30,
    maxPercent: 40,
    disputeWindowHours: 48,
  },
  chat: {
    messagingWindowDays: null, // null = always open
    attachmentMaxMb: 10,
    editWindowMinutes: 5,
    unreadEmailDelayMinutes: 10,
  },
  security: {
    adminMaxFailedLogins: 5,
    rememberDeviceDays: 30,
  },
};

export const SETTING_GROUPS = Object.keys(DEFAULT_SETTINGS);

/** Settings anyone (website, apps) may read without signing in. */
export const PUBLIC_SETTINGS = {
  general: ["marketing", "contact", "emergencyLine", "currency", "maintenanceMode"],
};
