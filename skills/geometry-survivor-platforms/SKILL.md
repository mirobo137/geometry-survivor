---
name: geometry-survivor-platforms
description: Implementar o revisar builds, lifecycle, anuncios, guardado y release de Geometry Survivor para GitHub Pages, Poki o CrazyGames. Usar para SDKs y requisitos de portal; requiere comprobar documentación oficial vigente.
metadata:
  short-description: GitHub Pages, Poki y CrazyGames
---

# Plataformas y release

Mantén una sola simulación con adaptadores aislados y bundles separados.

## Contexto requerido

Lee `../../PLAN_DESARROLLO.md`, especialmente “Builds y GitHub Pages”, “Integración Poki y CrazyGames”, “Guardado” y Fase 8. Consulta `../../proyecto.md` secciones 37–41. Antes de cambiar un SDK o requisito, abre su documentación oficial vigente.

## Invariantes

- Builds separados `local`, `poki` y `crazygames`; no cargar SDKs cruzados.
- Core/gameplay nunca importa un SDK.
- Lifecycle deriva de una state machine y sus eventos son idempotentes.
- Error, timeout, adblock o anuncio sin fill nunca bloquea el juego.
- El juego está pausado durante un anuncio real; audio se silencia al empezar y se restaura en fin/error.
- GitHub Pages usa LocalAdapter con anuncios y fallos simulados; no pretende validar SDK real.
- Assets, fonts y librerías van empaquetados; sin requests externos innecesarios.
- Paths relativos y `base: "./"` salvo decisión documentada contraria.
- Save schema versionado, payload pequeño y fallback seguro.
- Inglés fallback, PEGI 12 y sin fullscreen propio en CrazyGames.

## Procedimiento

1. Identifica plataforma, fase Basic/Full y ambiente real.
2. Verifica documentación oficial y anota fecha si cambia una decisión.
3. Implementa detrás de `PlatformLifecycle`, `AdService` o `SaveStore`.
4. Simula success, skip, error, demora y retorno de background en LocalAdapter.
5. Construye el bundle aislado y revisa requests de red/paths.
6. Para release, valida en Poki Inspector o CrazyGames Preview, no solo GitHub Pages.

## Límites comerciales

La compatibilidad técnica no sustituye términos contractuales. Si se publica en ambas plataformas, comprueba que cualquier acuerdo de Poki permita la distribución prevista.

## Entrega

Reporta documentación consultada, bundle probado, ambiente, eventos observados, fallos simulados y aspectos que requieren el portal real.
