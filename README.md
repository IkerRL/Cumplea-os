# 🎂 Tablón de Cumpleaños — Regalo de Comunidad para Streamer

Una aplicación web para que la comunidad de Twitch deje mensajes sorpresa antes del **4 de octubre**, que la streamer leerá en directo.

---

## 🗂️ Estructura del proyecto

```
cumpleaños/
├── index.html          # Página /enviar — Formulario para viewers
├── muro.html           # Página /muro  — Tablón interactivo para el directo
├── vercel.json         # Configuración de rutas para Vercel
├── css/
│   ├── enviar.css      # Estilos del formulario (tema oscuro glassmorphism)
│   └── muro.css        # Estilos del corcho y post-its
├── js/
│   ├── config.js       # ⚠️ Aquí van tus credenciales de Supabase
│   ├── confetti.js     # Confetti animado (sin dependencias)
│   ├── enviar.js       # Lógica del formulario
│   └── muro.js         # Lógica del tablón interactivo
└── supabase/
    └── schema.sql      # Script SQL para crear la tabla con RLS
```

---

## 🚀 Configuración paso a paso

### 1. Supabase — Crear la base de datos

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. En el menú lateral: **SQL Editor → New Query**.
3. Pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecuta.
4. Esto creará la tabla `postits` con RLS habilitado para lectura y escritura pública.

### 2. Obtener las credenciales de Supabase

En tu proyecto de Supabase:  
**Settings → API** → copia:
- **Project URL** → `https://xxxxxxxxxx.supabase.co`
- **anon / public key** → clave larga que empieza por `eyJ...`

### 3. Configurar `js/config.js`

Abre [`js/config.js`](js/config.js) y sustituye los placeholders:

```js
const SUPABASE_URL      = 'https://TU_PROYECTO.supabase.co';  // ← tu URL
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';                 // ← tu clave anon
```

### 4. Desplegar en Vercel

#### Opción A — Arrastrar carpeta (más fácil)
1. Ve a [vercel.com/new](https://vercel.com/new).
2. Arrastra la carpeta entera del proyecto.
3. ¡Listo! Vercel detectará automáticamente el `vercel.json`.

#### Opción B — Desde Git
```bash
# En la carpeta del proyecto:
git init
git add .
git commit -m "feat: tablón de cumpleaños"

# Luego conecta el repo en vercel.com/new
```

#### Opción C — CLI de Vercel
```bash
npm i -g vercel
vercel
```

---

## 🌐 URLs del proyecto

| Ruta | Descripción |
|------|-------------|
| `/` o `/enviar` | Formulario para que los viewers dejen su post-it |
| `/muro` | Tablón visual para abrir en el directo |

---

## ✨ Características

### Formulario (`/enviar`)
- ✍️ Área de texto con contador de caracteres (máx. 500)
- 🎨 Selector de color del post-it (amarillo, rosa, verde, azul, naranja, lila)
- 🔮 Vista previa en tiempo real del post-it
- 🎭 Toggle para envío anónimo
- 👤 Campos opcionales: nick de Twitch + pista para adivinar
- 🎉 Confetti al enviar correctamente
- 📱 100% responsive — cómodo desde el móvil

### Muro (`/muro`)
- 🪵 Fondo visual de tablón de corcho con textura
- 📌 Post-its con rotación aleatoria (-4° a +4°) y chincheta roja
- 👁️ Extracto del texto y autor en la carta
- 🔍 Modal al hacer clic: texto completo + mecanismo de reveal del autor
- ✅ Post-its marcados como "Leídos" (opacidad reducida + sello)
- 💾 Estado de lectura persistido en `localStorage` + Supabase
- ➕ Botón flotante para ir al formulario

---

## 🛡️ Seguridad (RLS de Supabase)

Las políticas de Row Level Security permiten:
- **SELECT**: cualquier usuario anónimo puede leer todos los post-its
- **INSERT**: cualquier usuario anónimo puede crear post-its nuevos
- **UPDATE**: cualquier usuario anónimo puede marcar post-its como leídos

> **Nota**: Para producción considera añadir rate limiting o captcha en el formulario para evitar spam.

---

## 🎨 Paleta de colores de post-its

| Nombre | Color |
|--------|-------|
| Amarillo | `#fef08a` |
| Rosa | `#fbcfe8` |
| Verde | `#bbf7d0` |
| Azul | `#bae6fd` |
| Naranja | `#fed7aa` |
| Lila | `#e9d5ff` |

---

## 📦 Dependencias externas (CDN)

Solo una dependencia real:
- **`@supabase/supabase-js@2`** — Cliente oficial de Supabase (cargado desde jsDelivr CDN)

El confetti está implementado desde cero con Canvas API, sin librerías adicionales.
