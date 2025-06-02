import * as THREE from 'three';
import SimplexNoise from 'https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/+esm';
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.min.js';
import Rock from './Rock.js';
import SlalomGate from './SlalomGate.js';
import Tree from './Tree.js';
import SpotLightModel from './Spotlight.js';
import { snowTexture } from './Textures.js';

const SLALOM = 1;
const RACE = 2;
const CHECKPOINTS = 3;
const ENDURANCE = 4;


export default class Mountain {
    constructor({ size = 500, resolution = 50, heightScale = 10, color = 0xffffff, steepness = 0.5, seed = Math.random(), rocks = 35 * Math.random(), previousMountain = null, mode = SLALOM } = {}) {
        console.log("Mode: ", mode);
        this.size = size;
        this.resolution = resolution;
        this.heightScale = heightScale;
        this.color = color;
        this.steepness = steepness;
        this.seed = seed;
        this.rocks = rocks;
        this.skiers = [];
        this.previousMountain = previousMountain;  // Store reference to the previous mountain

        this.noise = new SimplexNoise(this.seed);
        this.heightMap = [];
        this.mesh = this.createMountain();
        //this.rocks.raycast = function(raycaster, intersects) {
        //    return false;
        //}
        const now = Date.now();
        this.gates = new THREE.Group();
        this.mesh.add(this.gates);
        //console.log("prev mountain: ", previousMountain);
        if (mode == SLALOM) {
            console.log("Generating slalom gates...");
            this.generateGates(-this.size / 2 + 20);
            this.checkedGates = this.gates.clone().children;
        }

        //console.log("Gates generated in " + (Date.now() - now) + "ms");

        this.mesh.add(this.generateRocks());
        this.mesh.add(this.generateTrees());
        //this.generateSpotlight();
        //this.mesh.rotateOnAxis(new THREE.Vector3(0.1, 0, 0), this.steepness);
        //console.log("Mountain generated in " + (Date.now() - startGenerating) + "ms");
    }

