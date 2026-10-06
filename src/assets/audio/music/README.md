# Música general provisional

Pista aportada por el usuario el 03-10-2026: `36.3s Recording (Sep 26 @ 4_49 PM).mp3`.
Pese al nombre, el archivo contiene aproximadamente 359.76 s de audio estéreo,
48 kHz, y pesa 8,788,430 bytes. Se conserva el original fuera del repositorio.
Los metadatos indican creación con Suno; no constituyen evidencia de licencia
comercial. Confirmar los derechos antes de publicación/distribución comercial.

Derivado de runtime: `general-theme.mp3`, MP3 estéreo 32 kHz / 64 kbps, sin
imagen de portada ni metadatos embebidos. Conserva la duración y la composición,
sin normalizar volumen, cortar secciones ni repintar la música. La compresión
es con pérdida, elegida para respetar el límite de build completo de 15 MB,
incluidos mapas de depuración. El original no se modifica ni se incluye dos veces.
Peso del derivado: **2,878,892 bytes**, duración 359.760 s, verificados con ffprobe.

Procedencia verificable (SHA-256):

- Original: `f946f33e53e87a20fa0def4f56f7452227e9d4c3766fb2587dd9b5d5a7d97ee0`.
- Derivado: `851cb92053f3803a786a249048d455d7e6baa7863be0df781e1656092df01edb`.

Preparación reproducible (FFmpeg ya instalado; no dependencia del juego):

```powershell
ffmpeg -n -i "ruta/al/original.mp3" -map 0:a:0 -vn -map_metadata -1 -c:a libmp3lame -b:a 64k -ar 32000 -ac 2 src/assets/audio/music/general-theme.mp3
```

Howler posee una sola pista en loop, mediante HTML5 Audio para reproducción
progresiva: no decodifica seis minutos completos en un AudioBuffer Web Audio.
El primer gesto desbloquea el contexto compartido para SFX; antes de ese gesto
no se solicita el MP3. El navegador posee su caché/buffer de reproducción;
`shutdown()` libera el Howl, callbacks y nodo. No hay CDN ni un contexto de audio
independiente para la música. Howler puede cerrar/recrear su contexto inicial
una vez por su corrección de sample rate; sólo queda un contexto vivo compartido
con SFX y los cambios de pantalla no crean más.

Mezcla (ajuste del 03-10 tras prueba del usuario): volumen musical configurado
por el jugador × 0.50 en Inicio/consolas y resumen, × 0.20 en actos/Overdrive y
sus transiciones/level-up. Cambio de escena
con fade de 450 ms, sin reiniciar la posición. Silencio y control musical siguen
siendo persistentes y tienen prioridad; volumen cero/mute no inicia la pista.
Pausa, blur y segundo plano suspenden el audio. Volver a la ventana sólo retoma
la música de pantallas no jugables; una partida pausada sigue requiriendo Continuar.

Validación física y presupuesto final: consultar
`PLAN_DESARROLLO.md`, sección A.
Las regresiones reales de PC/móvil emulado viven en `tests/browser/music.checks.ts`:
volumen nativo, una pista, avance de posición, mute/slider, pausa, carga tardía/
fallida y cero llamadas a `decodeAudioData`. Los smoke generales sólo excluyen
`net::ERR_ABORTED` de esta pista HTML5: Chromium cancela un tramo ya bufferizado
y continúa por otra petición Range. No excluyen 404, red, decodificación ni
fallos de otros assets. No hay reintentos automáticos: después de un error,
un gesto posterior puede recrear el Howl.
No se afirma audición humana, móvil físico ni aprobación de derechos por tests.
