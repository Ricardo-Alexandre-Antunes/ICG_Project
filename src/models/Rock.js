import * as THREE from 'three';
import SimplexNoise from 'https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/+esm';

export default class Rock {
    constructor() {
        this.geometry = new THREE.IcosahedronGeometry(1, 3); // More subdivisions for smoother shape
        this.material = new THREE.MeshStandardMaterial({
            color: 0x8b7d6b,
            flatShading: false,
        });

        this.applyNoiseDistortion(); // Apply procedural noise

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }

    applyNoiseDistortion() {
        const noise = new SimplexNoise(Math.random()); // Randomized seed for different rocks
        const positionAttribute = this.geometry.getAttribute('position');
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);

            // Generate noise-based displacement
            const noiseValue = noise.noise3D(vertex.x * 1.5, vertex.y * 1.5, vertex.z * 1.5) * 0.15;

            // Apply smooth distortion
            vertex.normalize().multiplyScalar(1 + noiseValue);

            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        positionAttribute.needsUpdate = true;
    }

    getMesh() {
        return this.mesh;
    }
}
