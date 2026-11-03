import * as THREE from 'three';

export interface CharacterRig {
  root: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  backpack: THREE.Mesh;
  animTime: number;
  nameplateSprite?: THREE.Sprite;
  speechBubbleSprite?: THREE.Sprite;
  speechBubbleTimer?: number;
}

/**
 * Creates a stylish procedural low-poly humanoid character.
 * Uses 10+ distinct parts with varied roughness and bottom-center pivot.
 */
export function createCharacter(shirtColorHex: string = '#3b82f6'): CharacterRig {
  const root = new THREE.Group();
  root.name = 'CharacterRoot';

  // Materials
  const shirtColor = new THREE.Color(shirtColorHex);
  const skinColor = new THREE.Color('#fcd34d'); // Warm anime skin tone
  const pantsColor = new THREE.Color('#1e293b'); // Dark slate pants
  const shoeColor = new THREE.Color('#0f172a');
  const hairColor = new THREE.Color('#332219'); // Dark chestnut hair
  const backpackColor = new THREE.Color('#854d0e'); // Leather brown
  const buckleColor = new THREE.Color('#f59e0b');

  const shirtMat = new THREE.MeshStandardMaterial({
    color: shirtColor,
    roughness: 0.6,
    metalness: 0.1,
    flatShading: true,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.75,
    metalness: 0.05,
    flatShading: true,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColor,
    roughness: 0.8,
    metalness: 0.05,
    flatShading: true,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: shoeColor,
    roughness: 0.4,
    metalness: 0.2,
    flatShading: true,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.85,
    metalness: 0.0,
    flatShading: true,
  });

  const backpackMat = new THREE.MeshStandardMaterial({
    color: backpackColor,
    roughness: 0.7,
    metalness: 0.15,
    flatShading: true,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: buckleColor,
    roughness: 0.2,
    metalness: 0.8,
    flatShading: true,
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Pelvis / Hips (Y: 0.85)
  const pelvisGeo = new THREE.BoxGeometry(0.36, 0.16, 0.24);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
  pelvisMesh.position.y = 0.85;
  pelvisMesh.castShadow = true;
  root.add(pelvisMesh);

  // Belt & Gold Buckle
  const beltGeo = new THREE.BoxGeometry(0.37, 0.06, 0.25);
  const beltMesh = new THREE.Mesh(beltGeo, shoeMat);
  beltMesh.position.y = 0.92;
  root.add(beltMesh);

  const buckleGeo = new THREE.BoxGeometry(0.08, 0.06, 0.04);
  const buckleMesh = new THREE.Mesh(buckleGeo, metalMat);
  buckleMesh.position.set(0, 0.92, 0.13);
  root.add(buckleMesh);

  // Torso Group (Y: 0.95 to 1.35)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.94, 0);

  // Upper torso (Chest & Shirt)
  const chestGeo = new THREE.BoxGeometry(0.42, 0.46, 0.26);
  const chestMesh = new THREE.Mesh(chestGeo, shirtMat);
  chestMesh.position.y = 0.23;
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torsoGroup.add(chestMesh);

  // Explorer Backpack
  const packGeo = new THREE.BoxGeometry(0.32, 0.36, 0.16);
  const backpack = new THREE.Mesh(packGeo, backpackMat);
  backpack.position.set(0, 0.23, -0.19);
  backpack.castShadow = true;
  torsoGroup.add(backpack);

  // Collar detail
  const collarGeo = new THREE.BoxGeometry(0.24, 0.06, 0.22);
  const collarMesh = new THREE.Mesh(collarGeo, shirtMat);
  collarMesh.position.set(0, 0.47, 0);
  torsoGroup.add(collarMesh);

  // Head Group (pivot at neck Y: 0.48 on torsoGroup)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.48, 0);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.1, 6);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.y = 0.05;
  headGroup.add(neckMesh);

  // Head mesh
  const headGeo = new THREE.BoxGeometry(0.32, 0.32, 0.3);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.y = 0.24;
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Stylized Hair / Cap
  const hairGeo = new THREE.BoxGeometry(0.35, 0.16, 0.35);
  const hairMesh = new THREE.Mesh(hairGeo, hairMat);
  hairMesh.position.set(0, 0.35, -0.02);
  hairMesh.castShadow = true;
  headGroup.add(hairMesh);

  // Hair bangs
  const bangsGeo = new THREE.BoxGeometry(0.34, 0.08, 0.1);
  const bangsMesh = new THREE.Mesh(bangsGeo, hairMat);
  bangsMesh.position.set(0, 0.32, 0.14);
  headGroup.add(bangsMesh);

  // Eyes (small box/dots)
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.03), eyeMat);
  leftEye.position.set(-0.08, 0.24, 0.155);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.03), eyeMat);
  rightEye.position.set(0.08, 0.24, 0.155);
  headGroup.add(rightEye);

  torsoGroup.add(headGroup);
  root.add(torsoGroup);

  // Left Arm (Shoulder pivot at X: -0.27, Y: 0.4)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.27, 0.4, 0);

  const sleeveGeo = new THREE.BoxGeometry(0.12, 0.22, 0.14);
  const leftSleeve = new THREE.Mesh(sleeveGeo, shirtMat);
  leftSleeve.position.y = -0.11;
  leftSleeve.castShadow = true;
  leftArm.add(leftSleeve);

  const armGeo = new THREE.BoxGeometry(0.1, 0.22, 0.12);
  const leftForearm = new THREE.Mesh(armGeo, skinMat);
  leftForearm.position.y = -0.3;
  leftForearm.castShadow = true;
  leftArm.add(leftForearm);

  torsoGroup.add(leftArm);

  // Right Arm (Shoulder pivot at X: 0.27, Y: 0.4)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.27, 0.4, 0);

  const rightSleeve = new THREE.Mesh(sleeveGeo, shirtMat);
  rightSleeve.position.y = -0.11;
  rightSleeve.castShadow = true;
  rightArm.add(rightSleeve);

  const rightForearm = new THREE.Mesh(armGeo, skinMat);
  rightForearm.position.y = -0.3;
  rightForearm.castShadow = true;
  rightArm.add(rightForearm);

  torsoGroup.add(rightArm);

  // Left Leg (Hip pivot at X: -0.11, Y: 0.8)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.11, 0.8, 0);

  const legGeo = new THREE.BoxGeometry(0.15, 0.46, 0.16);
  const leftPants = new THREE.Mesh(legGeo, pantsMat);
  leftPants.position.y = -0.23;
  leftPants.castShadow = true;
  leftLeg.add(leftPants);

  // Left Shoe
  const shoeGeo = new THREE.BoxGeometry(0.16, 0.14, 0.24);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0, -0.44, 0.03);
  leftShoe.castShadow = true;
  leftLeg.add(leftShoe);

  root.add(leftLeg);

  // Right Leg (Hip pivot at X: 0.11, Y: 0.8)
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.11, 0.8, 0);

  const rightPants = new THREE.Mesh(legGeo, pantsMat);
  rightPants.position.y = -0.23;
  rightPants.castShadow = true;
  rightLeg.add(rightPants);

  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0, -0.44, 0.03);
  rightShoe.castShadow = true;
  rightLeg.add(rightShoe);

  root.add(rightLeg);

  return {
    root,
    torsoGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    backpack,
    animTime: 0,
  };
}

