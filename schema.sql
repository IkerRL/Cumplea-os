-- ============================================================
-- Schema para el tablón de cumpleaños de la streamer
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Crear la tabla principal de post-its
CREATE TABLE IF NOT EXISTS postits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message      TEXT NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 500),
  color        TEXT NOT NULL DEFAULT 'yellow' CHECK (color IN ('yellow', 'pink', 'green', 'blue', 'orange', 'purple')),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  author_nick  TEXT,         -- Nick de Twitch (solo si no es anónimo)
  author_hint  TEXT,         -- Pista opcional para adivinar quién es
  is_read      BOOLEAN NOT NULL DEFAULT false,
  rotation     FLOAT NOT NULL DEFAULT 0,  -- Grados de rotación (-4 a 4)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS postits_created_at_idx ON postits (created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE postits ENABLE ROW LEVEL SECURITY;

-- Política: cualquier usuario anónimo puede LEER todos los post-its
CREATE POLICY "Lectura pública de post-its"
  ON postits
  FOR SELECT
  TO anon
  USING (true);

-- Política: cualquier usuario anónimo puede INSERTAR post-its
CREATE POLICY "Inserción pública de post-its"
  ON postits
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política: cualquier usuario anónimo puede ACTUALIZAR solo el campo is_read
-- (para marcar como leído desde el muro)
CREATE POLICY "Marcar post-its como leídos"
  ON postits
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Datos de prueba (opcional, comentar si no se quieren)
-- ============================================================

/*
INSERT INTO postits (message, color, is_anonymous, author_nick, author_hint, rotation) VALUES
  ('¡Feliz cumpleaños! Llevas meses alegrando mis tardes con tus streams. ¡Que cumplas muchos más! 🎂', 'yellow', false, 'viewer_ejemplo', 'Siempre en el chat con emotes de sapo', -2.1),
  ('No sé ni cómo explicar lo mucho que me ha ayudado tu comunidad. Gracias por existir. 🎉', 'pink', true, null, null, 1.8),
  ('Me acuerdo cuando dijiste que nunca ibas a hacer karaoke y luego lo hiciste. Ese directo fue legendario jajaja', 'green', false, 'otro_viewer', 'El que siempre pregunta por la música', 3.2),
  ('¡Feliz cumple! Ojalá este año venga lleno de momentos increíbles 🌟', 'blue', true, null, null, -1.5),
  ('Tu energía es contagiosa. Gracias por hacer que los días malos sean un poco mejores ❤️', 'orange', false, 'fan_fiel', null, 0.7);
*/
