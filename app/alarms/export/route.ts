import type { NextRequest } from "next/server";
import { requireUser } from "@/features/auth/session";
import { alarmsToCsv } from "@/features/alarms/csv";
import { parseAlarmFilters } from "@/features/alarms/filters";
import { exportAlarms } from "@/features/alarms/queries";
import { csvErrorResponse, csvResponse } from "@/lib/csv";
import { bangkokToday } from "@/lib/format";
import { logLoadError } from "@/lib/log";

// CSV of the alarms matching the list filters in the URL (plan 9.4). Every
// signed-in role may export what it may read; RLS still applies to the query.
export async function GET(request: NextRequest) {
  await requireUser();
  const filters = parseAlarmFilters(Object.fromEntries(request.nextUrl.searchParams));

  try {
    const { rows, truncated } = await exportAlarms(filters);
    return csvResponse(alarmsToCsv(rows), {
      name: "alarms",
      today: bangkokToday(),
      partial: truncated,
    });
  } catch (error) {
    logLoadError("alarms export", error);
    return csvErrorResponse();
  }
}
