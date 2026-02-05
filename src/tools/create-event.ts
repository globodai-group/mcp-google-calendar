/**
 * Create a calendar event
 */

import { z } from "zod";
import { createEvent } from "../lib/calendar-api.js";
import { listAccounts } from "../lib/google-auth.js";

export const name = "create_event";

export const description = `Create a new calendar event. 

For timed events, provide start and end as ISO datetime (e.g., "2024-01-15T14:00:00").
For all-day events, use just the date (e.g., "2024-01-15") and set all_day=true.`;

export const parameters = z.object({
  account: z.string().optional().describe("Account name (uses first account if not specified)"),
  calendar_id: z.string().optional().describe("Calendar ID (uses primary if not specified)"),
  title: z.string().describe("Event title"),
  start: z.string().describe("Start time (ISO format for timed, YYYY-MM-DD for all-day)"),
  end: z.string().describe("End time (ISO format for timed, YYYY-MM-DD for all-day)"),
  all_day: z.boolean().optional().describe("Is this an all-day event?"),
  description: z.string().optional().describe("Event description"),
  location: z.string().optional().describe("Event location"),
  attendees: z.array(z.string()).optional().describe("Email addresses of attendees"),
  add_meet: z.boolean().optional().describe("Add a Google Meet link"),
  reminder_minutes: z.number().optional().describe("Popup reminder X minutes before (e.g., 30)"),
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

  const event = await createEvent(accountId, {
    calendarId: args.calendar_id,
    summary: args.title,
    start: args.start,
    end: args.end,
    allDay: args.all_day,
    description: args.description,
    location: args.location,
    attendees: args.attendees,
    addMeet: args.add_meet,
    reminders: args.reminder_minutes
      ? [{ method: "popup", minutes: args.reminder_minutes }]
      : undefined,
  });

  if (!event) {
    return {
      success: false,
      error: "Failed to create event",
    };
  }

  return {
    success: true,
    message: "Event created!",
    event: {
      id: event.id,
      title: event.summary,
      start: event.start,
      end: event.end,
      location: event.location,
      meet_link: event.conferenceLink,
      link: event.htmlLink,
      attendees_notified: args.attendees?.length ?? 0,
    },
  };
}