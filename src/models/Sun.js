import * as THREE from 'three';

export default class Sun {
    constructor() {
        this.mesh = this.createSun();
    }

    createSun() {
        //directional light
        const sun_group = new THREE.Group();
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

        sun_group.add(directionalLight);
        return sun_group;
    }

    Update() {
        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.01;
    }
}