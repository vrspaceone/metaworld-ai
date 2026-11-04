/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface WorldEnvironment {
  scene: THREE.Scene;
  asteroidMesh: THREE.Mesh;
  sunMesh: THREE.Mesh;
  roseLight: THREE.PointLight;
  volcano1Light: THREE.PointLight;
  volcano2Light: THREE.PointLight;
  flameMeshes: THREE.Mesh[];
  roseSparkles: THREE.Points;
  starsPoints: THREE.Points;
  getPlanetRadius: (surfacePoint: THREE.Vector3) => number;
  update: (delta: number, time: number) => void;
}

// Asteroid B612 physical radius
export const PLANET_RADIUS = 14.0;

// Land-mark spherical positions (expressed as normalized directions from origin)
// 1. The Rose (North-East quadrant)
export const ROSE_DIR = new THREE.Vector3(0.55, 0.72, 0.42).normalize();

// 2. The Sunset Chair (Equatorial rim facing the Sun)
export const CHAIR_DIR = new THREE.Vector3(0.72, 0.25, -0.65).normalize();

// 3. Volcano 1 (Active Large - North-West quadrant)
export const VOLCANO_1_DIR = new THREE.Vector3(-0.58, 0.75, 0.31).normalize();

// 4. Volcano 2 (Active Small - West-South quadrant)
export const VOLCANO_2_DIR = new THREE.Vector3(-0.82, 0.15, -0.55).normalize();

// 5. Volcano 3 (Extinct - South hemisphere)
export const VOLCANO_3_DIR = new THREE.Vector3(-0.35, -0.65, -0.67).normalize();

// 6. Sheep Box (Near Rose)
export const SHEEP_BOX_DIR = new THREE.Vector3(0.25, 0.88, 0.39).normalize();

// 7. Sun position in deep space
export const SUN_POSITION = new THREE.Vector3(65, 22, -45);

/**
 * Calculates the exact surface radius of Asteroid B612 along a given radial direction.
 * Base sphere radius is 14.0, with subtle crater basins, volcanic cones, and planetary noise.
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function getPlanetRadius(posOrDir: THREE.Vector3): number {
  const dir = posOrDir.clone().normalize();
  let r = PLANET_RADIUS;

  // Volcano 1 Cone elevation (smooth C1 curve)
  const angleV1 = dir.angleTo(VOLCANO_1_DIR);
  if (angleV1 < 0.28) {
    const factor = 1 - smoothstep(0, 0.28, angleV1);
    const hollow = angleV1 < 0.08 ? (1 - smoothstep(0, 0.08, angleV1)) * 0.65 : 0;
    r += factor * 1.8 - hollow;
  }

  // Volcano 2 Cone elevation (smooth C1 curve)
  const angleV2 = dir.angleTo(VOLCANO_2_DIR);
  if (angleV2 < 0.22) {
    const factor = 1 - smoothstep(0, 0.22, angleV2);
    const hollow = angleV2 < 0.06 ? (1 - smoothstep(0, 0.06, angleV2)) * 0.5 : 0;
    r += factor * 1.4 - hollow;
  }

  // Volcano 3 Cone elevation (smooth C1 curve)
  const angleV3 = dir.angleTo(VOLCANO_3_DIR);
  if (angleV3 < 0.20) {
    const factor = 1 - smoothstep(0, 0.20, angleV3);
    const hollow = angleV3 < 0.05 ? (1 - smoothstep(0, 0.05, angleV3)) * 0.4 : 0;
    r += factor * 1.2 - hollow;
  }

  // Rose pedestal rise
  const angleRose = dir.angleTo(ROSE_DIR);
  if (angleRose < 0.18) {
    r += (1 - smoothstep(0, 0.18, angleRose)) * 0.35;
  }

  // Gentle planetary micro-craters
  r += Math.sin(dir.x * 6) * Math.cos(dir.z * 6) * 0.14;
  r += Math.sin(dir.y * 8 + dir.x * 4) * 0.1;

  return r;
}

/**
 * Convenience height function for compatible ground checks:
 * Returns the surface position vector on the sphere.
 */
export function getGroundPosition(currentPos: THREE.Vector3): THREE.Vector3 {
  const dir = currentPos.clone().normalize();
  const radius = getPlanetRadius(dir);
  return dir.multiplyScalar(radius);
}

