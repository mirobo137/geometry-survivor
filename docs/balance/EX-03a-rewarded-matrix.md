# EX-03a — matriz automática de rewarded

Fecha: 06-09-2026  
Estado: AUTOMÁTICO PARCIAL — puerta humana pendiente  
Alcance: contrato local, disponibilidad, resultados, concurrencia e idempotencia

## Evidencia automática

La matriz local cubre los cuatro placements actuales:

| Placement | Éxito | Unavailable | Dismissed | Error/timeout | Repetición/solapamiento |
| --- | --- | --- | --- | --- | --- |
| `revive` | OK | OK | contrato compartido | contrato compartido | ledger/token OK |
| `reroll` | OK | OK | contrato compartido | contrato compartido | ledger/token OK |
| `double-nova` | OK | OK | contrato compartido | contrato compartido | ledger/token OK |
| `cosmetic-unlock` | OK | OK | contrato compartido | contrato compartido | ledger/token OK |

Las pruebas cubren además:

- `RewardedAdController` bloquea solicitudes concurrentes, libera el lock en
  resultado y excepción, no abre el anuncio cuando la disponibilidad falla y
  conserva el resultado exitoso para cada placement.
- `LocalAdService` convierte `?ad=unavailable`, `?ad=dismissed`,
  `?ad=error` y `?ad=timeout` al contrato local sin lanzar excepciones.
- `RewardedOfferLedger` ignora un settlement repetido o tardío, consume un
  placement exitoso una sola vez y permite reintentar un resultado fallido.

Comando específico:

```text
npm test -- --run src/platform/local/LocalAdService.test.ts src/platform/RewardedAdController.test.ts src/platform/RewardedOfferLedger.test.ts
```

Resultado: 3 archivos y 26 tests en verde.

## Pendientes que no se deben declarar cubiertos

1. La UI de reroll actualmente ofrece anuncio o elegir una carta. La
   alternativa de pagar NOVA indicada en §16.7 todavía no está implementada.
   DEC-05 debe fijar coste y momento exacto del débito antes de cambiar
   `Game`, `LevelUpOverlay` o el save; no se inventa ese precio aquí.
2. Falta probar cada placement con retorno real de background, cierre de vista,
   audio/input y pausa en un dispositivo físico. El smoke emulado no sustituye
   esa evidencia.
3. EX-03b requiere diez runs normales en un mismo teléfono/navegador/preset y
   EX-03c requiere sesiones `?stress=1&profile=1&quality=low` comparadas con
   Medium/High. No se rellenan métricas objetivo sin ejecutar esas sesiones.

Por tanto, esta ficha cierra la cobertura automática de EX-03a hasta el límite
del contrato actual, pero EX-03 completo sigue en espera humana y DEC-05.
