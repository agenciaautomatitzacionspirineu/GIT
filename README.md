# Chronos Civitas

Joc de navegador en PHP, HTML, CSS i JavaScript inspirat en gestio de ciutat, progressio d'eres i arbre tecnologic.

## Estat actual

- Mapa grafic 8x8 amb caselles mixtes: bosc, prat, pedrera, riera i turons.
- Recursos amb produccio continua: menjar, fusta, pedra, fibra, coneixement i seguretat.
- Poblacio, treballadors disponibles, moral i consum de menjar.
- Construccions amb compte enrere i sense limit fix d'accions simultanies.
- Cua paral.lela per lloc: accions diferents avancen alhora, pero les del mateix objectiu esperen en ordre.
- Recerca tecnologica inicial de la prehistoria.
- Fitxes especials de ciutat: magatzem, graner, hotel, hospital i espais reservats.
- Hotel amb atraccio, visitants i intercanvi calculat segons ciutat, recursos, poblacio i moral.
- Malalties que redueixen treballadors disponibles, mitigades per l'hospital.
- Esdeveniments naturals que alteren produccio o seguretat.
- Nova partida configurable: dificultat, recursos limitats/il.limitats i objectiu.
- Persistencia local amb `localStorage` i endpoints PHP preparats per guardar a sessio.
- Esquema MySQL modular a `database/schema.sql` amb partides, cues, configuracio de regles i caselles.

## Executar en local

```bash
php -S 127.0.0.1:8000
```

Obre `http://127.0.0.1:8000`.

## Estructura

- `index.php`: pantalla principal del joc.
- `assets/js/game-data.js`: dades modulars de recursos, eres, edificis, tecnologies i esdeveniments.
- `assets/js/game-engine.js`: simulacio, cues, produccio, poblacio i objectius.
- `assets/js/ui.js`: renderitzat i interaccio.
- `assets/css/styles.css`: entorn grafic.
- `api/`: endpoints PHP inicials.
- `config/game.php`: configuracio de projecte i MySQL.
- `database/schema.sql`: base de dades preparada per futures partides i usuaris.

## Properes ampliacions recomanades

1. Moure el guardat real a MySQL amb autenticacio d'usuari.
2. Afegir contingut complet per Mesopotamia i Egipte.
3. Convertir l'arbre tecnologic en una visualitzacio amb branques i prerequisits.
4. Afegir edificis especialitzats per cada era.
5. Afegir informes historics i estadistiques de produccio.
6. Crear una pantalla d'administracio per editar la configuracio de cada casella.
