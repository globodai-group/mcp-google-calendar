# MCP Google Calendar Server

[![npm version](https://badge.fury.io/js/@artik0din/mcp-google-calendar.svg)](https://www.npmjs.com/package/@artik0din/mcp-google-calendar)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

A powerful [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for Google Calendar integration. Provides comprehensive calendar management with OAuth2 authentication, multi-account support, and secure token encryption.

## 🚀 Features

- **🔐 OAuth2 Authentication** - Secure Google Calendar access
- **👥 Multi-Account Support** - Manage multiple Google accounts
- **📅 Full Calendar Management** - Events, calendars, availability
- **🔒 Token Encryption** - Secure local token storage
- **⏰ Smart Scheduling** - Find free slots and check availability  
- **🎯 Meet Integration** - Automatic Google Meet link generation
- **📧 Attendee Management** - Invite and notify attendees
- **🔔 Reminders** - Custom reminder settings

## 📦 Quick Start

### Install and Run

```bash
# Install globally
npm install -g @artik0din/mcp-google-calendar

# Or run directly with npx
npx @artik0din/mcp-google-calendar
```

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Desktop application** as application type
6. Note your `client_id` and `client_secret`

### Environment Configuration

```bash
# Required environment variables
export GOOGLE_CLIENT_ID="your_oauth_client_id"
export GOOGLE_CLIENT_SECRET="your_oauth_client_secret"

# Optional
export GOOGLE_REDIRECT_URI="urn:ietf:wg:oauth:2.0:oob"
export MCP_MASTER_KEY="your_encryption_key"
```

Or copy `.env.example` to `.env` and fill in your values.

## 🛠️ MCP Client Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-calendar": {
      "command": "npx",
      "args": ["@artik0din/mcp-google-calendar"],
      "env": {
        "GOOGLE_CLIENT_ID": "your_client_id",
        "GOOGLE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Other MCP Clients

The server communicates via stdio and follows the MCP protocol. Set up the executable path and environment variables according to your client's configuration format.

## 📋 Available Tools

### 🔑 Account Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `add_google_account` | Connect a Google account | `account_name`, `auth_code?` |
| `list_google_accounts` | List connected accounts | None |
| `remove_google_account` | Remove an account | `account_name`, `confirm` |

### 📅 Calendar Operations

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_calendars` | List all calendars | `account?` |
| `list_events` | Get calendar events | `account?`, `calendar_id?`, `days_ahead?`, `max_results?`, `time_min?`, `time_max?` |
| `create_event` | Create new event | `title`, `start`, `end`, `account?`, `calendar_id?`, `all_day?`, `description?`, `location?`, `attendees?`, `add_meet?`, `reminder_minutes?` |
| `update_event` | Update existing event | `event_id`, `account?`, `calendar_id?`, `title?`, `start?`, `end?`, `all_day?`, `description?`, `location?`, `attendees?` |
| `delete_event` | Delete event | `event_id`, `confirm`, `account?`, `calendar_id?`, `notify_attendees?` |

### ⏰ Availability & Scheduling

| Tool | Description | Parameters |
|------|-------------|------------|
| `check_availability` | Find free slots or check busy times | `account?`, `calendar_ids?`, `days_ahead?`, `duration_minutes?`, `working_hours_start?`, `working_hours_end?`, `time_min?`, `time_max?` |

## 💡 Usage Examples

### First-time Setup

```bash
# 1. Connect your Google account
add_google_account account_name="work"
# Follow the auth URL and get the authorization code
add_google_account account_name="work" auth_code="4/xxx..."

# 2. List your calendars
list_calendars account="work"
```

### Create Events

```bash
# Simple event
create_event title="Team Meeting" start="2024-01-15T14:00:00" end="2024-01-15T15:00:00"

# All-day event
create_event title="Conference" start="2024-01-15" end="2024-01-16" all_day=true

# Event with attendees and Google Meet
create_event title="Project Review" start="2024-01-15T10:00:00" end="2024-01-15T11:00:00" attendees=["alice@company.com", "bob@company.com"] add_meet=true
```

### Find Available Time

```bash
# Find 1-hour slots in the next 5 days
check_availability duration_minutes=60 days_ahead=5

# Check specific time range with custom working hours
check_availability duration_minutes=30 time_min="2024-01-15T08:00:00" time_max="2024-01-15T18:00:00" working_hours_start=8 working_hours_end=18
```

## 🔒 Security & Privacy

- **Local Token Storage**: OAuth tokens are encrypted and stored locally in `~/.mcp-google-calendar/`
- **AES-256-GCM Encryption**: Military-grade encryption for sensitive data
- **No Cloud Dependencies**: All data stays on your machine
- **OAuth2 Best Practices**: Secure authentication flow with refresh tokens
- **Minimal Permissions**: Only requests necessary Calendar API scopes

## 🏗️ Development

```bash
# Clone and setup
git clone https://github.com/artik0din/mcp-google-calendar.git
cd mcp-google-calendar
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

## 📄 License

MIT © 2026 Kevin Valfin

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines and submit PRs to the main branch.

## 🐛 Issues

Found a bug? Please file an issue on [GitHub](https://github.com/artik0din/mcp-google-calendar/issues) with:
- Node.js version
- Operating system  
- Error messages/logs
- Steps to reproduce

## 🔗 Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Claude Desktop](https://claude.ai/desktop)
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers)