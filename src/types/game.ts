export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PlayerData {
  id: string;
  nickname: string;
  color: string;
  position: Vector3D;
  rotationY: number;
  isMoving: boolean;
  isJumping: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  color: string;
  text: string;
  timestamp: number;
}

export interface WorldConfig {
  gravity: number;
  walkSpeed: number;
  runSpeed: number;
  jumpVelocity: number;
  worldRadius: number;
}

export type CameraPreset = 'close' | 'normal' | 'far' | 'top';
