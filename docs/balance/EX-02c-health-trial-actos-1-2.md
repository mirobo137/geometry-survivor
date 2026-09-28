# EX-02c — prueba de +20% de vida en Actos I y II

**Estado:** implementación de prueba; falta validación humana del usuario.
**Alcance:** vida base de enemigos normales de Actos I y II.

| Acto | Enemigo | Antes | Prueba |
| --- | --- | ---: | ---: |
| I | Chaser | 24 | 28.8 |
| I | Fast | 12 | 14.4 |
| I | Tank | 72 | 86.4 |
| I | Elite | 132 | 158.4 |
| II | Orbiter | 32 | 38.4 |
| II | Charger | 38 | 45.6 |
| II | Splitter | 46 | 55.2 |
| II | Prism Weaver | 52 | 62.4 |

El ajuste usa un multiplicador común `1.2`, conserva valores no enteros para
que el aumento sea exactamente 20% y ocurre en las definiciones base. Los
hijos del Splitter siguen aplicando su escala local authored a partir de la
vida del padre.

Acto III (Fracture Gunner 58, Thorn Bastion 148, Zigzag Reaver 72 y Rift Miner
92), boss y Warden Replica no cambian. Tampoco cambian daño, velocidad,
frecuencias de spawn, experiencia, puntuación ni recompensas. Overdrive compone
su multiplicador de tramo sobre la vida base actual de las familias I/II; por
eso también reflejará este +20% al reutilizarlas.

La prueba no cierra EX-02c. Después de partidas manuales, registrar por acto
sensación de tiempo para derrotar cada tipo, presión recibida y si el jugador
puede responder con sus armas iniciales, antes de decidir conservar, retocar o
revertir el multiplicador.
