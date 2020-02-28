'use strict';

const popupLeveys = document.querySelector('#map').clientWidth * 0.5;
const popupKorkeus = document.querySelector('#map').clientHeight * 0.55;

fetch('https://app.ticketmaster.com/discovery/v2/events.json?countryCode=FI&apikey=lFzFD4km6ABGdh9aye7qdAbL5yA1AHkb')
    .then(function(vastaus){
        return vastaus.json();
    }).then(function(json){
    palautus(json);
}).catch(function(error){
    console.log(error);
});

function palautus(palaute) {
    console.log(palaute);
    let totuus = false;
    let markerit = [];
    let sisalto = [];
    let longlat = [];
    let oikea = 0;
    for (let a = 0; a < palaute._embedded.events.length; ++a) {
        let event = palaute._embedded.events[a]
        const long = event._embedded.venues[0].location.longitude;
        const lat = event._embedded.venues[0].location.latitude;
        const kuvasrc =
            '<details class="tiedot"><summary>' + event.name + '</summary>' +
                '<img src=' + event.images[0].url + ' width="100%"><img>' +
                '<div class="tiedotTiedossa">' +
                    '<h3>' + event.name + '</h3>' +
                    event.classifications[0].segment.name + ': ' + event.classifications[0].genre.name + ', ' + event.classifications[0].subGenre.name +
                    '<p>' + event.dates.start.localDate + '</p>' +
                    '<p>' + event._embedded.venues[0].address.line1 + '</p>' +
                    '<a href="' + event.url + '" target="_blank">Hanki liput</a>' +
                '</div>' +
            '</details>'
        if (longlat.length != 0) {
            let koordinaatit = {
                "long": long,
                "lat": lat
            };
            for (let b = 0; b < longlat.length; ++b) {
                if (longlat[b].lat == koordinaatit.lat && longlat[b].long == koordinaatit.long) {
                    totuus = true;
                    oikea = b;
                }
            }
            if (!totuus) {
                longlat.push({"long": long, "lat": lat});
            }
        } else {
            longlat.push({"long": long, "lat": lat});
        }

        if (totuus) {
            sisalto[oikea] += kuvasrc;
        } else {
            sisalto.push(kuvasrc);
        }
        totuus = false;
    }
    for (let c = 0; c < sisalto.length; ++c) {
        console.log(longlat[c].lat + ' and ' + longlat[c].long);
        const marker = new MapsterMarker([longlat[c].lat, longlat[c].long], 13).addTo(map);
        marker.fetchTemperature();
        console.log(marker.temperature);
        marker.bindPopup(`<div id="events">${sisalto[c]}</div><div>Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut </div>`, {minWidth: popupLeveys, maxHeight: popupKorkeus});
        markerit.push(marker);
    }
}