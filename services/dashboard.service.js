import { connectDB } from "@/lib/db/connect";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { toPublicUser } from "./auth.service";

/**
 * Dashboard data per portal.
 * Admin figures are real counts. Doctor/patient figures are 0 until the
 * appointments / prescriptions models exist — the response shape is final.
 */

export async function getAdminDashboard(user) {
  await connectDB();
  const now = new Date();
  const [patients, doctors, admins, activeSessions, recentUsers] = await Promise.all([
    User.countDocuments({ role: "patient" }),
    User.countDocuments({ role: "doctor" }),
    User.countDocuments({ role: "admin" }),
    Session.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }),
    User.find().sort({ createdAt: -1 }).limit(5),
  ]);

  return {
    user: toPublicUser(user),
    stats: [
      { key: "patients", label: "Patients", value: patients },
      { key: "doctors", label: "Doctors", value: doctors },
      { key: "admins", label: "Admins", value: admins },
      { key: "activeSessions", label: "Active sessions", value: activeSessions },
    ],
    recentUsers: recentUsers.map((u) => ({ ...toPublicUser(u), createdAt: u.createdAt })),
  };
}

export async function getDoctorDashboard(user) {
  return {
    user: toPublicUser(user),
    stats: [
      { key: "appointmentsToday", label: "Appointments today", value: 0 },
      { key: "upcoming", label: "Upcoming", value: 0 },
      { key: "patientsSeen", label: "Patients seen", value: 0 },
      { key: "pendingNotes", label: "Notes to finish", value: 0 },
    ],
    upcomingAppointments: [],
  };
}

export async function getPatientDashboard(user) {
  return {
    user: toPublicUser(user),
    stats: [
      { key: "upcoming", label: "Upcoming consultations", value: 0 },
      { key: "past", label: "Past consultations", value: 0 },
      { key: "prescriptions", label: "Active prescriptions", value: 0 },
      { key: "documents", label: "Documents", value: 0 },
    ],
    upcomingAppointments: [],
  };
}
