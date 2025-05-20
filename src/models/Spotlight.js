import * as THREE from 'three';

export default class SpotlightModel {
    constructor() {
        this.group = new THREE.Group();
        this.createBody();
        this.createReflector();
        this.createSupport();
        this.createLightPanel();
        this.createLight();
    }

    createBody() {
        const bodyGeometry = new THREE.CylinderGeometry(2.3, 2.3, 5, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        this.group.add(body);
    }

    createReflector() {
        const reflectorGeometry = new THREE.CylinderGeometry(2.5, 2.6, 0.5, 32);
        const reflectorMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2 });
        const reflector = new THREE.Mesh(reflectorGeometry, reflectorMaterial);
        reflector.position.z = 2.75;
        reflector.rotation.x = Math.PI / 2;
        this.group.add(reflector);
    }

    createSupport() {
        const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const supportGeometry1 = new THREE.BoxGeometry(0.5, 6, 0.5);
        
        const support1 = new THREE.Mesh(supportGeometry1, supportMaterial);
        support1.position.set(-2.5, -3, 0);
        
        const support2 = new THREE.Mesh(supportGeometry1, supportMaterial);
        support2.position.set(2.5, -3, 0);
        
        const baseGeometry = new THREE.BoxGeometry(6, 0.5, 6);
        const base = new THREE.Mesh(baseGeometry, supportMaterial);
        base.position.set(0, -6, 0);
        
        this.group.add(support1, support2, base);
    }

    createLightPanel() {
        const panelGeometry = new THREE.CircleGeometry(2);
        const panelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, 0, 3);
        this.group.add(panel);
    }

    createLight() {
        const spotlight = new THREE.SpotLight(0xffffff, 4, 500, Math.PI / 6, 0.5, 1.5);
        spotlight.position.set(0, 0, 0);
        spotlight.target.position.set(0, -0.001, 600);
        spotlight.castShadow = true;
        spotlight.shadow.mapSize.width = 1024;
        spotlight.shadow.mapSize.height = 1024;
        spotlight.decay = 0;
        this.group.add(spotlight);
        this.group.add(spotlight.target);
    }

    getObject() {
        return this.group;
    }
}