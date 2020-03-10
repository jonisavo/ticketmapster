'use strict';

let currentMarker = null;   // Käyttäjän sijainti
let targetMarker = null;    // Reitityksen kohde
let currentRoute = null;    // Reitityksen reitti

// Tehdään kartta
let map = L.map('map').setView([60.171972,24.941496], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    noWrap: true
}).addTo(map);

// Siirretään karttaa aina popupia avattaessa
map.addEventListener("popupopen", popup => {
    let pan_location = map.project(popup.target._popup._latlng);
    // Siirretään karttaa hieman alemmas
    pan_location.y -= popup.target._popup._container.clientHeight/1.5;
    map.panTo(map.unproject(pan_location), {animate: true});
});

// Karttaa klikkaaminen asettaa markerin
map.addEventListener("dblclick", evt => {
    setCurrentLocation(evt.latlng.lat, evt.latlng.lng);
    reverse_geocode(evt.latlng.lat, evt.latlng.lng);
});

// Kaikkien markerien popupien kokoa muutetaan, kun selaimen ikkunan koko muuttuu.
// Timeoutia käytetään, jotta resizeAllMarkers()-funktiota ei suoritettaisi koko ajan.
// Ilmeisesti Timeoutin käyttöön tarvitsee luoda muuttujan, joka tässä tapauksessa
// on sitten julkinen.
let marker_resize_timeout;
window.addEventListener('resize', evt => {
    clearTimeout(marker_resize_timeout);
    marker_resize_timeout = setTimeout(resizeAllMarkers(),100)
});

// Päivitetään kaikkien markerien koko.
function resizeAllMarkers() {
    map.eachLayer(layer => {
        if (layer instanceof MapsterMarker) {
            layer.resizePopup();
        }
    })
}

// Tarkastaa, ovatko annettu leveys- ja pituuspiiri kelvollisia.
function validateCoordinates(latitude, longitude) {
    return (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180)
}

// MapsterMarker on L.Markerin alaluokka, joka sisältää tapahtuma-olioita ja
// markerin koordinaateissa sijaitsevan sääennusteen.
const MapsterMarker = L.Marker.extend({

    //Weather-lista viidelle päivälle.
    weather: [],
    events: [],
    details: null,

    // Lisää tapahtuman markeriin, mikäli sen nimistä tapahtumaa ei ole tai muuta
    // tapahtumaa ei löydy, jolla on sama id.
    addEvent: function (eventToAdd) {
        let will_add = true;
        this.events.forEach(event => {
            if (eventToAdd.id === event.id || eventToAdd.name === event.name) {
                will_add = false;
            }
        });
        if (will_add) { this.events.push(eventToAdd); }
    },

    // Hakee markerin sijainnissa olevan lämpötilaennusteen ja päivittää sitten
    // popupin automaattisesti.
    fetchTemperature: function() {
        let lat = this.getLatLng().lat;
        let lng = this.getLatLng().lng;
        let osoite = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lng + '&APPID=3f9c0f263c23c5f5c69f9ace9cc53244';
        fetch(osoite)
            .then(vastaus => {
                return vastaus.json();
            })
            .then(json => {
                // Ensin tyhjennetään weather-lista.
                this.weather = [];
                // Haetaan API:sta säätietoja sekä ajat. Lisätään weather-listaan.
                for (let i = 0; i < 5; i++) {
                    let day = i * 8;

                    // Katsotaan päivien lämpötiloista isoimmat ja pienimmät.
                    let maxTemp = Math.max(
                        json.list[day].main.temp_max,
                        json.list[1+day].main.temp_max,
                        json.list[2+day].main.temp_max,
                        json.list[3+day].main.temp_max,
                        json.list[4+day].main.temp_max,
                        json.list[5+day].main.temp_max,
                        json.list[6+day].main.temp_max,
                        json.list[7+day].main.temp_max,);

                    let minTemp = Math.min(
                        json.list[day].main.temp_min,
                        json.list[1+day].main.temp_min,
                        json.list[2+day].main.temp_min,
                        json.list[3+day].main.temp_min,
                        json.list[4+day].main.temp_min,
                        json.list[5+day].main.temp_min,
                        json.list[6+day].main.temp_min,
                        json.list[7+day].main.temp_min,);

                    // Otetaan unix-ajasta päivämäärä.
                    let date = new Date(json.list[day].dt * 1000);

                    // Tehdään viikonpäiville lista jotta saadaan getDay funktiolla oikea päivä.
                    let weekDays = ['SU', 'MA', 'TI', 'KE', 'TO', 'PE', 'LA'];

                    // Työnnetään säätiedot listaan
                    this.weather.push(new MapsterWeather({
                        // Minimilämpötila
                        minTemp: (minTemp - 273.15).toFixed(1),
                        // Maksimilämpötila
                        maxTemp: (maxTemp - 273.15).toFixed(1),
                        // Päivämäärä
                        time: date.getDate() + '.' + (date.getMonth() + 1),
                        // Säätyypin kuva
                        weatherIcon: json.list[day].weather[0].icon,
                        // Viikonpäivä
                        weekDay: weekDays[date.getDay()]
                    }));

                    //Päivitetään popup.
                    this.updatePopup();
                }
            })
            .catch(error => {
                console.log(error);
            });
    },

    // Rakentaa markerin popupin.
    generatePopup: function () {
        let content = "";
        this.events.forEach(event => {
            if (event.location.lat === this.getLatLng().lat && event.location.lng === this.getLatLng().lng) {
                content += `<details class="popup-information">`;
                content += `<summary>${(event.name) ? event.name : "(Ei nimeä)"}</summary>`;
                if (event.image) {
                    content += `<img src="${event.image}" width="100%" alt="Tapahtuman kuva">`
                }
                content += `<h3>${(event.name) ? event.name : "(Ei nimeä)"}</h3>`
                if (event.fromTicketmaster()) {
                    content += `<p>${event.classification}: ${event.genre}, ${event.subGenre}</p>`
                } else if (event.fromHelsinki() && event.description) {
                    content += `<p>${event.description}</p>`
                }
                content += `<p>${event.startDate}</p>`;
                content += `<p>${event.address}</p>`;
                if (event.url) {
                    content += `<a href="${event.url}" target="_blank">Hanki liput</a>`;
                }
                if (event.fromTicketmaster()) {
                    content += `<p><br/>Tiedot ovat Ticketmasterin tietokannasta.</p>`
                } else if (event.fromHelsinki()) {
                    content += `<p><br/>Tiedot ovat Helsingin tietokannasta.</p>`
                }
                content += `</details>`;
            }});
        this.details = content;
        let popup = L.popup();
        popup.setContent(`
            <div id="popup-container">
                <div id="popup-events">${this.details}</div>
                <div id="popup-routing"><button onclick="makeRoute()">Reitti tänne</button></div>
                <div id="popup-weather"><p>Lämpötilaa ladataan...</p></div>
            </div>`);
        popup.update();
        this.bindPopup(popup);
        this.resizePopup();

        this.addEventListener('click', evt => {
            targetMarker = evt.target;
        });

    },

    // Päivittää markerin popupin.
    // Tätä täytyy kutsua mikäli markerin details tai temperature -muuttujia
    // muutetaan.
    updatePopup: function () {
        // Piirretään tapahtumat
        let content = `
        <div id="popup-container">
            <div id="popup-events">${this.details}</div>
            <div id="popup-routing"><button onclick="makeRoute()">Reitti tänne</button></div>
            <div id="popup-weather">
                <ul>`;
        // Piirretään sää
        for (let i = 0; i < this.weather.length; i++) {
            content += `
                    <li>
                        <h4 id="weekday">${this.weather[i].weekDay}</h4>
                        <h4>${this.weather[i].time}</h4>                           
                        <img class="weatherIcon" src="https://openweathermap.org/img/wn/${this.weather[i].weatherIcon}.png">     
                        <div id="tempInfo">                    
                                <p id="maxTemp">${this.weather[i].maxTemp}°</p>
                                <p id="minTemp">${this.weather[i].minTemp}°</p>                                                        
                        </div>
                    </li>            
            `;
        }
        // Päätetään popup
        content += `
                </ul>
            </div>
        </div>
        `;

        this.setPopupContent(content)
    },

    resizePopup: function () {
        let popup = this.getPopup();

        if (map.getSize().x > 700) {
            popup.options.minWidth = map.getSize().x * 0.35;
            popup.options.maxWidth = map.getSize().x * 0.4;
            popup.options.maxHeight = map.getSize().y * 0.6;
        }
        else {
            popup.options.minWidth = map.getSize().x * 0.6;
            popup.options.maxWidth = map.getSize().x * 0.7;
            popup.options.maxHeight = map.getSize().y * 0.7;
        }
        popup.update();
    }

});

