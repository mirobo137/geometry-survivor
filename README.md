# Geometry Survivor

Prototipo web del MVP de *Geometry Survivor*. El juego está construido para ejecutarse primero en navegador y publicarse en GitHub Pages, con destinos separados para pruebas locales, Poki y CrazyGames.

## Arranque local

Requiere Node.js 20+.

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite. Para ver el panel técnico añade `?debug=1`.

## Validación y builds

```bash
npm run validate
npm run build:local
npm run build:poki
npm run build:crazygames
npm run preview
```

Los artefactos quedan en `dist/local`, `dist/poki` y `dist/crazygames`. En esta primera fase Poki y CrazyGames usan todavía `LocalPlatform`; sus SDK se integrarán en adaptadores aislados cuando el MVP sea estable.

## Subir al repositorio remoto

Después de crear el repositorio específico del juego:

```bash
git init
git add .
git commit -m "chore: bootstrap geometry survivor MVP"
git branch -M main
git remote add origin <URL_DEL_REPOSITORIO>
git push -u origin main
```

El workflow `.github/workflows/deploy.yml` publica automáticamente `dist/local` en GitHub Pages cuando se hace push a `main`.
