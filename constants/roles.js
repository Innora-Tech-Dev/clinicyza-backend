/**
 * The three portals / user types. The role is also the URL segment:
 *   /api/v1/admin/login · /api/v1/doctor/login · /api/v1/patient/login
 */
export const ROLES = Object.freeze({
  ADMIN: "admin",
  DOCTOR: "doctor",
  PATIENT: "patient",
});

export const ROLE_LIST = Object.values(ROLES);

/** Cookie names are per role so one browser can be signed in to several portals. */
export const cookieNames = (role) => ({
  access: `cz_${role}_at`,
  refresh: `cz_${role}_rt`,
});

/** Header web portals send so tokens go into httpOnly cookies instead of the JSON body. */
export const CLIENT_HEADER = "x-client";
export const WEB_CLIENT = "web";
