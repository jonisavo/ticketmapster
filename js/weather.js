navigator.geolocation.getCurrentPosition(getLocalWeather, positionError, {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
});
function getLocalWeather(pos) {
  let crd = pos.coords;
  let osoite = 'http://api.openweathermap.org/data/2.5/forecast?lat=' + crd.latitude + '&lon=' + crd.longitude + '&APPID=3f9c0f263c23c5f5c69f9ace9cc53244';
  fetch(osoite)
  .then(function(vastaus){
    return vastaus.json();
  })
  .then(function(json) {
    naytaTulos(json);
  })
  .catch(function(error) {
    console.log(error);
  });


  function naytaTulos(tulos){

    //Muuttaa unix-ajan normaaliin ajan muotoon.
    let unixtimestamp = tulos.list[0].dt;
    const date = new Date(unixtimestamp * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours() - 2;
    const minutes = '0' + date.getMinutes();
    const seconds = '0' + date.getSeconds();

    const convertedDataTime = day + '.' + month + '.' + year + ' ' + hours + ':' +
        minutes.substr(-2) + ':' + seconds.substr(-2);

    let temp = tulos.list[0].main.temp - 273.15;
    console.log('Aika: ' + convertedDataTime);
    console.log('Lämpötila on: ' + temp.toFixed(1) + '°C');

  }
}

function positionError(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}



