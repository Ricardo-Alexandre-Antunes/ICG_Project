import * as THREE from 'three';

export const woodTexture = new THREE.TextureLoader().load('./src/assets/wood.jpg');
export const leavesTexture = new THREE.TextureLoader().load('./src/assets/leaves.jpg');
export const snowTexture = new THREE.TextureLoader().load('./src/assets/snow_01_diff_4k.jpg');

snowTexture.wrapS = THREE.RepeatWrapping;
snowTexture.wrapT = THREE.RepeatWrapping;
snowTexture.repeat.set(10, 5);