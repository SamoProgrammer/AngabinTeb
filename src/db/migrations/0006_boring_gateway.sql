CREATE TABLE "setting" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value_json" json NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "setting_key_unique" UNIQUE("key")
);
