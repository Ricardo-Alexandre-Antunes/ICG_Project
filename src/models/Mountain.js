import * as THREE from 'three';
import { ImprovedNoise } from 'https://unpkg.com/three/examples/jsm/math/ImprovedNoise.js';
import Rock from './Rock.js';
import SlalomGate from './SlalomGate.js';
import Tree from './Tree.js';

export default class Mountain {
    constructor(size = 250, resolution = 130, heightScale = 10, color = 0xffffff, steepness = 0.5, seed = Math.random(), rocks = 50 * Math.random()) {
        this.size = size;
        this.resolution = resolution;
        this.heightScale = heightScale;
        this.color = color;
        this.steepness = steepness;
        this.seed = seed;
        this.rocks = rocks;
        this.heightMap = []; // Store the height values for quick lookup
        this.mesh = this.createMountain();
        this.rocks = this.generateRocks();
        this.gates = new THREE.Group();
        this.mesh.add(this.gates);
        this.generateGates(-this.size / 2 + 15, 0xff0000);
        this.mesh.add(this.rocks);
        this.mesh.add(this.generateTrees());
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
                const height = noise.noise(x * this.seed * Math.pow(2, 5), y * this.seed * Math.pow(2, 5), 10);

                vertices[index + 2] = height; // Modify the height in geometry
                this.heightMap[j][i] = height; // Save height in heightMap
            }
        }

        geometry.computeVertexNormals();

        const texture = new THREE.TextureLoader().load('../assets/snow_01_diff_4k.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 5);
        const material = new THREE.MeshStandardMaterial({ color: this.color, flatShading: false, map: texture, side: THREE.DoubleSide });

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
        const sharedRock = new Rock().mesh;
        for (let i = 0; i < this.rocks; i++) {
            const rock = sharedRock.clone();
            rock.position.x = Math.random() * this.size - this.size / 2;
            rock.position.z = Math.random() * this.size - this.size / 2;
            rock.position.y = 0
            rock.rotation.y = Math.random() * Math.PI;
            rock.scale.setScalar(Math.random() * 1.5 * (this.size/250) + 0.5);
            rocks.add(rock);
        }
        rocks.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI * this.steepness);
        return rocks;
    }

    generateGates(z_pos, color) {
        console.log(z_pos);
        if (z_pos > this.size / 2 - 10) {
            return;
        }

        const gate = new SlalomGate(new THREE.TextureLoader(), null, color);
        const x_pos = Math.random() * 30 + 35;

        switch (color) {
            case 0xff0000:
                // left / red gates
                gate.group.position.set(x_pos, z_pos, this.heightAtPoint(1, z_pos));
                gate.group.rotation.x = Math.PI / 2;
                gate.group.scale.setScalar(1.2);
                this.gates.add(gate.group);
                color = 0x0000ff;
                break;
            case 0x0000ff:
                // right / blue gates
                gate.group.position.set(-x_pos, z_pos, this.heightAtPoint(-1, z_pos));
                gate.group.rotation.x = Math.PI / 2;
                gate.group.scale.setScalar(1.2);
                this.gates.add(gate.group);
                color = 0xff0000;
                break;
        }

        z_pos = z_pos + Math.random() * 10 + 40;
        this.generateGates(z_pos, color);
    }

    generateTrees() {
        // generate a bunch of trees at the side of the mountain
        const trees = new THREE.Group();
        const sharedTree = new Tree().mesh;
        for (let i = 0; i < 100; i++) {
            const tree = sharedTree.clone();
            tree.position.x = Math.sign(Math.random() - 0.5) * (this.size / 2 - Math.random() * 20);
            tree.position.z = Math.random() * this.size - this.size / 2;
            tree.position.y = this.heightAtPoint(tree.position.x, tree.position.z);
            tree.rotation.x = Math.PI;
            tree.scale.setScalar(Math.random() * 0.5 + 0.3);
            trees.add(tree);
        }
        trees.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI * this.steepness);
        return trees;

    }
}
