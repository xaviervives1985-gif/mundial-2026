# Road to World Cup 2026

App web en HTML + CSS + JavaScript conectada con Supabase.

## Archivos

- `index.html`: estructura de la web.
- `styles.css`: diseño visual estilo Mundial/FIFA.
- `app.js`: lógica de partidos, predicciones, clasificación y jugadores.
- `supabase.js`: conexión con Supabase.
- `assets/world-cup.png`: imagen opcional de la Copa del Mundo.
- `assets/flags/`: carpeta opcional para banderas.

## Primer paso

Abre `supabase.js` y cambia:

```js
export const SUPABASE_URL = "PEGA_AQUI_TU_PROJECT_URL";
export const SUPABASE_ANON_KEY = "PEGA_AQUI_TU_ANON_PUBLIC_KEY";
```

por tus datos reales de Supabase.

No uses la `service_role key`.

## Cómo abrir la app

En Visual Studio Code instala la extensión **Live Server**.

Después haz clic derecho sobre `index.html` y pulsa:

**Open with Live Server**

## Importante

La app muestra partidos desde la tabla `matches`.

Si todavía no tienes partidos cargados, verás un mensaje vacío.
Cuando se sepan los cruces de dieciseisavos, añade los partidos en Supabase.
