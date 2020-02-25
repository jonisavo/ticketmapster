let currentmarker = null;

function locate() {
    navigator.geolocation.getCurrentPosition(pos => {
            reverse_geocode(pos.coords.latitude,pos.coords.longitude);
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
        .then(response => { return response.json()})
        .then(json => {
            console.log(json);
            let crd;
            if (json.results.length > 0) {
                crd = json.results[0].bounds.northeast;
                setCurrentLocation(crd.lat,crd.lng);
            }
            setStatusMessage(getSearchStatus(json));
            return true
        })
        .catch(err => {
            setStatusMessage(`Virhe: ${err.message}`);
            return false
        });
}

function reverse_geocode(latitude,longitude) {
    fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=3ecffaff42c04bc49347e53ca16d1b94`)
        .then(response => {return response.json()})
        .then(json => {
            setStatusMessage(getSearchStatus(json));
            return true
        })
        .catch( err => {
            setStatusMessage(`Virhe: ${err.message}`);
            return false
        })
}

function getSearchStatus(response) {
    if (response.status.code === 200) {
        if (response.results.length > 0) {
            return `Sijainti: ${response.results[0].formatted}`
        } else {
            return "Ei hakutuloksia."
        }
    } else {
        return `Virhekoodi ${response.status.code}: ${response.status.message}`
    }
}

function setStatusMessage(status) {
    let result_p = document.querySelector("#search_results");
    result_p.innerHTML = status
}

function setCurrentLocation(latitude, longitude) {
    map.setView([latitude, longitude], 13);
    if (!currentmarker) {
        currentmarker = L.marker([latitude, longitude]);
        currentmarker.addTo(map)
            .bindPopup('Olet täällä.')
            .openPopup();
    } else {
        currentmarker.setLatLng([latitude,longitude])
    }
}

function positionError(err) {
    setStatusMessage(`Virhe paikantamisessa: ${err.message}`)
}

let locate_button = document.querySelector("#locate_button");
locate_button.addEventListener('click',evt => {locate()});

let search_button = document.querySelector("#submit_button");
search_button.addEventListener('click', evt => {search()});