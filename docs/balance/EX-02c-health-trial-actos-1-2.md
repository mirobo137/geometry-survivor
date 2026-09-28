# EX-02c — prueba de vida en Actos I y II

**Estado:** APROBADO POR VALIDACIÓN HUMANA — 28-09-2026.
**Alcance:** vida base de enemigos normales de Actos I y II; ajuste adicional
aislado para Chaser.

| Acto | Enemigo | Base original | Prueba inicial (+20%) | Prueba actual |
| --- | --- | ---: | ---: | ---: |
| I | Chaser | 24 | 28.8 | **37.44** |
| I | Fast | 12 | 14.4 | 14.4 |
| I | Tank | 72 | 86.4 | 86.4 |
| I | Elite | 132 | 158.4 | 158.4 |
| II | Orbiter | 32 | 38.4 | 38.4 |
| II | Charger | 38 | 45.6 | 45.6 |
| II | Splitter | 46 | 55.2 | 55.2 |
| II | Prism Weaver | 52 | 62.4 | 62.4 |

La prueba inicial usa un multiplicador común `1.2`. La iteración actual añade
`1.3` solo al Chaser: `24 × 1.2 × 1.3 = 37.44`. Por tanto, esta iteración es
30% más resistente que la prueba inicial para Chaser y 56% sobre su base
original; no se redondea para conservar la proporción exacta. Los otros siete
enemigos mantienen la prueba inicial. Los hijos del Splitter siguen aplicando
su escala local authored a partir de la vida del padre.

Acto III normal (Fracture Gunner 58, Thorn Bastion 148, Zigzag Reaver 72 y Rift
Miner 92) y Warden Replica no cambian. Esta ficha solo cubre enemigos normales;
el aumento separado de bosses se registra en
[`EX-02c-boss-health-trial.md`](EX-02c-boss-health-trial.md). Tampoco cambian
daño, velocidad, frecuencias de spawn, experiencia, puntuación ni recompensas.
Overdrive compone su multiplicador de tramo sobre la vida base actual de cada
familia; al reutilizar Chaser también reflejará su aumento adicional.

El usuario aprueba estos valores como baseline actual del balance jugable. No
se afirma que se haya completado una matriz cuantitativa de diez runs ni que
cada multiplicador sea universalmente óptimo; cualquier ajuste futuro queda
acotado a un problema específico observado durante el juego.
