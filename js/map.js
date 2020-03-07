'use strict';

let currentMarker = null;
let targetMarker = null;
let currentRoute = null;

// Tehdään kartta
let map = L.map('map').setView([60.171972,24.941496], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    noWrap: true
}).addTo(map);

class MapsterWeather {
    constructor(props) {
        this.minTemp = props.minTemp;
        this.maxTemp = props.maxTemp;
        this.time = props.time;
    }
}

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

function resizeAllMarkers() {
    map.eachLayer(layer => {
        if (layer instanceof MapsterMarker) {
            layer.resizePopup();
        }
    })
}

function validateCoordinates(latitude, longitude) {
    return (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180)
}

// MapsterMarker on L.Markerin alaluokka, joka sisältää tapahtuma-olioita.
const MapsterMarker = L.Marker.extend({

    //Weather-lista viidelle päivälle.
    weather: [
        new MapsterWeather({minTemp: null, maxTemp: null, time: null}),
        new MapsterWeather({minTemp: null, maxTemp: null, time: null}),
        new MapsterWeather({minTemp: null, maxTemp: null, time: null}),
        new MapsterWeather({minTemp: null, maxTemp: null, time: null}),
        new MapsterWeather({minTemp: null, maxTemp: null, time: null}),
    ],

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
        let osoite = 'http://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lng + '&APPID=3f9c0f263c23c5f5c69f9ace9cc53244';
        fetch(osoite)
            .then(vastaus => {
                return vastaus.json();
            })
            .then(json => {
                // Haetaan API:sta säätietoja sekä ajat. Lisätään weather-listaan.
                let x = 0;
                for (let i = 0; i < this.weather.length; i++) {
                    this.weather[i].minTemp = (json.list[x].main.temp_min -
                        273.15).toFixed(1);
                    this.weather[i].maxTemp = (json.list[x].main.temp_max -
                        273.15).toFixed(1);
                    // Otetaan unix-ajasta päivämäärä.
                    let unixTimeStamp = json.list[x].dt;
                    const date = new Date(unixTimeStamp * 1000);
                    const month = date.getMonth();
                    const day = date.getDate();
                    this.weather[i].time = day + '.' + month;
                    // Päivitetään popup.
                    this.updatePopup();
                    x = x + 8;
                }
            })
            .catch(error => {
                console.log(error);
            });
    },

    // Rakentaa markerin popupin.
    // TODO kaikki tieto ei välttämättä löydy, ja sen vuoksi tulisi käyttää if-lauseita palautuksen tarkistamiseen
    generatePopup: function () {
        let content = "";
        this.events.forEach(event => {
            if (event.location.lat === this.getLatLng().lat && event.location.lng === this.getLatLng().lng) {
                content += `
                <details class="popup-information">
                    <summary>${event.name}</summary>
                    <img src="${event.image}" width="100%" alt="Tapahtuman kuva">
                    <h3>${event.name}</h3>
                    <p>${event.classification}: ${event.genre}, ${event.subGenre}</p>
                    <p>${event.startDate}</p>
                    <p>${event.address}</p>
                    <a href="${event.url}" target="_blank">Hanki liput</a>
                </details>`
            }});
        this.details = content;
        let popup = L.popup({
            minWidth: map.getSize().x * 0.35,
            maxWidth: map.getSize().x * 0.55,
            maxHeight: map.getSize().y * 0.6
        });
        popup.setContent(`
            <div id="popup-container">
                <div id="popup-events">${this.details}</div>
                <div id="popup-weather"><p>Lämpötilaa ladataan...</p></div>
            </div>`);
        popup.update();
        this.bindPopup(popup);

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
            <div id="popup-routing"><a href="#" onclick="makeRoute()">Reitti tänne</a></div>
            <div id="popup-weather">
                <ul>`;
        // Piirretään sää
        for (let i = 0; i < this.weather.length; i++) {
            content += `
                    <li>
                        <h4>${this.weather[i].time}</h4>
                        <p>min ${this.weather[i].minTemp}°C</p> 
                        <p>max ${this.weather[i].maxTemp}°C</p>
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
        popup.options.minWidth = map.getSize().x * 0.35;
        popup.options.maxWidth = map.getSize().x * 0.55;
        popup.options.maxHeight = map.getSize().y * 0.6;
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
    }
}

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
        alert("Sinulla ei ole sijaintia voi ei")
    }
}