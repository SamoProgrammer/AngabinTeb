CREATE TABLE "registry_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_id" text NOT NULL,
	"person_info" jsonb,
	"medical_history" jsonb,
	"drug_history" jsonb,
	"addiction_history" jsonb,
	"nutrition_info" jsonb,
	"cardiovascular_questions" jsonb,
	"anthropometric" jsonb,
	"medical_documents" jsonb,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_snapshot_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
ALTER TABLE "diet_claim" ADD COLUMN "organization_context" text;--> statement-breakpoint
ALTER TABLE "diet_claim" ADD COLUMN "price_paid" numeric(12, 0);--> statement-breakpoint
ALTER TABLE "diet_claim" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "registry_snapshot" ADD CONSTRAINT "registry_snapshot_claim_id_diet_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."diet_claim"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
UPDATE diet_claim SET status='ready' WHERE status IN ('paid','generating') AND id IN (SELECT claim_id FROM diet_document);
--> statement-breakpoint
INSERT INTO weight_log (id, user_id, weight_kg, logged_at) SELECT gen_random_uuid(), user_id, weight_kg, CURRENT_DATE FROM physiology_profile;