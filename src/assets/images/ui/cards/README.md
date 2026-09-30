# Catálogo completo de ilustraciones para cartas

Estado: integrado bajo autorización del usuario, 29-09-2026. La primera
prueba de Rail Lance/Pulse Volley se amplió a todas las ofertas reales:
6 armas base, 12 evoluciones y 11 mejoras no armadas (29 ilustraciones).
El arte cambia presentación; nunca define reglas, daño, colisiones ni balance.

## Inventario y asociaciones

### Armas base

Los rangos I–VII, la carta que abre la elección de evolución y las mejoras de
esa familia antes de evolucionar conservan la misma ilustración base. No se
genera una imagen redundante por cada rango.

| Familia | Archivo | Incluye las cartas/IDs de familia |
| --- | --- | --- |
| Proyectil | `weapons/projectile.webp` | `focused_projectiles`, `twin_emitters`, `rapid_projectiles`, rangos `projectile_*`, `projectile_evolution_offer` |
| Órbita | `weapons/orbit.webp` | `orbit_blade`, `orbit_reach`, rangos `orbit_*`, `orbit_evolution_offer` |
| Cadena | `weapons/chain.webp` | `chain_lightning`, `chain_overload`, rangos `chain_*`, `chain_evolution_offer` |
| Búmeran | `weapons/boomerang.webp` | `vector_boomerang`, rangos `boomerang_*`, `boomerang_evolution_offer` |
| Pulso | `weapons/pulse-ring.webp` | `pulse_ring`, rangos `pulse_ring_*`, `pulse_ring_evolution_offer` |
| Magnética | `weapons/magnetic-charge.webp` | `magnetic_charge`, rangos `magnetic_charge_*`, `magnetic_charge_evolution_offer` |

### Elección de evolución

Cada rama tiene dos imágenes diferentes, una por opción. La evolución elegida
se mantiene en las cartas de maestría posteriores de esa arma y en las cartas
repetibles de potencia Overdrive; no vuelve a la ilustración base.

| Arma | Primera opción | Segunda opción |
| --- | --- | --- |
| Proyectil | `rail_lance` → `evolutions/rail-lance.webp` | `pulse_volley` → `evolutions/pulse-volley.webp` |
| Órbita | `solar_crown` → `evolutions/solar-crown.webp` | `graviton_halo` → `evolutions/graviton-halo.webp` |
| Cadena | `closed_circuit` → `evolutions/closed-circuit.webp` | `thunderhead` → `evolutions/thunderhead.webp` |
| Búmeran | `twin_comet` → `evolutions/twin-comet.webp` | `singularity_return` → `evolutions/singularity-return.webp` |
| Pulso | `echo_shock` → `evolutions/echo-shock.webp` | `compression_wave` → `evolutions/compression-wave.webp` |
| Magnética | `event_horizon` → `evolutions/event-horizon.webp` | `polar_collapse` → `evolutions/polar-collapse.webp` |

La carta universal de maestría conserva arte propio: es una decisión genérica
anterior a escoger arma; la pantalla siguiente sí identifica cada evolución.

### Mejoras que no son armas

Cada opción ofrece una imagen con un motivo diferente; incluye reserva exclusiva
de Overdrive y la conversión NOVA.

| IDs | Archivo |
| --- | --- |
| `swift_step` | `non-weapon/swift-step.webp` |
| `reinforced_core` | `non-weapon/reinforced-core.webp` |
| `resonant_core` | `non-weapon/resonant-core.webp` |
| `regenerative_reactor` | `non-weapon/regenerative-reactor.webp` |
| `vampiric_core` | `non-weapon/vampiric-core.webp` |
| `critical_impact` | `non-weapon/critical-impact.webp` |
| `recharging_shield` | `non-weapon/recharging-shield.webp` |
| `hardened_shell` | `non-weapon/hardened-shell.webp` |
| `universal_weapon_mastery` | `non-weapon/universal-mastery.webp` |
| `overdrive_repair` | `non-weapon/overdrive-repair.webp` |
| `overdrive_nova` | `non-weapon/overdrive-nova.webp` |

## Guía de regeneración y procedencia

Los IDs son los retornados por el generador integrado; los PNG fuente quedan
en la biblioteca del host que los creó y no son dependencias del juego. El
repositorio contiene todos los derivados necesarios para que otra PC compile.
Para regenerar, partir del prompt común de abajo y sumar el brief de la fila;
conservar el ID del catálogo y revisar el resultado a tamaño de carta antes de
reemplazar el WebP.

