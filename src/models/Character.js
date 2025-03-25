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
        this._decceleration = new THREE.Vector3(-2.105, 3, -0.6);
        this._acceleration = new THREE.Vector3(1.5, 2, 50.0);
        this._velocity = new THREE.Vector3(0, 0, 0);
        this.counter = 0;
        this.score = 0;
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
        console.log(this.score);
        // Raycast downwards from the skier to detect the nearest surface
        const downVector = new THREE.Vector3(0, -1, 0);
        downVector.applyQuaternion(this.mesh.quaternion); // Adjust to skier's current rotation
    
        const raycaster = new THREE.Raycaster(this.mesh.position, downVector);
        const intersects = raycaster.intersectObjects(this.surface, true);
        if (intersects.length > 0) {
            const hit = intersects[0];
            const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    
            const upVector = new THREE.Vector3(0, 1, 0);
            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(upVector, worldNormal);
    
            this.mesh.quaternion.slerp(targetQuaternion, 0.2);
    
            this.mesh.position.y = hit.point.y + 1.200;
        }
        const velocity = this._velocity;
        const frameDecceleration = new THREE.Vector3(
            velocity.x * this._decceleration.x,
            velocity.y * this._decceleration.y,
            velocity.z * this._decceleration.z
        );
        if (isNaN(timeInSeconds)) {
            return;
        }
        frameDecceleration.multiplyScalar(timeInSeconds);
        frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
            Math.abs(frameDecceleration.z), Math.abs(velocity.z));

        velocity.add(frameDecceleration);
    
        const controlObject = this.mesh;
        const _Q = new THREE.Quaternion();
        const _A = new THREE.Vector3();
        const _R = controlObject.quaternion.clone();
    
        if (this.keys.forward) {
          velocity.z += this._acceleration.z * timeInSeconds;
          velocity.z = Math.min(velocity.z, 25 + 0.1 * (Date.now() - this.start) / 100);
        }
        if (this.keys.backward) {
          velocity.z -= this._acceleration.z * timeInSeconds;
            velocity.z = Math.max(velocity.z, 0);
        }
        if (this.keys.left) {
          _A.set(0, 1, 0);
          _Q.setFromAxisAngle(_A, 1.1 * Math.PI * timeInSeconds * this._acceleration.y);
          _R.multiply(_Q);
            velocity.x += this._acceleration.x * timeInSeconds * this._velocity.z;
        }
        if (this.keys.right) {
          _A.set(0, 1, 0);
          _Q.setFromAxisAngle(_A, 1.1 * -Math.PI * timeInSeconds * this._acceleration.y);
          _R.multiply(_Q);
            velocity.x -= this._acceleration.x * timeInSeconds * this._velocity.z;
        }

        //face the way skier is moving
        
    
        controlObject.quaternion.copy(_R);
    
    
        const oldPosition = new THREE.Vector3();
        oldPosition.copy(controlObject.position);
    
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(controlObject.quaternion);
        forward.normalize();
    

        forward.multiplyScalar(velocity.z * timeInSeconds);

    
        controlObject.position.add(forward);

        this.mesh.position.x = Math.min(Math.max(this.mesh.position.x, -intersects[0].object.geometry.parameters.width / 2 + 25), intersects[0].object.geometry.parameters.width / 2 - 25);
    
        oldPosition.copy(controlObject.position);   
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

        // Add 3rd person camera to headlight

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
        headbandLight.add(this.camera);
        this.camera.position.set(0, -160, -70);
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.x = 1.15*Math.PI / 2;
        this.camera.rotation.z = Math.PI ;


        this.mesh.add(headbandLight);

    }
}