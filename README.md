# Geometry Survivor

Prototipo web del MVP de *Geometry Survivor*. El juego está construido para ejecutarse primero en navegador y publicarse en GitHub Pages, con destinos separados para pruebas locales, Poki y CrazyGames.

## Arranque local

Requiere Node.js 20+.

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite. Para ver el panel técnico añade `?debug=1`.

La orientación primaria es portrait para móvil. En landscape el juego usa un viewport 1280×720 para aprovechar pantallas de PC y portales de escritorio; no se fuerza a girar el dispositivo.

Los spikes de Fase 0 se pueden ejecutar desde GitHub Pages con `?spike=rendering` y `?spike=audio`; el protocolo está en [docs/performance/F0_SPIKES.md](docs/performance/F0_SPIKES.md).

El stress de combate de Fase 2 se ejecuta con `?stress=1`. Inicializa 250 enemigos y 300 proyectiles reales, mantiene visible el panel técnico y sirve para comprobar el peor caso en el mismo móvil. Se puede combinar con `&debug=1`, aunque no es necesario.

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

El workflow `.github/workflows/deploy.yml` publica automáticamente `dist/local` en GitHub Pages cuando se hace push a `main`. Antes del primer despliegue, activa `Settings > Pages > Build and deployment > Source: GitHub Actions` en el repositorio; esa configuración permite que `configure-pages` encuentre el sitio.
