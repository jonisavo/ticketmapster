'use strict';

// Tehdään kartta
let map = L.map('map').setView([60.171972,24.941496], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// MapsterMarker on L.Markerin alaluokka, joka sisältää tapahtuma-olioita.
const MapsterMarker = L.Marker.extend({

    temperature: null,
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
    // TODO koko lämpötilaennusteen hakeminen. this.temperature voisi sisältää taulukon, jossa on 5 "sääoliota".
    fetchTemperature: function() {
        let lat = this.getLatLng().lat;
        let lng = this.getLatLng().lng;
        let osoite = 'http://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lng + '&APPID=3f9c0f263c23c5f5c69f9ace9cc53244';
        fetch(osoite)
            .then(vastaus => {
                return vastaus.json();
            })
            .then(json => {
                this.temperature = json.list[0].main.temp - 273.15;
                this.updatePopup();
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
                content += `
                <details class="popup-information">
                    <summary>${event.name}</summary>
                    <img src="${event.image}" width="100%">
                    <h3>${event.name}</h3>
                    <p>${event.classification}: ${event.genre}, ${event.subGenre}</p>
                    <p>${event.startDate}</p>
                    <p>${event.address}</p>
                    <a href="${event.url}" target="_blank">Hanki liput</a>
                </details>`
            }});
        this.details = content;
        this.bindPopup(`
            <div id="popup-container">
                <div id="popup-events">${this.details}</div>
                <div id="popup-weather"><p>Lämpötilaa ladataan...</p></div>
            </div>`, {minWidth: popupLeveys, maxHeight: popupKorkeus});
    },

    // Päivittää markerin popupin.
    // Tätä täytyy kutsua mikäli markerin details tai temperature -muuttujia
    // muutetaan.
    // TODO koko lämpötilaennusteen piirtäminen popupiin.
    updatePopup: function () {
        this.setPopupContent(`
            <div id="popup-container">
                <div id="popup-events">${this.details}</div>
                <div id="popup-weather"><p>Lämpötila on ${this.temperature}</p></div>
            </div>`
        )
    },

});

// Luokka tapahtumille, jotka sisällytetään MapsterMarker-olioihin.
class MapsterEvent {
    constructor(props) {
        this.id = props.id;
        this.name = props.name;
        this.location = props.location;
        this.image = props.image;
        this.classification = props.classification;
        this.genre = props.genre;
        this.subGenre = props.subGenre;
        this.startDate = props.startDate;
        this.address = props.address;
        this.url = props.url;
    }
}