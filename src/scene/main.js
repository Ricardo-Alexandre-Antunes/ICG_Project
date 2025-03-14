import * as THREE from "three";
import Character_Ski from "../models/Character.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// To store the scene graph, and elements usefull to rendering the scene
const sceneElements = {
    sceneGraph: null,
    camera: null,
    control: null,  // NEW
    renderer: null,
};

// HELPER FUNCTIONS

const helper = {

    initEmptyScene: function (sceneElements) {

        // ************************** //
        // Create the 3D scene
        // ************************** //
        sceneElements.sceneGraph = new THREE.Scene();

        // ************************** //
        // Add camera
        // ************************** //
        const width = window.innerWidth;
        const height = window.innerHeight;
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
        sceneElements.camera = camera;
        camera.position.set(0, 5, 5);
        camera.lookAt(0, 0, 0);


        //**************************//
        // Ortohgraphic camera
        //**************************//
        //const width = window.innerWidth;
        //const height = window.innerHeight;
        //const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 100);
        //sceneElements.camera = camera;
        //camera.position.set(0, 5, 5);
        //camera.lookAt(0, 0, 0);

        // ************************** //
        // Illumination
        // ************************** //

        // ************************** //
        // Add ambient light
        // ************************** //
        const ambientLight = new THREE.AmbientLight('rgb(255, 255, 255)', 0.2);
        sceneElements.sceneGraph.add(ambientLight);

        // ***************************** //
        // Add spotlight (with shadows)
        // ***************************** //
        const spotLight1 = new THREE.SpotLight('rgb(255, 255, 255)', 40);
        spotLight1.decay = 1;
        spotLight1.position.set(-5, 8, 0);
        sceneElements.sceneGraph.add(spotLight1);

        // Setup shadow properties for the spotlight
        spotLight1.castShadow = true;
        spotLight1.shadow.mapSize.width = 2048;
        spotLight1.shadow.mapSize.height = 2048;
        

        // Give a name to the spot light
        spotLight1.name = "light 1";

        // ***************************** //
        // Add 2nd spotlight (with shadows)
        // ***************************** //
        const spotLight2 = new THREE.SpotLight('rgb(255, 255, 255)', 10);
        spotLight2.decay = 1;
        spotLight2.position.set(10, 5, 0);
        sceneElements.sceneGraph.add(spotLight2);

        // Setup shadow properties for the spotlight
        spotLight2.castShadow = true;
        spotLight2.shadow.mapSize.width = 2048;
        spotLight2.shadow.mapSize.height = 2048;

        // Give a name to the spot light
        spotLight2.name = "light 2";

        // *********************************** //
        // Create renderer (with shadow map)
        // *********************************** //
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        sceneElements.renderer = renderer;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor('rgb(255, 255, 150)', 1.0);
        renderer.setSize(width, height);

        // Setup shadowMap property
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // **************************************** //
        // Add the rendered image in the HTML DOM
        // **************************************** //
        const htmlElement = document.querySelector("#MainScene");
        htmlElement.appendChild(renderer.domElement);

        // ************************** //
        // NEW --- Control for the camera
        // ************************** //
        sceneElements.control = new OrbitControls(camera, renderer.domElement);
        sceneElements.control.screenSpacePanning = true;

    },

    render: function (sceneElements) {
        sceneElements.renderer.render(sceneElements.sceneGraph, sceneElements.camera);
    },
};

// FUCNTIONS FOR BUILDING THE SCENE
function createTree() {
    // Creating a model by grouping basic geometries
    // Cylinder centered at the origin
    const cylinderRadius = 5;
    const cylinderHeight = 20;
    const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 32);
    const redMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const cylinder = new THREE.Mesh(cylinderGeometry, redMaterial);
    cylinder.receiveShadow = true;
    cylinder.castShadow = true;

    // Move base of the cylinder to y = 0
    cylinder.position.y = cylinderHeight / 2.0;

    // Cone
    const baseConeRadius = 10;
    const coneHeight = 30;
    const coneGeometry = new THREE.ConeGeometry(baseConeRadius, coneHeight, 32);
    const greenMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const cone = new THREE.Mesh(coneGeometry, greenMaterial);
    cone.receiveShadow = true;
    cone.castShadow = true;

    // Move base of the cone to the top of the cylinder
    cone.position.y = cylinderHeight + coneHeight / 2.0;

    // Tree
    const tree = new THREE.Group();
    tree.add(cylinder);
    tree.add(cone);
    return tree;
}

function createSkier() {
    const skier = new Character_Ski();
    return skier.mesh;
}

