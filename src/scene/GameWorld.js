import * as THREE from 'three';
import Character_Ski from '../models/Character.js';
import Mountain from '../models/Mountain.js';
import ThirdPersonCamera from '../cameras/ThirdPersonCamera.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Fog } from './Fog.js';
import Sun from '../models/Sun.js';


//"FREE - SkyBox Mountain View" (https://skfb.ly/oJrZI) by Paul is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

export default class GameWorld {
    

    constructor(numberPlayers = 1) {
        this.htmlElement = document.querySelector("#MainScene");
        this.previousRAF = null;
        this.start = Date.now();
        this.numberPlayers = numberPlayers;
        this.timeLeft = 300 * 10000;
        this._Initialize();
    }

    _Initialize() {



        //animated objects
        this.animatedObjects = [];

        //scene
        this.sceneGraph = new THREE.Scene();
        this.floor = [];

        //fog
        this.fog = new Fog(this.sceneGraph);

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
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        this.htmlElement.appendChild(this.renderer.domElement);

        //orbit controls
        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        this.control.screenSpacePanning = true;

        //sun
        this.sun = new Sun();
        this.sceneGraph.add(this.sun.mesh);
        this.animatedObjects.push(this.sun);


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
        this.skierHud = [];
        const cols = Math.ceil(Math.sqrt(this.numberPlayers));
        const rows = Math.ceil(this.numberPlayers / cols);
        const viewWidth = window.innerWidth / cols;
        const viewHeight = window.innerHeight / rows;
        
        for (let i = 0; i < this.numberPlayers; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
        
            const left = col * viewWidth + 10;
            const top = row * viewHeight + 10;
        
            const skierHud = document.createElement("div");
            skierHud.style.position = "absolute";
            skierHud.style.left = `${left}px`;
            skierHud.style.top = `${top}px`;
            skierHud.style.color = "lime";
            skierHud.style.background = "rgba(0,0,0,0.7)";
            skierHud.style.padding = "5px";
            skierHud.style.fontFamily = "Arial";
            skierHud.style.fontSize = "14px";
            skierHud.style.width = "80px";
            skierHud.innerHTML = `Score: 0`;
        
            this.skierHud.push(skierHud);
        }
        


        this.speedometerDisplay = document.createElement("div");
        this.speedometerDisplay.style.position = "relative";
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

        // charging bar container
        this.chargeBarContainer = document.createElement("div");
        this.chargeBarContainer.style.position = "absolute";
        this.chargeBarContainer.style.bottom = "20px";
        this.chargeBarContainer.style.right = "20px";
        this.chargeBarContainer.style.width = "16px";
        this.chargeBarContainer.style.height = "120px";
        this.chargeBarContainer.style.background = "rgba(255, 255, 255, 0.1)";
        this.chargeBarContainer.style.border = "2px solid lime";
        this.chargeBarContainer.style.borderRadius = "8px";
        this.chargeBarContainer.style.overflow = "hidden";
        this.chargeBarContainer.style.zIndex = "1000";
        this.chargeBarContainer.style.pointerEvents = "none";

        // inner fill bar
        this.chargeBar = document.createElement("div");
        this.chargeBar.style.width = "100%";
        this.chargeBar.style.height = "0%";  // start at 0%
        this.chargeBar.style.background = "lime";
        this.chargeBar.style.transition = "height 0.1s ease";

        this.chargeBarContainer.appendChild(this.chargeBar);
        document.body.appendChild(this.chargeBarContainer);




        document.body.appendChild(this.timerDisplay);
        document.body.appendChild(this.fpsDisplay);
        this.skierHud.forEach((skierHud) => {
            document.body.appendChild(skierHud);
        });


        this._addObjects();
        this._RAF();

        //event listeners
        window.addEventListener('resize', () => this._onWindowResize());
        window.addEventListener('keydown', (e) => this._onKeyDown(e));

    }

