function searchDoctors() {
    const cityInput = document.getElementById("cityInput").value;

    let doctorLocations;

    if (cityInput.toLowerCase() === "bhubaneswar") {
        doctorLocations = [
            { name: "Doctor A", lat: 20.1, lng: 85.1 },
            { name: "Doctor B", lat: 20.2, lng: 85.2 },
            { name: "Clinic C", lat: 20.3, lng: 85.3 }
        ];
    } else if (cityInput.toLowerCase() === "chennai") {
        doctorLocations = [
            { name: "Doctor D", lat: 13.1, lng: 80.2 },
            { name: "Doctor E", lat: 13.2, lng: 80.1 },
            { name: "Clinic F", lat: 13.3, lng: 80.3 }
        ];
    } else if (cityInput.toLowerCase() === "bangalore") {
        doctorLocations = [
            { name: "Doctor G", lat: 12.9, lng: 77.5 },
            { name: "Doctor H", lat: 12.8, lng: 77.4 },
            { name: "Clinic I", lat: 12.7, lng: 77.6 }
        ];
    } else if (cityInput.toLowerCase() === "hyderabad") {
        doctorLocations = [
            { name: "Doctor J", lat: 17.4, lng: 78.5 },
            { name: "Doctor K", lat: 17.3, lng: 78.4 },
            { name: "Clinic L", lat: 17.2, lng: 78.6 }
        ];
    } else if (cityInput.toLowerCase() === "kolkata") {
        doctorLocations = [
            { name: "Doctor M", lat: 22.6, lng: 88.4 },
            { name: "Doctor N", lat: 22.7, lng: 88.3 },
            { name: "Clinic O", lat: 22.8, lng: 88.5 }
        ];
    } else if (cityInput.toLowerCase() === "delhi") {
        doctorLocations = [
            { name: "Doctor A", lat: 28.6, lng: 77.2 },
            { name: "Doctor B", lat: 28.7, lng: 77.1 },
            { name: "Clinic C", lat: 28.8, lng: 77.3 },
            { name: "Hospital D", lat: 28.9, lng: 77.4 },
            { name: "Doctor E", lat: 28.5, lng: 77.5 },
            { name: "Clinic F", lat: 28.4, lng: 77.6 }
        ];
    } else if (cityInput.toLowerCase() === "pune") {
        doctorLocations = [
            { name: "Doctor P", lat: 18.6, lng: 73.7 },
            { name: "Doctor Q", lat: 18.7, lng: 73.6 },
            { name: "Clinic R", lat: 18.8, lng: 73.8 }
        ];
    } else if (cityInput.toLowerCase() === "ahmedabad") {
        doctorLocations = [
            { name: "Doctor S", lat: 23.1, lng: 72.5 },
            { name: "Doctor T", lat: 23.2, lng: 72.4 },
            { name: "Clinic U", lat: 23.3, lng: 72.6 }
        ];
    } else if (cityInput.toLowerCase() === "mumbai") {
        doctorLocations = [
            { name: "Doctor X", lat: 19.1, lng: 72.1 },
            { name: "Doctor Y", lat: 19.2, lng: 72.2 },
            { name: "Clinic Z", lat: 19.3, lng: 72.3 },
            { name: "Hospital W", lat: 19.4, lng: 72.4 }
        ];
    } else if (cityInput.toLowerCase() === "jaipur") {
        doctorLocations = [
            { name: "Doctor V", lat: 26.9, lng: 75.8 },
            { name: "Doctor W", lat: 26.8, lng: 75.7 },
            { name: "Clinic X", lat: 26.7, lng: 75.9 }
        ];
    } else if (cityInput.toLowerCase() === "chandigarh") {
        doctorLocations = [
            { name: "Doctor Y", lat: 30.8, lng: 76.7 },
            { name: "Doctor Z", lat: 30.7, lng: 76.6 },
            { name: "Clinic AA", lat: 30.9, lng: 76.8 }
        ];
    } else {
        alert(`This List is Not Updated for ${cityInput}  City.`);

    }

    const locationInfo = document.getElementById("locationInfo");
    locationInfo.textContent = cityInput;

    const mapContainer = document.getElementById("map");

    const map = L.map('map');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    if (doctorLocations.length > 0) {

        const bounds = doctorLocations.reduce((bounds, loc) => {
            return bounds.extend([loc.lat, loc.lng]);
        }, new L.LatLngBounds());

        map.fitBounds(bounds);

        doctorLocations.forEach(location => {
            L.marker([location.lat, location.lng])
                .addTo(map)
                .bindPopup(location.name);
        });

    } else {
        alert("No locations found");
    }
}