import * as THREE from 'three';
import * as keycodes from '../keys.js'
import Character_Ski from '../models/Character.js';
import Mountain from '../models/Mountain.js';
import ThirdPersonCamera from '../cameras/ThirdPersonCamera.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Fog } from './Fog.js';
import Sun from '../models/Sun.js';
import FirstPersonCamera from '../cameras/FirstPersonCamera.js';
import { D } from '../keys.js';


//"FREE - SkyBox Mountain View" (https://skfb.ly/oJrZI) by Paul is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

const SLALOM = 1;
const RACE = 2;
const CHECKPOINTS = 3;
const ENDURANCE = 4;


const TIME_LIMIT = 300 * 1000; // 30 seconds in milliseconds

export default class GameWorld {
    

    constructor({numberPlayers = 1, controls = [["w", "a", "s", "d", "space", "c"]], mode = SLALOM, bgMusic = null} = {}) {
        this.mode = mode;
        if (bgMusic != null) {
            console.log("bgMusic", bgMusic);
            bgMusic.play();
        }
        this.htmlElement = document.querySelector("#MainScene");
        this.previousRAF = null;
        this.start = Date.now();
        this.numberPlayers = numberPlayers;
        this.gameOver = false;
        this.timeLeft = TIME_LIMIT;
        this.controls = controls;
        this._Initialize();
        this.lowPowerMode = false;
        this._frameTimes = [];
        this._lowPowerThreshold = 20; // ms = ~50 FPS
        this._frameCheckInterval = 1000; // check every 1s
        this._lastFrameCheck = performance.now();
        this.losingTick = Date.now();

        if (numberPlayers > 1) {
            this.mode = RACE;
        }
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
        this.timerDisplay.style.top = "10vh";
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

        this.htmlElement.appendChild(this.timerDisplay);
        


        this.skierHud = [];
        const cols = Math.ceil(Math.sqrt(this.numberPlayers));
        const rows = Math.ceil(this.numberPlayers / cols);
        const viewWidth = window.innerWidth / cols;
        const viewHeight = window.innerHeight / rows;

        for (let i = 0; i < this.numberPlayers; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const left = col * viewWidth;  // wider to fit content
            const top = row * viewHeight;

            // Main container for each skier HUD
            const skierHud = document.createElement("div");
            skierHud.style.position = "absolute";
            skierHud.style.left = `${left}px`;
            skierHud.style.top = `${top}px`;
            skierHud.style.color = "#d1f0ff"; // icy light blue
            skierHud.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            skierHud.style.fontSize = "14px";
            skierHud.style.width = `${viewWidth}px`; // Adjust width to fit content
            skierHud.style.height = `${viewHeight}px`; // Fixed height for consistency
            skierHud.style.borderRadius = "100%";
            skierHud.style.userSelect = "none";
            skierHud.style.textAlign = "center";
            skierHud.style.zIndex = "1000"; // Ensure it appears above other elements

            // Score text
            const scoreText = document.createElement("div");
            scoreText.textContent = "Score: 0";
            scoreText.style.position = "relative";
            scoreText.style.top = "10px";
            scoreText.style.fontSize = "32px";
            scoreText.style.marginBottom = "12px";
            scoreText.style.fontWeight = "600";
            scoreText.style.letterSpacing = "0.04em";
            scoreText.style.textShadow = "0 0 4px #66ccff";
            skierHud.appendChild(scoreText);

            // Speedometer container
            const speedometerDisplay = document.createElement("div");
            speedometerDisplay.style.position = "absolute";
            speedometerDisplay.style.bottom = "0";
            speedometerDisplay.style.right = "10px";
            speedometerDisplay.style.width = "110px";
            speedometerDisplay.style.height = "110px";
            speedometerDisplay.style.borderRadius = "50%";
            speedometerDisplay.style.background = "radial-gradient(circle at center, #2c9be8 0%, #06467c 90%)";
            speedometerDisplay.style.border = "3px solid #88d9ff";
            speedometerDisplay.style.boxShadow = "0 0 14px #39aaff";
            speedometerDisplay.style.margin = "0 auto 14px auto";
            speedometerDisplay.style.overflow = "visible";

            // Needle
            const speedNeedle = document.createElement("div");
            speedNeedle.style.width = "4px";
            speedNeedle.style.height = "50px";
            speedNeedle.style.background = "#ff4e42"; // bright red for contrast
            speedNeedle.style.position = "absolute";
            speedNeedle.style.bottom = "50%";
            speedNeedle.style.left = "50%";
            speedNeedle.style.transformOrigin = "bottom center";
            speedNeedle.style.transform = "rotate(0deg)";
            speedNeedle.style.borderRadius = "2px";
            speedNeedle.style.boxShadow = "0 0 6px #ff6659";
            speedometerDisplay.appendChild(speedNeedle);

            // Center dot
            const speedCenter = document.createElement("div");
            speedCenter.style.width = "10px";
            speedCenter.style.height = "10px";
            speedCenter.style.background = "#001f3f"; // dark navy
            speedCenter.style.border = "2.5px solid #88d9ff";
            speedCenter.style.borderRadius = "50%";
            speedCenter.style.position = "absolute";
            speedCenter.style.left = "calc(50% - 5px)";
            speedCenter.style.bottom = "calc(50% - 5px)";
            speedometerDisplay.appendChild(speedCenter);

            // Numeric readout
            const speedText = document.createElement("div");
            speedText.style.position = "absolute";
            speedText.style.bottom = "12px";
            speedText.style.left = "50%";
            speedText.style.transform = "translateX(-50%)";
            speedText.style.color = "#cceeff";
            speedText.style.fontSize = "13px";
            speedText.style.fontWeight = "700";
            speedText.style.textShadow = "0 0 6px #39aaff";
            speedText.innerHTML = "0 km/h";
            speedometerDisplay.appendChild(speedText);

            // Ticks
            for (let j = 0; j <= 10; j++) {
                const tick = document.createElement("div");
                tick.style.position = "absolute";
                tick.style.width = "2px";
                tick.style.height = "8px";
                tick.style.background = "#99d6ff";
                const angle = (j / 10) * 270 - 135;
                tick.style.transform = `rotate(${angle}deg) translateY(-50px)`;
                tick.style.transformOrigin = "center bottom";
                tick.style.left = "50%";
                tick.style.bottom = "50%";
                tick.style.borderRadius = "1px";
                tick.style.boxShadow = "0 0 3px #66bbff";
                speedometerDisplay.appendChild(tick);
            }

            skierHud.appendChild(speedometerDisplay);

            // Charge bar container
            const chargeBarContainer = document.createElement("div");
            chargeBarContainer.style.position = "absolute";
            chargeBarContainer.style.bottom = "20px";
            chargeBarContainer.style.right = "140px";
            chargeBarContainer.style.width = "18px";
            chargeBarContainer.style.height = "90px";
            chargeBarContainer.style.background = "rgba(255, 255, 255, 0.15)";
            chargeBarContainer.style.border = "2px solid #88d9ff";
            chargeBarContainer.style.borderRadius = "10px";
            chargeBarContainer.style.overflow = "hidden";
            chargeBarContainer.style.margin = "0 auto";
            chargeBarContainer.style.boxShadow = "0 0 10px #66bbff inset";

            // Inner fill bar
            const chargeBar = document.createElement("div");
            chargeBar.style.width = "100%";
            chargeBar.style.height = "0%";  // start at 0%
            chargeBar.style.background = "linear-gradient(180deg, #00ff99, #007733)";
            chargeBar.style.transition = "height 0.15s ease";
            chargeBar.style.borderRadius = "8px 8px 0 0";

            chargeBarContainer.appendChild(chargeBar);
            skierHud.appendChild(chargeBarContainer);

            this.htmlElement.appendChild(skierHud);

            // Save references for updates
            this.skierHud.push({
                container: skierHud,
                scoreText,
                speedNeedle,
                speedText,
                chargeBarContainer,
                chargeBar,
            });
        }

        
        this.htmlElement.appendChild(this.fpsDisplay);


        this._addObjects();
        this._RAF();

        //event listeners
        window.addEventListener('resize', () => this._onWindowResize());


    }