    updateChargeBar = (chargeLevel) => {
        const clamped = Math.min(1, Math.max(0, chargeLevel / 50));
        this.chargeBar.style.height = `${clamped * 100}%`;
    
        // Optional: glow or color change
        if (clamped >= 1) {
            this.chargeBarContainer.style.border = "2px solid red";
            this.chargeBarContainer.style.animation = "pulse 1s infinite";
            this.chargeBarContainer.style.boxShadow = "0 0 15px red"; // 🔥 glow effect
        
            // Add the animation if not already present
            if (!document.getElementById("pulse-style")) {
                const style = document.createElement("style");
                style.id = "pulse-style";
                style.innerHTML = `
                    @keyframes pulse {
                        0% { transform: scaleY(1); opacity: 1; }
                        50% { transform: scaleY(1.05); opacity: 0.7; }
                        100% { transform: scaleY(1); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        } else {
            this.chargeBarContainer.style.border = "2px solid lime";
            this.chargeBarContainer.style.animation = "none";
            this.chargeBarContainer.style.boxShadow = "none";
            this.chargeBar.style.animation = "none";
        }
        
    
        // Optional: gradient or dynamic color
        const red = Math.floor(255 * clamped);
        const green = Math.floor(255 * (1 - clamped));
        this.chargeBar.style.background = `rgb(${red}, ${green}, 0)`;
    };
    

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
        const mountain2 = new Mountain(500, 50, 10, 0xffffff, mountain.steepness, Math.random(), 50 * Math.random(), mountain);
        const angle = mountain.mesh.rotation.x;
        mountain2.mesh.position.z = mountain.mesh.position.z - mountain.size * Math.sin(angle);
        mountain2.mesh.position.y = mountain.mesh.position.y - mountain.size * Math.cos(angle);
        this.sceneGraph.add(mountain2.mesh);
        this.floor.push(mountain2);

        //skier
        this.skiers = [];
        for (let i = 0; i < this.numberPlayers; i++) {
            const skier = new Character_Ski([mountain.mesh, mountain2.mesh], "Skier " + (i + 1));

            skier.mesh.position.y = 50;
            skier.mesh.position.x = -10 + i * 5;
            skier.mesh.scale.set(0.1, 0.1, 0.1);
            this.sceneGraph.add(skier.mesh);
            this.skiers.push(skier);
            this.animatedObjects.push(skier);

            //skier's camera
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
            const params = 
            {
                camera: camera,
                target: skier.mesh
            };
            const skierCamera = new ThirdPersonCamera(params);
            this.allCameras.push(skierCamera._camera);
            this.animatedObjects.push(skierCamera);
        }

        this.skier = this.skiers[0];




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
        const mountain = new Mountain(500);
        this.sceneGraph.add(mountain.mesh);
        this.floor.push(mountain);

        //2nd mountain
        const mountain2 = new Mountain(500, 50, 10, 0xffffff, mountain.steepness, Math.random(), 50 * Math.random(), mountain);
        const angle = mountain.mesh.rotation.x;
        mountain2.mesh.position.z = mountain.mesh.position.z - mountain.size * Math.sin(angle);
        mountain2.mesh.position.y = mountain.mesh.position.y - mountain.size * Math.cos(angle);
        this.sceneGraph.add(mountain2.mesh);
        this.floor.push(mountain2);


        //skier
        this.skier = new Character_Ski([mountain.mesh, mountain2.mesh]);
        this.skier.mesh.add(this.fog.snowstorm);
        this.skier.mesh.scale.set(0.1, 0.1, 0.1);
        this.sceneGraph.add(this.skier.mesh);
        this.animatedObjects.push(this.skier);

        //skier's camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
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
            for (let i = 0; i < this.skiers.length; i++) {
                const skier = this.skiers[i];
                for (let i = 0; i < this.floor.length; i++) {
                    if (skier.mesh.position.z < this.floor[i].mesh.position.z + this.floor[i].size * Math.cos(-this.floor[i].mesh.rotation.x) / 2) {
                        const pass_gate = this.floor[i].checkSkierScore(skier);
                        if (pass_gate != 0) {
                            console.log("pass_gate", pass_gate);
                        }
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
        }

        const now = performance.now();
        this.frameCount++;
        for (let i = 0; i < this.skiers.length; i++) {
            const skier = this.skiers[i];
            //console.log(this.skierHud[i]);
            this.skierHud[i].innerHTML = `Score: ${skier.score}`;
        }
        if (now - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.timeLeft -= 1000;
            this.timerDisplay.innerHTML = `Time Left: ${Math.floor(this.timeLeft / 1000)}s`;
            this.frameCount = 0;
            this.lastFrameTime = now;
            this.fpsDisplay.innerHTML = `FPS: ${this.fps}`;
            

        }

        const speed = this.skier.getCurrentSpeed() ? this.skier.getCurrentSpeed() : 0;
        const speedKmH = Math.round(speed * 3.6);
        this.speedText.innerHTML = `${speedKmH} km/h`;

        const chargingPercentage = Math.min(50, 10 * this.skier.timeCharging);
        this.updateChargeBar(chargingPercentage);


        // Clamp and map speed to angle (max 100 km/h = 270° rotation)
        const clampedSpeed = Math.min(speedKmH, 300);
        const angle = (clampedSpeed / 300) * 270 - 135; // map [0, 100] to [-135°, +135°]
        this.speedNeedle.style.transform = `rotate(${angle}deg)`;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setScissorTest(true);
        
            // Calculate the number of rows and columns based on the number of players
            const cols = Math.ceil(Math.sqrt(this.skiers.length));
            const rows = Math.ceil(this.skiers.length / cols);
        
            // Calculate viewport dimensions for each split-screen section
            const viewWidth = width / cols;
            const viewHeight = height / rows;
        
            // Iterate through each skier and render the scene from their respective camera
            for (let i = 0; i < this.skiers.length; i++) {
                const col = i % cols; // Column position for this skier
                const row = Math.floor(i / cols); // Row position for this skier
        
                // Calculate the top-left corner of the viewport for this skier
                const left = col * viewWidth;
                const top = row * viewHeight;
        
                // Set the viewport and scissor area for rendering
                this.renderer.setViewport(left, top, viewWidth, viewHeight);
                this.renderer.setScissor(left, top, viewWidth, viewHeight);
                this.renderer.setScissorTest(true);

                //console.log("skier", this.skiers[i]);
                //console.log("skier velocity", this.skiers[i]._velocity);
                //console.log("sun", this.sun);
                this.fog.update(this.skiers[i], this.sun.mesh);
                
        
                // Render the scene from the skier's camera
                this.renderer.render(this.sceneGraph, this.allCameras[i+1]);
            }
        
            // Reset scissor test for UI rendering (if needed)
            this.renderer.setScissorTest(false);
        

        this.renderer.setScissorTest(false);
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
        const furthestSkier = this.skiers.reduce((prev, curr) => (prev.mesh.position.z > curr.mesh.position.z) ? prev : curr);
        if (furthestSkier.mesh.position.z > detectPoint.mesh.position.z + detectPoint.size / 4) {
            for (let i = 0; i < 4; i++) {
                //console.log("rocks", lastFloor.rocks);
                const newFloor = new Mountain(
                    lastFloor.size,
                    50,
                    10,
                    0xffffff,
                    lastFloor.steepness,
                    Math.random(),
                    Math.max(0, lastFloor.rocks + 15 * (Math.random() - 0.5)),
                    lastFloor  // 👈 Pass the previous mountain
                  );
                  
                newFloor.mesh.position.z = lastFloor.mesh.position.z - lastFloor.size * Math.sin(angle);
                newFloor.mesh.position.y = lastFloor.mesh.position.y - lastFloor.size * Math.cos(angle);
                this.sceneGraph.add(newFloor.mesh);
                for (let idx = 0; idx < this.skiers.length; idx++) {
                    this.skiers[idx]._updateSurface(newFloor.mesh);
                }
                this.floor.push(newFloor);
                lastFloor = this.floor[this.floor.length - 1];
            }
            if (this.floor.length > 16) {
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