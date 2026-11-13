-- Esquema del checklist de tareas diarias.
-- Aplicar una vez sobre la base existente:  psql "$DATABASE_URL" -f db/esquema.sql

CREATE TABLE IF NOT EXISTS tareas (
  id         SERIAL      PRIMARY KEY,
  titulo     TEXT        NOT NULL CHECK (length(trim(titulo)) > 0),
  fecha      DATE        NOT NULL DEFAULT CURRENT_DATE,
  hecha      BOOLEAN     NOT NULL DEFAULT FALSE,
  creada_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tareas_fecha_idx ON tareas (fecha);
