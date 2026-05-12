UPDATE t_p76837068_nikolife_health_app.recipes
SET category = (SELECT json_array_elements_text(category::json) LIMIT 1)
WHERE category LIKE '[%';