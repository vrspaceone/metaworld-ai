/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CameraPreset } from '../types/game.ts';
import { PLANET_RADIUS } from './world.ts';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  
  // Camera offset relative to the target's head position in world space
  private offset = new THREE.Vector3(0, 4.5, 6.5);
  private previousTargetPos = new THREE.Vector3(0, PLANET_RADIUS, 0);
  private currentLookAt = new THREE.Vector3(0, PLANET_RADIUS + 1.2, 0);

  public distance: number = 7.0;
  public targetHeight: number = 1.35;
  public phi: number = 0.42; // vertical pitch above tangent plane
  public theta: number = 0;   // for network sync / telemetry compatibility

  private presetConfigs: Record<CameraPreset, { distance: number; height: number; phi: number }> = {
    close: { distance: 4.2, height: 1.35, phi: 0.32 },
    normal: { distance: 7.0, height: 1.35, phi: 0.42 },
    far: { distance: 11.5, height: 1.5, phi: 0.52 },
    top: { distance: 16.5, height: 1.2, phi: 1.15 },
  };

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.offset.setLength(this.distance);
  }

  public setPreset(preset: CameraPreset) {
    const config = this.presetConfigs[preset];
    if (config) {
      this.distance = config.distance;
      this.targetHeight = config.height;
      this.phi = config.phi;
      this.offset.setLength(this.distance);
    }
  }

  /**
   * Continuous mouse/touch rotation without coordinate singularities.
   */
  public rotate(deltaX: number, deltaY: number) {
    const up = this.previousTargetPos.clone().normalize();
    if (up.lengthSq() < 0.1) up.set(0, 1, 0);

    // 1. Horizontal rotation around local planet surface normal (up)
    const horizAngle = -deltaX * 0.0035;
    this.offset.applyAxisAngle(up, horizAngle);
    this.theta += horizAngle;

    // 2. Vertical pitch around camera right axis
    const camRight = new THREE.Vector3().crossVectors(this.offset, up).normalize();
    if (camRight.lengthSq() > 0.01) {
      const pitchAngle = deltaY * 0.0035;
      const testOffset = this.offset.clone().applyAxisAngle(camRight, pitchAngle);

      // Ensure camera stays above the tangent plane (pitch between 8° and 82°)
      const normTest = testOffset.clone().normalize();
      const dotUp = normTest.dot(up); // dot is sin(pitch)
      if (dotUp >= 0.12 && dotUp <= 0.96) {
        this.offset.copy(testOffset);
      }
    }

    this.offset.setLength(this.distance);
  }

  public zoom(deltaZoom: number) {
    this.distance = Math.max(3.2, Math.min(22, this.distance + deltaZoom * 0.004));
    this.offset.setLength(this.distance);
  }

  /**
   * Returns continuous tangent movement vectors (forward, right)
   * on the sphere surface relative to the camera's current viewing direction.
   * Completely continuous with ZERO singularities across the entire globe!
   */
  public getMovementVectors(targetPos: THREE.Vector3): {
    up: THREE.Vector3;
    forward: THREE.Vector3;
    right: THREE.Vector3;
  } {
    const up = targetPos.clone().normalize();
    if (up.lengthSq() < 0.1) up.set(0, 1, 0);

    // Vector from camera to player
    const camToTarget = targetPos.clone().sub(this.camera.position);

    // Project onto tangent plane orthogonal to local up
    const forward = camToTarget.clone().sub(up.clone().multiplyScalar(camToTarget.dot(up))).normalize();
    if (forward.lengthSq() < 0.01) {
      // Degenerate top-down edge case
      const fallback = Math.abs(up.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
      forward.crossVectors(fallback, up).normalize();
    }

    // Right vector on the tangent plane
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    return { up, forward, right };
  }

  /**
   * Updates camera position and orientation using parallel transport
   * to guarantee perfectly smooth traversal across the entire sphere.
   */
  public update(targetPos: THREE.Vector3, delta: number) {
    const currUp = targetPos.clone().normalize();
    if (currUp.lengthSq() < 0.1) currUp.set(0, 1, 0);

    const prevUp = this.previousTargetPos.clone().normalize();
    if (prevUp.lengthSq() < 0.1) prevUp.set(0, 1, 0);

    // Parallel transport camera offset vector along sphere geodesic
    if (prevUp.distanceToSquared(currUp) > 0.000001) {
      const qTransport = new THREE.Quaternion().setFromUnitVectors(prevUp, currUp);
      this.offset.applyQuaternion(qTransport);
    }
    this.previousTargetPos.copy(targetPos);
    this.offset.setLength(this.distance);

    // Ideal look-at (character head/chest along normal)
    const idealLookAt = targetPos.clone().addScaledVector(currUp, this.targetHeight);

    // Ideal camera position
    const idealCamPos = idealLookAt.clone().add(this.offset);

    // Ensure camera stays above the planet surface with safe margin
    const minCamRadius = PLANET_RADIUS + 1.2;
    if (idealCamPos.length() < minCamRadius) {
      idealCamPos.setLength(minCamRadius);
    }

    // Smooth exponential damping
    const dampSpeed = Math.min(1, delta * 15);
    this.camera.position.lerp(idealCamPos, dampSpeed);
    this.currentLookAt.lerp(idealLookAt, dampSpeed);

    // Camera up aligns with planet normal
    this.camera.up.lerp(currUp, dampSpeed).normalize();
    this.camera.lookAt(this.currentLookAt);
  }
}
