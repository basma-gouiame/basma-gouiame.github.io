// === Initialisation Leaflet ===
const map = L.map('map').setView([43.7, 7.25], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// === Webcam ===
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");

let model;
let lastX = null;
let lastY = null;
let cooldown = 0;
let moveFactor = 100;
let lastGesture = "none";
let consecutiveGestureCount = 0;
let lastDetectedGesture = "none";

// === Caméra ===
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; })
    .catch(err => console.error("Erreur caméra:", err));

// === Charger le modèle ===
async function init() {
    model = await handpose.load();
    console.log("✅ Modèle chargé !");
    statusEl.textContent = "✅ Prêt ! Montre un geste à la caméra";
    predictLoop();
}

video.addEventListener("loadeddata", init);

// === Gestion de la popup d'aide ===
const helpPopup = document.getElementById("help-popup");
const helpBtn = document.getElementById("help-btn");
const closePopupBtn = document.getElementById("close-popup");

// Afficher la popup au chargement
window.addEventListener("load", () => {
    helpPopup.style.display = "flex";
});

// Fermer la popup
closePopupBtn.addEventListener("click", () => {
    helpPopup.style.display = "none";
});

// Réouvrir la popup avec le bouton aide
helpBtn.addEventListener("click", () => {
    helpPopup.style.display = "flex";
});

// === Boucle principale ===
async function predictLoop() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const predictions = await model.estimateHands(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
        const hand = predictions[0];
        drawHand(hand);
        detectGesture(hand);
    } else {
        statusEl.textContent = "❌ Aucune main détectée";
        lastGesture = "none";
        consecutiveGestureCount = 0;
    }

    requestAnimationFrame(predictLoop);
}

// === Dessin des points de la main ===
function drawHand(hand) {
    const landmarks = hand.landmarks;
    landmarks.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "lime";
        ctx.fill();
    });
}

// === Calcul de la distance entre deux points ===
function getDistance(p1, p2) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
}

// === Détection du type de geste ===
function detectGesture(hand) {
    const landmarks = hand.landmarks;
    const palm = landmarks[0];

    // Points des doigts
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const indexBase = landmarks[5];
    const middleTip = landmarks[12];
    const middleBase = landmarks[9];
    const ringTip = landmarks[16];
    const ringBase = landmarks[13];
    const pinkyTip = landmarks[20];
    const pinkyBase = landmarks[17];

    // Calculer si chaque doigt est levé
    const thumbUp = thumbTip[0] > palm[0] + 40; // pouce écarté
    const indexUp = indexTip[1] < indexBase[1] - 30;
    const middleUp = middleTip[1] < middleBase[1] - 30;
    const ringUp = ringTip[1] < ringBase[1] - 30;
    const pinkyUp = pinkyTip[1] < pinkyBase[1] - 30;

    // Distance pouce-index pour détecter le signe "OK"
    const thumbIndexDist = getDistance(thumbTip, indexTip);

    // Compter les doigts levés
    const fingersUpCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

    // GESTE ITALIEN 🤌 : tous les doigts rapprochés en pointe
    // Calculer le centre des 5 doigts
    const fingerTips = [thumbTip, indexTip, middleTip, ringTip, pinkyTip];
    const centerX = fingerTips.reduce((sum, tip) => sum + tip[0], 0) / 5;
    const centerY = fingerTips.reduce((sum, tip) => sum + tip[1], 0) / 5;

    // Vérifier si tous les doigts sont proches du centre
    let allFingersClose = true;
    let maxDist = 0;
    for (let tip of fingerTips) {
        const dist = getDistance(tip, [centerX, centerY]);
        if (dist > 60) {
            allFingersClose = false;
        }
        maxDist = Math.max(maxDist, dist);
    }

    // Pour le poing fermé : vérifier que les doigts sont près de la paume
    const fingersNearPalm = fingerTips.every(tip => getDistance(tip, palm) < 100);

    let currentGesture = "none";

    // 0. GESTE ITALIEN 🤌 = Aller en Italie !
    // Tous les doigts en pointe mais PAS près de la paume (main tendue)
    if (allFingersClose && maxDist < 60 && !fingersNearPalm) {
        currentGesture = "italian";
    }
    // 1. Signe "OK" (pouce + index proches, autres doigts levés) = ZOOM AVANT
    else if (thumbIndexDist < 40 && middleUp && ringUp && pinkyUp) {
        currentGesture = "zoom_in";
    }
    // 2. Poing fermé complet = ZOOM ARRIÈRE
    // Les doigts doivent être près de la paume ET proches entre eux
    else if (fingersUpCount === 0 && fingersNearPalm) {
        currentGesture = "zoom_out";
    }
    // 3. Main ouverte (4-5 doigts levés) = NAVIGATION
    else if (fingersUpCount >= 4) {
        currentGesture = "move";
    }

    // Stabilisation : nécessite plusieurs détections consécutives pour confirmer
    if (currentGesture === lastDetectedGesture) {
        consecutiveGestureCount++;
    } else {
        consecutiveGestureCount = 0;
        lastDetectedGesture = currentGesture;
    }

    // On confirme le geste après 3 détections consécutives
    if (consecutiveGestureCount >= 3) {
        if (currentGesture === "italian") {
            if (lastGesture !== "italian") {
                updateStatus("🤌 Mamma mia ! Direction l'Italie !");
                lastGesture = "italian";
                goToItaly();
            }
        } else if (currentGesture === "move") {
            if (lastGesture !== "move") {
                updateStatus("🖐️ Mode navigation activé");
                lastGesture = "move";
            }
            handleMovement(hand);
        } else if (currentGesture === "zoom_in") {
            if (lastGesture !== "zoom_in") {
                updateStatus("👌 Mode zoom avant activé");
                lastGesture = "zoom_in";
            }
            handleZoomIn();
        } else if (currentGesture === "zoom_out") {
            if (lastGesture !== "zoom_out") {
                updateStatus("✊ Mode zoom arrière activé");
                lastGesture = "zoom_out";
            }
            handleZoomOut();
        } else {
            updateStatus("🤚 Geste non reconnu");
        }
    }
}

