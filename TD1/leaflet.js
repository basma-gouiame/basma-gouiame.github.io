// Création de la carte, centrée provisoirement sur Nice
const map = L.map("map").setView([43.7000, 7.2667], 6);

// ---- Définition des fonds de carte avec URLs Stadia Maps ----
const stamenToner = L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 20,
    ext: "png"
});

const stamenTonerLite = L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    minZoom: 0,
    maxZoom: 19,
    ext: "png"
});

const stamenWatercolor = L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg", {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abcd",
    minZoom: 1,
    maxZoom: 16
});

const stamenTerrain = L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png", {
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

// ---- Marqueur fixe sur Nice (centre-ville) ----
L.marker([43.7000, 7.2667]).addTo(map)
    .bindPopup("Nice (centre ville)").openPopup();

// ---- Triangle des Bermudes ----
const bermudes = [
    [25.774, -80.19], // Miami
    [18.466, -66.118], // Porto Rico
    [32.321, -64.757], // Bermuda
];
L.polygon(bermudes, { color: "red" }).addTo(map)
    .bindPopup("Triangle des Bermudes");

// ---- Géolocalisation utilisateur ----
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            // Centrer la carte sur la position
            map.setView([lat, lon], 13);

            // Ajouter un marqueur à la position de l’utilisateur
            L.marker([lat, lon]).addTo(map)
                .bindPopup("Vous êtes ici").openPopup();
        },
        (err) => {
            console.error("Erreur de géolocalisation : " + err.message);
            alert("Impossible de récupérer votre position.");
        }, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
} else {
    alert("La géolocalisation n’est pas supportée par ce navigateur.");
}