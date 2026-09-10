# CI y publicación en Pages

El workflow `.github/workflows/deploy.yml` publica únicamente `dist/local`
después de typecheck, unit tests, tres builds y toda la suite browser. Un
fallo sigue bloqueando la publicación. `npm ci` usa el lockfile y Chromium se
instala con la versión de Playwright de ese lockfile.

## Incidente de septiembre de 2026

Actions informó `Test timeout of 60000ms exceeded` en un caso que recorría
skins, cañones, fondos, laboratorio y audio. La operación en la que termina
el presupuesto total no prueba que esa operación haya consumido los 60 s.
El log no demuestra un fallo de scroll, audio ni un crash previo del browser.
Los errores de sesión cerrada/desconexión al finalizar necesitan contrastarse
con la traza; pueden aparecer durante el cierre por timeout.

La prueba original pasó localmente incluso antes del parche de scroll. Ese
parche volvió a fallar en Actions y se retiró el scroll asíncrono a SFX.
Se conserva el retorno al inicio del panel al salir de Skins/Meta.

## Contrato de pruebas

- Compras de skins, cañones, fondos, mejora permanente y configuración son
  cinco casos aislados. Cada compra verifica selección/nivel, save y débito;
  audio conserva la navegación Skins → menú → Meta → menú → Configuración
  → Jugar. La cobertura de gameplay, calidad y móvil continúa activa.
- Cada caso mantiene 60 s. Las acciones tienen 15 s y navegación 30 s para
  distinguir una espera puntual del agotamiento del caso completo.
- Un worker y un reintento en CI. No aumentar reintentos para tapar fallos.
- CI graba traza en el primer reintento. `retain-on-failure` graba todos los
  casos antes de descartar los exitosos; resulta costoso con DOM SVG extenso.
  Local mantiene `retain-on-failure` para diagnóstico sin reintento.
- El workflow conserva HTML, capturas, contexto y trazas por siete días,
  incluso si el reintento pasa. Revisar la clasificación flaky en el HTML.
- Límite de job: build 20 minutos y deploy 10 minutos. No son objetivos de
  rendimiento ni sustituyen los timeouts por acción.

## Reproducir y diagnosticar

1. Ejecutar `npm run build:local` para que preview sirva el código actual.
2. En PowerShell: `$env:CI='true'` y después `npx playwright test`.
   En bash: `CI=true npx playwright test`.
3. Para un caso: `npx playwright test --project=desktop --grep "presenta el menu inicial"`.
4. Descargar el artifact `playwright-report` del run fallido o flaky. Abrir
   su carpeta HTML con `npx playwright show-report <carpeta>` y la traza con
   `npx playwright show-trace <ruta/trace.zip>`.
5. Examinar duración de acciones anteriores, DOM, consola, red y punto exacto
   de desconexión. Un pase en Windows no certifica el runner Ubuntu.

La concurrencia `pages` prioriza el push más reciente. `Cancelled` por otra
ejecución no significa que el build haya fallado. Validar siempre el run del
commit más reciente; relanzar uno viejo puede competir con él.

No omitir checks ni usar `force`/eventos sintéticos para hacer pasar controles
no interactuables. No prometer estabilidad permanente de servicios externos.

Fuentes oficiales consultadas el 10-09-2026:
[CI](https://playwright.dev/docs/ci),
[timeouts](https://playwright.dev/docs/test-timeouts),
[trazas](https://playwright.dev/docs/trace-viewer).
