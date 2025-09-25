document.addEventListener('DOMContentLoaded', () => {
// Création de la carte, centrée provisoirement sur Nice
const map = L.map("map").setView([43.7000, 7.2667], 6);

// ---- Définition des fonds de carte avec URLs Stadia Maps ----
const stamenToner = L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png?api_key=eed6a6b4-d171-43e4-8215-e5f8490b4245", {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 20,
    ext: "png"
});

const stamenTonerLite = L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png?api_key=eed6a6b4-d171-43e4-8215-e5f8490b4245", {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 19,
    ext: "png"
});

const stamenWatercolor = L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=eed6a6b4-d171-43e4-8215-e5f8490b4245", {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    minZoom: 1,
    maxZoom: 16
});

const stamenTerrain = L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png?api_key=eed6a6b4-d171-43e4-8215-e5f8490b4245", {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 18,
    ext: "png"
});

// OpenStreetMap comme option de fond alternatif
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
});

// ---- Ajouter un fond par défaut ----
stamenTonerLite.addTo(map);

// ---- Contrôle pour choisir le fond ----
const baseMaps = {
    "OSM": osm,
    "Stamen Toner": stamenToner,
    "Stamen Toner Lite": stamenTonerLite,
    "Stamen Watercolor": stamenWatercolor,
    "Stamen Terrain": stamenTerrain
};
L.control.layers(baseMaps).addTo(map);

// =====================
// --- Coordonnées fixes ---
// =====================
const niceCoords = [43.7000, 7.2667];
const marseilleCoords = [43.2965, 5.3698];

// Marqueurs Marseille & Nice
L.marker(niceCoords).addTo(map).bindPopup("Nice (centre-ville)");
L.marker(marseilleCoords).addTo(map).bindPopup("Marseille (centre-ville)");

// Segment entre Marseille et Nice
L.polyline([marseilleCoords, niceCoords], { color: "red" }).addTo(map)
    .bindPopup("Segment Marseille ↔ Nice");

// =====================
// --- Fonction Haversine ---
// =====================
function haversineDistance(coord1, coord2) {
    const R = 6371;
    const toRad = deg => deg * Math.PI / 180;

    const dLat = toRad(coord2[0] - coord1[0]);
    const dLon = toRad(coord2[1] - coord1[1]);

    const lat1 = toRad(coord1[0]);
    const lat2 = toRad(coord2[0]);

    const a = Math.sin(dLat / 2) ** 2 +
        Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// =====================
// --- Géolocalisation utilisateur ---
// =====================
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const userCoords = [pos.coords.latitude, pos.coords.longitude];
            const precision = pos.coords.accuracy;


            map.setView(userCoords, 8);

            // Marqueur utilisateur
            L.marker(userCoords).addTo(map)
                .bindPopup(`Vous êtes ici<br>Précision : ${precision} m`).openPopup();

            // Cercle de précision
            L.circle(userCoords, {
                radius: precision,
                color: "blue",
                fillColor: "blue",
                fillOpacity: 0.2
            }).addTo(map);


            const distance = haversineDistance(marseilleCoords, niceCoords).toFixed(2);

            // Segment Marseille ↔ Nice
            L.polyline([marseilleCoords, niceCoords], { color: "red" }).addTo(map)
                .bindPopup(`Distance Marseille ↔ Nice : ${distance} km`).openPopup();
        },
        (err) => {
            console.error("Erreur de géolocalisation : " + err.message);
            alert("Impossible de récupérer votre position.");
        }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
} else {
    alert("La géolocalisation n’est pas supportée par ce navigateur.");
}

// ---- Triangle des Bermudes ----
const bermudes = [
    [25.774, -80.19], // Miami
    [18.466, -66.118], // Porto Rico
    [32.321, -64.757], // Bermuda
];
L.polygon(bermudes, { color: "red" }).addTo(map)
    .bindPopup("Triangle des Bermudes");


// =====================
// --- Ajout de données GeoJSON ---
// =====================

//Récupére toutes les communes du département 06 (Alpes-Maritimes)
const departementCode = "06";
const geojsonUrl = `https://geo.api.gouv.fr/departements/${departementCode}/communes?fields=nom,centre,contour&format=geojson&geometry=contour`;

// Charger et afficher le GeoJSON
fetch(geojsonUrl)
    .then(response => response.json())
    .then(geojsonData => {
        // Ajouter la couche GeoJSON à la carte
        L.geoJSON(geojsonData, {
            style: {
                color: "#0077cc",
                weight: 2,
                fillColor: "#99ccff",
                fillOpacity: 0.3
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.nom) {
                    layer.bindPopup(`<strong>${feature.properties.nom}</strong>`);
                }
            }
        }).addTo(map);
    })
    .catch(err => console.error("Erreur chargement GeoJSON:", err));

// =====================
// --- Trajet Marseille ↔ Nice via OSRM ---
// =====================
function drawRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const routeGeoJSON = data.routes[0].geometry;
                L.geoJSON(routeGeoJSON, {
                    style: {
                        color: 'blue',
                        weight: 4,
                        opacity: 0.7
                    }
                }).addTo(map)
                    .bindPopup(`Itinéraire routier : ${data.routes[0].distance/1000} km<br>
                            Durée estimée : ${(data.routes[0].duration/3600).toFixed(2)} h`);
            }
        })
        .catch(err => console.error("Erreur OSRM:", err));
}

drawRoute(marseilleCoords, niceCoords);

// =====================
// --- Trajet Marseille ↔ Nice via Mapbox Directions API ---
// =====================
function drawRouteMapbox(start, end) {
    const token = "pk.eyJ1IjoiY3YwNiIsImEiOiJjajg2MmpzYjcwbWdnMzNsc2NzM2l4eW0yIn0.TfDJipR5II7orUZaC848YA";
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[1]},${start[0]};${end[1]},${end[0]}?geometries=geojson&access_token=${token}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.routes && data.routes.length > 0) {
                const routeGeoJSON = data.routes[0].geometry;
                L.geoJSON(routeGeoJSON, {
                    style: {
                        color: 'purple',
                        weight: 4,
                        opacity: 0.7
                    }
                }).addTo(map)
                    .bindPopup(`Itinéraire routier (Mapbox)<br>
                            Distance : ${(data.routes[0].distance/1000).toFixed(2)} km<br>
                            Durée : ${(data.routes[0].duration/3600).toFixed(2)} h`);
            }
        })
        .catch(err => console.error("Erreur Mapbox:", err));
}

drawRouteMapbox(marseilleCoords, niceCoords);
});