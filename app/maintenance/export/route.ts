import type { NextRequest } from "next/server";
import { requireUser } from "@/features/auth/session";
import { maintenanceToCsv } from "@/features/maintenance/csv";
import { parseMaintenanceFilters } from "@/features/maintenance/filters";
import { exportMaintenance } from "@/features/maintenance/queries";
import { csvErrorResponse, csvResponse } from "@/lib/csv";
import { bangkokToday } from "@/lib/format";
import { logLoadError } from "@/lib/log";

// CSV of the maintenance records matching the list filters in the URL
// (plan 9.4). Every signed-in role may export what it may read.
export async function GET(request: NextRequest) {
  await requireUser();
  const filters = parseMaintenanceFilters(Object.fromEntries(request.nextUrl.searchParams));

  try {
    const { rows, truncated } = await exportMaintenance(filters);
    return csvResponse(maintenanceToCsv(rows), {
      name: "maintenance",
      today: bangkokToday(),
      partial: truncated,
    });
  } catch (error) {
    logLoadError("maintenance export", error);
    return csvErrorResponse();
  }
}
