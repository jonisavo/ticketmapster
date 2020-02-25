function locate() {
    navigator.geolocation.getCurrentPosition(pos => {
            setCurrentLocation(pos.coords.latitude,pos.coords.longitude)
        }, positionError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

function search() {
    let query = document.querySelector("#search_input").value;
    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${query}&key=3ecffaff42c04bc49347e53ca16d1b94`)
        .then(function(response){
            return response.json();
        }).then(function(json){
            console.log(json);
            let crd = json.results[0].bounds.northeast;
            setCurrentLocation(crd.lat,crd.lng);
    }).catch(function(error){
        console.log(error);
    });
}

function setCurrentLocation(latitude, longitude) {
    map.setView([latitude, longitude], 13);

    let currentmarker = L.marker([latitude, longitude]);
    currentmarker.addTo(map)
        .bindPopup('Olet täällä.')
        .openPopup();


}

function positionError(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

let locate_button = document.querySelector("#locate_button");
locate_button.addEventListener('click',evt => {locate()});

let search_button = document.querySelector("#submit_button");
search_button.addEventListener('click', evt => {search()});