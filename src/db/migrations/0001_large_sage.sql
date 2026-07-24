CREATE TABLE `moderation_cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`type` text NOT NULL,
	`target_id` text NOT NULL,
	`target_tag` text NOT NULL,
	`moderator_id` text NOT NULL,
	`reason` text,
	`duration_ms` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `guild_config` ADD `moderator_role_id` text;