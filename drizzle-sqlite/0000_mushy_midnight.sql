CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`sort_order` integer DEFAULT 0,
	`is_active` integer DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `data_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`import_session_id` integer NOT NULL,
	`year` integer NOT NULL,
	`state_id` integer NOT NULL,
	`statistic_id` integer NOT NULL,
	`value` real NOT NULL,
	FOREIGN KEY (`import_session_id`) REFERENCES `import_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`statistic_id`) REFERENCES `statistics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`url` text,
	`is_active` integer DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `data_sources_name_unique` ON `data_sources` (`name`);--> statement-breakpoint
CREATE TABLE `import_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`data_source_id` integer,
	`import_date` text DEFAULT CURRENT_TIMESTAMP,
	`data_year` integer,
	`record_count` integer,
	`is_active` integer DEFAULT 1,
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `magic_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `magic_links_token_unique` ON `magic_links` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_magic_links_token` ON `magic_links` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_magic_links_email` ON `magic_links` (`email`);--> statement-breakpoint
CREATE TABLE `national_averages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`statistic_id` integer NOT NULL,
	`year` integer NOT NULL,
	`value` real NOT NULL,
	`calculation_method` text DEFAULT 'arithmetic_mean' NOT NULL,
	`state_count` integer NOT NULL,
	`last_calculated` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`statistic_id`) REFERENCES `statistics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_national_average_unique` ON `national_averages` (`statistic_id`,`year`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_token` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`abbreviation` text NOT NULL,
	`is_active` integer DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `states_name_unique` ON `states` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `states_abbreviation_unique` ON `states` (`abbreviation`);--> statement-breakpoint
CREATE TABLE `statistics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ra_number` text,
	`category_id` integer NOT NULL,
	`data_source_id` integer,
	`name` text NOT NULL,
	`description` text,
	`sub_measure` text,
	`calculation` text,
	`unit` text NOT NULL,
	`available_since` text,
	`data_quality` text DEFAULT 'mock',
	`provenance` text,
	`is_active` integer DEFAULT 1,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`statistic_id` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`statistic_id`) REFERENCES `statistics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_favorites_unique` ON `user_favorites` (`user_id`,`statistic_id`);--> statement-breakpoint
CREATE TABLE `user_suggestions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_notes` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`email_verified` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);