// Luokka tapahtumille, jotka sisällytetään MapsterMarker-olioihin.
class MapsterEvent {
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.location = options.location;
        this.image = options.image;
        this.classification = options.classification;
        this.genre = options.genre;
        this.subGenre = options.subGenre;
        this.startDate = options.startDate;
        this.address = options.address;
        this.url = options.url;
        this.origin = options.origin;
    }

    fromTicketmaster() {
        return this.origin === "ticketmaster";
    }

    fromHelsinki() {
        return this.origin === "helsinki";
    }
}

// Asettaa reitityksen kartalle käyttäjän antaman sijainnin ja kohteen välille
function makeRoute() {
    if (currentMarker != null) {
        if (!currentRoute) {
            currentRoute = L.Routing.control({
                waypoints: [currentMarker.getLatLng(), targetMarker.getLatLng()],
                router: L.routing.mapbox('pk.eyJ1IjoicG9wcGFyaSIsImEiOiJjazdoOWN2aWwwN2cyM21wOGJhY3J5OWJzIn0.6mckBU0Hk3RrKPgWk828BQ'),
                // Poistetaan reitin tekemät markerit
                createMarker: function (i,waypoint,n) {
                    return null;
                },
                routeWhileDragging: false,
                collapsible: true
            });
            currentRoute.addEventListener('routingerror', evt => {
                let message;
                if (evt.error.message === "HTTP request failed: undefined") {
                    message = JSON.parse(evt.error.target.response).message;
                } else {
                    if (evt.error.status === "NoRoute") {
                        message = "Reittiä ei löytynyt"
                    } else {
                        message = evt.error.message;
                    }
                }
                alert(`Virhe tapahtui reitityksessä: ${message}`);
                currentRoute.remove();
                currentRoute = null;
            });
            currentRoute.addTo(map);
        } else {
            currentRoute.setWaypoints([currentMarker.getLatLng(), targetMarker.getLatLng()]);
            currentRoute.show();
        }
        targetMarker.closePopup();
    } else {
        alert("Sinulla ei ole sijaintia. Tuplaklikkaa karttaa tai kirjoita sijainti hakukenttään.");
    }
}

class MapsterWeather {
    constructor(props) {
        this.minTemp = props.minTemp;
        this.maxTemp = props.maxTemp;
        this.time = props.time;
        this.weatherIcon = props.weatherIcon;
        this.weekDay = props.weekDay
    }
}