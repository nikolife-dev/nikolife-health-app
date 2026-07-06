ALTER TABLE t_p76837068_nikolife_health_app.recipes ADD COLUMN IF NOT EXISTS import_batch_id text NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_import_batch ON t_p76837068_nikolife_health_app.recipes(import_batch_id);