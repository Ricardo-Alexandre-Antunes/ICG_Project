import * as THREE from "three";

export default class Character_Ski {
    constructor(surface) {
        this.start = Date.now();
        const document = window.document;
        //keys
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        this.surface = surface;
        this._decceleration = new THREE.Vector3(-0.105, 3, -0.06);
        this._acceleration = new THREE.Vector3(0, 0, 0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this.counter = 0;
        this.onGround = false;
        this.score = 0;
        this.gravity = new THREE.Vector3(0, -0.004, 0);
        this.sideVelocity = 0;    // smooth horizontal (x-axis) velocity
        this.turningRight = false;
        this.turningLeft = false;
        this.turningRightTime = 0; // time spent turning right
        this.turningLeftTime = 0;  // time spent turning left
        this.timeOnAir = 0; // time spent in the air
        this.curGround = null;

        this.lastScoreUpdate = Date.now();
        this.createMesh();


        document.addEventListener("keydown", (event) => {
            this.onkeydown(event);
        });

        document.addEventListener("keyup", (event) => {
            this.onkeyup(event);
        });
        
    }

    _updateSurface(surface) {
        this.surface.push(surface);
    }

    onkeydown(event) {
        switch (event.keyCode) {
            // w key
            case 87:
                this.keys.forward = true;
                break;
            // a key
            case 65:
                this.keys.left = true;
                break;
            // d key
            case 68:
                this.keys.right = true;
                break;
            // s key
            case 83:
                this.keys.backward = true;
                break;
        }
    }

    onkeyup(event) {
        switch (event.keyCode) {
            // w key
            case 87:
                this.keys.forward = false;
                break;
            // a key
            case 65:
                this.keys.left = false;
                break;
            // d key
            case 68:
                this.keys.right = false;
                break;
            // s key
            case 83:
                this.keys.backward = false;
                break;
        }
    }

    Update(timeInSeconds) {
        console.log("------------------------")
        this._acceleration.set(0, 0, 0);
        const downVector = new THREE.Vector3(0, -1, 0);
    
        const raycaster = new THREE.Raycaster(this.mesh.position, downVector);
        const intersects = raycaster.intersectObjects(this.surface, true);


        this._acceleration.add(this.gravity);

        // Add air resistance to acceleration in the direction the skier is moving
        if (this._velocity.lengthSq() > 0) {
            const airResistanceStrength = 0.0001; // tweak as needed
            const airResistanceVector = this._velocity.clone().normalize().multiplyScalar(-airResistanceStrength);
            this._acceleration.add(airResistanceVector);
            console.log("airResistance", airResistanceVector);
        }


    
        if (intersects.length > 0) {
            this.curGround = intersects[0];
            this._HandleGroundDetection(intersects[0]);
        }
    
        this._UpdateSteeringAndMovement();
        console.log("final acceleration", this._acceleration);
        this._velocity.add(this._acceleration);
        this.mesh.position.add(this._velocity);

        if (this.mesh.position.x > 100) {
            this.mesh.position.x = 100;
        }
        if (this.mesh.position.x < -100) {
            this.mesh.position.x = -100;
        }
    }
    
    
    
    _HandleGroundDetection(hit) {
        const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        const upVector = new THREE.Vector3(0, 1, 0);
    
        if (this.mesh.position.y <= hit.point.y + 1.7) {
            this.onGround = true;
            // Get velocity relative to the ground
            const relativeVelocity = this._velocity.clone().sub(worldNormal.clone().multiplyScalar(this._velocity.dot(worldNormal)));
            console.log("relativeVelocity", relativeVelocity);
            

            const friction = this._velocity.clone().multiplyScalar(-0.005);
            this._acceleration.add(friction);

            // apply a force in the direction of the ground normal
            // Calculate the acceleration along the ground normal
            const accAlongNormal = worldNormal.clone().multiplyScalar(this._acceleration.dot(worldNormal));

            // Calculate the acceleration that causes sliding (gravity down the slope)
            const slidingForce = accAlongNormal.clone().negate();
            console.log("normalForce", slidingForce);
            this._acceleration.add(slidingForce);
            const velocity = this._velocity.clone();
            const velocityAlongGround = velocity.clone().sub(worldNormal.clone().multiplyScalar(velocity.dot(worldNormal)));
            if (Math.abs(velocityAlongGround.z) < 1) {
                // Add a push in the forward direction
                const forward = new THREE.Vector3(0, 0, 0.002);
                forward.applyQuaternion(this.mesh.quaternion);
        
                // Project the input force onto the ground plane
                const pushAlongGround = forward.clone().sub(worldNormal.clone().multiplyScalar(forward.dot(worldNormal)));
        
                console.log("forward projected onto ground", pushAlongGround);
                this._acceleration.add(pushAlongGround);
            }

            this.mesh.rotation.x = Math.atan2(worldNormal.y, Math.sqrt(worldNormal.x ** 2 + worldNormal.z ** 2));
            this.mesh.rotation.z = 0;
            
            this.mesh.position.y = hit.point.y + 2.7; // Adjust the height of the skier
            
            
        } else {
            this.onGround = false;
            this.timeOnAir += 0.01;
        }
    
    }

    _UpdateSteeringAndMovement() {
        
        const velocity = this._velocity;
        const controlObject = this.mesh;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
    
        if (this.onGround) {
            this._HandleGroundMovement(velocity, _R, _Q, _A);
            controlObject.quaternion.copy(_R);
    
            const forward = new THREE.Vector3(0, 0, 1);
            forward.applyQuaternion(controlObject.quaternion);
            forward.normalize();
        
            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(controlObject.quaternion);
            right.normalize();
        
            forward.multiplyScalar(0);
            right.multiplyScalar(this.sideVelocity);
        
            const moveVector = new THREE.Vector3();
            moveVector.add(forward);
            moveVector.add(right);
            
            
        
            controlObject.position.add(moveVector);
        } else {
            this._HandleAirMovement(velocity, _R, _Q, _A);
        }
        
    
        
    }
    
    _HandleGroundMovement(velocity, _R, _Q, _A) {
        const worldNormal = this.curGround.face.normal.clone().transformDirection(this.curGround.object.matrixWorld);
        if (this.keys.forward) {
            const velocity = this._velocity.clone();
            const velocityAlongGround = velocity.clone().sub(worldNormal.clone().multiplyScalar(velocity.dot(worldNormal)));
            console.log("velocityAlongGround", velocityAlongGround);
            console.log("velocityAlongGroundTrue", velocity);
            if (Math.abs(velocityAlongGround.z) < 0.1) {
                // Add a push in the forward direction
                const forward = new THREE.Vector3(0, 0, 0.001);
                forward.applyQuaternion(this.mesh.quaternion);
        
                // Project the input force onto the ground plane
                const pushAlongGround = forward.clone().sub(worldNormal.clone().multiplyScalar(forward.dot(worldNormal)));
        
                console.log("forward projected onto ground", pushAlongGround);
                this._acceleration.add(pushAlongGround);
            } else {
                // Amplify the current acceleration
                console.log("amplify acceleration");
                console.log("acceleration", this._acceleration);
                this._acceleration.add(this._acceleration.clone().multiplyScalar(2));
            }
        }
        
        if (this.keys.backward) {
            // Subtract a push in the backward direction
            const backward = this._velocity.clone().multiplyScalar(-0.02);
            this._acceleration.add(backward);
            
        }
    
        if (this.keys.left) {
            if (this.turningLeft) {
                if (this.turningLeftTime < 1.0) {
                    this.turningLeftTime += 0.02;
                }
            }
            this.turningRight = false;
            this.turningLeft = true;
            _A.set(0, 1, 0);
            _Q.setFromAxisAngle(_A, 0.05);
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
            this.turningRight = true;
            _A.set(0, 1, 0);
            _Q.setFromAxisAngle(_A, -0.05);
            _R.multiply(_Q);
    
        } else {
            this.turningRight = false;
            this.turningRightTime = Math.max(this.turningRightTime - 0.02, 0);
        }
    }
    
    
    _HandleAirMovement(velocity, _R, _Q, _A) {
    
        if (this.keys.left) {
            this.mesh.rotation.y += 0.05;
        }
        if (this.keys.right) {
            this.mesh.rotation.y -= 0.05;
        }
        if (this.keys.forward) {
            this.mesh.rotation.x -= 0.05;
        }
        if (this.keys.backward) {
            this.mesh.rotation.x += 0.05;
        }
    }
    



    accelerate() {
        // Body leans forward
        this.mesh.rotation.x = -0.1;
        
        // Hands rotate backwards with ski poles
        this.mesh.children[4].rotation.x = 0.3;
        this.mesh.children[5].rotation.x = 0.3;

        // Legs rotate backwards
        this.mesh.children[6].rotation.x = 0.3;
        this.mesh.children[7].rotation.x = 0.3;
    }

    normalStance() {
        // Body upright
        this.mesh.rotation.x = 0;
        
        // Hands rotate forwards
        this.mesh.children[4].rotation.x = 0;
        this.mesh.children[5].rotation.x = 0;

        // Legs rotate forwards
        this.mesh.children[6].rotation.x = 0;
        this.mesh.children[7].rotation.x = 0;
    }

    turnLeft() {
        // Body leans left
        this.mesh.rotation.z = 0.1;

        // Arms lean left
        this.mesh.children[4].rotation.z = 0.3;
        this.mesh.children[5].rotation.z = 0.3;

        // Skis rotate left
        this.mesh.children[8].rotation.z = 0.3;
        this.mesh.children[9].rotation.z = 0.3;
    }

    turnRight() {
        // Body leans right
        this.mesh.rotation.z = -0.1;

        // Arms lean right
        this.mesh.children[4].rotation.z = -0.3;
        this.mesh.children[5].rotation.z = -0.3;

        // Skis rotate right
        this.mesh.children[8].rotation.z = -0.3;
        this.mesh.children[9].rotation.z = -0.3;
    }


    createMesh() {
        this.mesh = new THREE.Mesh();

        //AxesHelper
        this.mesh.add(new THREE.AxesHelper(10));
        

        // Create the body
        var bodyGeom = new THREE.CylinderGeometry(3.5, 3, 10, 4, 1);
        var bodyMat = new THREE.MeshPhongMaterial({ color: 0xff3333, flatShading: true });
        var body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(0, 0, 0);
        this.mesh.add(body);

        // Create the head
        var headGeom = new THREE.SphereGeometry(3, 32, 32);
        var headMat = new THREE.MeshPhongMaterial({ color: 0xff3333, flatShading: true });
        var head = new THREE.Mesh(headGeom, headMat);
        head.position.set(0, 8, 0);
        this.mesh.add(head);

        // Create the eyes
        var eyeGeom = new THREE.SphereGeometry(0.5, 32, 32);
        var eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
        var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
        eyeR.position.set(1.7, 8.3, 2.5);
        var eyeL = eyeR.clone();
        eyeL.position.x = -eyeR.position.x;
        this.mesh.add(eyeR);
        this.mesh.add(eyeL);

        // Create the arms

        // Right arm
        var armR = new THREE.Group();
        var armGeom = new THREE.CylinderGeometry(1, 1, 7, 4, 1);
        var armMat = new THREE.MeshPhongMaterial({ color: 0xff3333, flatShading: true });
        var armR = new THREE.Mesh(armGeom, armMat);
        armR.position.set(3.5, 1.5, 0);
        
        var armL = armR.clone();
        armL.position.x = -armR.position.x;
        this.mesh.add(armR);
        this.mesh.add(armL);

        //Rotate the arms slightly to the outside
        armR.rotation.z = 0.3;
        armL.rotation.z = -0.3;

        // Create the legs
        var legGeom = new THREE.CylinderGeometry(1, 1, 10, 4, 1);
        var legMat = new THREE.MeshPhongMaterial({ color: 0xff3333, flatShading: true });
        var legR = new THREE.Mesh(legGeom, legMat);
        legR.position.set(2
            , -5, 0);
        var legL = legR.clone();
        legL.position.x = -legR.position.x;
        this.mesh.add(legR);
        this.mesh.add(legL);

        // Create the skis
        var skiGeom = new THREE.BoxGeometry(2.5, 1, 20);
        var skiMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        var skiR = new THREE.Mesh(skiGeom, skiMat);
        skiR.position.set(2, -10, 0);
        var skiL = skiR.clone();
        skiL.position.x = -skiR.position.x;
        this.mesh.add(skiR);
        this.mesh.add(skiL);

        // Create the ski poles
        // Ski pole group
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

        this.mesh.add(poleGroupR);
        this.mesh.add(poleGroupL);

        //Place headband with headlight on head
        var headbandLight = new THREE.Group();
        headbandLight.position.set(0, 9.5, 0);
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



        var light = new THREE.SpotLight(0xffffff, 10);
        light.decay = 0.6;
        light.customDistanceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        light.distance = 200;
        light.target = new THREE.Object3D();
        light.target.position.set(0, 20, -5);
        light.position.set(0, 3, 0);

        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        headbandLight.add(light);
        headbandLight.add(light.target);

        this.mesh.add(headbandLight);

    }
}