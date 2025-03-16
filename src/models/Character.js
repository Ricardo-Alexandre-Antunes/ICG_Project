import * as THREE from "three";

export default class Character_Ski {
    constructor() {
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



        var light = new THREE.SpotLight(0xffffff, 0.4);
        light.decay = 0.5;
        light.target = new THREE.Object3D();
        light.target.position.set(0, 20, -10);
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

    updateCamera() {

    }
}