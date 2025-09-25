document.addEventListener('DOMContentLoaded', () => {
if ("geolocation" in navigator) {

    // ---- getCurrentPosition (une seule fois) ----
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            afficher(pos, "current");
        },
        (err) => {
            document.getElementById("current").textContent =
                "Erreur : " + err.message;
        },
        {
            enableHighAccuracy: true, // active GPS si dispo
            timeout: 5000,
            maximumAge: 0
        }
    );

    // ---- watchPosition (mise à jour continue) ----
    navigator.geolocation.watchPosition(
        (pos) => {
            afficher(pos, "watch");
        },
        (err) => {
            document.getElementById("watch").textContent =
                "Erreur : " + err.message;
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

function afficher(position, id) {
    const coords = position.coords;
    const date = new Date(position.timestamp);

    let texte = `
Latitude  : ${coords.latitude}
Longitude : ${coords.longitude}
Altitude  : ${coords.altitude !== null ? coords.altitude + " m" : "Non disponible"}
Précision : ${coords.accuracy} m
Précision altitude : ${coords.altitudeAccuracy ?? "N/A"} m
Vitesse   : ${coords.speed !== null ? coords.speed + " m/s" : "Non disponible"}
Date      : ${date.toLocaleString()}
  `;
    document.getElementById(id).textContent = texte;
}
});
