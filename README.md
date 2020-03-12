# Ticketmapster
Web-sovellus Ticketmaster-tapahtumien löytämiseen ja selaamiseen.

Ticketmapster on tehty kolmen viikon aikana ryhmätyönä Metropolia-ammattikorkeakoulussa.
Työn tarkoituksena oli opetella HTML, CSS ja JavaScript-kielien käyttöä.

Demo: https://users.metropolia.fi/~jonisavo/ticketmapster/

## Käytetyt ohjelmistot
Ticketmapster käyttää seuraavia kolmansien osapuolien ohjelmistoja:

- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Ticketmapster API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- [Helsinki Linked Events API](http://dev.hel.fi/apis/linked-events/)
- [OpenCageData Geocoding API](https://opencagedata.com/)
- [Leaflet Routing Machine](https://www.liedman.net/leaflet-routing-machine/)
- [Mapbox Directions API](https://docs.mapbox.com/help/glossary/directions-api/)
- [OpenWeatherMap](https://openweathermap.org/)

## Toiminnot
Sovellus hakee tapahtumia Ticketmaster API:n ja Helsinki Linked Events API:n avulla, ja tekee niistä kartalle
interaktiiviset merkit. Lisäksi OpenWeatherMapin API:tä käytetään viiden päivän sääennusteen hakemiseksi merkkien
kohdalla. Leaflet Routing Machinea ja Mapboxin Directions API:ta käytetään reitittämiseen käyttäjän antaman sijainnin
ja valitun merkin välillä. Sijainti voidaan hakea automaattisesti paikantamalla se, tai käyttäjä voi antaa sen
manuaalisesti kirjoittamalla osoitteen hakukenttään tai tuplaklikkaamalla karttaa.

