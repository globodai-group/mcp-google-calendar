/**
 * Check availability / find free slots
 */

import { z } from "zod";
import { findAvailableSlots, getFreeBusy } from "../lib/calendar-api.js";
import { listAccounts } from "../lib/google-auth.js";

export const name = "check_availability";

export const description = `Check availability and find free time slots.

Can check free/busy status or find available slots for a meeting of specified duration.`;

export const parameters = z.object({
  account: z.string().optional().describe("Account name (uses first account if not specified)"),
  calendar_ids: z.array(z.string()).optional().describe("Calendar IDs to check (uses primary if not specified)"),
  days_ahead: z.number().optional().describe("Number of days to look ahead (default: 7)"),
  duration_minutes: z.number().optional().describe("Duration of slot to find in minutes (e.g., 60 for 1 hour)"),
  working_hours_start: z.number().optional().describe("Working hours start (24h format, default: 9)"),
  working_hours_end: z.number().optional().describe("Working hours end (24h format, default: 18)"),
  time_min: z.string().optional().describe("Start time (ISO format). Overrides days_ahead."),
  time_max: z.string().optional().describe("End time (ISO format)."),
});

export async function execute(args: z.infer<typeof parameters>) {
  const accounts = await listAccounts();
  
  if (accounts.length === 0) {
    return {
      success: false,
      error: "No accounts connected. Use add_google_account first.",
    };
  }

  const accountId = args.account || accounts[0]!;
  
  if (!accounts.includes(accountId)) {
    return {
      success: false,
      error: `Account "${accountId}" not found. Available: ${accounts.join(", ")}`,
    };
  }

  const calendarIds = args.calendar_ids || ["primary"];
  const daysAhead = args.days_ahead ?? 7;

  // Calculate time range
  const now = new Date();
  const timeMin = args.time_min || now.toISOString();
  
  let timeMax = args.time_max;
  if (!timeMax) {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysAhead);
    timeMax = endDate.toISOString();
  }

  // If duration specified, find available slots
  if (args.duration_minutes) {
    const slots = await findAvailableSlots(
      accountId,
      calendarIds,
      timeMin,
      timeMax,
      args.duration_minutes,
      args.working_hours_start ?? 9,
      args.working_hours_end ?? 18
    );

    if (slots.length === 0) {
      return {
        success: true,
        message: "No available slots found in the specified time range",
        available_slots: [],
      };
    }

    return {
      success: true,
      account: accountId,
      duration_minutes: args.duration_minutes,
      available_slots: slots.map((s) => ({
        start: s.start,
        end: s.end,
        day: new Date(s.start).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        time: `${new Date(s.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - ${new Date(s.end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
      })),
    };
  }

  // Otherwise, just return free/busy info
  const busyMap = await getFreeBusy(accountId, calendarIds, timeMin, timeMax);

  const busySlots: { calendar: string; start: string; end: string }[] = [];
  for (const [calId, slots] of busyMap.entries()) {
    for (const slot of slots) {
      busySlots.push({
        calendar: calId,
        start: slot.start,
        end: slot.end,
      });
    }
  }

  return {
    success: true,
    account: accountId,
    calendars_checked: calendarIds,
    busy_slots: busySlots.length,
    busy_times: busySlots.map((b) => ({
      start: b.start,
      end: b.end,
      duration: `${Math.round((new Date(b.end).getTime() - new Date(b.start).getTime()) / 60000)} min`,
    })),
    tip: "Use duration_minutes parameter to find available slots of a specific length",
  };
}