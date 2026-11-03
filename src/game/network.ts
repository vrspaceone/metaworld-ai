import { io, Socket } from 'socket.io-client';
import { ChatMessage, PlayerData, Vector3D } from '../types/game.ts';

export class NetworkManager {
  private socket: Socket | null = null;
  public selfId: string | null = null;
  public isConnected: boolean = false;

  private onWorldInitCallbacks: ((data: { selfId: string; players: PlayerData[]; chatHistory: ChatMessage[] }) => void)[] = [];
  private onPlayerJoinedCallbacks: ((player: PlayerData) => void)[] = [];
  private onPlayerMovedCallbacks: ((data: {
    id: string;
    position: Vector3D;
    rotationY: number;
    isMoving: boolean;
    isJumping: boolean;
  }) => void)[] = [];
  private onPlayerLeftCallbacks: ((data: { id: string }) => void)[] = [];
  private onChatMessageCallbacks: ((msg: ChatMessage) => void)[] = [];
  private onConnectionChangeCallbacks: ((connected: boolean) => void)[] = [];

  private lastMoveSendTime: number = 0;
  private moveIntervalMs: number = 40; // ~25 updates per second

  public connect() {
    if (this.socket) return;

    // Connect to external backend server if configured, otherwise current origin
    const socketUrl = import.meta.env.VITE_SOCKET_URL || undefined;
    this.socket = socketUrl
      ? io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        })
      : io({
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.notifyConnection(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.notifyConnection(false);
    });

    this.socket.on('init:world', (data: { selfId: string; players: PlayerData[]; chatHistory: ChatMessage[] }) => {
      this.selfId = data.selfId;
      this.onWorldInitCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('player:joined', (player: PlayerData) => {
      this.onPlayerJoinedCallbacks.forEach(cb => cb(player));
    });

    this.socket.on('player:moved', (data) => {
      this.onPlayerMovedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('player:left', (data) => {
      this.onPlayerLeftCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('chat:message', (msg: ChatMessage) => {
      this.onChatMessageCallbacks.forEach(cb => cb(msg));
    });
  }

  public joinWorld(nickname: string, color: string) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit('player:join', { nickname, color });
  }

  public sendMovement(pos: Vector3D, rotationY: number, isMoving: boolean, isJumping: boolean, force: boolean = false) {
    if (!this.socket || !this.isConnected) return;
    const now = performance.now();
    if (!force && now - this.lastMoveSendTime < this.moveIntervalMs) {
      return;
    }
    this.lastMoveSendTime = now;

    this.socket.emit('player:move', {
      position: {
        x: Math.round(pos.x * 100) / 100,
        y: Math.round(pos.y * 100) / 100,
        z: Math.round(pos.z * 100) / 100,
      },
      rotationY: Math.round(rotationY * 1000) / 1000,
      isMoving,
      isJumping,
    });
  }

  public sendChat(text: string) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('chat:send', { text });
  }

  public onWorldInit(cb: (data: { selfId: string; players: PlayerData[]; chatHistory: ChatMessage[] }) => void) {
    this.onWorldInitCallbacks.push(cb);
  }

  public onPlayerJoined(cb: (player: PlayerData) => void) {
    this.onPlayerJoinedCallbacks.push(cb);
  }

  public onPlayerMoved(cb: (data: {
    id: string;
    position: Vector3D;
    rotationY: number;
    isMoving: boolean;
    isJumping: boolean;
  }) => void) {
    this.onPlayerMovedCallbacks.push(cb);
  }

  public onPlayerLeft(cb: (data: { id: string }) => void) {
    this.onPlayerLeftCallbacks.push(cb);
  }

  public onChatMessage(cb: (msg: ChatMessage) => void) {
    this.onChatMessageCallbacks.push(cb);
  }

  public onConnectionChange(cb: (connected: boolean) => void) {
    this.onConnectionChangeCallbacks.push(cb);
  }

  private notifyConnection(state: boolean) {
    this.onConnectionChangeCallbacks.forEach(cb => cb(state));
  }

  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
  }
}

export const networkManager = new NetworkManager();
