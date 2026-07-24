# stamp-bot

Discord bot for the [stamp.rip](https://stamp.rip/) support server — announcements, moderation logging, support tickets, and punishment commands.

## Features

- **Announcements** — `/announce` posts a formatted embed to any channel, with an optional role ping and image, via a modal for the title/body.
- **Logging** — configurable per-category log channels for member events (joins/leaves), moderation events (bans/kicks/timeouts/role changes), and message events (edits/deletes).
- **Support tickets** — a button-driven ticket panel opens a private thread per user, with claim/close buttons, staff add/remove, and an HTML + in-Discord readable transcript posted on close.
- **Moderation** — `/warn`, `/timeout`, `/kick`, `/ban`, `/unban`, `/purge`, and `/modlog` (case history), backed by a persistent case log.
- **Setup wizard** — `/setup` gives a one-command interactive menu (channel/role selects) for the ticket and announcement config; `/config` covers every setting individually, including log channels and the moderator role.

## Tech stack

- TypeScript + [discord.js](https://discord.js.org/) v14
- SQLite via [`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts) + [drizzle-orm](https://orm.drizzle.team/)
- [pino](https://getpino.io/) for logging

## Prerequisites

- Node.js 20+
- A Discord application/bot token from the [Discord Developer Portal](https://discord.com/developers/applications)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your bot application** at the Discord Developer Portal, then under the **Bot** tab enable the privileged intents:
   - Server Members Intent (needed for join/leave/kick logging)
   - Message Content Intent (needed for message edit/delete logging)

3. **Invite the bot** via OAuth2 → URL Generator with scopes `bot` and `applications.commands`, and these permissions: View Channels, Send Messages, Send Messages in Threads, Create Private Threads, Manage Threads, Embed Links, Attach Files, Read Message History, Mention @everyone/roles, View Audit Log.

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in:
   | Variable | Description |
   |---|---|
   | `DISCORD_TOKEN` | Bot token from the Developer Portal |
   | `CLIENT_ID` | Application ID |
   | `GUILD_ID` | Your server's ID (commands register to this one guild) |
   | `DATABASE_PATH` | SQLite file path (default `./data/bot.sqlite`) |
   | `NODE_ENV` | `development` or `production` |
   | `LOG_LEVEL` | pino log level (default `info`) |

5. **Register slash commands**
   ```bash
   npm run deploy-commands
   ```
   Re-run this any time a command's name/options/description changes. `npm run deploy-commands:global` registers globally instead (propagates over ~1 hour) — not needed for a single-server bot.

6. **Run it**
   ```bash
   npm run dev     # runs via tsx with auto-reload on file changes
   # or for production:
   npm run build
   npm start
   ```
   Database migrations run automatically on startup.

## In-server configuration

Once the bot is running and invited, an admin runs:

```
/setup
```

for the interactive wizard (ticket channel, ticket support role, ticket transcript channel, announcement channel, announcement staff role), plus:

```
/config set-log-channel type:<member|moderation|message> channel:#...
/config set-moderator-role role:@...
/config view
```

`/config view` shows every setting with a live health check (✅ configured and permissions look right, ⚠️ needs attention — missing permissions or a deleted channel/role).

For tickets specifically, grant your support role **Manage Threads** on the ticket parent channel — Discord has no "add role to private thread" API, so this is what lets the whole team see ticket threads automatically instead of being added one by one.

## Commands

| Command | Description |
|---|---|
| `/setup` | Interactive setup wizard (channel/role select menus) |
| `/config` | Individual config subcommands + `view` |
| `/announce` | Post an announcement embed |
| `/ticket-panel` | Post the "open a ticket" button panel |
| `/ticket claim\|close\|add\|remove` | Manage the current ticket thread |
| `/warn` | Log a warning against a user |
| `/timeout` | Time out a member (e.g. `10m`, `2h`, `1d`, max 28d) |
| `/kick` | Kick a member |
| `/ban` | Ban a user (works even if they've already left) |
| `/unban` | Unban by user ID |
| `/purge` | Bulk-delete recent messages, optionally filtered to one author |
| `/modlog` | View a user's moderation case history |

## Project structure

```
src/
  commands/       # one file per slash command, grouped by feature folder
  events/         # discord.js gateway event handlers
  services/       # business logic (tickets, moderation, logging, announcements, permissions)
  db/             # drizzle schema, migrations, and per-table repositories
  ui/             # embeds, buttons/selects, modals
  utils/          # logger, duration parsing, custom IDs, theme color
scripts/
  deploy-commands.ts   # registers slash commands with Discord
  copy-migrations.js   # copies .sql migrations into dist/ on build
```

## Deployment

Run under a process manager so it survives crashes/reboots. Recommended setup: a systemd service running as a dedicated non-root user that owns `/opt/stamp-bot`, with `Restart=on-failure` and `WantedBy=multi-user.target`.

Typical update flow on the server:
```bash
git pull
npm install
npm run build
sudo chown -R stampbot:stampbot /opt/stamp-bot
npm run deploy-commands   # only needed when a command definition changed
sudo systemctl restart stamp-bot
```
