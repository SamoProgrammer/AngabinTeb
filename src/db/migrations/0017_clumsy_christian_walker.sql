CREATE TABLE "intake_period" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"sex" text NOT NULL,
	"age" integer NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	"height_cm" numeric(5, 1) NOT NULL,
	"activity_level" text DEFAULT 'moderate' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_intake" ADD COLUMN "meal_slot" text;--> statement-breakpoint
ALTER TABLE "food_intake" ADD COLUMN "period_id" text;--> statement-breakpoint
ALTER TABLE "intake_period" ADD CONSTRAINT "intake_period_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "period_user" ON "intake_period" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "food_intake" ADD CONSTRAINT "food_intake_period_id_intake_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."intake_period"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_intake_period_id_idx" ON "food_intake" USING btree ("period_id");