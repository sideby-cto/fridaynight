-- Friday Night Plan — initial schema

CREATE TABLE IF NOT EXISTS friday_plans (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  friday_date DATE        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_activities (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id     BIGINT      NOT NULL REFERENCES friday_plans(id) ON DELETE CASCADE,
  position    INTEGER     NOT NULL,
  emoji       TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  time        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_plan_activities_plan_id ON plan_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_friday_plans_date       ON friday_plans(friday_date);
