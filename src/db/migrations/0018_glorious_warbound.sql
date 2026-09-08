CREATE TABLE "diet_document" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_id" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text DEFAULT 'v1' NOT NULL,
	"body_markdown" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diet_document_claim_id_unique" UNIQUE("claim_id")
);
--> statement-breakpoint
ALTER TABLE "diet_document" ADD CONSTRAINT "diet_document_claim_id_diet_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."diet_claim"("id") ON DELETE cascade ON UPDATE no action;