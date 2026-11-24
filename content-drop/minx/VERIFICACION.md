# Verificación del contenido de Megaminx

Verificado con un simulador geométrico propio (132 stickers) que usa los nombres de cara de cubing.js documentados en docs/DECISIONES.md (Fase 9): U arriba, F al frente; anillo superior F, R, BR, BL, L; anillo inferior FR, DR, B, DL, FL; D abajo. Giro sin número = 72° horario mirando la cara; 2 = 144°; prima invierte.

Chequeos del simulador: cada giro tiene orden 5; U lleva lo de F hacia L (horario visto desde arriba); las caras opuestas coinciden con la tabla de DECISIONES.md.

## Qué se comprobó
1. Los 37 casos (EO 3, CO 16, EP 3, CP 15) cubren todas las clases posibles de cada paso del 4LLL, salvo giros de U antes y después.
2. Cada algoritmo resuelve exactamente su `setup`, y cada `setup` es la inversa exacta del algoritmo. Todos los casos tienen F2L resuelto.
3. Cada caso pertenece al paso declarado: EO (aristas sin orientar), CO (aristas orientadas, esquinas no), EP (orientado, aristas fuera de lugar), CP (solo esquinas fuera de lugar respecto a las aristas).
4. Lección EO: con F R U R' U' F' y giros de U, las reglas de la lección resuelven todos los patrones con 2 aplicaciones como máximo.
5. Lección CO: el truco (R' FR' R FR) x2 en la esquina F-R, girando solo U, resuelve los 81 patrones de giro y devuelve el F2L intacto. (R' FR' R FR) tiene orden 6.
6. Lección CP: con A (fija 2 esquinas vecinas) y B (fija 2 separadas), todo ciclo de 3 se resuelve con 1 o 2 aplicaciones desde algún ángulo, y desde todo caso con 0 o 1 esquinas bien existe un ángulo que deja 2 bien.

## Fuentes
- EO, CO, EP y 11 casos de CP: algoritmos tomados de https://www.cubeskills.com/uploads/pdf/tutorials/intermediate-megaminx-techniques.pdf (Feliks Zemdegs y Andy Klise). El PDF viene con varios algoritmos pegados por renglón; se probaron todos los tramos y solo quedaron los que conservan F2L. Algunos pueden ser la unión de dos algoritmos seguidos del PDF, pero todos están verificados.
- 5 casos de CP: `generated:` = combinación verificada de dos algoritmos de CP del mismo PDF.
- Notación de mezclas: WCA 12d.

## Si la verificación con KPuzzle falla
No cambiar los datos: reportar set, caso y variante (puede ser una diferencia de nombre de cara o de sentido de giro).
