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
CREATE UNIQUE INDEX `idx_national_average_unique` ON `national_averages` (`statistic_id`,`year`);