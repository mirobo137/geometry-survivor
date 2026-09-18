# Acto III — presentación de ataques

Entrega 16-09-2026. Complementa [FLOTA_FRACTURE.md](FLOTA_FRACTURE.md) y las
guías canónicas de rendering/SVG. No modifica daño, cadencias ni dificultad.

## Lenguaje por familia

- Gunner: collar de inducción y tres marcas cortas de puntería. Al disparar,
  fogonazo direccional; proyectil coral con separación oscura, punta marfil y
  cola afilada cuya longitud nunca excede el recorrido desde su nacimiento.
  No usar una línea completa: no es un láser instantáneo.
- Thorn: aviso dorado segmentado y puntas retraídas; activo con púas facetadas
  oscuras/coral y nervio incandescente. El disco tenue explica que el interior
  también daña. Las puntas llegan al radio real, nunca más allá del hitbox.
- Reaver: aviso discontinuo del zigzag comprometido; activo deja sólo el último
  cuarto recorrido como estela decreciente. Misma ecuación sinusoidal, origen,
  destino, amplitud y progreso de simulación, no una curva estética alternativa.
- Miner: mandíbulas de expulsión alrededor del casco. Cada mina muestra desde
  el principio su radio de daño fijo y un arco de cuenta atrás; violeta antes
  de armar, dorado después. Detonación facetada y residuo de 0.32 s en ese mismo
  radio, sin onda expansiva que sugiera un alcance inexistente.
- Fracture Engine reutiliza ese lenguaje a su escala y con su radio real de
  púas (84, frente a 58 de Thorn). Los avisos sólo viven durante telegraph/active,
  nunca durante recovery.

## Contratos para futuras iteraciones

1. Simulación es dueña de daño, fase y geometría; presentación no cambia colisiones.
2. Cada arco o segmento independiente comienza con `beginPath`. En puntas finas
   usar uniones redondeadas para evitar prolongaciones por miter fuera del radio.
3. Mantener 48 Graphics de proyectiles, 12 de minas y dos de señales. Reutilizar
   los objetos; no crear emisores por ataque ni añadir blur, filtros o luces.
   Las geometrías dinámicas sí se reconstruyen: esto no equivale a coste cero.
4. Low conserva silueta, límites, cuenta atrás y color peligroso. Reduce el
   muestreo de estela de 20 a 12 segmentos y elimina su núcleo marfil secundario.
5. El residuo de mina utiliza delta de presentación (cero en pausa). Temporizador
   Float64: Float32 puede redondear 0.32 hacia abajo y dejar visible el residuo
   indefinidamente. Reset limpia marcas y edades. Reutilizar una mina puede
   reemplazar su residuo anterior; no ampliar el pool sólo para conservarlo.
6. Un proyectil hostil que pierda velocidad, reciba coordenadas no finitas o
   deje de avanzar se retira mediante un watchdog de 0.25 s. La presentación
   también limpia la geometría del slot al liberarlo. Es una protección contra
   balas congeladas y no modifica el TTL, daño ni trayectoria authored válida.
7. El boss toma posición angular/radio desde el final del zigzag al recuperar
   movimiento libre. No proyectarlo de nuevo sobre su órbita de entrada.

## Verificación y rutas

- Lámina de los efectos reales: `/docs/visual/fracture-fx-reference.html`;
  añadir `?quality=low` para comparar. Es una muestra de fases, no prueba de daño.
- Captura reproducible: `node docs/visual/capture-fracture.mjs` con Vite en 5173.
- Juego: `/?debug=1&fracture-drill=gunner` (o thorn, zigzag, miner).
- Boss: `/?debug=1&act=fracture&boss=1&quality=high`.
- `FractureThreatView.test.ts`: aviso enemigo sin boss, límite de púas,
  recuperación, residuo, pausa y reset.
- `FractureBossSystem.test.ts`: continuidad al terminar zigzag, repetida a
  30/60/120 actualizaciones por segundo.

La aprobación artística y el perfil de FPS en móvil físico quedan al usuario;
las capturas headless no certifican rendimiento real.