    updateChargeBar = (chargeBar, chargeBarContainer, chargeLevel) => {
        const clamped = Math.min(1, Math.max(0, chargeLevel / 50));
        chargeBar.style.height = `${clamped * 100}%`;
    
        // Optional: glow or color change
        if (clamped >= 1) {
            chargeBarContainer.style.border = "2px solid red";
            chargeBarContainer.style.animation = "pulse 1s infinite";
            chargeBarContainer.style.boxShadow = "0 0 15px red"; // 🔥 glow effect
        
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
            chargeBarContainer.style.border = "2px solid lime";
            chargeBarContainer.style.animation = "none";
            chargeBarContainer.style.boxShadow = "none";
            chargeBar.style.animation = "none";
        }
        
    
        // Optional: gradient or dynamic color
        const red = Math.floor(255 * clamped);
        const green = Math.floor(255 * (1 - clamped));
        chargeBar.style.background = `rgb(${red}, ${green}, 0)`;
    };
    



    _addObjects() {
        //mountain
        console.log("mode", this.mode);
        const mountain = new Mountain({mode: this.mode});
        this.sceneGraph.add(mountain.mesh);
        this.floor.push(mountain);

        //2nd mountain
        const mountain2 = new Mountain({mode: this.mode, previousMountain: mountain});
        const angle = mountain.mesh.rotation.x;
        mountain2.mesh.position.z = mountain.mesh.position.z - mountain.size * Math.sin(angle);
        mountain2.mesh.position.y = mountain.mesh.position.y - mountain.size * Math.cos(angle);
        this.sceneGraph.add(mountain2.mesh);
        this.floor.push(mountain2);

        //skier
        this.skiers = [];
        for (let i = 0; i < this.numberPlayers; i++) {
            console.log("controls", this.controls[i]);
            const skier = new Character_Ski([mountain.mesh, mountain2.mesh], "Skier " + (i + 1), this.controls[i]);
            
            skier.mesh.position.y = 50;
            skier.mesh.position.x = -10 + i * 5;
            skier.mesh.scale.set(0.1, 0.1, 0.1);
            this.sceneGraph.add(skier.mesh);
            this.skiers.push(skier);
            this.animatedObjects.push(skier);
        }

        this.skier = this.skiers[0];




    }


