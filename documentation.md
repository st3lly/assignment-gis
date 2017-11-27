## Úvod

Aplikácia zobrazuje nabájacie stanice pre elektromobily a hybridné automobily v rámci Slovenskej Republiky na mape. Najdôležitejšie funkcie:
- filtrovanie podľa typu nabíjacích staníc (farebne odlíšené a rozdelené do vrstiev)
- zobrazenie staníc podľa okresu
- zobrazenie staníc vo zvolenej vzdialenosti od vybraného bodu na mape
- zobrazenie bodov záujmu v okruhu 500 metrov od zvolenej nabíjacej stanice

## Screenshots

Vzhľad aplikácie
![Screenshot](screenshots/screenshot1.png)

Zobrazenie nabíjacích stanív v okrese Bratislava I
![Screenshot](screenshots/screenshot2.png)

Zobrazenie nabíjacích staníc v okruhu 5 km od zvoleného bodu
![Screenshot](screenshots/screenshot3.png)

Zobrazenie odov záujmu v okruhu 500 metrov od zvolenej nabíjacej stanice
![Screenshot](screenshots/screenshot4.png)

## Frontend

Frontend aplikácie tvorí statické HTML `static/templates/index.html`. Hlavná logika frontendu je v `static/js/mapbox.js`, ktorý komunikuje s API a stará sa o vykreslenie dát do mapy.

## Backend

Backend aplikácie je vytvorený vo frameworku [Flask](http://flask.pocoo.org/) (python framework). Databázu sme využili PostgreSQL s rozšírením PostGIS. Obsluha API volaní je v súbore `app.py` a o komunikáciu s DB sa stará `models.py`, kde sú jednotlivé queries.

## Dáta

### Open Charge Map
Základné dáta o naíjacích staniciach pre aplikáciu boli použíte z [Open Charge Map](https://www.openchargemap.org/). Dáta majú dostupné len prostredníctvom API v json formáte. Pre uloženie týchto dát sme si vytvorili nasledovnú tabuľku:

```SQL
CREATE TABLE charging_stations (
	id SERIAL PRIMARY KEY,
	operator_title text,
	operator_url text,
	operator_mail text,
	is_pay_at_location boolean,
	is_membership_required boolean,
	usage_cost text,
	address_title text,
	address_line1 text,
	address_line2 text,
	address_town text,
	address_postcode text,
	geom geography,
	contact_phone text,
	number_of_points integer,
	connection_type_title text,
	connection_type_name text,
	connection_amps	integer,
	connection_voltage integer,
	connection_power integer,
	connection_current_type	text,
	connection_current_desc	text
);
```

Dáta sa vkladajú do DB v (`models.py`) v metóde insertDataFromAPI().

### Open Street Maps
Ako ďalší zdroj dát sme použili [Open Street Maps](https://www.openstreetmap.org/). Stiahli sme dáta pre celé Slovensko a iportovali do DB použitím nástroja `osm2pgsql`. Tieto dáta sú použité pre body záujmu.

### Geoportál
Hranice okresov sme stiahli z [Geoportál](https://www.geoportal.sk/). Konkrétne [https://www.geoportal.sk/files/zbgis/na_stiahnutie/shp/ah_shp_0.zip](https://www.geoportal.sk/files/zbgis/na_stiahnutie/shp/ah_shp_0.zip). Dáta sme naiportovali použitím nástroja `shp2pgsql`.

## Api

**Find hotels in proximity to coordinates**

`GET /search?lat=25346&long=46346123`

**Find hotels by name, sorted by proximity and quality**

`GET /search?name=hviezda&lat=25346&long=46346123`

### Response

API calls return json responses with 2 top-level keys, `hotels` and `geojson`. `hotels` contains an array of hotel data for the sidebar, one entry per matched hotel. Hotel attributes are (mostly self-evident):
```
{
  "name": "Modra hviezda",
  "style": "modern", # cuisine style
  "stars": 3,
  "address": "Panska 31"
  "image_url": "/assets/hotels/652.png"
}
```
`geojson` contains a geojson with locations of all matched hotels and style definitions.