// === Déplacement de la carte (main ouverte) ===
function handleMovement(hand) {
    const [x, y] = hand.landmarks[8]; // bout de l'index

    if (cooldown > 0) {
        cooldown--;
        return;
    }

    if (lastX !== null && lastY !== null) {
        const dx = x - lastX;
        const dy = y - lastY;

        if (Math.abs(dx) > 30) {
            if (dx > 0) {
                map.panBy([moveFactor, 0]);
                updateStatus("➡️ Droite");
            } else {
                map.panBy([-moveFactor, 0]);
                updateStatus("⬅️ Gauche");
            }
            cooldown = 12;
        }

        if (Math.abs(dy) > 30) {
            if (dy > 0) {
                map.panBy([0, moveFactor]);
                updateStatus("⬇️ Bas");
            } else {
                map.panBy([0, -moveFactor]);
                updateStatus("⬆️ Haut");
            }
            cooldown = 12;
        }
    }

    lastX = x;
    lastY = y;
}

// === Zoom avant (signe OK) ===
function handleZoomIn() {
    if (cooldown > 0) {
        cooldown--;
        return;
    }

    map.zoomIn();
    updateStatus("🔍 Zoom avant");
    cooldown = 25;
}

// === Zoom arrière (poing fermé) ===
function handleZoomOut() {
    if (cooldown > 0) {
        cooldown--;
        return;
    }

    map.zoomOut();
    updateStatus("🔎 Zoom arrière");
    cooldown = 25;
}

// === Aller en Italie 🤌 ===
function goToItaly() {
    // Coordonnées de Rome, Italie
    map.flyTo([41.9028, 12.4964], 13, {
        duration: 2.5,
        easeLinearity: 0.25
    });

    setTimeout(() => {
        updateStatus("🇮🇹 Benvenuto a Roma!");
    }, 2500);
}

// === Texte d'état dynamique ===
let statusTimeout;

function updateStatus(text) {
    statusEl.textContent = text;
    statusEl.style.opacity = "1";
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
        statusEl.style.opacity = "0.6";
    }, 1500);
}