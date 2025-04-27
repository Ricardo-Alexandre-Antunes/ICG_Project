import * as THREE from 'three';
import { woodTexture, leavesTexture } from './Textures.js';

export default class Tree {
    constructor() {
        this.mesh = this.createTree();
    }

    createTree() {
        // Creating a model by grouping basic geometries
        // Cylinder centered at the origin
        const cylinderRadius = 5;
        const cylinderHeight = 20;
        const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 32);
        const texture = woodTexture; // Use the imported wood texture
        const redMaterial = new THREE.MeshLambertMaterial({ color: 0x964B00, map: texture });
        const cylinder = new THREE.Mesh(cylinderGeometry, redMaterial);
        cylinder.receiveShadow = true;
        cylinder.castShadow = true;
    
        // Move base of the cylinder to y = 0
        cylinder.position.y = cylinderHeight / 2.0;
    
        // Cone
        const baseConeRadius = 10;
        const coneHeight = 30;
        const coneGeometry = new THREE.ConeGeometry(baseConeRadius, coneHeight, 32);
        const texture2 = leavesTexture; // Use the imported leaves texture
        const greenMaterial = new THREE.MeshLambertMaterial({ color: 0x06402B, map: texture2 });
        const cone = new THREE.Mesh(coneGeometry, greenMaterial);
        cone.receiveShadow = true;
        cone.castShadow = true;
    
        // Move base of the cone to the top of the cylinder
        cone.position.y = cylinderHeight + coneHeight / 2.0;
    
        // Tree
        const tree = new THREE.Group();
        tree.add(cylinder);
        tree.add(cone);
        return tree;
    }

    static generateForest(size, count, heightAtPointFn, steepness) {
        // Two separate base meshes
        const trunkGeometry = new THREE.CylinderGeometry(5, 5, 25, 32);
        const trunkTexture = new THREE.TextureLoader().load('./src/assets/wood.jpg');
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x964B00, map: trunkTexture });
    
        const leavesGeometry = new THREE.ConeGeometry(10, 30, 32);
        const leavesTexture = new THREE.TextureLoader().load('./src/assets/leaves.jpg');
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x06402B, map: leavesTexture });
    
        const trunkMesh = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count);
        const leavesMesh = new THREE.InstancedMesh(leavesGeometry, leavesMaterial, count);
    
        const dummy = new THREE.Object3D();
    
        for (let i = 0; i < count; i++) {
            const x = Math.sign(Math.random() - 0.5) * (size / 2 - Math.random() * 20);
            const z = Math.random() * size - size / 2;
            const y = heightAtPointFn(x, z);
    
            dummy.position.set(x, y, z);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            const scale = Math.random() * 0.5 + 0.3;
            dummy.scale.setScalar(scale);
    
            dummy.updateMatrix();
            trunkMesh.setMatrixAt(i, dummy.matrix);
    
            // Adjust leaves higher
            dummy.position.y += 25 * scale; // Move up by trunk height
            dummy.updateMatrix();
            leavesMesh.setMatrixAt(i, dummy.matrix);
        }
    
        trunkMesh.instanceMatrix.needsUpdate = true;
        leavesMesh.instanceMatrix.needsUpdate = true;
    
        const forest = new THREE.Group();
        forest.add(trunkMesh);
        forest.add(leavesMesh);
    
        forest.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * steepness);
    
        return forest;
    }
}