**Prompt común:** “Final painted hero illustration for a premium sci-fi
survivor game's upgrade choice card, not a UI mockup. Landscape 2:1 composition.
Premium hand-painted 3D-stylized game art, sculpted dark gunmetal, pale ceramic
beveled armor, luminous energy channels, large readable silhouette and
controlled cinematic lighting. Midnight navy space background with restrained
particles. Keep the subject within the central 75% for mobile cropping. One
coherent subject, no people, text, letters, logos, card frame, UI, watermark or
complete screenshot. Make the material, silhouette, action and accent palette
visibly distinct from the other catalog entries.”

| Archivo | Brief particular que debe conservarse | ID de generación |
| --- | --- | --- |
| `weapons/projectile.webp` | Emisor compacto y direccional con proyectil concentrado; pulso dorado/ámbar. | `exec-8bd7dda6-691f-4ad6-9825-a3385e3d257f` |
| `weapons/orbit.webp` | Núcleo enmarcado por filos geométricos en órbita y arcos de contacto. | `exec-197087ec-ba6c-4635-b942-72e1193d1ff5` |
| `weapons/chain.webp` | Emisor que conecta varios blancos facetados con un rayo ramificado. | `exec-9a1fa44b-93f4-4464-9424-79ae1eeb4092` |
| `weapons/boomerang.webp` | Filo curvo con estela que sale y vuelve, silueta legible en abanico. | `exec-1e4504e3-50ee-4328-aff6-537b29572c50` |
| `weapons/pulse-ring.webp` | Generador bajo y ancho con una onda circular que se expande. | `exec-f026f3e6-7133-437b-a3e4-2c10236e4263` |
| `weapons/magnetic-charge.webp` | Carga suspendida, campo de atracción y zona de detonación contenida. | `exec-65a2e60e-4864-466f-bd2e-3feea6a7b423` |
| `evolutions/rail-lance.webp` | Emisor alargado y un único rayo recto que perfora una fila de blancos. | `exec-6f581247-67d5-4f6c-a0c3-3e7ffb4a0ebb` |
| `evolutions/pulse-volley.webp` | Emisor ancho; varias salvas separadas forman un abanico turquesa. | `exec-b94c7a10-4d74-47f5-a5dc-9e380d391d93` |
| `evolutions/solar-crown.webp` | Corona solar de filos en rotación, energía cálida y barrido orbital. | `exec-7b77de84-a09e-4037-8d1e-6929bbcd0a3a` |
| `evolutions/graviton-halo.webp` | Halo gravitatorio amplio que curva fragmentos hacia un centro oscuro. | `exec-dd4c8b61-cb3d-4bf4-aa9e-937cd178c93d` |
| `evolutions/closed-circuit.webp` | Red compacta de nodos unidos por un circuito eléctrico cerrado. | `exec-a1698696-dd8c-4fd1-acbd-cd7167436857` |
| `evolutions/thunderhead.webp` | Núcleo de tormenta y una descarga eléctrica explosiva de gran radio. | `exec-61630527-3b43-4156-b8f2-de653b26123b` |
| `evolutions/twin-comet.webp` | Cinco filos tipo cometa describen recorridos curvos de ida y regreso. | `exec-0e519177-0653-4911-82b3-179a3c621dc8` |
| `evolutions/singularity-return.webp` | Un grupo de fragmentos converge en un punto y estalla al retorno. | `exec-2c351581-750f-4792-94a0-e9ee821cfeb7` |
| `evolutions/echo-shock.webp` | Una onda única viaja y regresa por el mismo eje, con dos frentes visibles. | `exec-79010eba-011a-4d5e-926d-035340f8760e` |
| `evolutions/compression-wave.webp` | Tres frentes direccionales cortos se comprimen en una potente onda de empuje. | `exec-c6f09b0d-0fdb-4f14-89c9-0d85d5f16b2b` |
| `evolutions/event-horizon.webp` | Vórtice magnético sostenido que atrapa materia sin explosión final. | `exec-4d0a9f0e-6315-409c-b6d2-bc40f15a50a4` |
| `evolutions/polar-collapse.webp` | Arrastre polar y dos impactos en secuencia con un estallido final pesado. | `exec-e301ba7b-009f-4299-b8a8-14efe1175842` |
| `non-weapon/swift-step.webp` | Núcleo ligero con estela inclinada que comunica aceleración. | `exec-cc54fb8b-cf0f-4a86-816b-c6e62399dab5` |
| `non-weapon/reinforced-core.webp` | Reactor central robusto rodeado por placas de casco segmentadas. | `exec-a3c1950c-a62a-480c-9d4e-78a46fcae53d` |
| `non-weapon/resonant-core.webp` | Orbe que emite anillos concéntricos y fragmentos de experiencia. | `exec-104f2907-df39-4ca2-8736-d18ac327e661` |
| `non-weapon/regenerative-reactor.webp` | Reactor de reparación con un arco de energía verde que se recompone. | `exec-204c941a-7b0f-466d-9519-1db60985ea07` |
| `non-weapon/vampiric-core.webp` | Núcleo carmesí que absorbe motas de energía hacia su centro. | `exec-3c2749ae-da9d-4bab-896a-cee816b9d0fb` |
| `non-weapon/critical-impact.webp` | Punta de impacto y destello concentrado, lectura de golpe crítico. | `exec-6c01670a-76f6-4673-9555-f268eb157878` |
| `non-weapon/recharging-shield.webp` | Escudo hexagonal con cúpula protectora y arco de recarga cian. | `exec-3d780bcb-3660-4c06-ad73-542bfb5b2f8a` |
| `non-weapon/hardened-shell.webp` | Placas superpuestas de blindaje cerámico, compactas y pesadas. | `exec-10878bf2-0e27-47fc-ac38-90d1a09e1b11` |
| `non-weapon/universal-mastery.webp` | Núcleo de calibración que armoniza seis frecuencias de armas. | `exec-b5902a68-aa91-4b3e-b395-cc84cdd918e0` |
| `non-weapon/overdrive-repair.webp` | Corazón de emergencia y anillos de energía verde reparadora. | `exec-fa0754bc-ed1a-4822-b20d-7bd15fd8afac` |
| `non-weapon/overdrive-nova.webp` | Cristal NOVA que convierte una reserva de energía en un destello. | `exec-0dd6b232-0739-434a-b404-83053188bdc4` |

