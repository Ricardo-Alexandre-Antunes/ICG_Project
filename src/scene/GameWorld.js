import * as THREE from 'three';
import Character_Ski from '../models/Character.js';
import Mountain from '../models/Mountain.js';
import ThirdPersonCamera from '../cameras/ThirdPersonCamera.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Sun from '../models/Sun.js';


//"FREE - SkyBox Mountain View" (https://skfb.ly/oJrZI) by Paul is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

export default class GameWorld {
    

    constructor() {
        this.htmlElement = document.querySelector("#MainScene");
        this.previousRAF = null;
        this.start = Date.now();
        this._Initialize();
    }

    _Initialize() {

        //animated objects
        this.animatedObjects = [];

        //scene
        this.sceneGraph = new THREE.Scene();
        this.floor = [];

        //camera
        this.allCameras = [];
        this.curCamera = 0;
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
        this.camera.position.z = 5;
        this.camera.position.y = 5;
        this.camera.lookAt(0, 0, 0);
        this.allCameras.push(this.camera);

        //renderer
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor('rgb(255, 255, 150)', 1.0);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        this.htmlElement.appendChild(this.renderer.domElement);

        //orbit controls
        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        this.control.screenSpacePanning = true;

        //sun
        const sun = new Sun();
        this.sceneGraph.add(sun.mesh);
        this.animatedObjects.push(sun);

        this._addObjects();
        this._RAF();

        //event listeners
        window.addEventListener('resize', () => this._onWindowResize());
        window.addEventListener('keydown', (e) => this._onKeyDown(e));

    }

    _onKeyDown(event) {
        switch (event.key) {
            case 'c':
                this._switchCamera();
                break;
        }
    }

    _switchCamera() {
        this.curCamera = (this.curCamera + 1) % this.allCameras.length;
        this.camera = this.allCameras[this.curCamera];
    }

    _addObjects() {
        //mountain
        const mountain = new Mountain(500);
        this.sceneGraph.add(mountain.mesh);
        this.floor.push(mountain);

        //skier
        this.skier = new Character_Ski(mountain.mesh);
        this.skier.mesh.scale.set(0.1, 0.1, 0.1);
        this.sceneGraph.add(this.skier.mesh);
        this.animatedObjects.push(this.skier);

        //skier's camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
        const params = 
        {
            camera: camera,
            target: this.skier.mesh
        };
        const skierCamera = new ThirdPersonCamera(params);
        this.allCameras.push(skierCamera._camera);
        this.animatedObjects.push(skierCamera);


    }

    _onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        this.renderer.render(this.sceneGraph, this.camera);
    }

    _Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        //update game objects
        this.animatedObjects.forEach((obj) => {
            obj.Update(timeElapsedS);
        });

        //update camera
        this.control.update();     
        
        //generate more floor if needed
        this.floor.forEach((floor) => {
            const angle = -Math.PI / 2 * floor.steepness
            console.log(this.skier.mesh.position.z);
            console.log(floor.mesh.position.z + (floor.size * Math.abs(Math.sin(angle)) / 2) - 30);
            if (this.skier.mesh.position.z > floor.mesh.position.z + floor.size / 2 - 30) {
                this.sceneGraph.remove(floor.mesh);
                const newFloor = new Mountain(floor.size);
                newFloor.mesh.position.z = floor.mesh.position.z - floor.size * Math.sin(angle);
                newFloor.mesh.position.y = floor.mesh.position.y - floor.size * Math.cos(angle);
                this.sceneGraph.add(newFloor.mesh);
                this.floor.push(newFloor);
            }
        });
    }


    _RAF() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
              }
                
              this.renderer.render(this.sceneGraph, this.camera);
              this._Step(t - this._previousRAF);
              this._previousRAF = t;
              this._RAF();
        });
    }
}