# Memoria del servidor de desarrollo — 02-10-2026

## Incidencia y límites del diagnóstico

Eventos Windows 2004 confirmaron agotamiento de memoria comprometida: Node
22.14.0 llegó a 27–29 GB decimales en varios episodios. El 01-10, Vite PID 1588
se identificó por su comando y puerto 5173. Pasó de 4129.5 a 4909.1 MiB privados
entre 23:21:17 y 23:23:31 (Tijuana); se detuvo con permiso a 5084.8 MiB.
Esto no identifica retrospectivamente todos los procesos históricos como Vite.

Node 22.14.0 usa libuv 1.49.2. Su fuente oficial conserva la ruta `DeletePending`
de `uv__process_fs_event_req` que no libera `filename`; libuv PR 4656 añadió la
liberación. PR 4647 es otra fuga y sí está incorporada a la fuente de Node 22.14.
El defecto 4656 y los builds que borran carpetas vigiladas son la hipótesis
principal; no se reprodujo el disparador exacto ni se obtuvo un heap del PID.

Fuentes primarias:

- [Node 22.14 fs-event.c](https://github.com/nodejs/node/blob/v22.14.0/deps/uv/src/win/fs-event.c)
- [Parche 4656](https://github.com/libuv/libuv/pull/4656)
- [libuv 1.50 correcciones](https://github.com/libuv/libuv/releases/tag/v1.50.0)
- [Vite server.watch](https://vite.dev/config/server-options#server-watch)

Los logs locales confirmaron recargas por `dist/poki` y `dist/crazygames`:
Vite ignoraba sólo `dist/local`. OneDrive es un factor de entorno, no una causa
demostrada. Una observación de 15 s no registró cambios mientras crecía Vite.
Las texturas y la simulación viven en Chromium, no en el proceso dev server.

## Mitigación y prueba reproducible

- Referencia de desarrollo: Node 24.19.0 LTS, libuv 1.52.1; rama 24 también en CI.
- `vite.config.ts` ignora todos los `dist/**`, reportes, coverage, temporales
  y `.kilo/**`. Mantiene HMR sobre fuentes reales; no modifica el juego.
- No aumentar paginación ni heap como supuesto arreglo. RSS, memoria privada
  de Windows y heap JS son medidas distintas; una fuga nativa puede superar
  el límite de old-space.

Con Node 24 ya disponible:

```powershell
node scripts/qa-vite-memory.mjs --watch=original --seconds=60 --builds
node scripts/qa-vite-memory.mjs --watch=fixed --seconds=60 --builds
node scripts/qa-vite-memory.mjs --watch=off --seconds=60 --builds
```

Cada comando abre un proceso diagnóstico Vite en 5175 y un Chromium en menú,
mide RSS/heap/external/ArrayBuffers y número de entradas vigiladas cada 5 s,
espera en reposo antes y después de builds secuenciales de los tres targets.
Las muestras de arranque/calentamiento no son una pendiente de fuga.
Las ramas original/off cambian la configuración ya resuelta: Vite fusiona arrays
y omite `null` durante la mezcla de la configuración inline con la del archivo.
La rama off comprueba vigilancia cero; fixed rechaza eventos dentro de dist.
No ejecuta la rama antigua de Node 22 ni borra archivos fuente.

Duración acotada: 30–600 s de reposo total, más arranque/builds. Corte de RSS: 768 MiB;
build individual limitado a 60 s. El proceso y Chromium se cierran en `finally`.
Los informes se guardan en `test-results/vite-memory/{original,fixed,off}.json`
(ignorados por Git). Los builders son procesos separados, no incluidos en RSS
del servidor. Obtener también PrivateMemorySize64 del PID desde PowerShell.

Si vuelve a crecer con Node actualizado y watcher fijo: detenerlo, medir heap
y memoria nativa del PID afectado y comparar nuevamente watcher-off. No generar
un heap snapshot gigante cerca del agotamiento; puede añadir presión de memoria.
Una pasada breve estable no certifica varias horas de funcionamiento.

## Resultado local comprobado — 02-10-2026

La instalación global se actualizó con el instalador oficial mediante winget:
`C:\Program Files\nodejs\node.exe` devuelve Node 24.19.0 / libuv 1.52.1;
`npm` devuelve 11.17.0. `.node-version` documenta la referencia, no instala Node.
No se tocaron los runtimes separados de Codex. Para avanzar mientras Windows
esperaba elevación se usó una copia portátil oficial de la misma versión,
verificada contra SHASUMS256; las dos últimas pruebas usaron la instalación global.

Todas las filas usan Node 24.19.0, Vite 7.3.6, Chromium en menú a 1280×720,
calidad Low y builds local/Poki/CrazyGames secuenciales. «Original» significa
configuración previa del watcher, **no** ejecutar de nuevo Node 22.14.0.

| Vigilancia | Duración total | RSS final (MiB) | Heap usado final (MiB) | Entradas vigiladas | Eventos en dist |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original, 60 s de reposo | 102.8 s | 180.07 | 68.90 | 1869 | 464 |
| Corregida, 60 s de reposo | 90.1 s | 133.96 | 67.15 | 850 | 0 |
| Corregida ampliada, 180 s de reposo | 211.0 s | 149.54 | 75.57 | 850 | 0 |
| Desactivada, 60 s de reposo | 90.5 s | 127.60 | 64.60 | 0 | 0 |

Los picos de RSS en arranque fueron respectivamente 264.61, 244.05, 237.54 y
214.97 MiB; bajaron tras GC. La pasada ampliada incluye una recarga real de
`vite.config.ts` al cambiar un comentario: Vite reinició correctamente, luego
RSS permaneció aproximadamente en 148.05–148.08 MiB durante 90 s tras los builds.
La última lectura incluye comprobación de visibilidad del botón Jugar.
Se comprobó además que el watcher corregido conserva directorios `src/`.

PowerShell midió memoria **privada** del PID 20540 por separado: 172.56 MiB antes
de la recarga, pico muestreado de 256.88 MiB tras ella y 184.86 MiB estables entre
00:23:11 y 00:24:21 (Tijuana). En la prueba corta corregida se obtuvo una muestra
de 173.03 MiB privados. Estas muestras no incluyen builders ni Chromium.
No se alcanzó el corte preventivo de 768 MiB de RSS ni el corte externo de
768 MiB privados usado durante la pasada ampliada.

La primera tentativa «off» detectó que la mezcla de configuración omitía `null`;
su propia aserción falló y cerró servidor/Chromium. Se corrigió el diagnóstico
para aplicar `watch = null` después de resolver config y se repitió: la fila
aceptada mantiene cero entradas en **todas** las muestras. No se contó la
tentativa inválida como evidencia de vigilancia desactivada.

Validación: typecheck con Node global 24, 120 archivos / 578 pruebas unitarias
con Node 24, tres targets de build en cada pasada aceptada y cero errores JS en
las cuatro sesiones de menú. Sigue el warning preexistente de chunk >500 kB.
No se ejecutó la suite Playwright completa ni una sesión de varias horas.
Los informes son `original.json`, `fixed-60.json`, `fixed.json` y `off.json` en
`test-results/vite-memory/`; otra pasada puede reemplazarlos y Playwright puede
limpiar ese directorio. Conservar copia si se necesita comparar más adelante.

Conclusión: no se reprodujo el crecimiento de gigabytes con el runtime nuevo.
Los outputs ya no alcanzan el watcher y HMR permanece operativo. La mitigación
queda verificada en pruebas cortas; la causa exacta histórica y estabilidad
durante horas siguen sin demostrarse. Por ahora no se justifica un heap snapshot.
Al terminar se cerraron los servidores/Chromium de prueba; 5173 y 5175 quedaron
sin listeners y no se hizo commit/push.
