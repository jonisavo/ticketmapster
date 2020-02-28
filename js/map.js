let map = L.map('map').setView([60.171972,24.941496], 12);

class MapsterMarker extends L.marker {
    constructor(temperature) {
        super();
        this.temperature = temperature;
    }
}

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);