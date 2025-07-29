CREATE TABLE "import_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"csv_import_id" integer NOT NULL,
	"log_level" text NOT NULL,
	"row_number" integer,
	"field_name" text,
	"field_value" text,
	"expected_value" text,
	"failure_category" text NOT NULL,
	"message" text NOT NULL,
	"details" text,
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_validation_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"csv_import_id" integer NOT NULL,
	"total_rows" integer NOT NULL,
	"valid_rows" integer NOT NULL,
	"error_rows" integer NOT NULL,
	"failure_breakdown" text,
	"validation_time_ms" integer,
	"status" text NOT NULL,
	"completed_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint

ALTER TABLE "csv_imports" ADD COLUMN "total_rows" integer;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD COLUMN "valid_rows" integer;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD COLUMN "error_rows" integer;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD COLUMN "processing_time_ms" integer;--> statement-breakpoint
ALTER TABLE "user_suggestions" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "public"."csv_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_validation_summary" ADD CONSTRAINT "import_validation_summary_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "public"."csv_imports"("id") ON DELETE no action ON UPDATE no action;