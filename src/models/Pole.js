import * as THREE from 'three';

export default class Pole {
    constructor() {
        this.pole = new THREE.Mesh();
        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            shininess: 600,
        });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        this.pole.add(cylinder);

        const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            shininess: 600,
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(0, 1.1, 0);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        this.pole.add(sphere);
    }

    getMesh() {
        return this.pole;
    }
}