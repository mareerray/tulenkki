CREATE TABLE routine_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    cycle_start_date DATE NOT NULL,
    walking_days INTEGER NOT NULL DEFAULT 6
        CHECK (walking_days > 0),
    rest_days INTEGER NOT NULL DEFAULT 2
        CHECK (rest_days >= 0),
    daily_goal_minutes INTEGER NOT NULL DEFAULT 20
        CHECK (daily_goal_minutes > 0)
);

CREATE TABLE walks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    walk_date DATE NOT NULL,
    minutes INTEGER NOT NULL CHECK (minutes > 0),
    distance_km NUMERIC(7,3) CHECK (distance_km >= 0),
    notes TEXT
);