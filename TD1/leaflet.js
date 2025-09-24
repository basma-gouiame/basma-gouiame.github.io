// Création de la carte, centrée provisoirement sur Nice
const map = L.map("map").setView([43.7000, 7.2667], 6);

// Ajout du fond de carte OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Marqueur fixe sur Nice (centre ville)
L.marker([43.7000, 7.2667]).addTo(map)
    .bindPopup("Nice (centre ville)").openPopup();

// Triangle des Bermudes (Bermuda – Miami – Porto Rico)
const bermudes = [
    [25.774, -80.19],   // Miami
    [18.466, -66.118],  // Porto Rico
    [32.321, -64.757],  // Bermuda
];
L.polygon(bermudes, {color: "red"}).addTo(map)
    .bindPopup("Triangle des Bermudes");

// Géolocalisation utilisateur
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
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
} else {
    alert("La géolocalisation n’est pas supportée par ce navigateur.");
}
