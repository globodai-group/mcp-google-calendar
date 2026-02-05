/**
 * Google Calendar API Wrapper
 */

import { google, calendar_v3 } from "googleapis";
import { getAuthenticatedClient, listAccounts } from "./google-auth.js";

export interface CalendarInfo {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  accessRole: string;
}

export interface EventInfo {
  id: string;
  calendarId: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  allDay: boolean;
  status: string;
  htmlLink?: string;
  attendees?: { email: string; responseStatus: string }[];
  conferenceLink?: string;
}

export interface CreateEventParams {
  calendarId?: string; // Default: primary
  summary: string;
  description?: string;
  location?: string;
  start: string; // ISO string or date (YYYY-MM-DD for all-day)
  end: string;
  allDay?: boolean;
  attendees?: string[]; // Email addresses
  addMeet?: boolean; // Add Google Meet link
  reminders?: { method: "email" | "popup"; minutes: number }[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

/**
 * Get Calendar API for an account
 */
async function getCalendarApi(accountId: string): Promise<calendar_v3.Calendar | null> {
  const client = await getAuthenticatedClient(accountId);
  if (!client) {
    return null;
  }
  return google.calendar({ version: "v3", auth: client });
}

/**
 * List all calendars for an account
 */
export async function listCalendars(accountId: string): Promise<CalendarInfo[]> {
  const api = await getCalendarApi(accountId);
  if (!api) return [];

  try {
    const response = await api.calendarList.list();
    const items = response.data.items || [];

    return items.map((cal) => ({
      id: cal.id!,
      summary: cal.summary || "Untitled",
      description: cal.description,
      primary: cal.primary,
      backgroundColor: cal.backgroundColor,
      accessRole: cal.accessRole || "reader",
    }));
  } catch (error) {
    console.error(`[calendar-api] Failed to list calendars for ${accountId}:`, error);
    return [];
  }
}

/**
 * List events from a calendar
 */
export async function listEvents(
  accountId: string,
  calendarId: string = "primary",
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 50
): Promise<EventInfo[]> {
  const api = await getCalendarApi(accountId);
  if (!api) return [];

  try {
    const params: calendar_v3.Params$Resource$Events$List = {
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    };

    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;

    const response = await api.events.list(params);
    const items = response.data.items || [];

    return items.map((event) => ({
      id: event.id!,
      calendarId,
      summary: event.summary || "No title",
      description: event.description ,
      location: event.location ,
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      allDay: !!event.start?.date,
      status: event.status || "confirmed",
      htmlLink: event.htmlLink || undefined,
      attendees: event.attendees?.map((a) => ({
        email: a.email!,
        responseStatus: a.responseStatus || "needsAction",
      })),
      conferenceLink: event.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri,
    }));
  } catch (error) {
    console.error(`[calendar-api] Failed to list events:`, error);
    return [];
  }
}

/**
 * Get a single event
 */
export async function getEvent(
  accountId: string,
  calendarId: string,
  eventId: string
): Promise<EventInfo | null> {
  const api = await getCalendarApi(accountId);
  if (!api) return null;

  try {
    const response = await api.events.get({ calendarId, eventId });
    const event = response.data;

    return {
      id: event.id!,
      calendarId,
      summary: event.summary || "No title",
      description: event.description ,
      location: event.location ,
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      allDay: !!event.start?.date,
      status: event.status || "confirmed",
      htmlLink: event.htmlLink || undefined,
      attendees: event.attendees?.map((a) => ({
        email: a.email!,
        responseStatus: a.responseStatus || "needsAction",
      })),
      conferenceLink: event.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri,
    };
  } catch (error) {
    console.error(`[calendar-api] Failed to get event:`, error);
    return null;
  }
}

/**
 * Create a new event
 */
export async function createEvent(
  accountId: string,
  params: CreateEventParams
): Promise<EventInfo | null> {
  const api = await getCalendarApi(accountId);
  if (!api) return null;

  const calendarId = params.calendarId || "primary";

  try {
    const eventBody: calendar_v3.Schema$Event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
    };

    // Handle all-day vs timed events
    if (params.allDay) {
      eventBody.start = { date: params.start.split("T")[0] };
      eventBody.end = { date: params.end.split("T")[0] };
    } else {
      eventBody.start = { dateTime: params.start };
      eventBody.end = { dateTime: params.end };
    }

    // Attendees
    if (params.attendees?.length) {
      eventBody.attendees = params.attendees.map((email) => ({ email }));
    }

    // Google Meet
    if (params.addMeet) {
      eventBody.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    // Reminders
    if (params.reminders?.length) {
      eventBody.reminders = {
        useDefault: false,
        overrides: params.reminders,
      };
    }

    const response = await api.events.insert({
      calendarId,
      requestBody: eventBody,
      conferenceDataVersion: params.addMeet ? 1 : 0,
      sendUpdates: params.attendees?.length ? "all" : "none",
    });

    const event = response.data;

    return {
      id: event.id!,
      calendarId,
      summary: event.summary || params.summary,
      description: event.description ,
      location: event.location ,
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      allDay: !!event.start?.date,
      status: event.status || "confirmed",
      htmlLink: event.htmlLink || undefined,
      attendees: event.attendees?.map((a) => ({
        email: a.email!,
        responseStatus: a.responseStatus || "needsAction",
      })),
      conferenceLink: event.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri,
    };
  } catch (error) {
    console.error(`[calendar-api] Failed to create event:`, error);
    return null;
  }
}

/**
 * Update an event
 */
export async function updateEvent(
  accountId: string,
  calendarId: string,
  eventId: string,
  updates: Partial<CreateEventParams>
): Promise<EventInfo | null> {
  const api = await getCalendarApi(accountId);
  if (!api) return null;

  try {
    // Get existing event first
    const existing = await api.events.get({ calendarId, eventId });
    const eventBody = existing.data;

    // Apply updates
    if (updates.summary) eventBody.summary = updates.summary;
    if (updates.description !== undefined) eventBody.description = updates.description;
    if (updates.location !== undefined) eventBody.location = updates.location;

    if (updates.start && updates.end) {
      if (updates.allDay) {
        eventBody.start = { date: updates.start.split("T")[0] };
        eventBody.end = { date: updates.end.split("T")[0] };
      } else {
        eventBody.start = { dateTime: updates.start };
        eventBody.end = { dateTime: updates.end };
      }
    }

    if (updates.attendees) {
      eventBody.attendees = updates.attendees.map((email) => ({ email }));
    }

    const response = await api.events.update({
      calendarId,
      eventId,
      requestBody: eventBody,
      sendUpdates: updates.attendees ? "all" : "none",
    });

    const event = response.data;

    return {
      id: event.id!,
      calendarId,
      summary: event.summary || "No title",
      description: event.description ,
      location: event.location ,
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      allDay: !!event.start?.date,
      status: event.status || "confirmed",
      htmlLink: event.htmlLink || undefined,
      attendees: event.attendees?.map((a) => ({
        email: a.email!,
        responseStatus: a.responseStatus || "needsAction",
      })),
      conferenceLink: event.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri,
    };
  } catch (error) {
    console.error(`[calendar-api] Failed to update event:`, error);
    return null;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(
  accountId: string,
  calendarId: string,
  eventId: string,
  notifyAttendees: boolean = true
): Promise<boolean> {
  const api = await getCalendarApi(accountId);
  if (!api) return false;

  try {
    await api.events.delete({
      calendarId,
      eventId,
      sendUpdates: notifyAttendees ? "all" : "none",
    });
    return true;
  } catch (error) {
    console.error(`[calendar-api] Failed to delete event:`, error);
    return false;
  }
}

/**
 * Get free/busy information
 */
export async function getFreeBusy(
  accountId: string,
  calendarIds: string[],
  timeMin: string,
  timeMax: string
): Promise<Map<string, TimeSlot[]>> {
  const api = await getCalendarApi(accountId);
  if (!api) return new Map();

  try {
    const response = await api.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: calendarIds.map((id) => ({ id })),
      },
    });

    const result = new Map<string, TimeSlot[]>();
    const calendars = response.data.calendars || {};

    for (const [calId, data] of Object.entries(calendars)) {
      const busy = (data as any).busy || [];
      result.set(
        calId,
        busy.map((b: any) => ({ start: b.start, end: b.end }))
      );
    }

    return result;
  } catch (error) {
    console.error(`[calendar-api] Failed to get free/busy:`, error);
    return new Map();
  }
}

/**
 * Find available slots
 */
export async function findAvailableSlots(
  accountId: string,
  calendarIds: string[],
  timeMin: string,
  timeMax: string,
  durationMinutes: number,
  workingHoursStart: number = 9, // 9 AM
  workingHoursEnd: number = 18 // 6 PM
): Promise<TimeSlot[]> {
  const busyMap = await getFreeBusy(accountId, calendarIds, timeMin, timeMax);
  
  // Merge all busy times
  const allBusy: TimeSlot[] = [];
  for (const slots of busyMap.values()) {
    allBusy.push(...slots);
  }
  
  // Sort by start time
  allBusy.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  
  // Find gaps
  const available: TimeSlot[] = [];
  const minDate = new Date(timeMin);
  const maxDate = new Date(timeMax);
  const durationMs = durationMinutes * 60 * 1000;
  
  let current = new Date(minDate);
  
  while (current < maxDate) {
    const dayStart = new Date(current);
    dayStart.setHours(workingHoursStart, 0, 0, 0);
    
    const dayEnd = new Date(current);
    dayEnd.setHours(workingHoursEnd, 0, 0, 0);
    
    // Skip if current is before working hours
    if (current < dayStart) {
      current = dayStart;
    }
    
    // Skip if past working hours for this day
    if (current >= dayEnd) {
      current = new Date(current);
      current.setDate(current.getDate() + 1);
      current.setHours(workingHoursStart, 0, 0, 0);
      continue;
    }
    
    // Find next busy slot
    const nextBusy = allBusy.find(
      (b) => new Date(b.start) > current && new Date(b.start) < dayEnd
    );
    
    const slotEnd = nextBusy
      ? new Date(Math.min(new Date(nextBusy.start).getTime(), dayEnd.getTime()))
      : dayEnd;
    
    // Check if slot is long enough
    if (slotEnd.getTime() - current.getTime() >= durationMs) {
      available.push({
        start: current.toISOString(),
        end: new Date(current.getTime() + durationMs).toISOString(),
      });
    }
    
    // Move to after the busy slot
    if (nextBusy) {
      current = new Date(nextBusy.end);
    } else {
      current = new Date(current);
      current.setDate(current.getDate() + 1);
      current.setHours(workingHoursStart, 0, 0, 0);
    }
  }
  
  return available.slice(0, 10); // Return max 10 slots
}