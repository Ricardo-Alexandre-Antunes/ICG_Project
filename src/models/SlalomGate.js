import * as THREE from 'three';

export default class SlalomGate {
    constructor(textureLoader, flagTexturePath = null, color = 0xff0000) {
        this.group = new THREE.Group();

        const leftPole = new THREE.Group();
        leftPole.position.set(-0.6, 1, 0); // Adjust height so the bottom touches the ground

        // Pole material
        const poleMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color });

        // Create left pole
        const leftPoleStick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 2, 16), 
            poleMaterial
        );
        leftPoleStick.castShadow = true;
        leftPoleStick.receiveShadow = true;

        // Create left pole sphere on top
        const leftPoleSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16), 
            poleMaterial
        );
        leftPoleSphere.position.set(0, 1, 0);
        leftPoleSphere.castShadow = true;
        leftPoleSphere.receiveShadow = true;



        

        leftPole.add(leftPoleStick, leftPoleSphere);



        const rightPole = leftPole.clone();
        rightPole.position.set(0.6, 1, 0);

        // Flag material (with or without texture)
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: color, // Default blue flag
            side: THREE.DoubleSide,
        });

        if (flagTexturePath) {
            flagMaterial.map = textureLoader.load(flagTexturePath);
        }

        // Create the flag (plane)
        const flag = new THREE.Mesh(
            new THREE.PlaneGeometry(1.2, 0.6), // Width, Height
            flagMaterial
        );
        flag.position.set(0, 1.5, 0); // Adjust height
        flag.castShadow = true;
        flag.receiveShadow = true;

        // Grouping all elements
        this.group.add(leftPole, rightPole, flag);



    }

    getObject() {
        return this.group;
    }
}
