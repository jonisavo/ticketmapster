'use strict';

const popupLeveys = document.querySelector('#map').clientWidth * 0.7;
const popupKorkeus = document.querySelector('#map').clientHeight * 0.75;

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
    let markeri;
    for (let a = 0; a < palaute._embedded.events.length; ++a) {
        const long = palaute._embedded.events[a]._embedded.venues[0].location.longitude;
        const lat = palaute._embedded.events[a]._embedded.venues[0].location.latitude;
        const kuvasrc =
            '<div class="tiedot">' +
            '<img src=' + palaute._embedded.events[a].images[0].url + ' width="100%"><img>' +
            '<div class="tiedotTiedossa">' +
            '<h3>' + palaute._embedded.events[a].name + '</h3>' +
            palaute._embedded.events[a].classifications[0].segment.name + ': ' + palaute._embedded.events[a].classifications[0].genre.name + ', ' + palaute._embedded.events[a].classifications[0].subGenre.name +
            '<p>' + palaute._embedded.events[a].dates.start.localDate + '</p>' +
            '<p>' + palaute._embedded.events[a]._embedded.venues[0].address.line1 + '</p>' +
            '<a href="' + palaute._embedded.events[a].url + '" target="_blank">Hanki liput</a>' +
            '</div>' +
            '</div>'
        for (let b = 0; b < markerit.length; ++b) {
            if (markerit[b].getLatLng().lng == long && markerit[b].getLatLng().lat == lat) {
                totuus = true;
                markeri = markerit[b];
            }
        }
        if (totuus) {
            markeri._popup.setContent(markeri._popup.getContent() + kuvasrc);
        } else {
            const marker = L.marker([lat, long], 13).addTo(map);
            marker.bindPopup(kuvasrc, {minWidth: popupLeveys, maxHeight: popupKorkeus});
            markerit.push(marker);
        }
        totuus = false;
    }
}