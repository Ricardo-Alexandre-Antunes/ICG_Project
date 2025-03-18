import * as THREE from 'three';
import { ImprovedNoise } from 'https://unpkg.com/three/examples/jsm/math/ImprovedNoise.js';

export default class Mountain {
    constructor(size = 100, resolution = 100, heightScale = 10, color = 0xffffff, steepness = 0.5, seed = Math.random()) {
        this.size = size;
        this.resolution = resolution;
        this.heightScale = heightScale;
        this.color = color;
        this.steepness = steepness;
        this.seed = seed;
        this.mesh = this.createMountain();
    }

    createMountain() {
        const geometry = new THREE.PlaneGeometry(this.size, this.size * this.heightScale, this.resolution, this.resolution);
        const noise = new ImprovedNoise();
        const vertices = geometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i] / this.size;
            const y = vertices[i + 1] / this.size;
            vertices[i + 2] = noise.noise(x * this.seed * 3, y * this.seed * 3, 0) * this.heightScale; // Add randomness to terrain
        }
        geometry.computeVertexNormals();

        const texture = new THREE.TextureLoader().load('../assets/snow_01_diff_4k.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 5);
        const material = new THREE.MeshStandardMaterial({ color: this.color, flatShading: true, map: texture, side: THREE.DoubleSide });
        const mountain = new THREE.Mesh(geometry, material);
        mountain.rotation.x = -Math.PI / 2 * this.steepness; // Orient the plane to be horizontal

        return mountain;
    }

    normalOfPoint(x, y) {
        const geometry = this.mesh.geometry;
        const vertices = geometry.attributes.position.array;
        const i = (x + this.size / 2) / this.size * this.resolution;
        const j = (y + this.size / 2) / this.size * this.resolution;
        const index = Math.floor(j) * (this.resolution + 1) + Math.floor(i);
        const normal = new THREE.Vector3(
            geometry.attributes.normal.array[index * 3],
            geometry.attributes.normal.array[index * 3 + 1],
            geometry.attributes.normal.array[index * 3 + 2]
        );
        return normal;
    }
}