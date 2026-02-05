# 📅 Google Calendar MCP Server

[![npm version](https://img.shields.io/npm/v/@artik0din/mcp-google-calendar.svg)](https://www.npmjs.com/package/@artik0din/mcp-google-calendar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)

> A Model Context Protocol server for Google Calendar integration with OAuth2 authentication and multi-account support

## 🌟 Features

- **🔐 OAuth2 Authentication** - Secure Google account authorization
- **👥 Multi-Account Support** - Manage multiple Google accounts simultaneously  
- **📅 Full Calendar Management** - Create, read, update, and delete events
- **🕐 Availability Checking** - Find free time slots and check busy status
- **📋 Calendar Listing** - Browse available calendars per account
- **🔔 Meeting Integration** - Add Google Meet links to events
- **⏰ Smart Reminders** - Configure popup reminders
- **🎯 All-Day Events** - Support for both timed and all-day events

## 📋 Prerequisites

- Node.js >= 20
- Google Cloud Platform account with Calendar API enabled
- OAuth2 credentials (Client ID and Client Secret)

## 🚀 Quick Start

### Using npx (recommended)
```bash
npx @artik0din/mcp-google-calendar
```

### Install globally
```bash
npm install -g @artik0din/mcp-google-calendar
```

## ⚙️ Configuration

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add redirect URI: `http://localhost:3000/oauth/callback`
7. Copy the **Client ID** and **Client Secret**

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | OAuth2 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth2 Client Secret from Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | No | OAuth2 redirect URI (default: `http://localhost:3000/oauth/callback`) |

### MCP Client Setup

#### Claude Desktop / Cursor
```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "@artik0din/mcp-google-calendar"],
      "env": {
        "GOOGLE_CLIENT_ID": "your_client_id_here",
        "GOOGLE_CLIENT_SECRET": "your_client_secret_here"
      }
    }
  }
}
```

## 🔧 Available Tools

### add_google_account
Add a Google account for calendar access. Two-step process: first call to get auth URL, second call with authorization code.

**Parameters:**
- `account_name` (string, required): Friendly name for the account (e.g., 'personal', 'work')
- `auth_code` (string, optional): Authorization code from Google (after visiting auth URL)

### list_accounts
List all connected Google accounts.

**Parameters:** None

### remove_account
Remove a connected Google account.

**Parameters:**
- `account_name` (string, required): Name of account to remove

### list_calendars
List available calendars for an account.

**Parameters:**
- `account` (string, optional): Account name (uses first account if not specified)

### list_events
List events from a calendar. Shows upcoming events for the next 7 days by default.

**Parameters:**
- `account` (string, optional): Account name (uses first account if not specified)
- `calendar_id` (string, optional): Calendar ID (uses primary if not specified)
- `days_ahead` (number, optional): Number of days to look ahead (default: 7)
- `max_results` (number, optional): Maximum events to return (default: 20)
- `time_min` (string, optional): Start time (ISO format, overrides days_ahead)
- `time_max` (string, optional): End time (ISO format)

### create_event
Create a new calendar event. Supports both timed and all-day events.

**Parameters:**
- `account` (string, optional): Account name (uses first account if not specified)
- `calendar_id` (string, optional): Calendar ID (uses primary if not specified)
- `title` (string, required): Event title
- `start` (string, required): Start time (ISO format for timed, YYYY-MM-DD for all-day)
- `end` (string, required): End time (ISO format for timed, YYYY-MM-DD for all-day)
- `all_day` (boolean, optional): Is this an all-day event?
- `description` (string, optional): Event description
- `location` (string, optional): Event location
- `attendees` (array of strings, optional): Email addresses of attendees
- `add_meet` (boolean, optional): Add a Google Meet link
- `reminder_minutes` (number, optional): Popup reminder X minutes before (e.g., 30)

### update_event
Update an existing calendar event.

**Parameters:**
- `account` (string, optional): Account name (uses first account if not specified)
- `calendar_id` (string, optional): Calendar ID (uses primary if not specified)
- `event_id` (string, required): Event ID to update
- `title` (string, optional): New event title
- `start` (string, optional): New start time (ISO format)
- `end` (string, optional): New end time (ISO format)
- `all_day` (boolean, optional): Change to all-day event?
- `description` (string, optional): New description (empty string to clear)
- `location` (string, optional): New location (empty string to clear)
- `attendees` (array of strings, optional): Replace attendees list

### delete_event
Delete a calendar event.

**Parameters:**
- `account` (string, optional): Account name (uses first account if not specified)
- `calendar_id` (string, optional): Calendar ID (uses primary if not specified)
- `event_id` (string, required): Event ID to delete
- `notify_attendees` (boolean, optional): Notify attendees of cancellation (default: true)
- `confirm` (boolean, required): Must be true to confirm deletion

### check_availability
Check availability and find free time slots.

**Parameters:**
- `account` (string, optional): Account name (uses first account if not specified)
- `calendar_ids` (array of strings, optional): Calendar IDs to check (uses primary if not specified)
- `days_ahead` (number, optional): Number of days to look ahead (default: 7)
- `duration_minutes` (number, optional): Duration of slot to find in minutes (e.g., 60 for 1 hour)
- `working_hours_start` (number, optional): Working hours start (24h format, default: 9)
- `working_hours_end` (number, optional): Working hours end (24h format, default: 18)
- `time_min` (string, optional): Start time (ISO format, overrides days_ahead)
- `time_max` (string, optional): End time (ISO format)

## 🛡️ Security

- All credentials are stored securely using Google's OAuth2 flow
- Credentials are never logged or exposed in plain text
- All API calls are made over HTTPS
- Tokens are automatically refreshed when needed

## 📄 License

MIT - See LICENSE for details

## 🙏 Credits

- **Author:** Kevin Valfin
- **MCP SDK:** @modelcontextprotocol/sdk
- **Google APIs:** googleapis package
