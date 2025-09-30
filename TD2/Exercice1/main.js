import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// --- SCENE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 5;

// --- RENDERER ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- LIGHT ---
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(3, 3, 5);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0x404040, 0.5)); // lumière douce

// --- CUBE DE BASE ---
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const textureLoader = new THREE.TextureLoader();
const cubeTexture = textureLoader.load("https://threejs.org/examples/textures/crate.gif");
const cubeMaterial = new THREE.MeshStandardMaterial({ map: cubeTexture });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);
cube.position.x = -1;

// --- ÉPÉE (OBJ) ---
let sword = null;
const loader = new OBJLoader();
loader.load(
    './Sting-Sword-lowpoly.obj', // mets ton fichier OBJ ici
    (obj) => {
        obj.scale.set(0.05, 0.05, 0.05);
        obj.position.x = 1.5; // à droite du cube
        scene.add(obj);
        sword = obj;
    },
    undefined,
    (err) => console.error(err)
);

// --- PARTICULES (pluie simple) ---
const particlesCount = 2000;
const positions = new Float32Array(particlesCount * 3);
for (let i = 0; i < particlesCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 20;
}
const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const particlesMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.05 });
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// --- DEVICE ORIENTATION ---
window.addEventListener('deviceorientation', (event) => {
    if (!sword) return;
    const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0;
    const beta = event.beta ? THREE.MathUtils.degToRad(event.beta) : 0;
    const gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0;
    sword.rotation.set(beta, gamma, alpha);
}, true);

// --- ANIMATE ---
function animate() {
    requestAnimationFrame(animate);

    // rotation du cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // rotation de l'épée
    /*if (sword) {
        sword.rotation.y += 0.02;
        sword.rotation.x += 0.01;
    }*/

    // pluie
    const pos = particles.geometry.attributes.position.array;
    for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= 0.1;
        if (pos[i] < -10) pos[i] = 10;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}
animate();