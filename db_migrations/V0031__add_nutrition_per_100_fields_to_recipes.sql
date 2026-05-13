ALTER TABLE t_p76837068_nikolife_health_app.recipes
  ADD COLUMN IF NOT EXISTS weight_per_serving integer NULL,
  ADD COLUMN IF NOT EXISTS calories_100 integer NULL,
  ADD COLUMN IF NOT EXISTS protein_100 numeric(5,2) NULL,
  ADD COLUMN IF NOT EXISTS fats_100 numeric(5,2) NULL,
  ADD COLUMN IF NOT EXISTS carbs_100 numeric(5,2) NULL,
  ADD COLUMN IF NOT EXISTS user_groups text NULL;