/**
 * Procedural animation update for walking, jumping, and idle breathing.
 */
export function animateCharacterRig(
  rig: CharacterRig,
  delta: number,
  isMoving: boolean,
  isJumping: boolean
) {
  if (isMoving) {
    rig.animTime += delta * 11;
  } else {
    rig.animTime += delta * 2;
  }

  const t = rig.animTime;

  if (isJumping) {
    // Jump pose: arms raise slightly, legs bend back
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, -0.8, 12, delta);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, -0.8, 12, delta);
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, -0.3, 12, delta);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, 0.3, 12, delta);

    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0.4, 12, delta);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, 0.3, 12, delta);
    rig.torsoGroup.position.y = THREE.MathUtils.damp(rig.torsoGroup.position.y, 0.98, 12, delta);
  } else if (isMoving) {
    // Walk / Run cycle: pendulum arm and leg swings
    const swingArm = Math.sin(t) * 0.75;
    const swingLeg = Math.sin(t) * 0.7;

    rig.leftArm.rotation.x = swingArm;
    rig.rightArm.rotation.x = -swingArm;
    rig.leftArm.rotation.z = 0;
    rig.rightArm.rotation.z = 0;

    rig.leftLeg.rotation.x = -swingLeg;
    rig.rightLeg.rotation.x = swingLeg;

    // Torso bounce
    const bounce = Math.abs(Math.sin(t)) * 0.06;
    rig.torsoGroup.position.y = 0.94 + bounce;
    rig.torsoGroup.rotation.y = Math.sin(t * 0.5) * 0.08;
    rig.headGroup.rotation.x = Math.sin(t) * 0.04;
  } else {
    // Idle pose with subtle breathing
    rig.leftArm.rotation.x = THREE.MathUtils.damp(rig.leftArm.rotation.x, 0, 8, delta);
    rig.rightArm.rotation.x = THREE.MathUtils.damp(rig.rightArm.rotation.x, 0, 8, delta);
    rig.leftArm.rotation.z = THREE.MathUtils.damp(rig.leftArm.rotation.z, 0.05, 8, delta);
    rig.rightArm.rotation.z = THREE.MathUtils.damp(rig.rightArm.rotation.z, -0.05, 8, delta);

    rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, 0, 8, delta);
    rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, 0, 8, delta);

    const breath = Math.sin(t) * 0.015;
    rig.torsoGroup.position.y = THREE.MathUtils.damp(rig.torsoGroup.position.y, 0.94 + breath, 5, delta);
    rig.torsoGroup.rotation.y = THREE.MathUtils.damp(rig.torsoGroup.rotation.y, 0, 8, delta);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, 0, 8, delta);
  }
}
