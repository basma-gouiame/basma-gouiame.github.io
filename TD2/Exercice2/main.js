var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function(engine, canvas) {
    engine.runRenderLoop(function() {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
};

var engine = null;
var scene = null;
var sceneToRender = null;

var createDefaultEngine = function() {
    return new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false
    });
};

var createScene = function() {
    var scene = new BABYLON.Scene(engine);

    // --- CAMERA ---
    var camera = new BABYLON.ArcRotateCamera(
        "camera",
        BABYLON.Tools.ToRadians(0),
        BABYLON.Tools.ToRadians(57.3),
        10,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);

    // --- LUMIERE ---
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // --- SOL ---
    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
    ground.scaling = new BABYLON.Vector3(5, 0.5, 5);

    // --- CUBE ---
    var box = BABYLON.MeshBuilder.CreateBox("box", { size: 2 }, scene);
    box.position.y = 1;
    box.position.x = -5;

    // --- MATERIAU DU SOL ---
    const groundMaterial = new BABYLON.StandardMaterial("Ground Material", scene);
    groundMaterial.diffuseColor = BABYLON.Color3.Black(); // sol tout noir
    ground.material = groundMaterial;


    // --- IMPORT MODELE 3D : YETI ---
    BABYLON.ImportMeshAsync(
        Assets.meshes.Yeti.rootUrl + Assets.meshes.Yeti.filename,
        scene, { meshNames: "" }
    ).then((result) => {
        result.meshes[0].scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
    });

    return scene;
};

window.initFunction = async function() {
    var asyncEngineCreation = async function() {
        try {
            return createDefaultEngine();
        } catch (e) {
            console.log("the available createEngine function failed. Creating the default engine instead");
            return createDefaultEngine();
        }
    };

    window.engine = await asyncEngineCreation();

    if (!engine) throw "engine should not be null.";
    startRenderLoop(engine, canvas);

    window.scene = createScene();
};
initFunction().then(() => {
    sceneToRender = scene;
});

// --- RESIZE ---
window.addEventListener("resize", function() {
    engine.resize();
});