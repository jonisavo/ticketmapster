console.log("moi");
let map = L.map('map').setView([60.171972,24.941496], 12);

class MapsterMarker{
    constructor(latlng,options) {
        this.temperature = 0;
        this.events = [];
    }

    setTemperature(temp) {
        this.temperature = temp;
    }
    addEvent(event) {
       this.events.push(event);
    }

    fetchTemperature() {
        let osoite = 'http://api.openweathermap.org/data/2.5/forecast?lat=' + 1 + '&lon=' + 1 + '&APPID=3f9c0f263c23c5f5c69f9ace9cc53244';
        fetch(osoite)
            .then(function(vastaus){
                return vastaus.json();
            })
            .then(function(json) {
                setTemperature(json.list[0].main.temp - 273.15);
            })
            .catch(function(error) {
                console.log(error);
            });
    }

}

let testi = new MapsterMarker([1,1],13);
testi.addEvent("moi");
testi.fetchTemperature();
console.log("moi");
console.log(testi.temperature);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);