## Contrato visual y técnico

- Prompt común: ilustración panorámica 2:1 de una carta sci-fi de acción,
  acabado pictórico 3D estilizado, metal oscuro y cerámica clara, energía
  luminosa, composición centrada que sobreviva a la miniatura móvil, fondo
  espacial azul noche, sujeto/efecto legibles, sin texto, logos, marcos ni UI.
- Cada motivo y paleta se particulariza para comunicar la mecánica: trayectoria
  y proyectiles para armas; objeto central para armadura, escudo, reparación,
  regeneración, vampirismo, crítico, velocidad, experiencia, maestría o NOVA.
  Las dos evoluciones de cada arma difieren en silueta/acción, no sólo en color.
- Procedencia: generador de imágenes integrado de Codex durante desarrollo.
  Los WebP versionados del repositorio son las fuentes del juego; no se hacen
  llamadas a IA durante una partida ni se depende de archivos privados locales.
- Derivados: 768×384 WebP, calidad 88. El recorte se centra para ajustar 2:1.
  Son imágenes opacas decorativas; el marco, icono pequeño, título, descripción,
  cifras y selección siguen siendo HTML/SVG accesible.
- Hay 29 imágenes, 1,959,074 bytes transferibles en total si se solicitan todas.
  Una imagen decodificada equivale a 1.125 MiB RGBA8 teóricos; 3 cartas visibles,
  3.375 MiB. Son cálculos de píxeles, no una medición de memoria del navegador.
- Las imágenes se incorporan al DOM al presentar una oferta; no se cargan ni
  crean texturas Pixi para esta UI. El navegador controla caché y decodificación.
  No precargar el catálogo completo. Se conservan hasta tres cartas visibles.
- Un error de carga elimina la ilustración y devuelve la carta al icono SVG;
  texto, foco, preview, acción y selección siguen funcionando. `?card-art=svg`
  permite comparar el modo anterior sin cambiar combate.
- Si aparece una nueva carta de upgrade, agregar un motivo propio a
  `NON_WEAPON_ILLUSTRATIONS` o a la familia/evolución correspondiente. La prueba
  `UpgradeCardVisual.test.ts` exige arte y etiqueta para todo el catálogo; ampliar
  ese test al agregar definiciones. No reciclar el arte de otra mejora sólo para
  que la prueba pase.

## Validación y accesos de prueba

- Catálogo normal: `/?debug=1&campaign=evolved&quality=low`.
- Evoluciones: `/?evolution=solar-crown&debug=1&quality=low` (abre ambas opciones
  de Órbita); hay una ruta equivalente para cada ID de la tabla.
- No armas: `/?card=vampiric-core&debug=1&quality=low`, `?card=hardened-shell`
  o `?card=recharging-shield` (mantener `debug=1`).
- Evolución ya elegida: `/?debug=1&campaign=evolved&quality=low`; escoger
  «Potencia calibrada» para verificar Rail Lance, Solar Crown y Closed Circuit.
- SVG comparativo: añadir `&card-art=svg` a cualquiera de las rutas.
- La cobertura automática verifica IDs, unicidad del arte, carga y asociación de
  las doce evoluciones, categorías defensivas, selección, fallback y composición
  en desktop/móvil. Ejecutar `node docs/visual/capture-evolution-art.mjs
  http://localhost:5173/` para capturas del catálogo ilustrado.

Pendiente de aprobación humana: inspeccionar en el juego los tamaños y el estilo
en móvil físico. No se midieron FPS ni se certificaron anuncios/SDK de portales.
