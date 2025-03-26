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
        this.timeLeft = 30 * 1000;
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
        this.renderer.setClearColor(0x87CEEB, 1.0);
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


        this.lastFrameTime = performance.now();
        this.fps = 0;
        this.frameCount = 0;

        this.fpsDisplay = document.createElement("div");
        this.fpsDisplay.style.position = "absolute";
        this.fpsDisplay.style.top = "10px";
        this.fpsDisplay.style.left = "10px";
        this.fpsDisplay.style.color = "white";
        this.fpsDisplay.style.background = "rgba(0,0,0,0.7)";
        this.fpsDisplay.style.padding = "5px";
        this.fpsDisplay.style.fontFamily = "Arial";
        this.fpsDisplay.style.color = "lime";  // Change text color to green
        this.fpsDisplay.style.fontSize = "14px"; // Make it readable
        this.fpsDisplay.style.width = "80px"; // Give it some width

        //display timer on center top with funny animations
        this.timerDisplay = document.createElement("div");
        this.timerDisplay.style.position = "absolute";
        this.timerDisplay.style.top = "10px";
        this.timerDisplay.style.left = "50%";
        this.timerDisplay.style.transform = "translateX(-50%)";
        this.timerDisplay.style.color = "white";
        this.timerDisplay.style.background = "rgba(0,0,0,0.7)";
        this.timerDisplay.style.padding = "5px";
        this.timerDisplay.style.fontFamily = "Arial";
        this.timerDisplay.style.color = "lime";  // Change text color to green
        this.timerDisplay.style.fontSize = "14px"; // Make it readable
        this.timerDisplay.style.width = "80px"; // Give it some width
        this.timerDisplay.innerHTML = "Time Left: 30s";


        //skier score
        this.scoreDisplay = document.createElement("div");
        this.scoreDisplay.style.position = "absolute";
        this.scoreDisplay.style.top = "10px";
        this.scoreDisplay.style.right = "10px";
        this.scoreDisplay.style.color = "white";
        this.scoreDisplay.style.background = "rgba(0,0,0,0.7)";
        this.scoreDisplay.style.padding = "5px";
        this.scoreDisplay.style.fontFamily = "Arial";
        this.scoreDisplay.style.color = "lime";  // Change text color to green
        this.scoreDisplay.style.fontSize = "14px"; // Make it readable
        this.scoreDisplay.style.width = "80px"; // Give it some width
        this.scoreDisplay.innerHTML = "Score: 0";

        document.body.appendChild(this.timerDisplay);
        document.body.appendChild(this.fpsDisplay);
        document.body.appendChild(this.scoreDisplay);


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
        console.log("Switching camera");
        this.curCamera = (this.curCamera + 1) % this.allCameras.length;
        this.camera = this.allCameras[this.curCamera];
    }

    _addObjects() {
        //mountain
        const mountain = new Mountain(500);
        this.sceneGraph.add(mountain.mesh);
        this.floor.push(mountain);

        //2nd mountain
        const mountain2 = new Mountain(500);
        const angle = -Math.PI / 2 * mountain.steepness
        mountain2.mesh.position.z = mountain.mesh.position.z - mountain.size * Math.sin(angle) - 2;
        mountain2.mesh.position.y = mountain.mesh.position.y - mountain.size * Math.cos(angle) + 0.5;
        this.sceneGraph.add(mountain2.mesh);
        this.floor.push(mountain2);

        //skier
        this.skier = new Character_Ski([mountain.mesh, mountain2.mesh]);
        this.skier.mesh.scale.set(0.1, 0.1, 0.1);
        this.sceneGraph.add(this.skier.mesh);
        this.animatedObjects.push(this.skier);

        //skier's camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
        const params = 
        {
            camera: camera,
            target: this.skier.mesh
        };
        const skierCamera = new ThirdPersonCamera(params);
        this.allCameras.push(skierCamera._camera);
        this.animatedObjects.push(skierCamera);


    }

    _skierLose() {
        console.log("You lose");
        this.timeLeft = 30 * 1000;
        this.floor.forEach((floor) => {
            this.sceneGraph.remove(floor.mesh);
        }
        );
        this.floor = [];
        this.sceneGraph.remove(this.skier.mesh);
        //remove camera
        this.allCameras.forEach((camera) => {
            this.sceneGraph.remove(camera);
        });
        this.allCameras = [];
    

        //mountain
        const mountain = new Mountain(500);
        this.sceneGraph.add(mountain.mesh);
        this.floor.push(mountain);

        //2nd mountain
        const mountain2 = new Mountain(500);
        const angle = -Math.PI / 2 * mountain.steepness
        mountain2.mesh.position.z = mountain.mesh.position.z - mountain.size * Math.sin(angle) - 2;
        mountain2.mesh.position.y = mountain.mesh.position.y - mountain.size * Math.cos(angle) + 0.5;
        this.sceneGraph.add(mountain2.mesh);
        this.floor.push(mountain2);

        //skier
        this.skier = new Character_Ski([mountain.mesh, mountain2.mesh]);
        this.skier.mesh.scale.set(0.1, 0.1, 0.1);
        this.sceneGraph.add(this.skier.mesh);
        this.animatedObjects.push(this.skier);

        //skier's camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
        const params = 
        {
            camera: camera,
            target: this.skier.mesh
        };
        const skierCamera = new ThirdPersonCamera(params);
        this.camera = skierCamera._camera;
        this.allCameras.push(skierCamera._camera);
        this.animatedObjects.push(skierCamera);

    
        

    }

    _onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        const now = performance.now();
        this.frameCount++;
        this.scoreDisplay.innerHTML = `Score: ${this.skier.score}`;
        if (now - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.timeLeft -= 1000;
            this.timerDisplay.innerHTML = `Time Left: ${Math.floor(this.timeLeft / 1000)}s`;
            console.log("time left", this.timeLeft);
            this.frameCount = 0;
            this.lastFrameTime = now;
            this.fpsDisplay.innerHTML = `FPS: ${this.fps}`;
            
            console.log("fps", this.fps);

        }
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
        var lastFloor = this.floor[this.floor.length - 1];
        var detectPoint = this.floor[this.floor.length - 2];
        const angle = -Math.PI / 2 * lastFloor.steepness
        if (this.skier.mesh.position.z > detectPoint.mesh.position.z + detectPoint.size / 4) {
            for (let i = 0; i < 2; i++) {
                const newFloor = new Mountain(lastFloor.size);
                newFloor.mesh.position.z = lastFloor.mesh.position.z - lastFloor.size * Math.sin(angle) - 2;
                newFloor.mesh.position.y = lastFloor.mesh.position.y - lastFloor.size * Math.cos(angle) + 0.5;
                this.sceneGraph.add(newFloor.mesh);
                this.skier._updateSurface(newFloor.mesh);
                this.floor.push(newFloor);
                lastFloor = this.floor[this.floor.length - 1];
            }
            if (this.floor.length > 8) {
                this.sceneGraph.remove(this.floor.shift().mesh);
            }
        }

        //check which floor skier is in
        for (let i = 0; i < this.floor.length; i++) {
            console.log(this.skier.mesh.position.z, this.floor[i].mesh.position.z + this.floor[i].size * Math.sin(-this.floor[i].mesh.rotation.x) / 2);
            if (this.skier.mesh.position.z < this.floor[i].mesh.position.z + this.floor[i].size * Math.sin(-this.floor[i].mesh.rotation.x) / 2) {
                const pass_gate = this.floor[i].checkSkierScore(this.skier);
                if (pass_gate == -1) {
                    this.timeLeft -= 3000;
                }
                if (pass_gate == 1) {
                    this.timeLeft += 1000;
                }
            }
        }
        if (this.timeLeft <= 0) {
            this._skierLose();
            this.timeLeft = 30 * 1000;
        }
    }


    _RAF() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
              }
                
              this.render();
              this._Step(t - this._previousRAF);
              this._previousRAF = t;
              this._RAF();
        });
    }
}