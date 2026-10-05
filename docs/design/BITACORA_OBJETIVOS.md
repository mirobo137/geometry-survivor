# Bitácora — rangos y cobro manual

Actualización autorizada el 04-10-2026. Sustituye los objetivos generales de
una sola reclamación y su pago automático del prototipo de retención.
No modifica retos semanales, ruleta, balance ni recompensas normales de run.

## Flujo

1. Sólo partidas normales definitivas y elegibles aportan progreso.
   Abandonos, escenarios debug, prácticas y retos semanales no cuentan.
   Una derrota pendiente de reanimación todavía no es una run definitiva.
2. Completar deja el objetivo **por cobrar**, sin añadir NOVA de Bitácora
   a la liquidación de la run ni a su multiplicador por video.
3. El resumen destaca hasta tres objetivos y permite **Volver a Bitácora**,
   tanto en derrota como victoria; continuar al siguiente acto sigue disponible.
4. La tarjeta completada muestra **Cobrar +N NOVA**. Sólo esta pulsación paga.
5. El pago confirmado activa el siguiente rango general desde cero. No se
   arrastra el excedente ni se cuentan partidas anteriores al cobro siguiente.
   Mientras un premio está pendiente, ese objetivo no acumula futuros rangos.
6. Los objetivos únicos desaparecen del listado después de cobrarse. Su
   reclamación permanece guardada; no reaparecen al recargar o repetir el acto.

## Parámetros iniciales de prueba

`r` es el rango mostrado, empezando por 1. Los objetivos generales son siete;
las tres líneas de bajas y las dos de partidas siguen siendo ofertas separadas.

| Familia | Meta del rango r | Recompensa |
| --- | --- | --- |
| Primera travesía / Piloto constante | Meta base × r partidas nuevas (bases 1 / 10) | Base + redondeo hacia arriba de `base × 0.25 × (r−1)` |
| Primer centenar / Control de flota / Rompelíneas | Meta base × r bajas nuevas (bases 100 / 500 / 1,500) | Misma fórmula; bases 50 / 100 / 150 NOVA |
| Pulso firme | 5 min + 1 min por rango adicional, en una nueva run | Misma fórmula; base 75 NOVA |
| Más allá del límite | 3 + (r−1) etapas en una nueva run Overdrive | Misma fórmula; base 200 NOVA |
| Bosses de campaña y Actos I–III | Seis objetivos únicos, sin reciclar | Recompensas base sin cambiar |

Ejemplo: Primera travesía pasa de 1 partida / 50 NOVA a 2 partidas / 63 NOVA,
luego 3 partidas / 75 NOVA. Pulso firme pasa de 5 min / 75 NOVA a
6 min / 94 NOVA. Las cifras son provisionales para prueba humana, no balance
de economía cerrado. No se añade poder directo ni un coste para entrar.

## Guardado e integridad

Schema **13** migra de 10/11/12 conservando wallet, ruleta (incluido porcentaje),
retos, catálogo, Laboratorio y preferencias. Los `completedObjectiveIds`
anteriores significan **pagado**, no premio pendiente: se importan como un cobro
ya realizado, sin repetir NOVA. Los generales pagados comienzan su rango 2
desde cero; los únicos pagados se ocultan. Métricas legacy demostrables de
objetivos aún no pagados se conservan para el primer rango.

`objectiveCycles` contiene sólo trece pares `{ claimed, value }`; no crece
el historial con cada rango. Contadores y metas se limitan defensivamente a
1,000,000,000; los campos desconocidos/no finitos se descartan. La selección
de un objetivo único retirado pasa a uno activo. No se añade un loop de combate:
la evaluación ocurre al resolver una run, y el pago sólo en menú.

`RetentionObjectiveService` revalida el estado actual bajo Web Lock del origen;
cartera y rango se escriben juntos y se confirman por lectura. Doble clic,
botones desactualizados en otra pestaña y recarga no duplican el mismo cobro.
Si la cartera no tiene espacio para **todo** el premio, no se consume el objetivo.
Si falla storage, sigue pendiente; no prometer persistencia cuando el navegador
la bloquea. Requiere HTTPS/localhost y navegador con Web Locks; sin soporte
se explica el impedimento sin consumir el premio. No es antitrampas ni
sincronización entre dispositivos. Los premios semanales mantienen su contrato.

La UI conserva las ilustraciones aprobadas, ordena pendientes primero,
presenta rango/meta/recompensa y usa una tarjeta-botón sin botones anidados.
No añade imágenes, dependencias, filtros o partículas. El próximo rango usa
la misma ilustración de su familia, con meta y recompensa nuevas.

## Validación

Unitarias: terminal normal sin bono automático, idempotencia del cierre,
cobro/recarga, nuevos rangos y progreso fresco, actos/bosses únicos, cuota,
cartera llena, doble clic, lock compartido y migración sin repagar.
Smoke PC/móvil: cobrar explícitamente, incrementar wallet, rango nuevo,
retirar campañas, navegación ida/vuelta, persistencia tras recarga, fallo de
storage y dos pestañas con UI desactualizada. Ruleta probada como regresión.
QA humana pendiente: ritmo de las metas, generosidad de NOVA y móvil físico.

Evidencia final local: tipado, **737 unitarias / 132 archivos** y **10 smoke
PC/móvil en 29.6s** (cuatro Bitácora, seis ruleta), todos correctos.
Builds Local/Poki/CrazyGames: **14,939,834 / 9,869,389 / 9,869,395 bytes**,
por debajo de 15 MB; mapas conservados en Local. Persiste el warning conocido
de chunk JS mayor de 500 kB. No se ejecutó toda la suite browser ni se validó
en dispositivo físico/portal real. Servidor del usuario no reiniciado; preview
de pruebas cerrado al terminar. Sin commit, push o publicación automática.
