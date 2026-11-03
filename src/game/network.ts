import { io, Socket } from 'socket.io-client';
import { ChatMessage, PlayerData, Vector3D } from '../types/game.ts';

export class NetworkManager {
  private socket: Socket | null = null;
  public selfId: string | null = null;
  public isConnected: boolean = false;
  public lastJoinData: { nickname: string; color: string } | null = null;
  public currentServerUrl: string = '';

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

  public getServerUrl(): string {
    if (typeof window === 'undefined') return '';
    // Priority: 1. localStorage override, 2. VITE_SOCKET_URL env, 3. window.location.origin
    const stored = localStorage.getItem('meta_world_socket_url');
    if (stored && stored.trim()) {
      return stored.trim();
    }
    const envUrl = import.meta.env.VITE_SOCKET_URL;
    if (envUrl && envUrl.trim()) {
      return envUrl.trim();
    }
    return '';
  }

  public setCustomServerUrl(url: string) {
    if (typeof window === 'undefined') return;
    const cleanUrl = url.trim();
    if (cleanUrl) {
      localStorage.setItem('meta_world_socket_url', cleanUrl);
    } else {
      localStorage.removeItem('meta_world_socket_url');
    }
    // Reconnect with new URL
    this.disconnect();
    this.connect();
    if (this.lastJoinData) {
      this.joinWorld(this.lastJoinData.nickname, this.lastJoinData.color);
    }
  }

  public connect() {
    if (this.socket) return;

    const serverUrl = this.getServerUrl();
    this.currentServerUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : '');

    console.log('[MetaWorld Network] Connecting to Socket.IO server at:', this.currentServerUrl);

    this.socket = serverUrl
      ? io(serverUrl, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 20,
          reconnectionDelay: 1500,
        })
      : io({
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 20,
          reconnectionDelay: 1500,
        });

    this.socket.on('connect', () => {
      console.log('[MetaWorld Network] Connected successfully, socket.id:', this.socket?.id);
      this.isConnected = true;
      this.notifyConnection(true);

      // Automatically re-join if user was already in the world
      if (this.lastJoinData) {
        console.log('[MetaWorld Network] Emitting player:join with:', this.lastJoinData);
        this.socket?.emit('player:join', this.lastJoinData);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[MetaWorld Network] Disconnected:', reason);
      this.isConnected = false;
      this.notifyConnection(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[MetaWorld Network] Connection error:', err.message);
      this.isConnected = false;
      this.notifyConnection(false);
    });

    this.socket.on('init:world', (data: { selfId: string; players: PlayerData[]; chatHistory: ChatMessage[] }) => {
      console.log('[MetaWorld Network] init:world received, total players:', data.players.length);
      this.selfId = data.selfId;
      this.onWorldInitCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('player:joined', (player: PlayerData) => {
      console.log('[MetaWorld Network] player:joined received:', player.nickname, player.id);
      this.onPlayerJoinedCallbacks.forEach(cb => cb(player));
    });

    this.socket.on('player:moved', (data) => {
      this.onPlayerMovedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('player:left', (data) => {
      console.log('[MetaWorld Network] player:left received:', data.id);
      this.onPlayerLeftCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('chat:message', (msg: ChatMessage) => {
      this.onChatMessageCallbacks.forEach(cb => cb(msg));
    });
  }

  public joinWorld(nickname: string, color: string) {
    this.lastJoinData = { nickname, color };

    if (!this.socket) {
      this.connect();
    }

    if (this.socket && this.isConnected) {
      console.log('[MetaWorld Network] Directly emitting player:join:', this.lastJoinData);
      this.socket.emit('player:join', this.lastJoinData);
    } else {
      console.log('[MetaWorld Network] Socket connecting... player:join will emit on connect');
    }
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
