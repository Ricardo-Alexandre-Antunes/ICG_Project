import * as THREE from 'three';
import Character_Ski from '../models/Character.js';
import Mountain from '../models/Mountain.js';
import ThirdPersonCamera from '../cameras/ThirdPersonCamera.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Fog } from './Fog.js';
import Sun from '../models/Sun.js';
import FirstPersonCamera from '../cameras/FirstPersonCamera.js';


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
        this.timerDisplay.style.fontFamily = "'Press Start 2P', monospace";
        this.timerDisplay.style.color = "#00FF00";
        this.timerDisplay.style.fontSize = "28px";
        this.timerDisplay.style.padding = "10px 20px";
        this.timerDisplay.style.background = "rgba(0,0,0,0.8)";
        this.timerDisplay.style.border = "3px solid lime";
        this.timerDisplay.style.borderRadius = "12px";
        this.timerDisplay.style.textShadow = "2px 2px 4px #000";
        this.timerDisplay.style.zIndex = "1000";
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
        
            const left = col * viewWidth + viewWidth / 2 - 50 ;
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

    
        

    }

    _onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        const now = Date.now();
    
        // Update score if enough time has passed
        if (now - this.skier.lastScoreUpdate > 200) {
            this.skier.lastScoreUpdate = now;
    
            for (const skier of this.skiers) {
                const skierZ = skier.mesh.position.z;
    
                for (const floor of this.floor) {
                    const cosRotX = Math.cos(-floor.mesh.rotation.x); // Cache this
                    const floorZ = floor.mesh.position.z + floor.size * cosRotX / 2;
    
                    if (skierZ < floorZ) {
                        const pass_gate = floor.checkSkierScore(skier);
    
                        if (pass_gate !== 0) {
                            //console.log("pass_gate", pass_gate);
                            if (pass_gate === -1) this.timeLeft -= 3000;
                            if (pass_gate === 1) this.timeLeft += 1000;
                        }
                        break;
                    }
                }
    
                if (this.timeLeft <= 0) {
                    this._skierLose();
                    return; // Stop rendering if game ends
                }
            }
        }
    
        // Update FPS, Timer, and UI once per second
        const perfNow = performance.now();
        this.frameCount++;
    
        if (perfNow - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.timeLeft -= 1000;
    
            this.timerDisplay.innerHTML = `Time Left: ${Math.floor(this.timeLeft / 1000)}s`;
            this.fpsDisplay.innerHTML = `FPS: ${this.fps}`;
    
            this.lastFrameTime = perfNow;
            this.frameCount = 0;
        }
    
        // Update skier HUD (score) only if changed
        for (let i = 0; i < this.skiers.length; i++) {
            const skier = this.skiers[i];
            const scoreText = `Score: ${skier.score}`;
            if (this.skierHud[i].innerHTML !== scoreText) {
                this.skierHud[i].innerHTML = scoreText;
            }
        }
    
        // Update Speed and Charge HUD
        const currentSpeed = this.skier.getCurrentSpeed() || 0;
        const speedKmH = Math.round(currentSpeed * 3.6);
    
        if (this.lastSpeedKmH !== speedKmH) {
            this.lastSpeedKmH = speedKmH;
            this.speedText.innerHTML = `${speedKmH} km/h`;
    
            const clampedSpeed = Math.min(speedKmH, 300);
            const angle = (clampedSpeed / 300) * 270 - 135;
            this.speedNeedle.style.transform = `rotate(${angle}deg)`;
        }
    
        const chargingPercentage = Math.min(50, 10 * this.skier.timeCharging);
        this.updateChargeBar(chargingPercentage);
    
        // Multi-view rendering
        const width = window.innerWidth;
        const height = window.innerHeight;
    
        const cols = Math.ceil(Math.sqrt(this.skiers.length));
        const rows = Math.ceil(this.skiers.length / cols);
        const viewWidth = width / cols;
        const viewHeight = height / rows;
    
        this.renderer.setScissorTest(true);
    
        for (let i = 0; i < this.skiers.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const left = col * viewWidth;
            const top = row * viewHeight;
    
            this.renderer.setViewport(left, top, viewWidth, viewHeight);
            this.renderer.setScissor(left, top, viewWidth, viewHeight);
    
            this.fog.update(this.skiers[i], this.sun.mesh);
            //console.log("cameras", this.allCameras);
            //console.log("curCamera", this.skiers[i].curCamera);
            this.renderer.render(this.sceneGraph, this.skiers[i].getCamera());
        }
    
        this.renderer.setScissorTest(false);
    }

    tutorial() {
        if (this.numberPlayers == 1) {
            const tutorialText = document.createElement("div");
            tutorialText.id = "tutorialText";
            tutorialText.style.position = "absolute";
            tutorialText.style.top = "50%";
            tutorialText.style.left = "50%";
            tutorialText.style.transform = "translate(-50%, -50%)";
            tutorialText.style.color = "white";
            tutorialText.style.background = "rgba(0,0,0,0.7)";
            tutorialText.style.padding = "5px";
            tutorialText.style.fontFamily = "Arial";
            tutorialText.style.fontSize = "24px";
            tutorialText.style.zIndex = "1000";
            if (this.skiers[0].mesh.position.z > 0 && this.skiers[0].mesh.position.z < 100) {
                // show tutorial text
                tutorialText.innerHTML = "Use WASD to move and Space to charge!";
                document.body.appendChild(tutorialText);
            }
            else if (this.skiers[0].mesh.position.z > 100 && this.skiers[0].mesh.position.z < 200) {
                // show tutorial text
                tutorialText.innerHTML = "Pass on the right of the blue gates and on the left of the red gates to earn points!";
                document.body.appendChild(tutorialText);
            }
            else {
                const tutorialText = document.getElementById("tutorialText");
                if (tutorialText) {
                    tutorialText.remove();
                }
            }
        }
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
              this.tutorial();
              this._Step(t - this._previousRAF);
              this._previousRAF = t;
              this._RAF();
        });
    }
}