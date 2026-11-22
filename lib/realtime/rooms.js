/**
 * Socket.IO room names — the only place they're built, so the API and the
 * realtime server always agree. Chat (conversation:<id>) is added with the chat milestone,
 * with a membership check on join and on every message (spec §3.5).
 */
export const rooms = {
  user: (userId) => `user:${userId}`,
  role: (role) => `role:${role}`,
};
