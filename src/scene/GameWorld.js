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
        this.timeLeft = 300 * 1000;
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

        this.speedometerDisplay = document.createElement("div");
        this.speedometerDisplay.style.position = "absolute";
        this.speedometerDisplay.style.bottom = "20px";
        this.speedometerDisplay.style.left = "50%";
        this.speedometerDisplay.style.transform = "translateX(-50%)";
        this.speedometerDisplay.style.width = "140px";
        this.speedometerDisplay.style.height = "140px";
        this.speedometerDisplay.style.borderRadius = "50%";
        this.speedometerDisplay.style.background = "radial-gradient(circle at center, #0f0 0%, #030 100%)";
        this.speedometerDisplay.style.border = "4px solid lime";
        this.speedometerDisplay.style.boxShadow = "0 0 15px lime";
        this.speedometerDisplay.style.display = "flex";
        this.speedometerDisplay.style.alignItems = "center";
        this.speedometerDisplay.style.justifyContent = "center";
        this.speedometerDisplay.style.position = "absolute";
        this.speedometerDisplay.style.zIndex = "1000";
        this.speedometerDisplay.style.pointerEvents = "none";
        this.speedometerDisplay.style.overflow = "hidden";
        document.body.appendChild(this.speedometerDisplay);
        
        // needle
        this.speedNeedle = document.createElement("div");
        this.speedNeedle.style.width = "4px";
        this.speedNeedle.style.height = "60px";
        this.speedNeedle.style.background = "red";
        this.speedNeedle.style.position = "absolute";
        this.speedNeedle.style.bottom = "50%";
        this.speedNeedle.style.left = "50%";
        this.speedNeedle.style.transformOrigin = "bottom center";
        this.speedNeedle.style.transform = "rotate(0deg)";
        this.speedometerDisplay.appendChild(this.speedNeedle);
        
        // center dot
        this.speedCenter = document.createElement("div");
        this.speedCenter.style.width = "12px";
        this.speedCenter.style.height = "12px";
        this.speedCenter.style.background = "black";
        this.speedCenter.style.border = "2px solid lime";
        this.speedCenter.style.borderRadius = "50%";
        this.speedCenter.style.position = "absolute";
        this.speedCenter.style.left = "calc(50% - 6px)";
        this.speedCenter.style.bottom = "calc(50% - 6px)";
        this.speedometerDisplay.appendChild(this.speedCenter);
        
        // numeric readout
        this.speedText = document.createElement("div");
        this.speedText.style.position = "absolute";
        this.speedText.style.bottom = "10px";
        this.speedText.style.left = "50%";
        this.speedText.style.transform = "translateX(-50%)";
        this.speedText.style.color = "white";
        this.speedText.style.fontSize = "14px";
        this.speedText.style.fontWeight = "bold";
        this.speedText.innerHTML = "0 km/h";
        this.speedometerDisplay.appendChild(this.speedText);

        for (let i = 0; i <= 10; i++) {
            const tick = document.createElement("div");
            tick.style.position = "absolute";
            tick.style.width = "2px";
            tick.style.height = "10px";
            tick.style.background = "white";
            const angle = (i / 10) * 270 - 135;
            tick.style.transform = `rotate(${angle}deg) translateY(-60px)`;
            tick.style.transformOrigin = "center bottom";
            tick.style.left = "50%";
            tick.style.bottom = "50%";
            this.speedometerDisplay.appendChild(tick);
        }


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
        const mountain = new Mountain(250);
        this.sceneGraph.add(mountain.mesh);
        this.floor.push(mountain);

        //2nd mountain
        const mountain2 = new Mountain(250, 50, 10, 0xffffff, mountain.steepness, Math.random(), 50 * Math.random(), mountain);
        const angle = mountain.mesh.rotation.x;
        mountain2.mesh.position.z = mountain.mesh.position.z - mountain.size * Math.sin(angle);
        mountain2.mesh.position.y = mountain.mesh.position.y - mountain.size * Math.cos(angle);
        this.sceneGraph.add(mountain2.mesh);
        this.floor.push(mountain2);

        //skier
        this.skier = new Character_Ski([mountain.mesh, mountain2.mesh]);
        this.skier.mesh.position.y = 50;
        this.skier.mesh.position.x = -10;
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
        this.timeLeft = 30 * 10000;
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
        this.allCameras = [this.camera];
    

        //mountain
        const mountain = new Mountain(250);
        this.sceneGraph.add(mountain.mesh);
        this.floor.push(mountain);

        //2nd mountain
        const mountain2 = new Mountain(250, 50, 10, 0xffffff, mountain.steepness, Math.random(), 15 * Math.random(), mountain); // Pass the previous mountain
        const angle = mountain.mesh.rotation.x;
        mountain2.mesh.position.z = mountain.mesh.position.z - mountain.size * Math.sin(angle);
        mountain2.mesh.position.y = mountain.mesh.position.y - mountain.size * Math.cos(angle);
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
        //check which floor skier is in
        if (Date.now() - this.skier.lastScoreUpdate > 200) {
            for (let i = 0; i < this.floor.length; i++) {
                if (this.skier.mesh.position.z < this.floor[i].mesh.position.z + this.floor[i].size * Math.cos(-this.floor[i].mesh.rotation.x) / 2) {
                    const pass_gate = this.floor[i].checkSkierScore(this.skier);
                    if (pass_gate == -1) {
                        this.timeLeft -= 3000;
                    }
                    if (pass_gate == 1) {
                        this.timeLeft += 1000;
                    }
                    break;
                }
            }
            if (this.timeLeft <= 0) {
                this._skierLose();
            }
        }

        const now = performance.now();
        this.frameCount++;
        this.scoreDisplay.innerHTML = `Score: ${this.skier.score}`;
        if (now - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.timeLeft -= 1000;
            this.timerDisplay.innerHTML = `Time Left: ${Math.floor(this.timeLeft / 1000)}s`;
            this.frameCount = 0;
            this.lastFrameTime = now;
            this.fpsDisplay.innerHTML = `FPS: ${this.fps}`;
            

        }

        const speed = this.skier._velocity ? this.skier._velocity.z : 0;
        const speedKmH = Math.round(speed * 3.6);
        this.speedText.innerHTML = `${speedKmH} km/h`;

        // Clamp and map speed to angle (max 100 km/h = 270° rotation)
        const clampedSpeed = Math.min(speedKmH, 300);
        const angle = (clampedSpeed / 300) * 270 - 135; // map [0, 100] to [-135°, +135°]
        this.speedNeedle.style.transform = `rotate(${angle}deg)`;

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
        const angle = lastFloor.mesh.rotation.x;
        if (this.skier.mesh.position.z > detectPoint.mesh.position.z + detectPoint.size / 4) {
            for (let i = 0; i < 4; i++) {
                const newFloor = new Mountain(
                    lastFloor.size,
                    50,
                    10,
                    0xffffff,
                    lastFloor.steepness,
                    Math.random(),
                    15 * Math.random(),
                    lastFloor  // 👈 Pass the previous mountain
                  );
                  
                newFloor.mesh.position.z = lastFloor.mesh.position.z - lastFloor.size * Math.sin(angle);
                newFloor.mesh.position.y = lastFloor.mesh.position.y - lastFloor.size * Math.cos(angle);
                this.sceneGraph.add(newFloor.mesh);
                this.skier._updateSurface(newFloor.mesh);
                this.floor.push(newFloor);
                lastFloor = this.floor[this.floor.length - 1];
            }
            if (this.floor.length > 6) {
                this.sceneGraph.remove(this.floor.shift().mesh);
            }
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