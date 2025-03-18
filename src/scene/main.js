import * as THREE from "three";
import Character_Ski from "../models/Character.js";
import Rock from "../models/Rock.js";
import SlalomGate from "../models/SlalomGate.js";
import ThirdPersonCamera from "../cameras/ThirdPersonCamera.js";
import Pole from "../models/Pole.js";
import SpotlightModel from "../models/Spotlight.js";
import Mountain from "../models/Mountain.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// To store the scene graph, and elements usefull to rendering the scene
const sceneElements = {
    sceneGraph: null,
    camera: null,
    control: null,  // NEW
    renderer: null,
};

sceneElements.sceneGraph = new THREE.Scene();

const skierData = {
    speed: 0,
    rotation: 0,
};

const relevantPlanes = [];

const lights = [];

const cameras = [];

const skier = createSkier();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 5, 5);
const thirdPersonCamera = new ThirdPersonCamera({
    camera: camera,
    target: skier.mesh,
});
cameras.push(thirdPersonCamera._camera);


const mountain = new Mountain();
relevantPlanes.push(mountain.mesh);
sceneElements.sceneGraph.add(mountain.mesh);


let i = 0;

let last_camera_change = 0;

// HELPER FUNCTIONS

const helper = {

    initEmptyScene: function (sceneElements) {

        // ************************** //
        // Create the 3D scene
        // ************************** //


        // ************************** //
        // Add camera
        // ************************** //
        const width = window.innerWidth;
        const height = window.innerHeight;
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
        sceneElements.camera = camera;
        camera.position.set(0, 5, 5);
        camera.lookAt(0, 0, 0);

        cameras.push(camera);


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
        //const spotLight1 = new THREE.SpotLight('rgb(255, 255, 255)', 40);
        //spotLight1.decay = 1;
        //spotLight1.position.set(-5, 8, 0);
        //sceneElements.sceneGraph.add(spotLight1);
        //lights.push(spotLight1);
//
        //// Setup shadow properties for the spotlight
        //spotLight1.castShadow = true;
        //spotLight1.shadow.mapSize.width = 2048;
        //spotLight1.shadow.mapSize.height = 2048;
        //
//
        //// Give a name to the spot light
        //spotLight1.name = "light 1";

        // ***************************** //
        // Add 2nd spotlight (with shadows)
        // ***************************** //
        //const spotLight2 = new THREE.SpotLight('rgb(255, 255, 255)', 10);
        //spotLight2.decay = 1;
        //spotLight2.position.set(10, 5, 0);
        //sceneElements.sceneGraph.add(spotLight2);
        //lights.push(spotLight2);
//
        //// Setup shadow properties for the spotlight
        //spotLight2.castShadow = true;
        //spotLight2.shadow.mapSize.width = 2048;
        //spotLight2.shadow.mapSize.height = 2048;
//
        //// Give a name to the spot light
        //spotLight2.name = "light 2";

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
        renderer.shadowMap.autoUpdate = true;


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
    return skier;
}

function createPole() {
    const pole = new Pole();
    return pole.getMesh();
}


const scene = {

    // Create and insert in the scene graph the models of the 3D scene

    load3DObjects: function (sceneGraph) {

        // ************************** //
        // Create a ground plane
        // ************************** //
        const planeGeometry = new THREE.PlaneGeometry(20, 20);
        const planeMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(200, 200, 200)', side: THREE.DoubleSide });
        const planeObject = new THREE.Mesh(planeGeometry, planeMaterial);
        sceneGraph.add(planeObject);
        relevantPlanes.push(planeObject)

        // Change orientation of the plane using rotation
        planeObject.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        // Set shadow property
        planeObject.receiveShadow = true;

        planeObject.name = "floor"


        // ************************** //
        // Create AxesHelper
        // ************************** //
        const axes = new THREE.AxesHelper(1000);
        sceneGraph.add(axes);

        // ************************** //
        // Create a skier
        // ************************** //
        skier.mesh.position.set(3, 50, 3);
        skier.mesh.scale.set(0.01, 0.01, 0.01);
        sceneGraph.add(skier.mesh);

        //Set shadow property
        skier.mesh.castShadow = true;
        skier.mesh.receiveShadow = true;

        //Name
        skier.mesh.name = "skier";

        cameras.push(skier.camera);
        sceneGraph.add(skier.helper);

        // ************************** //
        // Create a rock
        // ************************** //

        const rock = new Rock();
        rock.mesh.position.set(-2, 0, 2);
        rock.mesh.scale.set(0.25, 0.25, 0.25);
        sceneGraph.add(rock.mesh);

        const rock2 = new Rock();
        rock2.mesh.position.set(-3, 0, 2);
        rock2.mesh.scale.set(0.25, 0.25, 0.25);
        sceneGraph.add(rock2.mesh);

        // ************************** //
        // Add 2 slalom gates red / blue
        // ************************** //

        const textureLoader = new THREE.TextureLoader();
        const slalomGate1 = new SlalomGate(textureLoader, null, 0xff0000);
        slalomGate1.group.position.set(0, 0, 8);
        slalomGate1.group.scale.set(0.15, 0.10, 0.15)
        sceneGraph.add(slalomGate1.group);

        const slalomGate2 = new SlalomGate(textureLoader, null, 0x0000ff);
        slalomGate2.group.position.set(1, 0, 8);
        slalomGate2.group.scale.set(0.15, 0.10, 0.15)
        sceneGraph.add(slalomGate2.group);

        // ************************** //
        // Create a pole
        // ************************** //

        const pole = createPole();
        pole.position.set(5, 0, 5);
        pole.scale.set(0.5, 0.5, 0.5);
        sceneGraph.add(pole);


        // ************************** //
        // Create a spotlight
        // ************************** //

        const spotlight = new SpotlightModel();
        spotlight.getObject().position.set(-5, 0.3, -5);
        spotlight.getObject().scale.set(0.05, 0.05, 0.05);
        sceneGraph.add(spotlight.getObject());


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
var keyD = false, keyA = false, keyS = false, keyW = false, keyC = false;
var arrowUp = false, arrowDown = false, arrowLeft = false, arrowRight = false;
var yspeed = 0;

function resetSkier() {
    skier.mesh.position.set(3, 0.145, 3);
    skier.mesh.rotation.set(0, 0, 0);
    skierData.speed = 0;
    skier.camera.zoom = 1;
    thirdPersonCamera._camera.fov = 45;
}

function skierMovement(time) {
    // Raycasting downwards
    const raycaster = new THREE.Raycaster();
    raycaster.set(skier.mesh.position, new THREE.Vector3(0, -1, 0));

    // Check for closest plane
    const intersects = raycaster.intersectObjects(relevantPlanes, true);
    console.log(intersects);
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(skier.mesh.quaternion).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(skier.mesh.quaternion).normalize();
    let onGround = true;
    if (intersects.length > 0) {
        // Find the closest intersection
        let closest = intersects.reduce((a, b) => (a.distance < b.distance ? a : b));
        let normal = closest.face.normal.clone(); // Copy to avoid modifying the original

        // Adjust skier position
        if (closest.distance < 0.400) {
            // Check if at end of ramp
            const newRaycaster = new THREE.Raycaster();
            const position = skier.mesh.position.clone();
            position.setZ(position.z + 0.1);
            newRaycaster.set(position, new THREE.Vector3(0, -1, 0));
            const newIntersects = newRaycaster.intersectObjects(relevantPlanes, true);
            const rayCasterUp = new THREE.Raycaster();
            rayCasterUp.set(position, new THREE.Vector3(0, 1, 0));
            const upIntersects = rayCasterUp.intersectObjects(relevantPlanes, true);

            if (upIntersects.length === 0 && newIntersects.length !== 0 && newIntersects[0].distance < 0.400) {
                onGround = true;
                skier.mesh.position.y = closest.point.y + 0.145;
            }



        }
        else {
            // apply gravity
            skier.mesh.position.add(new THREE.Vector3(0, -0.3, 0));
            onGround = false;
        }

        // Align skier with the closest plane
        const objectUp = new THREE.Vector3(0, 1, 0).applyQuaternion(skier.mesh.quaternion);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(objectUp, normal);
        skier.mesh.quaternion.slerp(quaternion, 0.2); // Smooth transition

        // Compute movement directions
        let turnAngle = 0;
        if (arrowLeft) turnAngle = 0.05;  // Rotate left
        if (arrowRight) turnAngle = -0.05; // Rotate right

        if (turnAngle !== 0) {
            const turnQuaternion = new THREE.Quaternion();
            turnQuaternion.setFromAxisAngle(normal, turnAngle); // Rotate around slope's normal
            skier.mesh.quaternion.multiply(turnQuaternion); // Apply rotation
        }
        
        // Movement controls
        if (arrowUp) {
            if (skierData.speed < 0.5) {
                skierData.speed += 0.001;
                skier.camera.zoom += 0.1;
                thirdPersonCamera._camera.fov += 0.1;
            }
        }

        if (arrowDown) {
            if (skierData.speed > -0.5) {
                skierData.speed -= 0.001;
                skier.camera.zoom -= 0.1;
                thirdPersonCamera._camera.fov -= 0.1;
            }
        }
        
    } else {
        // Mantain speed but be affected by gravity
        skier.mesh.position.add(new THREE.Vector3(0, yspeed, 0));
    }

    // Apply gravity
    skier.mesh.position.add(forward.multiplyScalar(skierData.speed));

    // Reset skier if they fall too low
    //if (skier.mesh.position.y < -135) {
    //    resetSkier();
    //}
}


function computeFrame(time) {
    thirdPersonCamera.Update(time);
    if (keyC) {
        if (Date.now() - last_camera_change > 50) {
            sceneElements.camera = cameras[(++i) % cameras.length];
        }
        last_camera_change = Date.now();
    }

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



    skierMovement(time);

    //check list of planes, if skier is in last plane generate 3 more mountains in front of him
    const skierPosition = skier.mesh.position;
    const lastPlane = relevantPlanes[relevantPlanes.length - 1];
    const lastPlanePosition = lastPlane.position;
    // close to ending plane
    if (skierPosition.z > lastPlanePosition.z + 270) {
        const newMountain1 = new Mountain();
        newMountain1.mesh.position.set(0, lastPlanePosition.y - 450, lastPlanePosition.z + 400);
        relevantPlanes.push(newMountain1.mesh);
        sceneElements.sceneGraph.add(newMountain1.mesh);

        //remove first plane
        const firstPlane = relevantPlanes.shift();
        sceneElements.sceneGraph.remove(firstPlane);

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

    for (let i = 0; i < cameras.length; i++) {
        cameras[i].aspect = width / height;
        cameras[i].updateProjectionMatrix();
    }

    sceneElements.renderer.setSize(width, height);

    // Comment when doing animation
    //computeFrame(sceneElements);
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
        case 37: //left arrow
            arrowLeft = true;
            break;
        case 38: //up arrow
            arrowUp = true;
            break;
        case 39: //right arrow
            arrowRight = true;
            break;
        case 40: //down arrow
            arrowDown = true;
            break;
        case 67: //c
            keyC = true
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
        case 37: //left arrow
            arrowLeft = false;
            break;
        case 38: //up arrow 
            arrowUp = false;
            break;
        case 39: //right arrow
            arrowRight = false;
            break;
        case 40: //down arrow  
            arrowDown = false;
            break;
        case 67: //c
            keyC = false;
            break;
    }
}


// STARTING

init();