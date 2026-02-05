/**
 * Update a calendar event
 */

import { z } from "zod";
import { updateEvent } from "../lib/calendar-api";
import { listAccounts } from "../lib/google-auth";

export const name = "update_event";

export const description = "Update an existing calendar event. Only provide the fields you want to change.";

export const parameters = z.object({
  account: z.string().optional().describe("Account name (uses first account if not specified)"),
  calendar_id: z.string().optional().describe("Calendar ID (uses primary if not specified)"),
  event_id: z.string().describe("Event ID to update"),
  title: z.string().optional().describe("New event title"),
  start: z.string().optional().describe("New start time (ISO format)"),
  end: z.string().optional().describe("New end time (ISO format)"),
  all_day: z.boolean().optional().describe("Change to all-day event?"),
  description: z.string().optional().describe("New description (empty string to clear)"),
  location: z.string().optional().describe("New location (empty string to clear)"),
  attendees: z.array(z.string()).optional().describe("Replace attendees list"),
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

  const event = await updateEvent(accountId, calendarId, args.event_id, {
    summary: args.title,
    start: args.start,
    end: args.end,
    allDay: args.all_day,
    description: args.description,
    location: args.location,
    attendees: args.attendees,
  });

  if (!event) {
    return {
      success: false,
      error: "Failed to update event. Check if event ID is correct.",
    };
  }

  return {
    success: true,
    message: "Event updated!",
    event: {
      id: event.id,
      title: event.summary,
      start: event.start,
      end: event.end,
      location: event.location,
      link: event.htmlLink,
    },
  };
}