    _onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    checkGameOver() {
        if (this.timeLeft > 0) return;
        if (this.numberPlayers == 2) {
            const skier1 = this.skiers[0];
            const skier2 = this.skiers[1];
            if (Math.abs(skier1.mesh.position.z - skier2.mesh.position.z) > 1200) {
                if (Date.now() - this.losingTick > 10000) {
                    this._gameOver(`Skier ${skier1.mesh.position.z > skier2.mesh.position.z ? 1 : 2} wins!`);
                }
            }
            else {
                this.losingTick = Date.now();
            }
        }
        else if (this.numberPlayers == 1) {
            this._gameOver("Time's up!");
        }
    }

    _gameOver(message = "Game Over") {
        this.gameOver = true;
        const audio = document.getElementById('bgMusic'); // or wherever your audio element is
        audio.pause();
        audio.currentTime = 0;  // reset to start if you want
        // Create blur effect on the renderer's DOM element (assuming this.renderer.domElement)
        this.renderer.domElement.style.filter = "blur(8px)";
        this.renderer.domElement.style.transition = "filter 0.5s ease";
    
        // Create overlay container
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = 9999;
        overlay.style.color = "white";
        overlay.style.fontFamily = "Arial, sans-serif";
        overlay.style.fontSize = "3rem";
        overlay.style.textAlign = "center";

        // Stats container
        const statsContainer = document.createElement("div");
        statsContainer.style.margin = "2rem 0";
        statsContainer.style.fontSize = "1.5rem";
        statsContainer.style.width = "80%";
        statsContainer.style.maxWidth = "600px";
        statsContainer.style.textAlign = "left";
        statsContainer.style.backgroundColor = "rgba(0,0,0,0.6)";
        statsContainer.style.padding = "1rem 2rem";
        statsContainer.style.borderRadius = "10px";

        // For each skier, add stats block
        this.skiers.forEach((skier, idx) => {
            const avgSpeed = skier._averageSpeed.toFixed(2) || "0.00"; // Average speed example

            // Score example — assuming skier.score exists
            const score = skier.score !== undefined ? skier.score : "0";

            // Create skier stats block
            const skierStats = document.createElement("div");
            skierStats.style.marginBottom = "1rem";
            skierStats.innerHTML = `
                <strong>P${idx + 1}</strong><br/>
                Average Speed: ${avgSpeed} km/h<br/>
                Score: ${score}
            `;

            statsContainer.appendChild(skierStats);
        });

        overlay.appendChild(statsContainer);

    
        // Add message
        const messageEl = document.createElement("div");
        messageEl.textContent = message;
        messageEl.style.marginBottom = "2rem";
        overlay.appendChild(messageEl);
    
        // Buttons container
        const buttons = document.createElement("div");
        buttons.style.display = "flex";
        buttons.style.gap = "1rem";
    
        // Main Menu button
        const mainMenuBtn = document.createElement("button");
        mainMenuBtn.textContent = "Main Menu";
        mainMenuBtn.style.padding = "1rem 2rem";
        mainMenuBtn.style.fontSize = "1.5rem";
        mainMenuBtn.style.cursor = "pointer";
        mainMenuBtn.style.border = "none";
        mainMenuBtn.style.borderRadius = "8px";
        mainMenuBtn.style.backgroundColor = "#0055ff";
        mainMenuBtn.style.color = "white";
    
        mainMenuBtn.onclick = () => {
            // Remove overlay and blur
            window.location.href = "/index.html";
        };
    
        // Restart button
        const restartBtn = document.createElement("button");
        restartBtn.textContent = "Restart";
        restartBtn.style.padding = "1rem 2rem";
        restartBtn.style.fontSize = "1.5rem";
        restartBtn.style.cursor = "pointer";
        restartBtn.style.border = "none";
        restartBtn.style.borderRadius = "8px";
        restartBtn.style.backgroundColor = "#00aa00";
        restartBtn.style.color = "white";
    
        restartBtn.onclick = () => {
            console.log("Restarting game...");
            // Remove overlay and blur
            this.clearObjectChildren();
            const newSceneInstance = new GameWorld({numberPlayers: this.numberPlayers, controls: this.controls});
            Object.assign(this, newSceneInstance);
        };
    
        buttons.appendChild(mainMenuBtn);
        buttons.appendChild(restartBtn);
        overlay.appendChild(buttons);
    
        // Add overlay to document body
        this.htmlElement.appendChild(overlay);
    }

