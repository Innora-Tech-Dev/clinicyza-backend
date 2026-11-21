import { NextResponse } from "next/server";

/** Standard success envelope: { success: true, message?, data } */
export function ok(data = null, { status = 200, message } = {}) {
  return NextResponse.json({ success: true, ...(message && { message }), data }, { status });
}

/** Standard error envelope: { success: false, error: { code, message, details? } } */
export function fail(status, code, message, details) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details && { details }) } },
    { status },
  );
}