/**
 * Legacy terrain height adapter for 2D UI or distance utilities
 */
export function getTerrainHeight(x: number, z: number): number {
  const dir = new THREE.Vector3(x, 0, z).normalize();
  return getPlanetRadius(dir) - PLANET_RADIUS;
}

/**
 * Builds the Little Prince's true 3D spherical Asteroid B612.
 */
export function buildNatureWorld(scene: THREE.Scene): WorldEnvironment {
  // 1. Full 3D Spherical Asteroid Planetoid Mesh
  const detail = 46;
  const sphereGeo = new THREE.SphereGeometry(PLANET_RADIUS, detail, detail);

  const posAttr = sphereGeo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  // Palette colors for Asteroid B612
  const sandGold = new THREE.Color('#d4b483');       // Warm Stardust lunar soil
  const asteroidRock = new THREE.Color('#8c7359');   // Weathered asteroid rock
  const darkBasalt = new THREE.Color('#2d2621');     // Volcanic basalt
  const roseGardenMoss = new THREE.Color('#588157'); // Verdant moss near the rose
  const craterShade = new THREE.Color('#5e4d3c');

  const tmpColor = new THREE.Color();
  const vertexVec = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    vertexVec.fromBufferAttribute(posAttr, i);
    const dir = vertexVec.clone().normalize();
    const radius = getPlanetRadius(dir);

    // Displace vertex along normal to create craters and volcanic peaks
    vertexVec.copy(dir).multiplyScalar(radius);
    posAttr.setXYZ(i, vertexVec.x, vertexVec.y, vertexVec.z);

    // Color based on landmarks
    const dRose = dir.angleTo(ROSE_DIR);
    const dV1 = dir.angleTo(VOLCANO_1_DIR);
    const dV2 = dir.angleTo(VOLCANO_2_DIR);
    const dV3 = dir.angleTo(VOLCANO_3_DIR);

    if (dV1 < 0.28 || dV2 < 0.22 || dV3 < 0.20) {
      tmpColor.copy(darkBasalt).lerp(asteroidRock, Math.min(1, Math.min(dV1, dV2, dV3) / 0.28));
    } else if (dRose < 0.22) {
      tmpColor.copy(roseGardenMoss).lerp(sandGold, dRose / 0.22);
    } else {
      const noise = (Math.sin(dir.x * 12) * Math.cos(dir.z * 12) + 1) * 0.2;
      tmpColor.copy(sandGold).lerp(asteroidRock, noise);
      if (Math.sin(dir.y * 14) > 0.6) {
        tmpColor.lerp(craterShade, 0.4);
      }
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  sphereGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  sphereGeo.computeVertexNormals();

  const asteroidMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.05,
    flatShading: true,
  });

  const asteroidMesh = new THREE.Mesh(sphereGeo, asteroidMat);
  asteroidMesh.receiveShadow = true;
  asteroidMesh.castShadow = true;
  scene.add(asteroidMesh);

  // 2. 360-Degree Deep Space Starfield
  const starCount = 1800;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const starColorPalette = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#fef08a'),
    new THREE.Color('#93c5fd'),
    new THREE.Color('#f472b6'),
    new THREE.Color('#c084fc'),
  ];

  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 80 + Math.random() * 80;

    const sinPhi = Math.sin(phi);
    starPositions[i * 3] = r * sinPhi * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * sinPhi * Math.sin(theta);

    const c = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 1.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
  });
  const starsPoints = new THREE.Points(starGeo, starMat);
  scene.add(starsPoints);

  // 3. The Setting Sun in Deep Space (어린 왕자가 44번 본 일몰의 태양)
  const sunGroup = new THREE.Group();
  sunGroup.position.copy(SUN_POSITION);

  const sunGeo = new THREE.SphereGeometry(4.2, 24, 24);
  const sunMat = new THREE.MeshBasicMaterial({ color: '#ffedd5' });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);

  // Golden Sun atmospheric corona glow
  const sunGlowGeo = new THREE.SphereGeometry(6.5, 24, 24);
  const sunGlowMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    transparent: true,
    opacity: 0.28,
    side: THREE.BackSide,
  });
  sunGroup.add(new THREE.Mesh(sunGlowGeo, sunGlowMat));
  scene.add(sunGroup);

  // Directional Sun lighting across the sphere
  const sunLight = new THREE.DirectionalLight('#fffbeb', 2.2);
  sunLight.position.copy(SUN_POSITION);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 160;
  sunLight.shadow.camera.left = -22;
  sunLight.shadow.camera.right = 22;
  sunLight.shadow.camera.top = 22;
  sunLight.shadow.camera.bottom = -22;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Ambient cosmic starlight
  const ambientLight = new THREE.HemisphereLight('#67e8f9', '#451a03', 0.9);
  scene.add(ambientLight);

  // Helper to place and orient any object radially onto the sphere
  const attachToSphere = (object: THREE.Object3D, dir: THREE.Vector3, heightOffset: number = 0) => {
    const normal = dir.clone().normalize();
    const surfaceRadius = getPlanetRadius(normal);
    const pos = normal.clone().multiplyScalar(surfaceRadius + heightOffset);
    object.position.copy(pos);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  };

  // 4. The Rose in the Glass Cloche (유리 돔 속의 장미)
  const roseGroup = new THREE.Group();

  // Stone Pedestal
  const stoneMat = new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    roughness: 0.75,
    flatShading: true,
  });
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.22, 12), stoneMat);
  base1.position.y = 0.11;
  base1.castShadow = true;
  base1.receiveShadow = true;
  roseGroup.add(base1);

  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.68, 0.18, 12), stoneMat);
  base2.position.y = 0.3;
  base2.castShadow = true;
  base2.receiveShadow = true;
  roseGroup.add(base2);

  // Stem & Leaves
  const stemMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.7 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), stemMat);
  stem.position.y = 0.58;
  roseGroup.add(stem);

  const leafGeo = new THREE.BoxGeometry(0.14, 0.02, 0.07);
  const leaf1 = new THREE.Mesh(leafGeo, stemMat);
  leaf1.position.set(0.08, 0.52, 0);
  leaf1.rotation.z = -0.4;
  roseGroup.add(leaf1);

  const leaf2 = new THREE.Mesh(leafGeo, stemMat);
  leaf2.position.set(-0.08, 0.58, 0);
  leaf2.rotation.z = 0.4;
  roseGroup.add(leaf2);

  // Blooming Red Petals
  const petalMat = new THREE.MeshStandardMaterial({
    color: '#e11d48',
    roughness: 0.45,
    metalness: 0.1,
  });
  const roseCore = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), petalMat);
  roseCore.position.y = 0.82;
  roseGroup.add(roseCore);

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const petalGeo = new THREE.SphereGeometry(0.085, 6, 6);
    petalGeo.scale(1, 0.6, 0.4);
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(angle) * 0.085, 0.82, Math.sin(angle) * 0.085);
    petal.rotation.y = angle;
    petal.rotation.x = 0.3;
    roseGroup.add(petal);
  }

  // The Glass Cloche
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#f8fafc',
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    transmission: 0.88,
    ior: 1.45,
    reflectivity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const glassBody = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.9, 20, 1, true), glassMat);
  glassBody.position.y = 0.82;
  roseGroup.add(glassBody);

  const glassDome = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
  glassDome.position.y = 1.27;
  roseGroup.add(glassDome);

  const brassMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.8, roughness: 0.2 });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), brassMat);
  knob.position.y = 1.74;
  roseGroup.add(knob);

  // Soft romantic Rose Light
  const roseLight = new THREE.PointLight('#f43f5e', 2.8, 8.0, 1.5);
  roseLight.position.set(0, 0.9, 0);
  roseGroup.add(roseLight);

  // Rose Sparkle Stardust particles
  const sparkleCount = 16;
  const sparkleGeo = new THREE.BufferGeometry();
  const sparklePos = new Float32Array(sparkleCount * 3);
  for (let i = 0; i < sparkleCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = 0.5 + Math.random() * 0.6;
    sparklePos[i * 3] = Math.cos(a) * rad;
    sparklePos[i * 3 + 1] = 0.35 + Math.random() * 1.1;
    sparklePos[i * 3 + 2] = Math.sin(a) * rad;
  }
  sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
  const roseSparkles = new THREE.Points(
    sparkleGeo,
    new THREE.PointsMaterial({ color: '#fda4af', size: 0.32, transparent: true, opacity: 0.85 })
  );
  roseGroup.add(roseSparkles);

  // Watering can
  const canMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.5 });
  const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.24, 8), canMat);
  canBody.position.set(-0.7, 0.12, 0.25);
  canBody.castShadow = true;
  roseGroup.add(canBody);

  const canSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.22, 6), canMat);
  canSpout.position.set(-0.84, 0.2, 0.25);
  canSpout.rotation.z = 0.7;
  roseGroup.add(canSpout);

  attachToSphere(roseGroup, ROSE_DIR);
  scene.add(roseGroup);

  // 5. The Sunset Viewing Chair (일몰을 보는 의자)
  const chairGroup = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.75, flatShading: true });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.48), woodMat);
  seat.position.y = 0.42;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chairGroup.add(seat);

  for (const lx of [-0.2, 0.2]) {
    for (const lz of [-0.18, 0.18]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.42, 6), woodMat);
      leg.position.set(lx, 0.21, lz);
      leg.castShadow = true;
      chairGroup.add(leg);
    }
  }

  for (const rx of [-0.2, 0.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.52, 6), woodMat);
    post.position.set(rx, 0.68, -0.18);
    post.castShadow = true;
    chairGroup.add(post);
  }

  const slat1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.035), woodMat);
  slat1.position.set(0, 0.8, -0.18);
  chairGroup.add(slat1);

  const slat2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.035), woodMat);
  slat2.position.set(0, 0.64, -0.18);
  chairGroup.add(slat2);

  attachToSphere(chairGroup, CHAIR_DIR);
  scene.add(chairGroup);

  // 6. The Three Volcanoes (3개의 작은 화산)
  const flameMeshes: THREE.Mesh[] = [];

  const buildVolcano = (
    dir: THREE.Vector3,
    height: number,
    radius: number,
    isActive: boolean
  ): { group: THREE.Group; light?: THREE.PointLight } => {
    const vGroup = new THREE.Group();

    const coneMat = new THREE.MeshStandardMaterial({
      color: '#262626',
      roughness: 0.95,
      metalness: 0.15,
      flatShading: true,
    });
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.38, radius, height, 12, 1, true),
      coneMat
    );
    cone.position.y = height / 2;
    cone.castShadow = true;
    cone.receiveShadow = true;
    vGroup.add(cone);

    const craterMat = new THREE.MeshStandardMaterial({
      color: isActive ? '#f97316' : '#1c1917',
      emissive: isActive ? '#ea580c' : '#000000',
      emissiveIntensity: isActive ? 1.4 : 0,
      roughness: 0.6,
      flatShading: true,
    });
    const crater = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.36, 0.08, 0.28, 10),
      craterMat
    );
    crater.position.y = height - 0.08;
    vGroup.add(crater);

    let vLight: THREE.PointLight | undefined;

    if (isActive) {
      vLight = new THREE.PointLight('#f97316', 2.8, 7.0, 1.4);
      vLight.position.set(0, height + 0.25, 0);
      vGroup.add(vLight);

      const flameMat = new THREE.MeshBasicMaterial({ color: '#fb923c' });
      for (let j = 0; j < 3; j++) {
        const fMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1 + Math.random() * 0.06, 0), flameMat);
        const a = (j / 3) * Math.PI * 2;
        fMesh.position.set(Math.cos(a) * 0.15, height + 0.18 + j * 0.12, Math.sin(a) * 0.15);
        vGroup.add(fMesh);
        flameMeshes.push(fMesh);
      }
    } else {
      // Chimney cleaning brush
      const brushHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.75, 6), woodMat);
      brushHandle.position.set(radius * 0.35, height * 0.6, 0.1);
      brushHandle.rotation.z = -0.3;
      brushHandle.castShadow = true;
      vGroup.add(brushHandle);

      const brushBristles = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.18, 8),
        new THREE.MeshStandardMaterial({ color: '#44403c', roughness: 0.9 })
      );
      brushBristles.position.set(radius * 0.35 + 0.09, height * 0.92, 0.1);
      brushBristles.rotation.z = -0.3;
      vGroup.add(brushBristles);
    }

    attachToSphere(vGroup, dir);
    scene.add(vGroup);
    return { group: vGroup, light: vLight };
  };

  const v1 = buildVolcano(VOLCANO_1_DIR, 1.8, 1.7, true);
  const v2 = buildVolcano(VOLCANO_2_DIR, 1.35, 1.35, true);
  buildVolcano(VOLCANO_3_DIR, 1.15, 1.15, false);

  const volcano1Light = v1.light!;
  const volcano2Light = v2.light!;

  // 7. Baobab Saplings (바오밥나무 작은 싹들)
  const sproutDirs = [
    new THREE.Vector3(-0.25, 0.85, 0.45).normalize(),
    new THREE.Vector3(0.85, -0.15, 0.5).normalize(),
    new THREE.Vector3(-0.45, -0.35, 0.82).normalize(),
    new THREE.Vector3(0.35, -0.85, -0.38).normalize(),
  ];

  const sproutStemMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.7 });
  const sproutLeafMat = new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 0.6 });

  sproutDirs.forEach((dir) => {
    const sGroup = new THREE.Group();
    const sStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.32, 6), sproutStemMat);
    sStem.position.y = 0.16;
    sStem.castShadow = true;
    sGroup.add(sStem);

    const sLeafGeo = new THREE.SphereGeometry(0.11, 6, 6);
    sLeafGeo.scale(1, 0.2, 0.7);

    const l1 = new THREE.Mesh(sLeafGeo, sproutLeafMat);
    l1.position.set(0.09, 0.33, 0);
    l1.rotation.z = -0.4;
    sGroup.add(l1);

    const l2 = new THREE.Mesh(sLeafGeo, sproutLeafMat);
    l2.position.set(-0.09, 0.33, 0);
    l2.rotation.z = 0.4;
    sGroup.add(l2);

    attachToSphere(sGroup, dir);
    scene.add(sGroup);
  });

  // 8. The Sheep's Crate ("상자 속의 양")
  const boxGroup = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.8, flatShading: true });
  const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.42, 0.46), boxMat);
  boxMesh.position.y = 0.21;
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  boxGroup.add(boxMesh);

  // 3 Air Holes on side
  const holeMat = new THREE.MeshBasicMaterial({ color: '#1c1917' });
  for (let i = -1; i <= 1; i++) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), holeMat);
    hole.position.set(i * 0.14, 0.22, 0.232);
    boxGroup.add(hole);
  }

  attachToSphere(boxGroup, SHEEP_BOX_DIR);
  scene.add(boxGroup);

  // 9. Floating Golden Crystals & Stardust Rocks
  const crystalMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    emissive: '#d97706',
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.6,
  });

  const crystalDirs = [
    new THREE.Vector3(0.12, 0.98, -0.15).normalize(),
    new THREE.Vector3(0.75, 0.62, 0.22).normalize(),
    new THREE.Vector3(-0.62, 0.55, -0.55).normalize(),
    new THREE.Vector3(0.42, -0.45, 0.78).normalize(),
    new THREE.Vector3(-0.85, -0.42, 0.32).normalize(),
  ];

  crystalDirs.forEach((dir) => {
    const cMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16 + Math.random() * 0.08, 0), crystalMat);
    attachToSphere(cMesh, dir, 0.1);
    cMesh.castShadow = true;
    scene.add(cMesh);
  });

  return {
    scene,
    asteroidMesh,
    sunMesh,
    roseLight,
    volcano1Light,
    volcano2Light,
    flameMeshes,
    roseSparkles,
    starsPoints,
    getPlanetRadius,
    update: (delta: number, time: number) => {
      roseLight.intensity = 2.4 + Math.sin(time * 3.0) * 0.5;
      roseSparkles.rotation.y += delta * 0.45;

      volcano1Light.intensity = 2.5 + Math.sin(time * 16) * 0.6 + Math.cos(time * 24) * 0.4;
      volcano2Light.intensity = 2.0 + Math.sin(time * 14 + 1.0) * 0.5;

      flameMeshes.forEach((flame, idx) => {
        const offset = idx * 1.5;
        flame.position.y += Math.sin(time * 6 + offset) * 0.003;
        flame.rotation.y += delta * 1.8;
      });

      // Slowly rotate cosmic starfield
      starsPoints.rotation.y += delta * 0.003;
    },
  };
}
