import * as THREE from "three";

export default class Character_Ski {
    constructor() {
        this.mesh = new THREE.Group();

        // Create the body
        var bodyGeom = new THREE.CylinderGeometry(5, 5, 10, 4, 1);
        var bodyMat = new THREE.MeshPhongMaterial({ color: 0xff3333, flatShading: true });
        var body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(0, 0, 0);
        this.mesh.add(body);

        // Create the head
        var headGeom = new THREE.SphereGeometry(3, 32, 32);
        var headMat = new THREE.MeshPhongMaterial({ color: 0xff3333, flatShading: true });
        var head = new THREE.Mesh(headGeom, headMat);
        head.position.set(0, 10, 0);
        this.mesh.add(head);

        // Create the eyes
        var eyeGeom = new THREE.SphereGeometry(0.5, 32, 32);
        var eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
        var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
        eyeR.position.set(2, 11, 3);
        var eyeL = eyeR.clone();
        eyeL.position.z = -eyeR.position.z;
        this.mesh.add(eyeR);
        this.mesh.add(eyeL);

        // Create the arms
        var armGeom = new THREE.CylinderGeometry(1, 1, 10, 4, 1);
        var armMat = new THREE.MeshPhongMaterial({ color: 0xff3333, flatShading: true });
        var armR = new THREE.Mesh(armGeom, armMat);
        armR.position.set(5, 5, 0);
        var armL = armR.clone();
        armL.position.x = -armR.position.x;
        this.mesh.add(armR);
        this.mesh.add(armL);

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
        var skiGeom = new THREE.BoxGeometry(5, 1, 20);
        var skiMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        var skiR = new THREE.Mesh(skiGeom, skiMat);
        skiR.position.set(2, -10, 0);
        var skiL = skiR.clone();
        skiL.position.x = -skiR.position.x;
        this.mesh.add(skiR);
        this.mesh.add(skiL);

        // Create the ski poles
        var poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 10, 4, 1);
        var poleMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        var poleR = new THREE.Mesh(poleGeom, poleMat);
        poleR.position.set(5, -5, 0);
        var poleL = poleR.clone();
        poleL.position.x = -poleR.position.x;
        this.mesh.add(poleR);
        this.mesh.add(poleL);

        // Create the ski pole handles
        var handleGeom = new THREE.SphereGeometry(0.5, 32, 32);
        var handleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        var handleR = new THREE.Mesh(handleGeom, handleMat);
        handleR.position.set(5, -10, 0);
        var handleL = handleR.clone();
        handleL.position.x = -handleR.position.x;
        this.mesh.add(handleR);
        this.mesh.add(handleL);
    }
}