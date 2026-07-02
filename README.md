# TitanBot

TitanBot is a modular Discord bot for community servers, built with Discord.js v14 and PostgreSQL. It combines moderation, utility, economy, leveling, music, welcome systems, tickets, giveaways, and custom community tools in one package.

[![Discord.js](https://img.shields.io/npm/v/discord.js?style=flat-square&labelColor=%23202225&color=%23202225&logo=npm&logoColor=white&logoWidth=20)](https://www.npmjs.com/package/discord.js)
![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-%23336791?logo=postgresql&logoColor=white&style=flat-square&logoWidth=20)

## Table of Contents

- [Features Overview](#features-overview)
- [Quick Setup](#quick-setup)
- [Manual Installation Steps](#manual-installation-steps)
- [Required Bot Intents](#bot-intents)
- [Contributing](CONTRIBUTING.md)

## Features Overview

TitanBot includes a broad suite of server management and community engagement features:

### Moderation & Administration
- Bulk ban, kick, timeout, unban, and moderation actions
- User notes and moderation case tracking
- Ticket system with claiming, prioritization, and ticket logs
- Report system for sending reports to staff

### Economy & Community Systems
- Economy wallet/bank system with work, daily, beg, pay, and gambling features
- Shop and inventory management
- Leveling and XP progression with role rewards
- Welcome and goodbye systems with configurable messages and roles

### Utility & Social Features
- AFK slash command with reason-based status and mention notifications
- Anonymous message sender through a guided slash command prompt
- Anonymous DM forwarding to a configured staff/log channel
- Todo lists, avatar lookup, server info, and user info tools

### Engagement & Events
- Giveaways with winner selection and reroll support
- Birthday tracking and announcements
- Counting game support and reaction-role systems
- Server stats and live counters

### Music
- Music playback, queue, now playing, join/leave, skip, pause, resume, and loop/shuffle controls
- Lavalink integration for streaming support

## Quick Setup

### Docker Deployment (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/codebymitch/TitanBot.git
   cd TitanBot
   ```

2. Create a `.env` file with your bot and database settings.

3. Start the containers:
   ```bash
   docker-compose up -d
   ```

This starts the bot, PostgreSQL, and Lavalink services.

### Environment Variables

```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here
GUILD_ID=your_discord_guild_id_here
POSTGRES_URL=postgresql://postgres:yourpassword@localhost:5432/titanbot
ANONYMOUS_DM_CHANNEL_ID=1522029770139897866
```

### Anonymous Message Setup

- Set `ANONYMOUS_DM_CHANNEL_ID` to the Discord channel where anonymous DM content should be forwarded.
- Users can run `/anonymous` and then type their message in the channel to send it anonymously.
- The bot also supports direct-message anonymous forwarding for users who DM the bot.

### AFK Setup

- Use `/afk set <reason>` to mark yourself AFK.
- Use `/afk remove` to clear your AFK status.
- When someone mentions an AFK user, the bot sends a notification with the AFK reason and relative time.

## Manual Installation Steps

### Prerequisites
- Node.js 18.0.0 or higher
- PostgreSQL server (recommended) or memory fallback
- Discord bot application with proper intents

1. Clone the repository:
   ```bash
   git clone https://github.com/codebymitch/TitanBot.git
   cd TitanBot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Example:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_client_id_here
   GUILD_ID=your_discord_guild_id_here

   POSTGRES_URL=postgresql://postgres:yourpassword@localhost:5432/titanbot
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=titanbot
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=yourpassword
   ANONYMOUS_DM_CHANNEL_ID=1522029770139897866
   ```

4. Verify database setup:
   ```bash
   npm run migrate:check
   ```

5. Start the bot:
   ```bash
   npm start
   ```

## Required Bot Intents

TitanBot requires the following Discord intents:
- Guilds
- Guild Messages
- Message Content
- Guild Members
- Guild Message Reactions
- Guild Voice States
- Direct Messages

### Required Permissions
- View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Messages
- Manage Channels
- Manage Roles
- Kick Members
- Ban Members
- Moderate Members
- Connect

## License

TitanBot is released under the MIT License. See [LICENSE](LICENSE) for details.

## Thank You

Thank you for choosing TitanBot for your Discord server. It is continuously improved with new features and community feedback.

*Last updated: July 2026*