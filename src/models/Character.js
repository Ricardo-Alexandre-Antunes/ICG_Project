import * as THREE from "three";
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import * as keyCodes from '../keys.js';
import FirstPersonCamera from '../cameras/FirstPersonCamera.js';
import ThirdPersonCamera from "../cameras/ThirdPersonCamera.js";

const ACCELERATE = 0;
const DECELERATE = 2;
const TURN_LEFT = 1;
const TURN_RIGHT = 3;
const JUMP = 4;
const SWITCH_CAMERA = 5;

export default class Character_Ski {
    constructor(surface, name="Skier", controls=[keyCodes.W, keyCodes.A, keyCodes.S, keyCodes.D, keyCodes.SPACE, keyCodes.C]) {
        this.start = Date.now();
        this._averageSpeed = 0;
        this._totalTime = 0;
        this.createMesh(name);
        const document = window.document;
        //keys
        this.keyButtons = controls;
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        // cameras
        this.thirdPerson = true;

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
        const params = 
        {
            camera: camera,
            target: this.mesh
        };
        this.thirdPersonCamera = new ThirdPersonCamera(params);
        const camera2 = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 8, 5500);
        this.firstPersonCamera = new FirstPersonCamera(camera2, this.attachCamera(camera2));
        this.curCamera = this.thirdPersonCamera;



        this.thirdPerson = true;
        this.surface = surface;
        this._decceleration = new THREE.Vector3(-0.105, 3, -0.06);
        this._acceleration = new THREE.Vector3(0, 0, 0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this.counter = 0;
        this.onGround = false;
        this.score = 0;
        this.gravity = new THREE.Vector3(0, -24, 0);
        this.sideVelocity = 0;    // smooth horizontal (x-axis) velocity
        this.turningRight = false;
        this.turningLeft = false;
        this.turningRightTime = 0; // time spent turning right
        this.turningLeftTime = 0;  // time spent turning left
        this.timeOnAir = 0; // time spent in the air
        this.curGround = null;
        this.timeCharging = 0;
        this.rotationPower = 1;

        this.lastScoreUpdate = Date.now();


        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.snowParticles = [];
        this._InitSnowParticles();


        document.addEventListener("keydown", (event) => {
            this.onkeydown(event);
        });

        document.addEventListener("keyup", (event) => {
            this.onkeyup(event);
        });
        
    }

    switchCamera() {
        if (this.thirdPerson) {
            //console.log("switch to first person");
            this.curCamera = this.firstPersonCamera;
            this.thirdPerson = false;
        }
        else {
            //console.log("switch to third person");
            this.curCamera = this.thirdPersonCamera;
            const head = this.mesh.children[0].children[1];
            head.rotateOnAxis(new THREE.Vector3(0, 0, 0), Math.PI);
            this.thirdPersonCamera.resetPosition();
            this.thirdPerson = true;
        }
    }

    getCamera() {
        return this.curCamera._camera;
    }

