import * as THREE from 'three';
import SimplexNoise from 'https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/+esm';
import Rock from './Rock.js';
import SlalomGate from './SlalomGate.js';
import Tree from './Tree.js';
import SpotLightModel from './Spotlight.js';

export default class Mountain {
    constructor(size = 250, resolution = 50, heightScale = 10, color = 0xffffff, steepness = 0.5, seed = Math.random(), rocks = 50 * Math.random()) {
        this.size = size;
        this.resolution = resolution;
        this.heightScale = heightScale;
        this.color = color;
        this.steepness = steepness;
        this.seed = seed;
        this.rocks = rocks;
        this.skiers = [];


        this.noise = new SimplexNoise(this.seed);
        this.heightMap = []; // Store the height values for quick lookup
        this.mesh = this.createMountain();
        this.rocks = this.generateRocks();
        this.gates = new THREE.Group();
        this.mesh.add(this.gates);
        this.generateGates(-this.size / 2 + 15, 0xff0000);
        this.checkedGates = this.gates.clone().children;
        //this.generateSpotlight();
        this.mesh.add(this.rocks);
        this.mesh.add(this.generateTrees());
    }

    createMountain() {
        const geometry = new THREE.PlaneGeometry(this.size, this.size, this.resolution, this.resolution);
        const vertices = geometry.attributes.position.array;
        this.heightMap = new Array(this.resolution + 1).fill().map(() => new Array(this.resolution + 1).fill(0));

        for (let j = 0; j <= this.resolution; j++) {
            for (let i = 0; i <= this.resolution; i++) {
                const index = (j * (this.resolution + 1) + i) * 3;
                const x = (i / this.resolution - 0.5) * this.size;
                const y = (j / this.resolution - 0.5) * this.size;
                const height = this.noise.noise2D(x * 0.002, y * 0.002) * this.heightScale;

                vertices[index + 2] = height;
                this.heightMap[j][i] = height;
            }
        }

        geometry.computeVertexNormals();

        const texture = new THREE.TextureLoader().load('./src/assets/snow_01_diff_4k.jpg');
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
        const i = Math.floor((x / this.size + 0.5) * this.resolution);
        const j = Math.floor((y / this.size + 0.5) * this.resolution);

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
            rock.position.y = this.heightAtPoint(rock.position.x, rock.position.z);
            rock.scale.setScalar(Math.random() * 1.5 * (this.size/250) + 2.5);
            rocks.add(rock);
        }
        rocks.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * this.steepness);
        return rocks;
    }

    generateGates(z_pos, color) {
        if (z_pos > this.size / 2 - 10) {
            this.gates.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * this.steepness);
            return;
        }

        const gate = new SlalomGate(new THREE.TextureLoader(), null, color);
        const x_pos = Math.random() * 10 + 15;

        switch (color) {
            case 0xff0000:
                // left / red gates
                gate.group.position.set(x_pos, this.heightAtPoint(1, z_pos), z_pos);
                gate.group.scale.setScalar(1.2);
                this.gates.add(gate.group);
                color = 0x0000ff;
                break;
            case 0x0000ff:
                // right / blue gates
                gate.group.position.set(-x_pos, this.heightAtPoint(-1, z_pos), z_pos);
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
            //tree.rotation.x = Math.PI;
            tree.scale.setScalar(Math.random() * 0.5 + 0.3);
            trees.add(tree);
        }
        trees.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * this.steepness);
        return trees;

    }

    generateSpotlight() {
        for (let i = 0; i < 3; i++) {
            const spotlight = new SpotLightModel().getObject();
            spotlight.position.set(Math.sign(Math.random() - 0.5) * this.size / 2 - (Math.random() * 10), Math.random() * this.size - this.size / 2, 6);
            spotlight.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
            spotlight.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            this.mesh.add(spotlight);
        }
    }

    checkSkierScore(skier) {
        console.log("unchecked gates", this.checkedGates);
        if (this.checkedGates.length == 0) {
            return;
        }
        if (!this.skiers.includes(skier)) {
            this.skiers.push(skier);
        }
        // check if skier has passed through next gate from the right side
        // if wrong side take a point away
        if (this.skiers.includes(skier)) {
            const skierPosition = (skier.mesh.position.z - this.mesh.position.z) / Math.abs(Math.sin(this.mesh.rotation.x));
            const gates = this.checkedGates.sort((gate1, gate2) => {
                return -gate1.position.y + gate2.position.y;
            }).filter(gate => -gate.position.y > skierPosition - 10);
            if (gates.length == 0) {
                return;
            }
            console.log("skierPosition", skierPosition);
            const positions = gates.map(gate => -gate.position.y);
            const distances = gates.map(gate => Math.abs(-gate.position.y - skierPosition));
            console.log("gates", gates);
            console.log("positions", positions);
            console.log("distances", distances);
            if (-gates[0].position.y < skierPosition && -gates[0].position.y > skierPosition - 1) {
                console.log("gates before", this.checkedGates);
                this.checkedGates.shift();                
                console.log("gates after", this.checkedGates);
                if ((gates[0].position.x < 0 && skier.mesh.position.x < gates[0].position.x) || (gates[0].position.x > 0 && skier.mesh.position.x > gates[0].position.x)) {
                    skier.score += 1;
                    return 1;
                }
                else {
                    if (skier.score > 0) {
                        skier.score -= 1;
                        return -1;
                    }
                }

            }
            return 0;
            
        }

        // check if skier hit a rock
        // if so make the skier blink and slow it down
        if (this.skiers.includes(skier)) {
            const skierPos = skier.mesh.position;
            const rocks = this.rocks.children;
            for (let i = 0; i < rocks.length; i++) {
                if (rocks[i].position.distanceTo(skierPos) < 1) {
                    skier.velocity = new THREE.Vector3(0, 0, 0);
                    setTimeout(() => {
                        skier.mesh.visible = !skier.mesh.visible;
                    }
                    , 100, 2);
                }
            }
        }
    }
}
