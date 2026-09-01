CREATE TABLE "dispatch_record" (
	"id" text PRIMARY KEY NOT NULL,
	"ambulance_service_id" text NOT NULL,
	"appointment_id" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dispatch_record" ADD CONSTRAINT "dispatch_record_ambulance_service_id_service_id_fk" FOREIGN KEY ("ambulance_service_id") REFERENCES "public"."service"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch_record" ADD CONSTRAINT "dispatch_record_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;