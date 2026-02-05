/**
 * List events from a calendar
 */

import { z } from "zod";
import { listEvents } from "../lib/calendar-api.js";
import { listAccounts } from "../lib/google-auth.js";

export const name = "list_events";

export const description = "List events from a calendar. By default shows upcoming events for the next 7 days.";

export const parameters = z.object({
  account: z.string().optional().describe("Account name (uses first account if not specified)"),
  calendar_id: z.string().optional().describe("Calendar ID (uses primary if not specified)"),
  days_ahead: z.number().optional().describe("Number of days to look ahead (default: 7)"),
  max_results: z.number().optional().describe("Maximum number of events to return (default: 20)"),
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

  const calendarId = args.calendar_id || "primary";
  const daysAhead = args.days_ahead ?? 7;
  const maxResults = args.max_results ?? 20;

  // Calculate time range
  const now = new Date();
  const timeMin = args.time_min || now.toISOString();
  
  let timeMax = args.time_max;
  if (!timeMax) {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysAhead);
    timeMax = endDate.toISOString();
  }

  const events = await listEvents(accountId, calendarId, timeMin, timeMax, maxResults);

  if (events.length === 0) {
    return {
      success: true,
      account: accountId,
      calendar: calendarId,
      events: [],
      message: "No events found in the specified time range",
    };
  }

  return {
    success: true,
    account: accountId,
    calendar: calendarId,
    count: events.length,
    events: events.map((e) => ({
      id: e.id,
      title: e.summary,
      start: e.start,
      end: e.end,
      all_day: e.allDay,
      location: e.location,
      meet_link: e.conferenceLink,
      attendees: e.attendees?.length ?? 0,
      link: e.htmlLink,
    })),
  };
}