CREATE TABLE "pipeline_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_created" timestamp DEFAULT now(),
	"data" jsonb
);
