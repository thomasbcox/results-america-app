CREATE TABLE "csv_import_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"csv_import_id" integer NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"data_type" text DEFAULT 'string' NOT NULL,
	"is_required" integer DEFAULT 0 NOT NULL,
	"validation_rule" text
);
--> statement-breakpoint
CREATE TABLE "csv_import_staging" (
	"id" serial PRIMARY KEY NOT NULL,
	"csv_import_id" integer NOT NULL,
	"row_number" integer NOT NULL,
	"state_name" text,
	"state_id" integer,
	"year" integer,
	"statistic_name" text,
	"statistic_id" integer,
	"value" real,
	"raw_data" text NOT NULL,
	"validation_status" text DEFAULT 'pending' NOT NULL,
	"validation_errors" text,
	"is_processed" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "csv_import_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" integer,
	"data_source_id" integer,
	"template_schema" text NOT NULL,
	"validation_rules" text,
	"sample_data" text,
	"is_active" integer DEFAULT 1,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "csv_import_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "csv_import_validation" (
	"id" serial PRIMARY KEY NOT NULL,
	"csv_import_id" integer NOT NULL,
	"validation_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"details" text,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completed_at" timestamp,
	"error_count" integer DEFAULT 0,
	"warning_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "csv_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filename" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_hash" text NOT NULL,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"uploaded_by" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"validated_at" timestamp,
	"published_at" timestamp,
	"error_message" text,
	"metadata" text,
	"is_active" integer DEFAULT 1
);
--> statement-breakpoint
ALTER TABLE "csv_import_metadata" ADD CONSTRAINT "csv_import_metadata_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "public"."csv_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_staging" ADD CONSTRAINT "csv_import_staging_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "public"."csv_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_staging" ADD CONSTRAINT "csv_import_staging_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_staging" ADD CONSTRAINT "csv_import_staging_statistic_id_statistics_id_fk" FOREIGN KEY ("statistic_id") REFERENCES "public"."statistics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_templates" ADD CONSTRAINT "csv_import_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_templates" ADD CONSTRAINT "csv_import_templates_data_source_id_data_sources_id_fk" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_templates" ADD CONSTRAINT "csv_import_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_import_validation" ADD CONSTRAINT "csv_import_validation_csv_import_id_csv_imports_id_fk" FOREIGN KEY ("csv_import_id") REFERENCES "public"."csv_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD CONSTRAINT "csv_imports_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_csv_import_metadata_unique" ON "csv_import_metadata" USING btree ("csv_import_id","key");--> statement-breakpoint
CREATE INDEX "idx_csv_import_staging_import" ON "csv_import_staging" USING btree ("csv_import_id");--> statement-breakpoint
CREATE INDEX "idx_csv_import_staging_row" ON "csv_import_staging" USING btree ("csv_import_id","row_number");