    _InitSnowParticles() {
        const particleCount = 100;
    
        // Use a larger sphere and a bright color like white or light blue
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,              // bright white
            transparent: true,
            opacity: 0.8,
        });
    
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.visible = false;
            particle.life = 0;
            particle.scale.set(7, 7, 7); // make the particles larger
            this.mesh.add(particle); // attach to skier mesh
            this.snowParticles.push(particle);
        }
    }
    

    _EmitSnowParticles() {
        const forward = this._velocity.clone().normalize().multiplyScalar(2);
        const origin = new THREE.Vector3(0, -3, 0).sub(forward);
        origin.y -= 6.5;
        origin.z -= 3.3;
        for (let i = 0; i < this.snowParticles.length; i++) {
            const p = this.snowParticles[i];
            if (!p.visible) {
                p.position.copy(origin);
                p.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 1,
                    Math.random() * 1.2,
                    (Math.random() - 1.5) * this._velocity.lengthSq() / 1000
                );
                p.life = 0.5;
                p.material.opacity = this._velocity.lengthSq() / 1000;
                p.visible = true;
                break;
            }
        }
    }

    _UpdateSnowParticles(deltaTime) {
        for (let p of this.snowParticles) {
            if (p.visible) {
                p.life -= deltaTime;
                if (p.life <= 0) {
                    p.visible = false;
                    continue;
                }
                p.position.add(p.velocity.clone().multiplyScalar(deltaTime * 60));
                p.velocity.multiplyScalar(0.95);
            }
        }
    }

    _updateSurface(surface) {
        this.surface.push(surface);
    }

    onkeydown(event) {
        switch (event.keyCode) {
            // w key
            case this.keyButtons[ACCELERATE]:
                this.keys.forward = true;
                break;
            // a key
            case this.keyButtons[TURN_LEFT]:
                this.keys.left = true;
                break;
            // d key
            case this.keyButtons[TURN_RIGHT]:
                this.keys.right = true;
                break;
            // s key
            case this.keyButtons[DECELERATE]:
                this.keys.backward = true;
                break;
            // space key
            case this.keyButtons[JUMP]:
                this.keys.space = true;
                break;
            case this.keyButtons[SWITCH_CAMERA]:
                this.switchCamera();
                break;
            default:
                break;
        }
    }

    onkeyup(event) {
        switch (event.keyCode) {
            // w key
            case this.keyButtons[ACCELERATE]:
                this.keys.forward = false;
                break;
            // a key
            case this.keyButtons[TURN_LEFT]:
                this.keys.left = false;
                break;
            // d key
            case this.keyButtons[TURN_RIGHT]:
                this.keys.right = false;
                break;
            // s key
            case this.keyButtons[DECELERATE]:
                this.keys.backward = false;
                break;
            // space key
            case this.keyButtons[JUMP]:
                this.keys.space = false;
                break;
            default:
                break;
        }
    }

    getCurrentSpeed() {
        // the current speed cannot be measured simply by the velocity, instead the direction in which the skier is facing (should directly impact the speec)
        // the speed is the length of the velocity vector projected onto the direction the skier is facing
        if (this.curGround == null) {
            return 0;
        }

        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        forward.normalize();
        const velocity = this._velocity.clone();
        const velocityAlongGround = velocity.clone().sub(this.curGround.face.normal.clone().multiplyScalar(velocity.dot(this.curGround.face.normal)));
        const speed = velocityAlongGround.length();
        return speed * 3.6 / 2;
    }

    getAverageSpeed(timeInSeconds) {
        //console.log("getAverageSpeed", timeInSeconds);
        const currentSpeed = this.getCurrentSpeed();

        // Weighted average formula:
        // newAverage = (oldAverage * oldTime + currentSpeed * deltaTime) / (oldTime + deltaTime)
        //console.log("old average speed", this._averageSpeed);
        //console.log("numerator", this._averageSpeed * this._totalTime);
        this._averageSpeed = (this._averageSpeed * this._totalTime + currentSpeed * timeInSeconds) / (this._totalTime + timeInSeconds);
        //console.log("new average speed", this._averageSpeed);
        this._totalTime += timeInSeconds;
    }

    Update(timeInSeconds) {

        this.curCamera.Update(timeInSeconds);
        //console.log(this.curCamera._camera.position);
        if (isNaN(timeInSeconds)) {
            return;
        }
        this._acceleration.set(0, 0, 0);
        const downVector = new THREE.Vector3(0, -1, 0);
    
        const raycaster = new THREE.Raycaster(this.mesh.position, downVector);
        const intersects = raycaster.intersectObjects(this.surface, true);
    
        this._acceleration.add(this.gravity);
    
        if (this._velocity.lengthSq() > 0) {
            const airResistanceStrength = 10;
            const airResistanceVector = this._velocity.clone().normalize().multiplyScalar(-airResistanceStrength);
            //console.log("gravity", this.gravity);
            //console.log("airResistanceVector", airResistanceVector);
            this._acceleration.add(airResistanceVector);
        }
    
        if (intersects.length > 0) {
            this.curGround = intersects[0];
            this._HandleGroundDetection(intersects[0], timeInSeconds);
        }
    
        this._UpdateSteeringAndMovement(timeInSeconds);
    
        // Apply physics using delta time
        //console.log("acceleration disregard fps", this._acceleration);
        //console.log("acceleration", this._acceleration.clone().multiplyScalar(timeInSeconds));
        //console.log("final accel", this._acceleration.clone().multiplyScalar(timeInSeconds));
        this._velocity.add(this._acceleration.clone().multiplyScalar(timeInSeconds));
        this.mesh.position.add(this._velocity.clone().multiplyScalar(timeInSeconds));
    
        this._UpdateSnowParticles(timeInSeconds);
    
        if (this.onGround && this._velocity.lengthSq() > 0) {
            this._EmitSnowParticles();
        }
        this.getAverageSpeed(timeInSeconds);
    
        // Clamp X position
        if (this.mesh.position.x > 220) this.mesh.position.x = 220;
        if (this.mesh.position.x < -220) this.mesh.position.x = -220;
    }
    
    
    
    
    _HandleGroundDetection(hit, deltaTime) {
        const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        const upVector = new THREE.Vector3(0, 1, 0);
    
        const groundHeight = hit.point.y;
        const skierHeightOffset = 1.5; // adjust for your skier's "foot" height
    
        const currentY = this.mesh.position.y;
        const verticalVelocity = this._velocity.y;
    
        // Consider a small margin of tolerance based on velocity and deltaTime
        const margin = Math.max(0.001, Math.abs(verticalVelocity * deltaTime));
    
        if (currentY <= groundHeight + skierHeightOffset + margin / 2) {
            // Snap above ground
            this.mesh.position.y = groundHeight + skierHeightOffset;
            this.onGround = true;
            this.timeOnAir = 0;
    
            // Project velocity onto the ground plane
            const velocity = this._velocity;
            const normalComponent = worldNormal.clone().multiplyScalar(velocity.dot(worldNormal));
            const tangentialVelocity = velocity.clone().sub(normalComponent);
            this._velocity.copy(tangentialVelocity); // remove vertical bounce (can tweak if desired)
    
            // Add friction (dampen velocity)
            const friction = tangentialVelocity.clone().multiplyScalar(-5 * deltaTime); // stronger if needed
            this._acceleration.add(friction);
    
            // Apply slide force down the slope
            const gravityComponent = worldNormal.clone().multiplyScalar(this.gravity.dot(worldNormal));
            const slideForce = gravityComponent.negate();
            this._acceleration.add(slideForce);
    
            // Push in skier's forward direction projected onto the slope
            //const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
            //const push = forward.clone().sub(worldNormal.clone().multiplyScalar(forward.dot(worldNormal)));
            //this._acceleration.add(push.multiplyScalar(0.4)); // scale as needed
    
            // Optional: tilt the mesh to match terrain slope
            // Align skier to terrain slope without flipping forward direction
            const slopeNormal = worldNormal.clone().normalize();
            const currentForward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);

            // Project forward vector onto slope plane
            const forwardOnSlope = currentForward.clone().sub(
            slopeNormal.clone().multiplyScalar(currentForward.dot(slopeNormal))
            ).normalize();

            // If projection failed (too flat), bail out to avoid NaNs
            if (forwardOnSlope.lengthSq() < 1e-6) return;

            // Rebuild orthonormal basis: right, up, forward
            const right = new THREE.Vector3().crossVectors(slopeNormal, forwardOnSlope).normalize();
            const adjustedForward = new THREE.Vector3().crossVectors(right, slopeNormal).normalize();

            // Create matrix and convert to quaternion
            const basisMatrix = new THREE.Matrix4().makeBasis(right, slopeNormal, adjustedForward);
            const targetQuat = new THREE.Quaternion().setFromRotationMatrix(basisMatrix);

            // Smooth orientation to prevent jitter
            this.mesh.quaternion.slerp(targetQuat, 0.15);



    
        } else {
            // Not on ground
            this.onGround = false;
            this.timeOnAir += deltaTime;
        }
    }
    

    _UpdateSteeringAndMovement(timeInSeconds) {
        const velocity = this._velocity;
        const controlObject = this.mesh;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
    
        if (this.onGround) {
            if (this.keys.space) {
                this.timeCharging = Math.min(this.timeCharging + timeInSeconds * 4, 20);
                this.rotationPower = Math.min(1, this.timeCharging * 10);
                this._acceleration.add(new THREE.Vector3(0, 0, Math.min(-(20 - this.timeCharging), -this._velocity.z) * 0.3));
            }
            if (!this.keys.space && this.timeCharging > 0) {
                //console.log("JUMP!!!!");
                // perform jump
                const accelerationJump = new THREE.Vector3(0, 0.2, 0.2);
                // apply quarterion for skier's up
                accelerationJump.applyQuaternion(controlObject.quaternion);
                const jumpStrength = Math.min(50, 10 * this.timeCharging);
                accelerationJump.multiplyScalar(jumpStrength);
                //console.log(this._acceleration);
                this.mesh.position.add(new THREE.Vector3(0, 0.8, 0));
                this._velocity.add(accelerationJump);
                //console.log(this._acceleration);
                this.timeCharging = 0;
                return;
            }
            if (this.timeCharging == 0) {
                this.rotationPower = 1;
            }
            this._HandleGroundMovement(velocity, _R, _Q, _A);
            controlObject.quaternion.copy(_R);
    
        
    
            // --- Smoothly align velocity to facing direction ---
            // --- Smoothly align velocity to facing direction ---
            const speed = velocity.length();
            if (speed > 0.01) {
                const currentDir = velocity.clone().normalize();
            
                // Get forward direction from skier orientation
                const facingDir = new THREE.Vector3(0, 0, 1).applyQuaternion(controlObject.quaternion).normalize();
            
                // Make direction always "forward-facing"
                if (facingDir.z < 0) {
                    facingDir.negate();
                }
            
                // Step 1: Apply side acceleration input (e.g., from left/right keys)
                // Assuming `inputAxis` is -1 (left), 0 (none), or 1 (right)
                const inputAxis = this._inputAxis || 0; // you should set this externally
                const sideDir = new THREE.Vector3(1, 0, 0).applyQuaternion(controlObject.quaternion).normalize();
                const sideAcceleration = 0.02; // tune this
                const sideAccelVec = sideDir.multiplyScalar(inputAxis * sideAcceleration);
                this._velocity.add(sideAccelVec);
            
                // Step 2: Apply friction based on misalignment with skis
                const updatedDir = this._velocity.clone().normalize();
                const alignment = facingDir.dot(updatedDir); // 1 = perfect alignment, 0 = perpendicular
                const frictionFactor = THREE.MathUtils.clamp(alignment, 0, 1); // lower alignment = more friction
            
                const frictionCoefficient = 0.985; // base friction multiplier
                const misalignmentLoss = 1 - (1 - frictionCoefficient) * (1 - frictionFactor);
                this._velocity.multiplyScalar(misalignmentLoss);
            
                // Step 3: Apply turn blend for smoother movement (optional drift feel)
                const turnBlendFactor = 0.01;
                const blendedDir = updatedDir.lerp(facingDir, turnBlendFactor).normalize();
                const finalSpeed = this._velocity.length();
                this._velocity.copy(blendedDir.multiplyScalar(finalSpeed));
            }

    
        } else {
            this._HandleAirMovement(timeInSeconds);
        }
    }
    
    
    _HandleGroundMovement(velocity, _R, _Q, _A) {
        const worldNormal = this.curGround.face.normal.clone().transformDirection(this.curGround.object.matrixWorld);
        if (this.keys.forward) {
            this.accelerate();
            const velocity = this._velocity.clone();
            const velocityAlongGround = velocity.clone().sub(worldNormal.clone().multiplyScalar(velocity.dot(worldNormal)));
            //console.log("velocityAlongGround", velocityAlongGround);
            //console.log("velocityAlongGroundTrue", velocity);
            if (Math.abs(velocityAlongGround.z) < 10) {
                // Add a push in the forward direction
                const forward = new THREE.Vector3(0, 0, 10);
                forward.applyQuaternion(this.mesh.quaternion);
        
                // Project the input force onto the ground plane
                const pushAlongGround = forward.clone().sub(worldNormal.clone().multiplyScalar(forward.dot(worldNormal)));
                //console.log("pushAlongGround", pushAlongGround);
        
                //console.log("forward projected onto ground", pushAlongGround);
                this._acceleration.add(pushAlongGround);
            } else {
                // Amplify the current acceleration
                //console.log("amplify acceleration");
                //console.log("acceleration", this._acceleration);
                this._acceleration.add(this._acceleration.clone().multiplyScalar(2));
            }
        }
        else {
            this.normalStance();
        }
        
        if (this.keys.backward) {
            const speed = this._velocity.length();
            if (speed > 0.01) {
                const brakeStrength = THREE.MathUtils.clamp(1.5 * speed + 0.5, 0, 20);
                const brake = this._velocity.clone().multiplyScalar(-brakeStrength / speed);
                this._acceleration.add(brake);
            }
        }
        
    
        const MAX_TURN_ANGLE = Math.PI / 2; // 90 degrees

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion).normalize();
        const velocityDir = this._velocity.clone().normalize();
        
        let angleToVelocity = forward.angleTo(velocityDir);
        
        // Use cross product to determine turn direction
        const cross = new THREE.Vector3().crossVectors(forward, velocityDir);
        const sign = Math.sign(cross.y); // +1: velocity is to the left of forward, -1: to the right
        angleToVelocity *= sign; // signed angle between -PI and PI
        
        if (this.keys.left) {
            if (this.turningLeft) {
                if (this.turningLeftTime < 1.0) {
                    this.turningLeftTime += 0.02;
                }
            }
            this.turningRight = false;
            this.turningLeft = true;
            _A.set(0, 1, 0);
            const turnStrength = Math.min(0.05, 100 / this._velocity.lengthSq() + 0.02);
            _Q.setFromAxisAngle(_A, turnStrength);
            _R.multiply(_Q);
        
        } else {
            this.turningLeft = false;
            this.turningLeftTime = Math.max(this.turningLeftTime - 0.02, 0);
        }
        
        if (this.keys.right) {
            if (this.turningRight) {
                if (this.turningRightTime < 1.0) {
                    this.turningRightTime += 0.02;
                }
            }
            this.turningLeft = false;
        
            // Only allow right turn if not already turned too far right
            this.turningRight = true;
            _A.set(0, 1, 0);
            const turnStrength = Math.min(0.05, 100 / this._velocity.lengthSq() + 0.02);
            _Q.setFromAxisAngle(_A, -turnStrength);
            _R.multiply(_Q);
        
        } else {
            this.turningRight = false;
            this.turningRightTime = Math.max(this.turningRightTime - 0.02, 0);
        }
        
    }
    
    
    _HandleAirMovement(timeInSeconds) {
    
        if (this.keys.left) {
            this.mesh.rotation.y += 9 * timeInSeconds * this.rotationPower;
        }
        if (this.keys.right) {
            this.mesh.rotation.y -= 9 * timeInSeconds * this.rotationPower;
        }
        if (this.keys.forward) {
            this.mesh.rotation.x -= 9 * timeInSeconds * this.rotationPower;
        }
        if (this.keys.backward) {
            this.mesh.rotation.x += 9 * timeInSeconds * this.rotationPower;
        }
    }
    



    accelerate() {
        // Skier mesh
        const skierMesh = this.mesh.children[0];
    
        // === LEGS ===
        const rightLeg = skierMesh.children[2];
        const leftLeg = skierMesh.children[3];

    
        // Scale and position updates (not interpolated here — update separately if needed)
        rightLeg.scale.set(1, 0.9, 1);
        leftLeg.scale.set(1, 0.9, 1);
        rightLeg.position.y = -6;
        leftLeg.position.y = -6;

        // === BODY ===
        const body = skierMesh.children[0];

        const bodyRotation = new THREE.Euler(Math.PI / 8, 0, 0);
        const bodyQuat = new THREE.Quaternion().setFromEuler(bodyRotation);
        body.quaternion.slerp(bodyQuat, 0.1);

        body.position.y = -1;
        body.position.z = 1;

        // === HEAD ===
        const head = skierMesh.children[1];
        head.position.y = 6;
        head.position.z = 4;
        const rightPole = this.mesh.children[2];
        const leftPole = this.mesh.children[3];           
        // === ARMS (Hands + Poles) ===
        const targetPoleRotation = new THREE.Euler(Math.PI / 2, 0, 0);
        const targetPoleQuat = new THREE.Quaternion().setFromEuler(targetPoleRotation);

        rightPole.quaternion.slerp(targetPoleQuat, 0.1);
        leftPole.quaternion.slerp(targetPoleQuat, 0.1);

        rightPole.position.y = -3;
        leftPole.position.y = -3;
        rightPole.position.z = -3;
        leftPole.position.z = -3;

    }
    
    
    normalStance() {
        // Reset to normal stance
        // Skier mesh

        const skierMesh = this.mesh.children[0];
        //console.log(skierMesh);
    
        // === LEGS ===
        const rightLeg = skierMesh.children[2];
        const leftLeg = skierMesh.children[3];

    
        // Scale and position updates (not interpolated here — update separately if needed)
        rightLeg.scale.set(1, 1, 1);
        leftLeg.scale.set(1, 1, 1);
        rightLeg.position.y = -6;
        leftLeg.position.y = -6;

        // === BODY ===
        const body = skierMesh.children[0];

        const bodyRotation = new THREE.Euler(0, 0, 0);
        const bodyQuat = new THREE.Quaternion().setFromEuler(bodyRotation);
        body.quaternion.slerp(bodyQuat, 0.1);

        body.position.y = 0;
        body.position.z = 0;

        // === HEAD ===
        const head = skierMesh.children[1];
        head.position.y = 8;
        head.position.z = 0;
    
        // === ARMS (Hands + Poles) ===
        const rightPole = this.mesh.children[2];
        const leftPole = this.mesh.children[3];
    
        const targetPoleRotation = new THREE.Euler(0, 0, 0);
        const targetPoleQuat = new THREE.Quaternion().setFromEuler(targetPoleRotation);
    
        rightPole.quaternion.slerp(targetPoleQuat, 0.1);
        leftPole.quaternion.slerp(targetPoleQuat, 0.1);


        rightPole.position.y = -5;
        leftPole.position.y = -5;
        rightPole.position.z = 0;
        leftPole.position.z = 0;
    }
    
    turnLeft() {
        // Rotate the visual components
        // Body leans left (keep mesh body rotation as is, just rotate visual parts)
        this.mesh.children[0].rotation.z = 0.1;
    
        // Arms lean left
        this.mesh.children[4].rotation.z = 0.3;
        this.mesh.children[5].rotation.z = 0.3;
    
        // Skis rotate left
        this.mesh.children[8].rotation.z = 0.3;
        this.mesh.children[9].rotation.z = 0.3;
    }
    
    turnRight() {
        // Rotate the visual components
        // Body leans right (keep mesh body rotation as is, just rotate visual parts)
        this.mesh.children[0].rotation.z = -0.1;
    
        // Arms lean right
        this.mesh.children[4].rotation.z = -0.3;
        this.mesh.children[5].rotation.z = -0.3;
    
        // Skis rotate right
        this.mesh.children[8].rotation.z = -0.3;
        this.mesh.children[9].rotation.z = -0.3;
    }

    attachCamera(camera) {
        // Attach the camera to the skier's head
        const head = this.mesh.children[0].children[1];
        head.add(camera);
        return head;
    }

    detachCamera(camera) {
        // Detach the camera from the skier's head
        const head = this.mesh.children[0].children[1];
        head.remove(camera);
        return head;
    }

    


    createMesh(name="Skier") {

        // Main skier mesh for position and movement
        this.mesh = new THREE.Group(); // World position & movement
    
        // Visual group that holds the body parts for animation poses
        this.visualGroup = new THREE.Group(); // Holds animated limbs, head, etc.
        this.mesh.add(this.visualGroup); // Add visualGroup to the mesh
    
        // Axes Helper (for debugging)
        this.mesh.add(new THREE.AxesHelper(10));
    
        // Create the body
        const loader = new THREE.TextureLoader();
        const jacketTexture = loader.load("src/assets/jacket.avif");
        jacketTexture.wrapS = THREE.RepeatWrapping;
        jacketTexture.wrapT = THREE.RepeatWrapping;
        jacketTexture.repeat.set(5, 5);
        var bodyGeom = new THREE.CylinderGeometry(3.5, 3, 10, 7, 1);
        var bodyMat = new THREE.MeshPhongMaterial({ map: jacketTexture, flatShading: true });
        var body = new THREE.Mesh(bodyGeom, bodyMat);
        body.name = "body";
        body.position.set(0, 0, 0);
        this.visualGroup.add(body); // Add to visual group
    
        // Create the head
        var headGeom = new THREE.SphereGeometry(3, 32, 32);
        var headMat = new THREE.MeshPhongMaterial({ color: 0xc68642, flatShading: true });
        var head = new THREE.Mesh(headGeom, headMat);
        head.name = "head";
        head.position.set(0, 8, 0);

        // Create a hat (example: a cylinder)
        const hatBrimGeom = new THREE.CylinderGeometry(4, 4, 0.5, 32);
        const hatTopGeom = new THREE.CylinderGeometry(2.5, 2.5, 3, 32);
        const hatMat = new THREE.MeshPhongMaterial({ color: 0x000000 });

        const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
        hatBrim.position.set(0, 1.5, 0);

        const hatTop = new THREE.Mesh(hatTopGeom, hatMat);
        hatTop.position.set(0, 2.5, 0);

        head.add(hatBrim);
        head.add(hatTop);

        this.visualGroup.add(head);
    
        // Create the eyes
        var eyeGeom = new THREE.SphereGeometry(0.5, 32, 32);
        var eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
        var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
        eyeR.position.set(1.7, 0.3, 2.5);
        var eyeL = eyeR.clone();
        eyeL.position.x = -eyeR.position.x;
        eyeR.name = "eyeR";
        eyeL.name = "eyeL";
        head.add(eyeR);
        head.add(eyeL);
    
        // Create the arms
        var armGeom = new THREE.CylinderGeometry(1, 1, 7, 4, 1);
        var armMat = new THREE.MeshPhongMaterial({ map: jacketTexture, flatShading: true });
        var armR = new THREE.Mesh(armGeom, armMat);
        armR.position.set(3.5, 1.5, 0);
        var armL = armR.clone();
        armL.position.x = -armR.position.x;
        armR.name = "armR";
        armL.name = "armL";
        body.add(armR);
        body.add(armL);
    
        // Rotate arms slightly for natural pose
        armR.rotation.z = 0.3;
        armL.rotation.z = -0.3;
    
        // Create the legs
        var legGeom = new THREE.CylinderGeometry(1, 1, 10, 4, 1);
        var legMat = new THREE.MeshPhongMaterial({ map: jacketTexture, flatShading: true });
        var legR = new THREE.Mesh(legGeom, legMat);
        legR.position.set(2, -5, 0);
        var legL = legR.clone();
        legL.position.x = -legR.position.x;
        legR.name = "legR";
        legL.name = "legL";
        this.visualGroup.add(legR);
        this.visualGroup.add(legL);
    
        // Create the skis
        var skiGeom = new THREE.BoxGeometry(2.5, 1, 20);
        var skiMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        var skiR = new THREE.Mesh(skiGeom, skiMat);
        skiR.position.set(2, -10, 0);
        var skiL = skiR.clone();
        skiL.position.x = -skiR.position.x;
        skiR.name = "skiR";
        skiL.name = "skiL";
        this.visualGroup.add(skiR);
        this.visualGroup.add(skiL);
    
        // Create the ski poles
        var poleGroupR = new THREE.Group();
        poleGroupR.position.set(5, -5.1, 0);
        var poleGroupL = new THREE.Group();
        poleGroupL.position.set(-5, -5.1, 0);
    
        var poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 10, 4, 1);
        var poleMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        var pole = new THREE.Mesh(poleGeom, poleMat);
        poleGroupR.add(pole);
        poleGroupL.add(pole.clone());
    
        // Create the ski pole handles
        var handleGeom = new THREE.SphereGeometry(0.5, 32, 32);
        var handleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        var handle = new THREE.Mesh(handleGeom, handleMat);
        handle.position.set(0, -5, 0);
        poleGroupR.add(handle);
        poleGroupL.add(handle.clone());
        poleGroupR.name = "poleR";
        poleGroupL.name = "poleL";
        this.mesh.add(poleGroupR);
        this.mesh.add(poleGroupL);
    
        // Place headband with headlight on head
        var headbandLight = new THREE.Group();
        headbandLight.position.set(0, 1.5, 0);
        headbandLight.rotation.x = Math.PI / 2;
        var headbandGeom = new THREE.TorusGeometry(2.7, 0.5, 16, 100);
        var headbandMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        var headband = new THREE.Mesh(headbandGeom, headbandMat);
        headbandLight.add(headband);
    
        // Create the headlight
        var lightGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.6);
        var lightMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
        var light = new THREE.Mesh(lightGeom, lightMat);
        light.position.set(0, 3, 0);
        headbandLight.add(light);
    
        // Create light source
        var light = new THREE.SpotLight(0xffffff, 10);
        light.decay = 0.8;
        light.customDistanceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        light.distance = 50;
        light.target = new THREE.Object3D();
        light.target.position.set(0, 20, -5);
        light.position.set(0, 3, 0);
    
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        headbandLight.add(light);
        headbandLight.add(light.target);
        headbandLight.name = "headbandLight";
    
        head.add(headbandLight);
        //console.log(this.mesh);

    }
    
}