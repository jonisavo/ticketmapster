'use strict';

let map = L.map('map').setView([60.171972,24.941496], 12);

const MapsterMarker = L.Marker.extend({

    temperature: null,
    events: [],
    details: null,

    addEvent: function (eventToAdd) {
        let will_add = true;
        this.events.forEach(event => {
           if (eventToAdd.id === event.id) {
               will_add = false;
           }
        });
        if (will_add) { this.events.push(eventToAdd); }
    },

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

    generatePopup: function () {
        let content = "";
        this.events.forEach(event => {
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
            /*
            content += '<details class="popup-information"><summary>' + event.name + '</summary>' +
                '<img src=' + event.image + ' width="100%"><img>' +
                '<div class="tiedotTiedossa">' +
                '<h3>' + event.name + '</h3>' +
                event.classification + ': ' + event.genre + ', ' + event.subGenre +
                '<p>' + event.startDate + '</p>' +
                '<p>' + event.address + '</p>' +
                '<a href="' + event.url + '" target="_blank">Hanki liput</a>' +
                '</div>' +
                '</details>'

             */
        });
        this.details = content;
        this.bindPopup(`
            <div id="popup-container">
                <div id="popup-events">${this.details}</div>
                <div id="popup-weather"><p>Lämpötilaa ladataan...</p></div>
            </div>`, {minWidth: popupLeveys, maxHeight: popupKorkeus});
    },

    updatePopup: function () {
        this.setPopupContent(`
            <div id="popup-container">
                <div id="popup-events">${this.details}</div>
                <div id="popup-weather"><p>Lämpötila on ${this.temperature}</p></div>
            </div>`
        )
    },

});

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

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);