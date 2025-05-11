import * as THREE from 'three';
import SimplexNoise from 'https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/+esm';
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.min.js';
import Rock from './Rock.js';
import SlalomGate from './SlalomGate.js';
import Tree from './Tree.js';
import SpotLightModel from './Spotlight.js';
import { snowTexture } from './Textures.js';

export default class Mountain {
    constructor(size = 250, resolution = 50, heightScale = 10, color = 0xffffff, steepness = 0.5, seed = Math.random(), rocks = 15 * Math.random(), previousMountain = null) {
        const startGenerating = Date.now();
        ////console.log("Generating mountain...");
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
        if (previousMountain) {
            //console.log("prev gates: ", previousMountain.gates);
            //console.log("prev gates children: ", previousMountain.gates.children);
            //console.log("last children: ", previousMountain.gates.children[previousMountain.gates.children.length - 1].children[0].children[0].material.color.getHex());
        }
        if (previousMountain && previousMountain.gates.children[previousMountain.gates.children.length - 1].children[0].children[0].material.color.getHex() == 0x0000ff) {
            this.generateGates(-this.size / 2 + 15, 0xff0000);
        }
        else {
            this.generateGates(-this.size / 2 + 15, 0x0000ff);
        }
        
        //console.log("Gates generated in " + (Date.now() - now) + "ms");
        this.checkedGates = this.gates.clone().children;
        this.mesh.add(this.generateRocks());
        this.mesh.add(this.generateTrees());
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
    

    generateGates(z_pos, color) {
        if (z_pos > this.size / 2 - 10) {
            this.gates.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI * this.steepness);
            return;
        }

        const gate = new SlalomGate(new THREE.TextureLoader(), null, color);
        const x_pos = Math.random() * 5 + 1;

        switch (color) {
            case 0xff0000:
                // left / red gates
                gate.group.position.set(x_pos, this.heightAtPoint(x_pos, z_pos), z_pos);
                gate.group.scale.setScalar(1.2);
                this.gates.add(gate.group);
                color = 0x0000ff;
                break;
            case 0x0000ff:
                // right / blue gates
                gate.group.position.set(-x_pos, this.heightAtPoint(-x_pos, z_pos), z_pos);
                gate.group.scale.setScalar(1.2);
                this.gates.add(gate.group);
                color = 0xff0000;
                break;
        }

        z_pos = z_pos + Math.random() * 10 + 180;
        this.generateGates(z_pos, color);
    }

   
    generateTrees() {
        return Tree.generateForest(this.size, this.size * 0.2, this.heightAtPoint.bind(this), this.steepness);
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
        console.log(this.checkedGates);
        console.log(this.checkedGates[skier]);
        console.log(this.checkedGates[skier] == undefined);
        console.log(this.checkedGates[skier] != undefined);
        if (this.checkedGates[skier] === undefined) {
            this.skiers.push(skier);
            this.checkedGates[skier] = this.gates.clone().children;
        }
        if (this.checkedGates[skier].length == 0) {
            return;
        }
        if (this.skiers.includes(skier)) {
            const skierPos = skier.mesh.getWorldPosition(new THREE.Vector3());
            const rocks = this.mesh.children[2]; // InstancedMesh
            const dummy = new THREE.Object3D();
            const worldMatrix = rocks.matrixWorld; // world matrix of the instanced mesh
        
            const instanceCount = Math.floor(rocks.count);
            for (let i = 0; i < instanceCount; i++) {
                // Get local matrix of the instance
                rocks.getMatrixAt(i, dummy.matrix);
        
                // Convert instance's local matrix to world matrix
                dummy.matrix.premultiply(worldMatrix); // apply the parent world transform
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
                const distance = dummy.position.distanceTo(skierPos);
                ////console.log(`Distance to rock ${i}:`, distance);
                ////console.log("Skier mesh", skier.mesh);
                if (distance < dummy.scale.x * 1.7) {
                    skier._velocity.set(0, 25, -20);
                    skier.mesh.position.set(
                        skier.mesh.position.x,
                        skier.mesh.position.y + 2,
                        skier.mesh.position.z
                    );
                
                    // Store original colors for all mesh children
                    const originalColors = [];
                    skier.mesh.traverse((child) => {
                        if (child.isMesh && child.material && child.material.color) {
                            originalColors.push({
                                mesh: child,
                                color: child.material.color.clone(),
                            });
                        }
                    });
                
                    let flashCount = 0;
                    const flashInterval = setInterval(() => {
                        originalColors.forEach(({ mesh, color }) => {
                            mesh.material.color.set(flashCount % 2 === 0 ? 0xff0000 : color);
                        });
                
                        flashCount++;
                        if (flashCount >= 6) {
                            clearInterval(flashInterval);
                            // Restore original colors
                            originalColors.forEach(({ mesh, color }) => {
                                mesh.material.color.copy(color);
                            });
                        }
                    }, 100);
                
                    break;
                }
                
            }
        }
        
        // check if skier has passed through next gate from the right side
        // if wrong side take a point away
        if (this.checkedGates[skier] != undefined) {
            const skierPosition = (skier.mesh.position.z - this.mesh.position.z) / Math.cos(this.mesh.rotation.x);
            //console.log("Skier position: ", skierPosition);

            const gates = this.checkedGates[skier].sort((gate1, gate2) => {
                return gate1.position.z - gate2.position.z;
            }).filter(gate => gate.position.z > skierPosition - 10);
            if (gates.length == 0) {
                return 0;
            }
            if (gates[0].position.z < skierPosition && gates[0].position.z > skierPosition - 1) {
                this.checkedGates[skier].shift();         
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
        return -5;

        // check if skier hit a rock
        // if so make the skier blink and slow it down
        
    }
}
