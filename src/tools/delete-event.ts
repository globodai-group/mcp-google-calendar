/**
 * Delete a calendar event
 */

import { z } from "zod";
import { deleteEvent, getEvent } from "../lib/calendar-api";
import { listAccounts } from "../lib/google-auth";

export const name = "delete_event";

export const description = "Delete a calendar event.";

export const parameters = z.object({
  account: z.string().optional().describe("Account name (uses first account if not specified)"),
  calendar_id: z.string().optional().describe("Calendar ID (uses primary if not specified)"),
  event_id: z.string().describe("Event ID to delete"),
  notify_attendees: z.boolean().optional().describe("Notify attendees of cancellation (default: true)"),
  confirm: z.boolean().describe("Must be true to confirm deletion"),
});

export async function execute(args: z.infer<typeof parameters>) {
  if (!args.confirm) {
    return {
      success: false,
      error: "You must set confirm=true to delete the event",
    };
  }

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

  // Get event details first for confirmation message
  const event = await getEvent(accountId, calendarId, args.event_id);
  
  const deleted = await deleteEvent(
    accountId,
    calendarId,
    args.event_id,
    args.notify_attendees ?? true
  );

  if (!deleted) {
    return {
      success: false,
      error: "Failed to delete event. Check if event ID is correct.",
    };
  }

  return {
    success: true,
    message: `Event "${event?.summary ?? args.event_id}" deleted`,
    attendees_notified: (args.notify_attendees ?? true) && (event?.attendees?.length ?? 0) > 0,
  };
}
