CREATE TABLE "wallet_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(12, 0) NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"bank_ref_code" text,
	"status" text DEFAULT 'success' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet" (
	"user_id" text PRIMARY KEY NOT NULL,
	"balance" numeric(12, 0) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_registry" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"person_info" jsonb,
	"medical_history" jsonb,
	"drug_history" jsonb,
	"addiction_history" jsonb,
	"nutrition_info" jsonb,
	"cardiovascular_questions" jsonb,
	"anthropometric" jsonb,
	"medical_documents" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "diet_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"plan_tier" text NOT NULL,
	"price" numeric(12, 0) NOT NULL,
	"status" text DEFAULT 'pending_registry' NOT NULL,
	"registry_id" text,
	"meal_plan_notes" text,
	"meal_plan_pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	"logged_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_message" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_user_id" text NOT NULL,
	"sender_doctor_id" text,
	"sender_doctor_name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"attachment_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_application" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"sector" text NOT NULL,
	"proposal" text NOT NULL,
	"resume_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_complaint" (
	"id" text PRIMARY KEY NOT NULL,
	"tracking_code" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"service_or_appointment_code" text,
	"target_doctor_or_department" text NOT NULL,
	"description" text NOT NULL,
	"evidence_url" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clinical_complaint_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "national_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "father_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "practitioner" ADD COLUMN "medical_council_code" text;--> statement-breakpoint
ALTER TABLE "practitioner" ADD COLUMN "landline_phone" text;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "deposit_fee" numeric(12, 0) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "payment_method" text DEFAULT 'location';--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "tracking_code" text;--> statement-breakpoint
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_registry" ADD CONSTRAINT "clinical_registry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_subscription" ADD CONSTRAINT "diet_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_subscription" ADD CONSTRAINT "diet_subscription_registry_id_clinical_registry_id_fk" FOREIGN KEY ("registry_id") REFERENCES "public"."clinical_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_log" ADD CONSTRAINT "weight_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_message" ADD CONSTRAINT "clinical_message_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_message" ADD CONSTRAINT "clinical_message_sender_doctor_id_provider_id_fk" FOREIGN KEY ("sender_doctor_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;