CREATE TABLE "doctor_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"service_id" text NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_exception" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"service_id" text,
	"exception_date" date NOT NULL,
	"is_closed" boolean DEFAULT true NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD CONSTRAINT "doctor_schedule_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedule" ADD CONSTRAINT "doctor_schedule_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_exception" ADD CONSTRAINT "schedule_exception_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_exception" ADD CONSTRAINT "schedule_exception_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doctor_schedule_provider_idx" ON "doctor_schedule" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "doctor_schedule_service_idx" ON "doctor_schedule" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doctor_schedule_unique" ON "doctor_schedule" USING btree ("provider_id","service_id","weekday","start_time");--> statement-breakpoint
CREATE INDEX "schedule_exception_provider_idx" ON "schedule_exception" USING btree ("provider_id","exception_date");--> statement-breakpoint
CREATE INDEX "schedule_exception_service_idx" ON "schedule_exception" USING btree ("service_id");