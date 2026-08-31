CREATE TABLE "ambulance_service" (
	"service_id" text PRIMARY KEY NOT NULL,
	"dispatch_model" text,
	"vehicle_type" text
);
--> statement-breakpoint
CREATE TABLE "availability_slot" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"service_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"held_until" timestamp with time zone,
	"held_by" text
);
--> statement-breakpoint
CREATE TABLE "diagnostic_service" (
	"service_id" text PRIMARY KEY NOT NULL,
	"prep_instructions" text,
	"fasting_hours" integer,
	"requires_referral" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_care_service" (
	"service_id" text PRIMARY KEY NOT NULL,
	"requires_patient_address" boolean DEFAULT true NOT NULL,
	"serviceable_city_ids" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"label" text NOT NULL,
	"address_line" text,
	"city_id" text NOT NULL,
	"latitude" text,
	"longitude" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practitioner" (
	"provider_id" text PRIMARY KEY NOT NULL,
	"specialty_id" text,
	"bio" text,
	"credentials" text,
	"cv_url" text,
	"video_url" text
);
--> statement-breakpoint
CREATE TABLE "provider" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"org_type" text,
	"name" text NOT NULL,
	"primary_location_id" text,
	"phone" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_category" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "service_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"category_id" text NOT NULL,
	"service_type" text NOT NULL,
	"location_id" text,
	"name" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"base_price" numeric(12, 0) DEFAULT '0' NOT NULL,
	"is_bookable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"service_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"location_id" text,
	"slot_id" text NOT NULL,
	"party_size" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"price" numeric(12, 0) NOT NULL,
	"notes" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ambulance_service" ADD CONSTRAINT "ambulance_service_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slot" ADD CONSTRAINT "availability_slot_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slot" ADD CONSTRAINT "availability_slot_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_service" ADD CONSTRAINT "diagnostic_service_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_care_service" ADD CONSTRAINT "home_care_service_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location" ADD CONSTRAINT "location_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practitioner" ADD CONSTRAINT "practitioner_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_category" ADD CONSTRAINT "service_category_parent_id_service_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."service_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_category_id_service_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_booking_per_slot" ON "appointment" USING btree ("slot_id") WHERE status NOT IN ('cancelled','no_show');--> statement-breakpoint
CREATE UNIQUE INDEX "appointment_idempotency" ON "appointment" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "appointment_patient" ON "appointment" USING btree ("patient_id");