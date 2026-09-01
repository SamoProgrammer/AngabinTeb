CREATE TABLE "diet_claim" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"program_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diet_claim" ADD CONSTRAINT "diet_claim_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_claim" ADD CONSTRAINT "diet_claim_program_id_diet_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."diet_program"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_claim_per_program" ON "diet_claim" USING btree ("user_id","program_id") WHERE status != 'completed';