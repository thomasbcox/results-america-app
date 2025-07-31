CREATE TABLE `csv_import_metadata` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`csv_import_id` integer NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`data_type` text DEFAULT 'string' NOT NULL,
	`is_required` integer DEFAULT 0 NOT NULL,
	`validation_rule` text,
	FOREIGN KEY (`csv_import_id`) REFERENCES `csv_imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_csv_import_metadata_unique` ON `csv_import_metadata` (`csv_import_id`,`key`);--> statement-breakpoint
CREATE TABLE `csv_import_staging` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`csv_import_id` integer NOT NULL,
	`row_number` integer NOT NULL,
	`state_name` text,
	`state_id` integer,
	`year` integer,
	`statistic_name` text,
	`statistic_id` integer,
	`value` real,
	`raw_data` text NOT NULL,
	`validation_status` text DEFAULT 'pending' NOT NULL,
	`validation_errors` text,
	`is_processed` integer DEFAULT 0 NOT NULL,
	`processed_at` integer,
	FOREIGN KEY (`csv_import_id`) REFERENCES `csv_imports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`statistic_id`) REFERENCES `statistics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_csv_import_staging_import` ON `csv_import_staging` (`csv_import_id`);--> statement-breakpoint
CREATE INDEX `idx_csv_import_staging_row` ON `csv_import_staging` (`csv_import_id`,`row_number`);--> statement-breakpoint
CREATE TABLE `csv_import_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category_id` integer,
	`data_source_id` integer,
	`template_schema` text NOT NULL,
	`validation_rules` text,
	`sample_data` text,
	`is_active` integer DEFAULT 1,
	`created_by` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `csv_import_templates_name_unique` ON `csv_import_templates` (`name`);--> statement-breakpoint
CREATE TABLE `csv_import_validation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`csv_import_id` integer NOT NULL,
	`validation_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message` text,
	`details` text,
	`started_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` integer,
	`error_count` integer DEFAULT 0,
	`warning_count` integer DEFAULT 0,
	FOREIGN KEY (`csv_import_id`) REFERENCES `csv_imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `csv_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`filename` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_hash` text NOT NULL,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`uploaded_by` integer NOT NULL,
	`uploaded_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`validated_at` integer,
	`published_at` integer,
	`error_message` text,
	`metadata` text,
	`is_active` integer DEFAULT 1,
	`duplicate_of` integer,
	`total_rows` integer,
	`valid_rows` integer,
	`error_rows` integer,
	`processing_time_ms` integer,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `import_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`csv_import_id` integer NOT NULL,
	`log_level` text NOT NULL,
	`row_number` integer,
	`field_name` text,
	`field_value` text,
	`expected_value` text,
	`failure_category` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`csv_import_id`) REFERENCES `csv_imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `import_validation_summary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`csv_import_id` integer NOT NULL,
	`total_rows` integer NOT NULL,
	`valid_rows` integer NOT NULL,
	`error_rows` integer NOT NULL,
	`failure_breakdown` text,
	`validation_time_ms` integer,
	`status` text NOT NULL,
	`completed_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`csv_import_id`) REFERENCES `csv_imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "user_id", "token", "expires_at", "created_at") SELECT "id", "user_id", "token", "expires_at", "created_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `__new_user_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`statistic_id` integer NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`statistic_id`) REFERENCES `statistics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_favorites`("id", "user_id", "statistic_id", "created_at") SELECT "id", "user_id", "statistic_id", "created_at" FROM `user_favorites`;--> statement-breakpoint
DROP TABLE `user_favorites`;--> statement-breakpoint
ALTER TABLE `__new_user_favorites` RENAME TO `user_favorites`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_favorites_unique` ON `user_favorites` (`user_id`,`statistic_id`);--> statement-breakpoint
DROP INDEX `idx_magic_links_token`;--> statement-breakpoint
DROP INDEX `idx_magic_links_email`;--> statement-breakpoint
ALTER TABLE `user_suggestions` ADD `email` text NOT NULL;