CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`object_key` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_files_owner` ON `files` (`owner`);--> statement-breakpoint
CREATE TABLE `records` (
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`payload` text NOT NULL,
	`updated` integer NOT NULL,
	PRIMARY KEY(`owner`, `kind`, `id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`unit_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`note` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reservations_owner_unit` ON `reservations` (`owner`,`unit_id`,`status`);