const scene = {

    // Create and insert in the scene graph the models of the 3D scene

    load3DObjects: function (sceneGraph) {

        // ************************** //
        // Create a ground plane
        // ************************** //
        const planeGeometry = new THREE.PlaneGeometry(6, 6);
        const planeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(200, 200, 200)', side: THREE.DoubleSide });
        const planeObject = new THREE.Mesh(planeGeometry, planeMaterial);
        sceneGraph.add(planeObject);

        // Change orientation of the plane using rotation
        planeObject.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        // Set shadow property
        planeObject.receiveShadow = true;

        // ************************** //
        // Create a skier
        // ************************** //
        const skier = createSkier();
        skier.position.set(3, 1.05, 3);
        skier.scale.set(0.1, 0.1, 0.1);
        sceneGraph.add(skier);

        //Set shadow property
        skier.castShadow = true;
        skier.receiveShadow = true;

        //Name
        skier.name = "skier";


        // ************************** //
        // Create a cube
        // ************************** //
        // Cube center is at (0,0,0)
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(255,0,0)' });
        const cubeObject = new THREE.Mesh(cubeGeometry, cubeMaterial);
        sceneGraph.add(cubeObject);

        // Set position of the cube
        // The base of the cube will be on the plane 
        cubeObject.translateY(0.5);

        // Set shadow property
        cubeObject.castShadow = true;
        cubeObject.receiveShadow = true;

        // Name
        cubeObject.name = "cube";

        // ************************** //
        // Create a tree
        // ************************** //
        const tree = createTree();
        tree.position.set(2, 0, -2);
        tree.scale.set(0.03, 0.03, 0.03);

        sceneGraph.add(tree);

        // ************************** //
        // Create a sphere
        // ************************** //
        // Sphere center is at (0,0,0)
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(180,180,255)' });
        const sphereObject = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sceneGraph.add(sphereObject);

        // Set position of the sphere
        // Move to the left and away from (0,0,0)
        // The sphere touches the plane
        sphereObject.translateX(-1.2).translateY(0.5).translateZ(-0.5);

        // Set shadow property
        sphereObject.castShadow = true;
        sphereObject.receiveShadow = true;

        // ************************** //
        // Create a cylinder
        // ************************** //
        const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 25, 1);
        const cylinderMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(200,255,150)' });
        const cylinderObject = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        sceneGraph.add(cylinderObject);

        // Set position of the cylinder
        // Move to the right and towards the camera
        // The base of the cylinder is on the plane
        cylinderObject.translateX(0.5).translateY(0.75).translateZ(1.5);

        // Set shadow property
        cylinderObject.castShadow = true;
        cylinderObject.receiveShadow = true;
    }
};

// ANIMATION

// Displacement values
var delta = 0.1;
var dispX = 0.2, dispZ = 0.2;

//To keep track of the keyboard - WASD
var keyD = false, keyA = false, keyS = false, keyW = false;

function computeFrame(time) {

    // Can extract an object from the scene Graph from its name
    const light = sceneElements.sceneGraph.getObjectByName("light 1");

    // Apply a small displacement

    if (light.position.x >= 10) {
        delta *= -1;
    } else if (light.position.x <= -10) {
        delta *= -1;
    }
    light.translateX(delta);

    // CONTROLING THE CUBE WITH THE KEYBOARD

    const cube = sceneElements.sceneGraph.getObjectByName("cube");

    if (keyD && cube.position.x < 2.5) {
        cube.translateX(dispX);
    }
    if (keyW && cube.position.z > -2.5) {
        cube.translateZ(-dispZ);
    }
    if (keyA && cube.position.x > -2.5) {
        cube.translateX(-dispX);
    }
    if (keyS && cube.position.z < 2.5) {
        cube.translateZ(dispZ);
    }

    // Rendering
    helper.render(sceneElements);

    // Animation
    //Call for the next frame
    requestAnimationFrame(computeFrame);
}

// Call functions:
//  1. Initialize the empty scene
//  2. Add elements within the scene
//  3. Animate

function init() {
    helper.initEmptyScene(sceneElements);
    scene.load3DObjects(sceneElements.sceneGraph);
    requestAnimationFrame(computeFrame);
}

// HANDLING EVENTS

// Event Listeners

window.addEventListener('resize', resizeWindow);

document.addEventListener('keydown', onDocumentKeyDown, false);
document.addEventListener('keyup', onDocumentKeyUp, false);

// Update render image size and camera aspect when the window is resized
function resizeWindow(eventParam) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    sceneElements.camera.aspect = width / height;
    sceneElements.camera.updateProjectionMatrix();

    sceneElements.renderer.setSize(width, height);

    // Comment when doing animation
    // computeFrame(sceneElements);
}

function onDocumentKeyDown(event) {
    switch (event.keyCode) {
        case 68: //d
            keyD = true;
            break;
        case 83: //s
            keyS = true;
            break;
        case 65: //a
            keyA = true;
            break;
        case 87: //w
            keyW = true;
            break;
    }
}

function onDocumentKeyUp(event) {
    switch (event.keyCode) {
        case 68: //d
            keyD = false;
            break;
        case 83: //s
            keyS = false;
            break;
        case 65: //a
            keyA = false;
            break;
        case 87: //w
            keyW = false;
            break;
    }
}


// STARTING

init();
