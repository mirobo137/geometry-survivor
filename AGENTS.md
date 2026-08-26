# Geometry Survivor — instrucciones para agentes

Estas reglas aplican a todo el repositorio. Están escritas para ser neutrales al modelo y deben producir el mismo criterio de trabajo en Grok Build, Codex y otros agentes compatibles con `AGENTS.md`.

## Fuentes de verdad

Respeta este orden:

1. solicitud actual del usuario;
2. [PLAN_DESARROLLO.md](PLAN_DESARROLLO.md) para alcance, decisiones, fases y puertas;
3. [proyecto.md](proyecto.md) para visión y principios de largo plazo;
4. la skill pertinente para el procedimiento de la tarea;
5. el código y los tests como descripción del estado implementado.

Si detectas una contradicción material, no inventes una solución silenciosa: explica el conflicto y actualiza la fuente correcta cuando la tarea autorice cambios.

## Antes de actuar

- Al retomar el proyecto en otra sesión, lee [CONTINUACION.md](CONTINUACION.md) como snapshot operativo y comprueba que siga vigente frente al plan, el código y Git. No es una fuente de verdad superior.
- Para cambios importantes de arquitectura, alcance o plataforma, lee completos `proyecto.md` y `PLAN_DESARROLLO.md`.
- Para tareas acotadas, lee este archivo, la skill correspondiente y las secciones que esa skill indique.
- Inspecciona el código existente antes de proponer archivos o abstracciones nuevas.
- Consulta documentación oficial vigente cuando una API, SDK o requisito de plataforma pueda haber cambiado.
- Conserva cambios del usuario que no pertenezcan a la tarea.

## Skills canónicas

Las skills canónicas están en `skills/`. Carga la mínima combinación que cubra la tarea:

- [geometry-survivor-architecture](skills/geometry-survivor-architecture/SKILL.md): capas, módulos, contratos y cambios estructurales.
- [geometry-survivor-gameplay](skills/geometry-survivor-gameplay/SKILL.md): armas, enemigos, upgrades, hazards, bosses y balance.
- [geometry-survivor-rendering](skills/geometry-survivor-rendering/SKILL.md): PixiJS, SVG, UI visual, animación y FX.
- [geometry-survivor-svg](skills/geometry-survivor-svg/SKILL.md): SVG code-first, iconos, assets, accesibilidad, optimización y validación.
- [geometry-survivor-mobile-performance](skills/geometry-survivor-mobile-performance/SKILL.md): viewport, input, loop, spatial grid, pooling, calidad y profiling.
- [geometry-survivor-platforms](skills/geometry-survivor-platforms/SKILL.md): GitHub Pages, Poki, CrazyGames, anuncios y guardado.
- [geometry-survivor-validation](skills/geometry-survivor-validation/SKILL.md): tests, CI, revisión, presupuestos y puertas de fase.

Si una tarea cruza dominios, combina únicamente las skills necesarias. Por ejemplo, un nuevo Laser normalmente necesita gameplay + rendering + mobile-performance + validation.

## Portabilidad

- `skills/` es la fuente canónica neutral y se carga mediante este `AGENTS.md`.
- `.grok/skills/` contiene adaptadores finos de descubrimiento para Grok y no debe duplicar reglas.
- No cambies una decisión técnica según el nombre del modelo que ejecuta la tarea.
- No dependas de memoria de conversaciones, prompts privados o configuración global de un agente.
- No copies reglas extensas entre `AGENTS.md`, skills y documentos. Enlaza la fuente canónica.
- Si cambia el nombre, descripción o ubicación de una skill canónica, actualiza su adaptador Grok correspondiente.

## Runtime del agente

El modelo por sí solo no controla un repositorio. El host debe abrir este directorio como raíz y darle herramientas de lectura, edición y validación.

- Codex/GPT: iniciar en la raíz para que reciba `AGENTS.md`; las skills canónicas se enrutan desde este archivo.
- Grok Build: iniciar en la raíz; descubre `AGENTS.md` y los adaptadores de `.grok/skills/`.
- API directa de GPT o Grok: el orquestador debe cargar `AGENTS.md`, entregar la skill pertinente y exponer herramientas equivalentes. No asumir descubrimiento automático de archivos.

## Límites de implementación

- Simulación no importa PixiJS, DOM ni SDKs.
- Presentación no decide daño, drops, dificultad ni progresión.
- Contenido configura sistemas; no modifica el engine salvo mecánica fundamental nueva.
- Los builds `local`, `poki` y `crazygames` permanecen separados.
- El resize cambia presentación, no simulación.
- No crear infraestructura futura sin un consumidor o una puerta del plan actual.
- No agregar dependencias, servicios externos o analítica sin justificar peso, privacidad y compatibilidad de plataforma.

## Validación y entrega

- Una petición de revisar, explicar o planear no autoriza implementar código no solicitado.
- Una petición de construir, cambiar o corregir incluye las validaciones locales no destructivas pertinentes.
- Prueba la lógica crítica sin levantar Pixi cuando sea posible.
- Reporta qué se comprobó y qué no pudo comprobarse; no presentes una suposición como resultado medido.
- Una feature debe satisfacer la Definition of Done y la puerta de su fase en `PLAN_DESARROLLO.md`.
