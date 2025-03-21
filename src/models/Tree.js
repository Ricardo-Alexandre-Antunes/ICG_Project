import * as THREE from 'three';

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
        const redMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const cylinder = new THREE.Mesh(cylinderGeometry, redMaterial);
        cylinder.receiveShadow = true;
        cylinder.castShadow = true;
    
        // Move base of the cylinder to y = 0
        cylinder.position.y = cylinderHeight / 2.0;
    
        // Cone
        const baseConeRadius = 10;
        const coneHeight = 30;
        const coneGeometry = new THREE.ConeGeometry(baseConeRadius, coneHeight, 32);
        const greenMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
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
}