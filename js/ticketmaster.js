'use strict';

let popupLeveys = document.querySelector('#map').clientWidth * 0.5;
let popupKorkeus = document.querySelector('#map').clientHeight * 0.55;

fetch('https://app.ticketmaster.com/discovery/v2/events.json?countryCode=FI&apikey=lFzFD4km6ABGdh9aye7qdAbL5yA1AHkb')
    .then(response => {
        return response.json();
    }).then(json => {
        generateTicketmasterMarkers(json);
    }).catch(error => {
        console.log(error);
    });

fetch('https://api.hel.fi/linkedevents/v1/event/')
    .then(response => {
        return response.json();
    }).then(json => {
        return getHelsinkiEventLocations(json);
    }).catch(error => {
        console.log(error);
    });

// Hakee Helsingin tapahtumien sijainnit ja sitten kutsuu generateHelsinkiEventMarkers-funktiota.
function getHelsinkiEventLocations(events) {
    let locations = [];
    let addresses = [];
    let location_fetches = [];
    events.data.forEach(event => {
        location_fetches.push(
            // Tehdään kyselyitä tapahtumien sijainneista
            fetch(event.location['@id'])
                .then(response => {
                    return response.json();
                })
                .then(json => {
                    locations.push(L.latLng(json.position.coordinates[1],json.position.coordinates[0]));
                    addresses.push(json.street_address.fi);
                }).catch(error => {
                    console.log(error);
                })
        );
    });
    // Odotetaan kunnes kaikki sijainnit tiedetään, sitten suoritetaan markereiden teko
    Promise.all(location_fetches).then(function() {
        generateHelsinkiEventMarkers(events,locations,addresses)
    });
}

// Luo Leaflet-karttaan markerit Helsingin API:sta tulleen vastauksen perusteella
function generateHelsinkiEventMarkers(json, locations, addresses) {
    let events = [];
    // Muutetaan API:sta tulleet JSON-muotoiset eventit Event-luokan olioiksi
    json.data.forEach((event, i) => {
        events.push(new MapsterEvent({
            id: event.id,
            name: 'test',
            location: locations[i],
            image: 'http://placekitten.com/200/300',
            classification: 'test',
            genre: 'test',
            subGenre: 'test',
            startDate: event.start_time,
            address: addresses[i],
            url: 'test'
        }));
    });
    // Luodaan markerit sijaintien perusteella
    // TODO Markerit luodaan onnistuneesti, mutta tapahtumat eivät löydy niistä. Jokin on siis pielessä.
    locations.forEach(location => {
        //console.log(`Tehdään marker sijaintiin ${location}`);
        let marker = new MapsterMarker(location, 13);
        events.forEach(event => {
            if (event.location.lat === location.lat && event.location.lng === location.lng) {
                marker.addEvent(event);
            }
        });
        // Napataan markeriin lämpötilat
        marker.fetchTemperature();
        // Lisätään se karttaan
        marker.addTo(map);
        // Ja rakennetaan sen popup
        marker.generatePopup();
    });
}

// Luo Leaflet-karttaan markerit Ticketmasterin API:sta tulleen vastauksen perusteella
function generateTicketmasterMarkers(response) {
    //console.log(response);
    let events = [];
    let locations = [];
    let foundevents = response._embedded.events;
    // Muutetaan API:sta tulleet JSON-muotoiset eventit Event-luokan olioiksi
    foundevents.forEach(event => {
        let event_location = L.latLng(event._embedded.venues[0].location.latitude,event._embedded.venues[0].location.longitude);
        events.push(new MapsterEvent({
            id: event.id,
            name: event.name,
            location: event_location,
            image: event.images[0].url,
            classification: event.classifications[0].segment.name,
            genre: event.classifications[0].genre.name,
            subGenre: event.classifications[0].subGenre.name,
            startDate: event.dates.start.localDate,
            address: event._embedded.venues[0].address.line1,
            url: event.url
        }));
        // Jos tapahtumalla on uniikki sijainti, pistetään se talteen.
        // latlng-objekteja ei ilmeisesti voi verrata suoraan, joten
        // kikkailu on tarpeen.
        let push_location = true;
        locations.forEach(location => {
            if (location.lat === event_location.lat && location.lng === event_location.lng) {
                push_location = false;
            }
        });
        if (push_location) {
            locations.push(event_location);
        }
    });
    // Luodaan markerit sijaintien perusteella
    locations.forEach(location => {
        let marker = new MapsterMarker(location, 13);
        events.forEach(event => {
            if (event.location.lat === location.lat && event.location.lng === location.lng) {
                marker.addEvent(event);
            }
        });
        // Napataan markeriin lämpötilat
        marker.fetchTemperature();
        // Lisätään se karttaan
        marker.addTo(map);
        // Ja rakennetaan sen popup
        marker.generatePopup();
    });
}