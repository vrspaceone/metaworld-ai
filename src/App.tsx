/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CameraPreset, ChatMessage, PlayerData, Vector3D } from './types/game.ts';
import { soundEngine } from './game/audio.ts';
import { animateCharacterRig, CharacterRig, createCharacter } from './game/character.ts';
import { buildNatureWorld, getTerrainHeight, WorldEnvironment } from './game/world.ts';
import { ThirdPersonCamera } from './game/camera.ts';
import { networkManager } from './game/network.ts';
import { RemotePlayerInstance, RemotePlayersManager } from './game/remotePlayers.ts';
import { WorldEntryModal } from './components/WorldEntryModal.tsx';
import { ChatOverlay } from './components/ChatOverlay.tsx';
import { OnlinePlayersModal } from './components/OnlinePlayersModal.tsx';
import { ControlsHelpModal } from './components/ControlsHelpModal.tsx';
import { createNameplateSprite, createSpeechBubbleSprite } from './game/nameplate.ts';
import { ServerConfigModal } from './components/ServerConfigModal.tsx';
import { VirtualJoystick, TouchJumpButton } from './components/VirtualJoystick.tsx';
import { Compass, Server, Users, Volume2, VolumeX, HelpCircle } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  // User State
  const [hasEntered, setHasEntered] = useState(false);
  const hasEnteredRef = useRef(false);
  const [selfNickname, setSelfNickname] = useState('탐험가');
  const [selfColor, setSelfColor] = useState('#3b82f6');
  const [selfId, setSelfId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Mobile / Touch detection
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const touchMoveRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  // UI Modals & State
  const [isChatFocused, setIsChatFocused] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('normal');
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // Game data state for 2D overlays
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [playerList, setPlayerList] = useState<PlayerData[]>([]);
  const [selfPosState, setSelfPosState] = useState<Vector3D>({ x: 0, y: 0, z: 5.5 });
  const [selfSpeechBubble, setSelfSpeechBubble] = useState<string | null>(null);
  const [activeRemotePlayers, setActiveRemotePlayers] = useState<RemotePlayerInstance[]>([]);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  });

  // Three.js References
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const tpCameraRef = useRef<ThirdPersonCamera | null>(null);
  const localRigRef = useRef<CharacterRig | null>(null);
  const remoteMgrRef = useRef<RemotePlayersManager | null>(null);
  const worldEnvRef = useRef<WorldEnvironment | null>(null);

  // Player Kinematics
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 5.5));
  const playerVelocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const playerRotYRef = useRef<number>(Math.PI);
  const isGroundedRef = useRef<boolean>(true);
  const isMovingRef = useRef<boolean>(false);
  const isJumpingRef = useRef<boolean>(false);

  // Input Keys State (Keyboard)
  const keysRef = useRef<{
    w: boolean;
    s: boolean;
    a: boolean;
    d: boolean;
    space: boolean;
  }>({
    w: false,
    s: false,
    a: false,
    d: false,
    space: false,
  });

  // Mouse Orbit Dragging State
  const isMouseDownRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Self speech bubble timer ref
  const selfBubbleTimerRef = useRef<number>(0);

  // Handle entering the world
  const handleJoinWorld = (nickname: string, color: string) => {
    hasEnteredRef.current = true;
    setSelfNickname(nickname);
    setSelfColor(color);
    setHasEntered(true);

    // Initialize local character rig with chosen color and 3D overhead nameplate
    if (localRigRef.current) {
      const scene = localRigRef.current.root.parent as THREE.Scene | null;
      if (scene) {
        if (localRigRef.current.nameplateSprite) {
          localRigRef.current.root.remove(localRigRef.current.nameplateSprite);
          localRigRef.current.nameplateSprite.material.dispose();
        }
        if (localRigRef.current.speechBubbleSprite) {
          localRigRef.current.root.remove(localRigRef.current.speechBubbleSprite);
          localRigRef.current.speechBubbleSprite.material.dispose();
        }
        scene.remove(localRigRef.current.root);
        const newRig = createCharacter(color);
        newRig.root.position.copy(playerPosRef.current);
        newRig.root.rotation.y = playerRotYRef.current;
        const nameplate = createNameplateSprite(nickname, color, true);
        newRig.nameplateSprite = nameplate;
        newRig.root.add(nameplate);
        scene.add(newRig.root);
        localRigRef.current = newRig;
      }
    }

    // Connect and join via Socket.IO
    networkManager.joinWorld(nickname, color);
    soundEngine.startCampfireAmbience();
  };

  // Handle sending chat
  const handleSendMessage = useCallback((text: string) => {
    networkManager.sendChat(text);
    if (localRigRef.current) {
      if (localRigRef.current.speechBubbleSprite) {
        localRigRef.current.root.remove(localRigRef.current.speechBubbleSprite);
        localRigRef.current.speechBubbleSprite.material.dispose();
      }
      const bubble = createSpeechBubbleSprite(text);
      localRigRef.current.speechBubbleSprite = bubble;
      localRigRef.current.speechBubbleTimer = 5.0;
      localRigRef.current.root.add(bubble);
    }
    soundEngine.playChatChime();
  }, []);

  // Handle camera preset change
  const handleSelectPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    tpCameraRef.current?.setPreset(preset);
  };

  // Handle audio mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  };

  // Handle jump trigger for touch and key
  const triggerJump = useCallback(() => {
    if (isGroundedRef.current) {
      playerVelocityRef.current.y = 8.8; // Jump impulse
      isGroundedRef.current = false;
      isJumpingRef.current = true;
      soundEngine.playJump();
    }
  }, []);

  // Initialize Three.js Scene and Game Loop ONCE
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL per Three.js guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene & Environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#bae6fd'); // Soft sky blue
    scene.fog = new THREE.FogExp2('#bae6fd', 0.016); // Horizon fog match

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );
    cameraRef.current = camera;
    const tpCamera = new ThirdPersonCamera(camera);
    tpCameraRef.current = tpCamera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Natural Sunlight Rig (Key + Fill)
    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.8);
    sunLight.position.set(35, 45, 25);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 110;
    sunLight.shadow.camera.left = -35;
    sunLight.shadow.camera.right = 35;
    sunLight.shadow.camera.top = 35;
    sunLight.shadow.camera.bottom = -35;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight('#bae6fd', '#4d7c0f', 0.85);
    scene.add(hemiLight);

    // 4. Build Nature World
    const worldEnv = buildNatureWorld(scene);
    worldEnvRef.current = worldEnv;

    // 5. Build Local Player Character Rig
    const localRig = createCharacter(selfColor);
    localRig.root.position.copy(playerPosRef.current);
    const localNameplate = createNameplateSprite(selfNickname, selfColor, true);
    localRig.nameplateSprite = localNameplate;
    localRig.root.add(localNameplate);
    scene.add(localRig.root);
    localRigRef.current = localRig;

    // 6. Build Remote Players Manager
    const remoteMgr = new RemotePlayersManager(scene);
    remoteMgrRef.current = remoteMgr;

    // 7. Network Event Subscriptions
    networkManager.connect();
    networkManager.onConnectionChange((connected) => setIsConnected(connected));
    setIsConnected(networkManager.isConnected);

    networkManager.onWorldInit((data) => {
      setSelfId(data.selfId);
      setChatMessages(data.chatHistory || []);

      // Add existing remote players
      data.players.forEach((p) => {
        if (p.id !== data.selfId) {
          remoteMgr.addPlayer(p);
        }
      });
      setPlayerList(data.players);
      setActiveRemotePlayers(Array.from(remoteMgr.players.values()));
    });

    networkManager.onPlayerJoined((player) => {
      if (player.id !== networkManager.selfId) {
        remoteMgr.addPlayer(player);
        setPlayerList((prev) => [...prev.filter((p) => p.id !== player.id), player]);
        setActiveRemotePlayers(Array.from(remoteMgr.players.values()));
      }
    });

    networkManager.onPlayerMoved((data) => {
      remoteMgr.updatePlayerTransform(
        data.id,
        data.position,
        data.rotationY,
        data.isMoving,
        data.isJumping
      );
    });

    networkManager.onPlayerLeft((data) => {
      remoteMgr.removePlayer(data.id);
      setPlayerList((prev) => prev.filter((p) => p.id !== data.id));
      setActiveRemotePlayers(Array.from(remoteMgr.players.values()));
    });

    networkManager.onChatMessage((msg) => {
      setChatMessages((prev) => [...prev, msg]);
      soundEngine.playChatChime();

      // If remote player sent message, attach speech bubble
      if (msg.playerId !== networkManager.selfId && msg.playerId !== 'system') {
        remoteMgr.setSpeechBubble(msg.playerId, msg.text);
        setActiveRemotePlayers(Array.from(remoteMgr.players.values()));
      }
    });

    // 8. Event Listeners for Movement & Camera (Keyboard)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsChatFocused((prev) => !prev);
        return;
      }

      if (isChatFocused || isPlayersModalOpen || isHelpModalOpen || isServerModalOpen) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.w = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.s = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.a = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.d = true;
          break;
        case 'Space':
          if (!keysRef.current.space) {
            keysRef.current.space = true;
            triggerJump();
          }
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keysRef.current.w = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keysRef.current.s = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keysRef.current.a = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keysRef.current.d = false;
          break;
        case 'Space':
          keysRef.current.space = false;
          break;
      }
    };

    // Mouse Listeners
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      tpCamera.rotate(dx, dy);
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      tpCamera.zoom(e.deltaY);
    };

    // Touch Listeners on Canvas (1-finger camera orbit, 2-finger pinch zoom)
    let lastTouchPos: { x: number; y: number } | null = null;
    let lastPinchDist: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target !== renderer.domElement) return;

      if (e.touches.length === 1) {
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastPinchDist = null;
      } else if (e.touches.length === 2) {
        lastTouchPos = null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.target !== renderer.domElement) return;

      if (e.touches.length === 1 && lastTouchPos) {
        const dx = e.touches[0].clientX - lastTouchPos.x;
        const dy = e.touches[0].clientY - lastTouchPos.y;
        lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        tpCamera.rotate(dx * 1.25, dy * 1.25);
      } else if (e.touches.length === 2 && lastPinchDist !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const deltaDist = currentDist - lastPinchDist;
        lastPinchDist = currentDist;
        tpCamera.zoom(-deltaDist * 14);
      }
    };

    const handleTouchEnd = () => {
      lastTouchPos = null;
      lastPinchDist = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    const domCanvas = renderer.domElement;
    domCanvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    domCanvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    domCanvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    domCanvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      setViewportSize({ width, height });
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);

    // 9. Main Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();
    let syncTickAccumulator = 0;
    let billboardSyncAccumulator = 0;

    const tick = () => {
      const delta = Math.min(0.1, clock.getDelta());
      const elapsedTime = clock.getElapsedTime();

      // A. Local Player Movement & Physics
      if (hasEnteredRef.current && !isChatFocused) {
        const { w, s, a, d } = keysRef.current;
        const tMove = touchMoveRef.current;

        // Combine Keyboard + Virtual Touch Joystick
        let moveX = tMove.x;
        let moveZ = tMove.z;

        if (w) moveZ -= 1;
        if (s) moveZ += 1;
        if (a) moveX -= 1;
        if (d) moveX += 1;

        const isMoving = Math.abs(moveX) > 0.05 || Math.abs(moveZ) > 0.05;
        isMovingRef.current = isMoving;

        if (isMoving) {
          // Clamp/normalize input magnitude
          const len = Math.hypot(moveX, moveZ);
          if (len > 1) {
            moveX /= len;
            moveZ /= len;
          }

          // Camera azimuth relative direction
          const camAngle = tpCamera.theta;
          const worldMoveX = moveX * Math.cos(camAngle) + moveZ * Math.sin(camAngle);
          const worldMoveZ = -moveX * Math.sin(camAngle) + moveZ * Math.cos(camAngle);

          // Turn character smoothly towards movement direction
          const targetRot = Math.atan2(worldMoveX, worldMoveZ);
          let rotDiff = (targetRot - playerRotYRef.current) % (Math.PI * 2);
          if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
          if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
          playerRotYRef.current += rotDiff * Math.min(1, delta * 15);

          // Apply move speed
          const speed = 7.5;
          playerPosRef.current.x += worldMoveX * speed * delta;
          playerPosRef.current.z += worldMoveZ * speed * delta;

          // Sound
          if (isGroundedRef.current) {
            soundEngine.playStep();
          }
        }

        // Gravity & Jump Physics
        const gravity = 22.0;
        playerVelocityRef.current.y -= gravity * delta;
        playerPosRef.current.y += playerVelocityRef.current.y * delta;

        // Ground Height Check
        const groundY = getTerrainHeight(playerPosRef.current.x, playerPosRef.current.z);
        if (playerPosRef.current.y <= groundY) {
          playerPosRef.current.y = groundY;
          playerVelocityRef.current.y = 0;
          isGroundedRef.current = true;
          isJumpingRef.current = false;
        }

        // Clamp to world radius ~55 units
        const distFromCenter = Math.hypot(playerPosRef.current.x, playerPosRef.current.z);
        if (distFromCenter > 54) {
          const ratio = 54 / distFromCenter;
          playerPosRef.current.x *= ratio;
          playerPosRef.current.z *= ratio;
        }

        // Update local character rig
        if (localRigRef.current) {
          localRigRef.current.root.position.copy(playerPosRef.current);
          localRigRef.current.root.rotation.y = playerRotYRef.current;
          animateCharacterRig(
            localRigRef.current,
            delta,
            isMoving,
            !isGroundedRef.current
          );
        }

        // Campfire audio proximity
        soundEngine.updateCampfireProximity(distFromCenter);

        // Network replication tick (every ~40ms)
        syncTickAccumulator += delta;
        if (syncTickAccumulator >= 0.04) {
          syncTickAccumulator = 0;
          networkManager.sendMovement(
            playerPosRef.current,
            playerRotYRef.current,
            isMoving,
            !isGroundedRef.current
          );
        }

        // Update local 3D speech bubble timeout
        if (localRigRef.current?.speechBubbleSprite && localRigRef.current.speechBubbleTimer !== undefined) {
          localRigRef.current.speechBubbleTimer -= delta;
          if (localRigRef.current.speechBubbleTimer <= 0) {
            localRigRef.current.root.remove(localRigRef.current.speechBubbleSprite);
            localRigRef.current.speechBubbleSprite.material.dispose();
            localRigRef.current.speechBubbleSprite = undefined;
          }
        }

        // Periodic state sync for 2D UI overlay (distance etc)
        setSelfPosState({
          x: playerPosRef.current.x,
          y: playerPosRef.current.y,
          z: playerPosRef.current.z,
        });
      }

      // B. Update Remote Players
      remoteMgr.update(delta);

      // Keep active remote players synced for 2D billboard labels
      billboardSyncAccumulator += delta;
      if (billboardSyncAccumulator >= 0.08) {
        billboardSyncAccumulator = 0;
        if (remoteMgr.players.size > 0 || activeRemotePlayers.length > 0) {
          setActiveRemotePlayers(Array.from(remoteMgr.players.values()));
        }
      }

      // C. Update World (Flames, Water)
      worldEnv.update(delta, elapsedTime);

      // D. Update Camera Follow
      tpCamera.update(playerPosRef.current, delta);

      // Render
      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      domCanvas.removeEventListener('touchstart', handleTouchStart);
      domCanvas.removeEventListener('touchmove', handleTouchMove);
      domCanvas.removeEventListener('touchend', handleTouchEnd);
      domCanvas.removeEventListener('touchcancel', handleTouchEnd);

      networkManager.disconnect();
      remoteMgr.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [triggerJump]); // Mounted once, never torn down on join

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing canvas-container"
      />

      {/* Top Bar Header (Zone 1: Brand, Zone 2: Single-line context, Zone 3: Status) */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 sm:py-4 pointer-events-none">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-1.5 shadow-lg">
          <div className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center">
            <Compass className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="hidden sm:inline text-sm font-bold tracking-tight text-white whitespace-nowrap">
            Meta World
          </span>
          <span className="hidden sm:inline text-xs text-slate-400 font-medium">자연 프로토타입</span>
        </div>

        {/* Zone 3: Primary Action & Player status */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-1.5 rounded-xl border transition-all ${
              isMuted
                ? 'bg-red-950/60 border-red-800/60 text-red-400 hover:bg-red-900/60'
                : 'bg-slate-900/80 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Online Players Button */}
          {hasEntered && (
            <button
              onClick={() => setIsPlayersModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl shadow-lg text-[11px] font-medium text-slate-200 transition-colors"
              title="접속자 목록"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">접속자</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono font-semibold">
                {playerList.length}
              </span>
            </button>
          )}

          {/* Controls Help */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="조작 안내"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Connection status button */}
          <button
            onClick={() => setIsServerModalOpen(true)}
            className="px-2.5 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 rounded-xl shadow-lg text-[11px] font-mono flex items-center gap-1.5 transition-colors"
            title="게임 서버 설정 및 연결 확인"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className={isConnected ? 'text-emerald-300' : 'text-amber-300'}>
              {isConnected ? '온라인' : '연결 대기중'}
            </span>
            <Server className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>
      </header>

      {/* Mobile On-Screen Virtual Touch Controls */}
      {hasEntered && isTouchDevice && (
        <>
          {/* Left: Virtual Joystick */}
          <div className="fixed bottom-6 left-6 z-30 pointer-events-auto">
            <VirtualJoystick
              onMove={(move) => {
                touchMoveRef.current = move;
              }}
            />
          </div>

          {/* Right: Touch Jump Button */}
          <div className="fixed bottom-8 right-6 z-30 pointer-events-auto">
            <TouchJumpButton onJump={triggerJump} />
          </div>
        </>
      )}

      {/* Initial Entry Modal */}
      {!hasEntered && (
        <WorldEntryModal
          onJoin={handleJoinWorld}
          isConnected={isConnected}
          onOpenServerConfig={() => setIsServerModalOpen(true)}
        />
      )}

      {/* Real-Time Chat Overlay (Responsive Desktop Card + Mobile Slide Drawer) */}
      {hasEntered && (
        <ChatOverlay
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          selfNickname={selfNickname}
          isChatFocused={isChatFocused}
          setIsChatFocused={setIsChatFocused}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />
      )}

      {/* Online Players Modal */}
      <OnlinePlayersModal
        isOpen={isPlayersModalOpen}
        onClose={() => setIsPlayersModalOpen(false)}
        selfId={selfId}
        selfPos={selfPosState}
        players={playerList}
      />

      {/* Controls Help Modal */}
      <ControlsHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Server Config Modal */}
      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        isConnected={isConnected}
      />
    </div>
  );
}
