import * as THREE from 'three';

// Taken from Third Person Camera tutorial
// https://github.com/simondevyoutube/ThreeJS_Tutorial_ThirdPersonCamera/blob/main/main.js#L498

export default class ThirdPersonCamera {
    constructor(params) {
        this._params = params;
        this._camera = params.camera;

        this._currentPosition = new THREE.Vector3();
        this._currentLookat = new THREE.Vector3();
    }

    _CalculateIdealOffset() {
        const idealOffset = new THREE.Vector3(-0.05, 4, -5);
        const quartenion = new THREE.Quaternion();
        quartenion.setFromEuler(this._params.target.rotation);
        idealOffset.applyQuaternion(quartenion);
        idealOffset.add(this._params.target.position);
        return idealOffset;
    }

    _CalculateIdealLookat() {
        const idealLookat = new THREE.Vector3(-0.05, 2, 2.5);
        const quartenion = new THREE.Quaternion();
        quartenion.setFromEuler(this._params.target.rotation);
        idealLookat.applyQuaternion(quartenion);
        idealLookat.add(this._params.target.position);
        return idealLookat;
    }

    Update(timeElapsed) {
        if (isNaN(timeElapsed)) {
            return;
        }
        const idealOffset = this._CalculateIdealOffset();
        const idealLookat = this._CalculateIdealLookat();

        const t = 1.0 - Math.pow(0.001, timeElapsed);

        this._currentPosition.lerp(idealOffset, t);
        this._currentLookat.lerp(idealLookat, t);
        this._camera.position.copy(this._currentPosition);
        this._camera.lookAt(this._currentLookat);
    }

}
