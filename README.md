# General course assignment

Build a map-based application, which lets the user see geo-based data on a map and filter/search through it in a meaningfull way. Specify the details and build it in your language of choice. The application should have 3 components:

1. Custom-styled background map, ideally built with [mapbox](http://mapbox.com). Hard-core mode: you can also serve the map tiles yourself using [mapnik](http://mapnik.org/) or similar tool.
2. Local server with [PostGIS](http://postgis.net/) and an API layer that exposes data in a [geojson format](http://geojson.org/).
3. The user-facing application (web, android, ios, your choice..) which calls the API and lets the user see and navigate in the map and shows the geodata. You can (and should) use existing components, such as the Mapbox SDK, or [Leaflet](http://leafletjs.com/).

## My project

Fill in (either in English, or in Slovak):

**Application description**: Jednoduchá aplikácia, ktorá zobrazuje nabíjacie stanice pre elektromobily a hybridné automobily na Slovensku. Aplikácia tiež umožňuje zobrazenie nabíjacích staníc v rámci vybraného okresu a alebo v určitom okruhu od zvolenej polohy na mape. Po kliknutí na nabíjaciu stanicu na mape je možné zobraziť body záujmu (občerstvenie, kaviarne, bary ...) v okruhu 500 m od nabíjacej stanice. Mapa je rozdelená do niekoľkých vrstiev, pričom každá vrstva obsahuje nabíjacie stanice určitého typu. Používateľ si môže vybrať, ktoré vrstvy budú zobrazené.

**Data source**: [Open Street Maps](https://www.openstreetmap.org/), [Open Charge Map](https://www.openchargemap.org/), [Geoportál](https://www.geoportal.sk/)

**Technologies used**: [Flask](http://flask.pocoo.org/), [PostGIS](http://postgis.net/), [MapBox](https://www.mapbox.com/), [Leaflet](http://leafletjs.com/), [jQuery](https://jquery.com/), [Bootstrap](https://getbootstrap.com/)
