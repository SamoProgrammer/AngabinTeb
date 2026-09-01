CREATE TABLE "daily_nutrition" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"energy_kcal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"carbs_g" numeric(10, 2) DEFAULT '0' NOT NULL,
	"protein_g" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fat_g" numeric(10, 2) DEFAULT '0' NOT NULL,
	CONSTRAINT "daily_nutrition_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "diet_program" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_context" text NOT NULL,
	"plan_type" text NOT NULL,
	"duration_days" integer NOT NULL,
	"price" numeric(12, 0) DEFAULT '0' NOT NULL,
	"practitioner_id" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "food_intake" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"food_id" text NOT NULL,
	"serving_unit_id" text NOT NULL,
	"quantity" numeric(6, 2) NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_nutrient" (
	"food_id" text NOT NULL,
	"nutrient_id" text NOT NULL,
	"amount_per_100g" numeric(10, 2) NOT NULL,
	CONSTRAINT "food_nutrient_food_id_nutrient_id_pk" PRIMARY KEY("food_id","nutrient_id")
);
--> statement-breakpoint
CREATE TABLE "food" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"meal_types" text[] DEFAULT '{}' NOT NULL,
	"image_url" text,
	"source" text NOT NULL,
	"source_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrient_requirement" (
	"nutrient_id" text NOT NULL,
	"sex" text NOT NULL,
	"age_min" integer NOT NULL,
	"age_max" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"source" text NOT NULL,
	CONSTRAINT "nutrient_requirement_nutrient_id_sex_age_min_pk" PRIMARY KEY("nutrient_id","sex","age_min")
);
--> statement-breakpoint
CREATE TABLE "nutrient" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	CONSTRAINT "nutrient_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "physiology_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sex" text NOT NULL,
	"birth_date" date NOT NULL,
	"height_cm" numeric(5, 1) NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	"activity_level" text DEFAULT 'moderate' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serving_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"food_id" text NOT NULL,
	"name" text NOT NULL,
	"grams_equivalent" numeric(8, 1) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_nutrition" ADD CONSTRAINT "daily_nutrition_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_program" ADD CONSTRAINT "diet_program_practitioner_id_provider_id_fk" FOREIGN KEY ("practitioner_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_intake" ADD CONSTRAINT "food_intake_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_intake" ADD CONSTRAINT "food_intake_food_id_food_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."food"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_intake" ADD CONSTRAINT "food_intake_serving_unit_id_serving_unit_id_fk" FOREIGN KEY ("serving_unit_id") REFERENCES "public"."serving_unit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_nutrient" ADD CONSTRAINT "food_nutrient_food_id_food_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."food"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_nutrient" ADD CONSTRAINT "food_nutrient_nutrient_id_nutrient_id_fk" FOREIGN KEY ("nutrient_id") REFERENCES "public"."nutrient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrient_requirement" ADD CONSTRAINT "nutrient_requirement_nutrient_id_nutrient_id_fk" FOREIGN KEY ("nutrient_id") REFERENCES "public"."nutrient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physiology_profile" ADD CONSTRAINT "physiology_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serving_unit" ADD CONSTRAINT "serving_unit_food_id_food_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."food"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "intake_user_day" ON "food_intake" USING btree ("user_id","logged_at");