    createMountain() {
        const geometry = new THREE.PlaneGeometry(this.size, this.size, this.resolution, this.resolution);
        const vertices = geometry.attributes.position.array;
        this.heightMap = new Array(this.resolution + 1).fill().map(() => new Array(this.resolution + 1).fill(0));
    
        const position = this.position || new THREE.Vector3(0, 0, 0);
        const rotation = new THREE.Euler(-Math.PI / 2 * this.steepness, 0, 0);  // Apply rotation based on steepness
        const transformMatrix = new THREE.Matrix4().compose(
            position,
            new THREE.Quaternion().setFromEuler(rotation),
            new THREE.Vector3(1, 1, 1)
        );
    
        // Only match the edges of the current and previous mountain
        if (this.previousMountain) {
            this.heightMap[0] = this.previousMountain.heightMap[this.previousMountain.heightMap.length - 1];
            // If no previous mountain, generate the height map using noise
            for (let j = 1; j <= this.resolution; j++) {
                for (let i = 0; i <= this.resolution; i++) {
                    const x = (i / this.resolution - 0.5) * this.size;
                    const y = (j / this.resolution - 0.5) * this.size;
                    let baseHeight = this.noise.noise2D(x * 0.001, y * 0.001) * this.heightScale;
                    const previousHeight = this.heightMap[j - 1][i];
                    const smoothFactor = 0.7; // 0.0 = noisy, 1.0 = very smooth
                    baseHeight = THREE.MathUtils.lerp(baseHeight, previousHeight, smoothFactor);
                    this.heightMap[j][i] = baseHeight;
                }
            }
        } else {
            // If no previous mountain, generate the height map using noise
            for (let j = 0; j <= this.resolution; j++) {
                for (let i = 0; i <= this.resolution; i++) {
                    const x = (i / this.resolution - 0.5) * this.size;
                    const y = (j / this.resolution - 0.5) * this.size;
                    const height = this.noise.noise2D(x * 0.001, y * 0.001) * this.heightScale;
                    this.heightMap[j][i] = height;
                }
            }
        }
    
        // Smooth the interior heights (to avoid jagged edges between mountains)
        const smoothed = JSON.parse(JSON.stringify(this.heightMap));
        for (let j = 1; j < this.resolution; j++) {
            for (let i = 1; i < this.resolution; i++) {
                let sum = 0;
                let count = 0;
    
                for (let dj = -1; dj <= 1; dj++) {
                    for (let di = -1; di <= 1; di++) {
                        sum += this.heightMap[j + dj][i + di];
                        count++;
                    }
                }
    
                smoothed[j][i] = sum / count;
            }
        }
    
        // Apply smoothed heights to geometry
        for (let j = 0; j <= this.resolution; j++) {
            for (let i = 0; i <= this.resolution; i++) {
                const index = (j * (this.resolution + 1) + i) * 3;
                vertices[index + 2] = smoothed[j][i];
            }
        }
    
        geometry.computeVertexNormals();
    
        const texture = snowTexture;

        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            flatShading: false,
            map: texture,
            side: THREE.DoubleSide
        });


        const mountaingroup = new THREE.Group();
        mountaingroup.position.copy(position);
        mountaingroup.rotation.copy(rotation);

        // Create the basic mountain mesh
        const mountain = new THREE.Mesh(geometry, material);
        mountaingroup.add(mountain);

        return mountaingroup;

    }
    
    
    
    
    
    

    heightAtPoint(x, y) {
        const i = Math.floor((x / this.size + 0.5) * this.resolution);
        const j = Math.floor((y / this.size + 0.5) * this.resolution);

        if (i < 0 || i > this.resolution || j < 0 || j > this.resolution) {
            return 0; // Out of bounds, return base height
        }

        return this.heightMap[j][i];
    }

    generateRocks() {
        //console.log("Generating rocks...");
        const now = Date.now();
        const sharedRock = new Rock().mesh; // Single mesh, good
        const geometry = sharedRock.geometry.clone();
        const material = sharedRock.material.clone();
    
        const rockCount = this.rocks;
        const instancedMesh = new THREE.InstancedMesh(geometry, material, rockCount);
    
        const dummy = new THREE.Object3D();

    
        for (let i = 0; i < rockCount; i++) {
            const x = Math.random() * this.size - this.size / 2;
            const z = Math.random() * this.size - this.size / 2;
            const y = this.heightAtPoint(x, z);
    
            dummy.position.set(x, y, z);
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.scale.setScalar(Math.random() * 1.5 * (this.size / 250) + 2.5);
            dummy.updateMatrix();
    
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
    
        instancedMesh.instanceMatrix.needsUpdate = true;
    
        // Rotate entire rock field to match terrain steepness
        instancedMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * this.steepness);
        //console.log("Rocks generated in " + (Date.now() - now) + "ms");
        return instancedMesh;
    }
    

    generateGates(z_pos) {
        if (z_pos > this.size / 2 - 10) {
            this.gates.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * this.steepness);
            return;
        }
    
        const centerX = (Math.random() - 0.5) * 55;
        const offset = 7.5;
        const leftX = centerX - offset;
        const rightX = centerX + offset;
    
        const leftGate = new SlalomGate(new THREE.TextureLoader(), null, 0xff0000); // Red
        const rightGate = new SlalomGate(new THREE.TextureLoader(), null, 0x0000ff); // Blue
    
        const yL = this.heightAtPoint(leftX, z_pos);
        const yR = this.heightAtPoint(rightX, z_pos);
    
        leftGate.group.position.set(leftX, yL, z_pos);
        rightGate.group.position.set(rightX, yR, z_pos);
    
        const gateGroup = new THREE.Group();
        gateGroup.add(leftGate.group);
        gateGroup.add(rightGate.group);

    
        // Save metadata
        gateGroup.passed = new Set(); // Use a Set for unique skiers
    
        this.gates.add(gateGroup);
    
        z_pos += Math.random() * 10 + 125;
        this.generateGates(z_pos);
    }
    
    

   
    generateTrees() {
        return Tree.generateForest(this.size, this.size * 0.6, this.heightAtPoint.bind(this), this.steepness);
    }
    
    
    

    generateSpotlight() {
        for (let i = 0; i < 3; i++) {
            const spotlight = new SpotLightModel().getObject();
            spotlight.position.set(Math.sign(Math.random() - 0.5) * this.size / 2 - (Math.random() * 20), Math.random() * this.size - this.size / 2, this.heightAtPoint(spotlight.position.x, spotlight.position.z) + 1);
            spotlight.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);
            spotlight.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            this.mesh.add(spotlight);
        }
    }

    checkSkierScore(skier) {
        //console.log(this.checkedGates);
        //console.log(this.checkedGates[skier]);
        //console.log(this.checkedGates[skier] == undefined);
        //console.log(this.checkedGates[skier] != undefined);
        const skierPos = skier.mesh.getWorldPosition(new THREE.Vector3());
        const rocks = this.mesh.children[2]; // InstancedMesh
        const dummy = new THREE.Object3D();
        const worldMatrix = rocks.matrixWorld;
    
        const instanceCount = Math.floor(rocks.count);
    
        for (let i = 0; i < instanceCount; i++) {
            rocks.getMatrixAt(i, dummy.matrix);
            dummy.matrix.premultiply(worldMatrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
    
            const distance = dummy.position.distanceTo(skierPos);
            //console.log("Distance to rock: ", distance);

            // 🔥 Check for collision
            if (distance < dummy.scale.x * 1.7) {
                skier._velocity.set(0, 25, -20);
                skier.mesh.position.set(
                    skier.mesh.position.x,
                    skier.mesh.position.y + 2,
                    skier.mesh.position.z
                );
    
                // [Flash logic omitted for brevity...]
                break;
            }
        }
        
        

        

        this.gates.children.forEach((gate) => {
            gate.updateMatrixWorld(true);
            skier.mesh.updateMatrixWorld(true);
        
            const skierBox = new THREE.Box3().setFromObject(skier.mesh);
            const gateBox = new THREE.Box3().setFromObject(gate);
            gateBox.expandByVector(new THREE.Vector3(1.5, 10, 1)); // Expand the gate box to account for height and width
        
            const intersectBox = skierBox.intersectsBox(gateBox);

            const widerBox = gateBox.clone().expandByVector(new THREE.Vector3(100, 10, 0.1));

            if (widerBox.intersectsBox(skierBox) && !intersectBox && !gate.passed.has(skier)) {
                skier.score -= 1;
            }
        
            if (intersectBox && !gate.passed.has(skier)) {
        
                const leftX = gate.children[0].getWorldPosition(new THREE.Vector3()).x;
                const rightX = gate.children[1].getWorldPosition(new THREE.Vector3()).x;
                const skierX = skier.mesh.getWorldPosition(new THREE.Vector3()).x;
        
                if (skierX > leftX && skierX < rightX) {
                    gate.passed.add(skier);
                    skier.score += 1;
                } else {
                    skier.score -= 1;
                }
            }
        });
        
        

        // check if skier hit a rock
        // if so make the skier blink and slow it down
        
    }
}
