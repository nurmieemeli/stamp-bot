CREATE TABLE `guild_config` (
	`guild_id` text PRIMARY KEY NOT NULL,
	`ticket_channel_id` text,
	`ticket_support_role_id` text,
	`ticket_transcript_channel_id` text,
	`announcement_default_channel_id` text,
	`announcement_staff_role_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `log_channels` (
	`guild_id` text NOT NULL,
	`log_type` text NOT NULL,
	`channel_id` text NOT NULL,
	PRIMARY KEY(`guild_id`, `log_type`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`thread_id` text NOT NULL,
	`opener_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`claimed_by` text,
	`claimed_at` integer,
	`closed_by` text,
	`closed_at` integer,
	`close_reason` text,
	`transcript_message_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_thread_id_unique` ON `tickets` (`thread_id`);