    clearObjectChildren() {
        while (this.htmlElement.firstChild) {
            this.htmlElement.removeChild(this.htmlElement.firstChild);
        }
    }
    
    
    render() {
        const now = Date.now();
        this.checkGameOver();
        // Update score if enough time has passed
        if (now - this.skier.lastScoreUpdate > 200) {
            this.skier.lastScoreUpdate = now;
            
            for (const skier of this.skiers) {
                if (this.numberPlayers > 1) {
                    skier.score = Math.floor(skier.mesh.position.z);
                } 
                const skierZ = skier.mesh.position.z;
    
                for (const floor of this.floor) {
                    const cosRotX = Math.cos(-floor.mesh.rotation.x); // Cache this
                    const floorZ = floor.mesh.position.z + floor.size * cosRotX / 2;
    
                    if (skierZ < floorZ) {
                        const pass_gate = floor.checkSkierScore(skier);
                        console.log("pass_gate", pass_gate);
                        if (pass_gate !== 0) {
                            //console.log("pass_gate", pass_gate);
                            if (pass_gate === -1) this.timeLeft -= 3000;
                            if (pass_gate === 1) this.timeLeft += 1000;
                        }
                        break;
                    }
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
        for (let i = 0; i < this.numberPlayers; i++) {
            const hud = this.skierHud[i];
            const skier = this.skiers[i]; // assuming you keep skier references here
        
            // Update score
            hud.scoreText.textContent = `Score: ${skier.score}`;
        
            // Update speed needle rotation (e.g. max speed 40 m/s maps to 270 degrees)
            const speed = skier.getCurrentSpeed();
            const clampedSpeed = Math.min(speed, 300);
            const angle = (clampedSpeed / 300) * 270 - 135;
            hud.speedNeedle.style.transform = `rotate(${angle}deg)`;
            hud.speedText.textContent = `${Math.round(speed)} km/h`; // convert to km/h
        
            // Update charge bar height (0-1 range)
            hud.chargeBar.style.height = `${skier.charge * 100}%`;
            const chargingPercentage = Math.min(50, 10 * skier.timeCharging);
            this.updateChargeBar(hud.chargeBar, hud.chargeBarContainer, chargingPercentage);
        }

        // Insert vertical bar on the middle of the screen to show the distance between skiers only if there is more than one skier
        const MAX_DISTANCE = 1200; // You can tweak this value
        const screenHeight = window.innerHeight;
        const barHeight = 300; // Max height of the bar in px when distance is at MAX_DISTANCE

        if (this.skiers.length > 1) {
            const skier1 = this.skiers[0];
            const skier2 = this.skiers[1];
            const z1 = skier1.mesh.position.z;
            const z2 = skier2.mesh.position.z;

            const skierDistance = Math.abs(z1 - z2);
            const normalizedDistance = Math.min(skierDistance / MAX_DISTANCE, 1);

            // Create or get container
            let distanceContainer = document.getElementById("distanceContainer");
            if (!distanceContainer) {
                distanceContainer = document.createElement("div");
                distanceContainer.id = "distanceContainer";
                distanceContainer.style.position = "absolute";
                distanceContainer.style.top = "50%";
                distanceContainer.style.left = "50%";
                distanceContainer.style.transform = "translate(-50%, -50%)";
                distanceContainer.style.display = "flex";
                distanceContainer.style.flexDirection = "column";
                distanceContainer.style.alignItems = "center";
                distanceContainer.style.pointerEvents = "none";
                distanceContainer.style.zIndex = "1000";
                this.htmlElement.appendChild(distanceContainer);
            }

            // Create or get player icons
            const getOrCreateLabel = (id, label) => {
                let el = document.getElementById(id);
                if (!el) {
                    el = document.createElement("div");
                    el.id = id;
                    el.textContent = label;
                    el.style.color = "black";
                    el.style.fontWeight = "bold";
                    el.style.fontSize = "20px";
                    el.style.margin = "5px";
                    el.style.transition = "all 0.2s";
                    distanceContainer.appendChild(el);
                }
                return el;
            };

            const label1 = getOrCreateLabel("skierLabel1", "P1");
            const label2 = getOrCreateLabel("skierLabel2", "P2");

            // Determine which skier is ahead
            const skier1IsAhead = z1 > z2;
            const topLabel = skier1IsAhead ? label1 : label2;
            const bottomLabel = skier1IsAhead ? label2 : label1;

            // Set label order and spacing
            distanceContainer.innerHTML = ""; // Clear previous
            distanceContainer.appendChild(topLabel);

            // Create or get bar
            let distanceBar = document.getElementById("distanceBar");
            if (!distanceBar) {
                distanceBar = document.createElement("div");
                distanceBar.id = "distanceBar";
                distanceBar.style.width = "4px";
                distanceBar.style.backgroundColor = "red";
                distanceBar.style.transition = "height 0.1s";
                distanceContainer.appendChild(distanceBar);
            }

            // Adjust bar height based on normalized distance
            const actualHeight = normalizedDistance * barHeight;
            distanceBar.style.height = `${actualHeight}px`;

            // Flash red when distance exceeds threshold
            if (skierDistance >= MAX_DISTANCE) {
                distanceBar.style.backgroundColor = "orange";
                distanceBar.style.boxShadow = "0 0 10px 5px orange";
            } else {
                distanceBar.style.backgroundColor = "red";
                distanceBar.style.boxShadow = "none";
            }

            distanceContainer.appendChild(bottomLabel);
        } else {
            const container = document.getElementById("distanceContainer");
            if (container) container.remove();
        }



    
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

        const keyCodeToKey = (keyCode) => {
            return keycodes.codeToKey[keyCode] || keyCode;
        }

        if (this.numberPlayers === 1) {
            let tutorialBox = document.getElementById("tutorialBox");
    
            if (!tutorialBox) {
                tutorialBox = document.createElement("div");
                tutorialBox.id = "tutorialBox";
                tutorialBox.style.position = "absolute";
                tutorialBox.style.top = "70%";
                tutorialBox.style.left = "50%";
                tutorialBox.style.transform = "translate(-50%, -50%)";
                tutorialBox.style.background = "rgba(0,0,0,0.8)";
                tutorialBox.style.color = "white";
                tutorialBox.style.padding = "15px";
                tutorialBox.style.borderRadius = "12px";
                tutorialBox.style.fontFamily = "Arial";
                tutorialBox.style.fontSize = "20px";
                tutorialBox.style.zIndex = "1000";
                tutorialBox.style.display = "flex";
                tutorialBox.style.alignItems = "center";
                tutorialBox.style.gap = "10px";
                tutorialBox.style.maxWidth = "600px";
                tutorialBox.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    
                const skierImg = document.createElement("img");
                skierImg.src = "src/assets/download.jpeg"; // Make sure this path is correct
                skierImg.alt = "Skier";
                skierImg.style.width = "60px";
                skierImg.style.height = "60px";
                skierImg.style.borderRadius = "50%";
                skierImg.style.border = "2px solid white";
                skierImg.style.flexShrink = "0";
                skierImg.id = "skierPortrait";
    
                const textDiv = document.createElement("div");
                textDiv.id = "tutorialText";
                textDiv.style.lineHeight = "1.4";
    
                tutorialBox.appendChild(skierImg);
                tutorialBox.appendChild(textDiv);
                this.htmlElement.appendChild(tutorialBox);
            }
    
            const tutorialText = document.getElementById("tutorialText");
            const z = this.skiers[0].mesh.position.z;
            const keys = this.skiers[0].keyButtons;
            const movementKeys = keys.slice(0, 4).map(keyCodeToKey).join(", ");
            const jumpKey = keyCodeToKey(keys[4]);
            const cameraKey = keyCodeToKey(keys[5]);
            if (Date.now() - this.start < 3000) {
                tutorialText.innerHTML = "I'm so nervous, this is my first time skiing! I think I remember some tips from my coach.";
            }

            else if (Date.now() - this.start > 4000 && Date.now() - this.start < 10000) {


            tutorialText.innerHTML =
                    `My coach told me I can move using the <b>${movementKeys}</b> keys and jump with <b>${jumpKey}</b>.`;
            } else if (Date.now() - this.start > 11000 && Date.now() - this.start < 16000) {
                tutorialText.innerHTML = "I remember that in order to score points, I need to pass through the left of the red gates and the right of the blue gates. Weird how they are color-coded like that.";
            } else if (Date.now() - this.start > 17000 && Date.now() - this.start < 23000) {
                tutorialText.innerHTML = "I can also charge my jump by holding the jump key. The longer I hold it, the higher I can jump!";
            } else if (Date.now() - this.start > 24000 && Date.now() - this.start < 32000) {
                tutorialText.innerHTML = `If I want to change my camera view, I can use the <b>${cameraKey}</b> key. I think I can also use the mouse to look around if I'm in first-person view.`;
            } else if (Date.now() - this.start > 33000 && Date.now() - this.start < 37000) {
                tutorialText.innerHTML = "Alright, let's do this!"
            }

            

            else {
                if (tutorialBox) {
                    tutorialBox.remove();
                }
            }
        }
    }


    
    

    _Step(timeElapsed) {
        const timeElapsedS = Math.min(timeElapsed * 0.001, 0.1); // max 100ms step (10 fps worst case)
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
            for (let i = 0; i < 2; i++) {
                console.log(this.mode);
                //console.log("rocks", lastFloor.rocks);
                const newFloor = new Mountain({
                    size: lastFloor.size,
                    steepness: lastFloor.steepness,
                    rocks: Math.max(0, lastFloor.rocks + 15 * (Math.random() - 0.5)),
                    previousMountain: lastFloor,  // 👈 Pass the previous mountain
                    mode: this.mode,
                });
                  
                newFloor.mesh.position.z = lastFloor.mesh.position.z - lastFloor.size * Math.sin(angle);
                newFloor.mesh.position.y = lastFloor.mesh.position.y - lastFloor.size * Math.cos(angle);
                this.sceneGraph.add(newFloor.mesh);
                for (let idx = 0; idx < this.skiers.length; idx++) {
                    this.skiers[idx]._updateSurface(newFloor.mesh);
                }
                this.floor.push(newFloor);
                lastFloor = this.floor[this.floor.length - 1];
            }
            if (this.floor.length > 10) {
                this.sceneGraph.remove(this.floor.shift().mesh);
            }
        }


    }


    _RAF() {
        if (!this.gameOver) {
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
}