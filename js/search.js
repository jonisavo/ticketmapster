navigator.geolocation.getCurrentPosition(setCurrentLocation, positionError, {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
});

function setCurrentLocation(pos) {
    const crd = pos.coords;

    map.setView([crd.latitude, crd.longitude], 13);

    L.marker([crd.latitude, crd.longitude]).addTo(map)
        .bindPopup('Olen tässä.')
        .openPopup();
}

function positionError(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}