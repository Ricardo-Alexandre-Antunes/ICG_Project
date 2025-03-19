import * as THREE from 'three';
import { ImprovedNoise } from 'https://unpkg.com/three/examples/jsm/math/ImprovedNoise.js';
import Rock from './Rock.js';

export default class Mountain {
    constructor(size = 250, resolution = 100, heightScale = 10, color = 0xffffff, steepness = 0.5, seed = Math.random(), rocks = 150 * Math.random()) {
        this.size = size;
        this.resolution = resolution;
        this.heightScale = heightScale;
        this.color = color;
        this.steepness = steepness;
        this.seed = seed;
        this.rocks = rocks;
        this.heightMap = []; // Store the height values for quick lookup
        this.mesh = this.createMountain();
        this.mesh.add(this.generateRocks());
    }

    createMountain() {
        const geometry = new THREE.PlaneGeometry(this.size, this.size, this.resolution, this.resolution);
        const noise = new ImprovedNoise();
        const vertices = geometry.attributes.position.array;
        this.heightMap = new Array(this.resolution + 1).fill().map(() => new Array(this.resolution + 1).fill(0));

        for (let j = 0; j <= this.resolution; j++) {
            for (let i = 0; i <= this.resolution; i++) {
                const index = (j * (this.resolution + 1) + i) * 3;
                const x = (i / this.resolution - 0.5) * this.size;
                const y = (j / this.resolution - 0.5) * this.size;
                const height = noise.noise(x * this.seed * Math.pow(2, 3), y * this.seed * Math.pow(2, 3), 0);

                vertices[index + 2] = height; // Modify the height in geometry
                this.heightMap[j][i] = height; // Save height in heightMap
            }
        }

        geometry.computeVertexNormals();

        const texture = new THREE.TextureLoader().load('../assets/snow_01_diff_4k.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 5);
        const material = new THREE.MeshStandardMaterial({ color: this.color, flatShading: true, map: texture, side: THREE.DoubleSide });

        const mountain = new THREE.Mesh(geometry, material);
        mountain.rotation.x = -Math.PI / 2 * this.steepness;

        return mountain;
    }

    heightAtPoint(x, y) {
        // Convert world coordinates to grid indices
        const i = Math.round((x / this.size + 0.5) * this.resolution);
        const j = Math.round((y / this.size + 0.5) * this.resolution);

        if (i < 0 || i > this.resolution || j < 0 || j > this.resolution) {
            return 0; // Out of bounds, return base height
        }

        return this.heightMap[j][i];
    }

    generateRocks() {
        const rocks = new THREE.Group();
        for (let i = 0; i < this.rocks; i++) {
            const rock = new Rock();
            rock.mesh.position.x = Math.random() * this.size - this.size / 2;
            rock.mesh.position.z = Math.random() * this.size - this.size / 2;
            rock.mesh.position.y = 0
            rock.mesh.rotation.y = Math.random() * Math.PI;
            rock.mesh.scale.setScalar(Math.random() * 1.5 * (this.size/250) + 0.5);
            rocks.add(rock.mesh);
        }
        rocks.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI * this.steepness);
        return rocks;
    }
}
