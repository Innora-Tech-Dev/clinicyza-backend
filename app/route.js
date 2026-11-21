import { NextResponse } from "next/server";
import { ROLE_LIST } from "@/constants/roles";

// GET / — API index
export function GET() {
  return NextResponse.json({
    name: "Clinicyza API",
    version: "v1",
    baseUrl: "/api/v1",
    roles: ROLE_LIST,
    health: "/api/health",
    docs: "See docs/API.md in the clinicyza-server repository",
  });
}
