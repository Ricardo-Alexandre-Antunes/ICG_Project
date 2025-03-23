import * as THREE from 'three';

export default class Sun {
    constructor() {
        this.mesh = this.createSun();
        this.step = 0.01;
    }

    createSun() {
        //directional light
        const sun_group = new THREE.Group();
        const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
        directionalLight.position.set(0, 150, 0);
        const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
        directionalLight.castShadow = true;
        sun_group.add(directionalLight);
        sun_group.add(helper);
        return sun_group;
    }

    Update() {
        this.mesh.position.x = Math.sin(this.step) * 200;
        this.mesh.position.y = Math.cos(this.step) * 200;
        
        //get the light
        const light = this.mesh.children[0];
        light.intensity = Math.max(0, Math.sin(this.step + Math.PI / 2)) * 10;

        this.step += 0.001;
    }
}