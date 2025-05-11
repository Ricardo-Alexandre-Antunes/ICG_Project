import * as THREE from 'three';

export class Fog {
    constructor(scene) {
        this.scene = scene;
        this.initFog();
        this.initSnowstorm();
    }

    initFog() {
        this.fogColor = 0xffffff;
        this.scene.fog = new THREE.FogExp2(this.fogColor, 0.002);
        this.scene.background = new THREE.Color(this.fogColor);
        this.fogDayColor = new THREE.Color(0x96accd);   // light blue
        this.fogNightColor = new THREE.Color(0x292625); // dark blueish/black

    }

    initSnowstorm() {
        const count = 10000;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const scales = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 800;
            const y = Math.random() * 400 + 100;
            const z = (Math.random() - 0.5) * 800;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            velocities[i * 3] = (Math.random() - 0.5) * 0.5;
            velocities[i * 3 + 1] = -Math.random();
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

            scales[i] = Math.random() * 0.5 + 4.5; // Random scale between 0.5 and 1.0


        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            fog: true,
            blending: THREE.AdditiveBlending,
        });

        this.snowstorm = new THREE.Points(geometry, material);
        this.scene.add(this.snowstorm);
    }

    update(skier, sun) {
        const skierSpeed = skier._velocity.length();
    
        // Fog distance
        this.prevDensity = this.scene.fog.density;
        this.scene.fog.density = THREE.MathUtils.lerp(this.prevDensity, 0.002 + skierSpeed * 0.00005, 0.1);
    
        // Adjust snowstorm opacity and density based on skier speed
        const snowDensity = Math.min(0.5 + skierSpeed * 0.02, 1.0); // Increase density with speed
        this.snowstorm.material.opacity = Math.min(1.0, 0.4 + skierSpeed * 0.03 + snowDensity * 0.2);
    
        const sunHeight = sun.position.y;
        const factor = THREE.MathUtils.clamp(sunHeight / 200, 0, 1);
        //console.log('Sun Height:', sunHeight, 'Factor:', factor);
        this.scene.fog.color.copy(this.fogNightColor).lerp(this.fogDayColor, factor);
        this.scene.background.copy(this.fogNightColor).lerp(this.fogDayColor, factor);
    
        // Move snow to skier position
        this.snowstorm.position.copy(skier.mesh.position);
    
        // Animate snow particles
        const pos = this.snowstorm.geometry.attributes.position.array;
        const vel = this.snowstorm.geometry.attributes.velocity.array;
    
        for (let i = 0; i < pos.length; i += 3) {
            pos[i] += vel[i] + 0.1 * Math.sin(Date.now() * 0.001 + i);  // wind sway
            pos[i + 1] += vel[i + 1] - skierSpeed * 0.01;               // fall
    
            // Adjust snow density
            pos[i + 2] += -vel[i + 2] * snowDensity;
    
            // Recycle snow particles when they fall below a threshold
            if (pos[i + 1] < -100) {
                pos[i] = (Math.random() - 0.5) * 800;
                pos[i + 1] = 400 + Math.random() * 200;
                pos[i + 2] = (Math.random() - 0.5) * 800;
            }
        }
    
        this.snowstorm.geometry.attributes.position.needsUpdate = true;
    }
    
    
}
