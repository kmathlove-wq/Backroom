import * as THREE from "three";

const canvas = document.querySelector("#world");
const startButton = document.querySelector("#startButton");
const deathOverlay = document.querySelector("#deathOverlay");
const restartButton = document.querySelector("#restartButton");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080801);
scene.fog = new THREE.FogExp2(0x2f2a0b, 0.041);

const camera = new THREE.PerspectiveCamera(
  76,
  window.innerWidth / window.innerHeight,
  0.1,
  170,
);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.78;

const world = new THREE.Group();
scene.add(world);

const clock = new THREE.Clock();
const keys = new Set();
const velocity = new THREE.Vector3();
const player = {
  position: new THREE.Vector3(0, 1.7, 0),
  yaw: 0,
  pitch: 0,
  onGround: true,
  dead: false,
};

const settings = {
  eyeHeight: 1.7,
  ceilingLimit: 2.72,
  gravity: 24,
  jumpPower: 6.6,
  moveSpeed: 7.2,
  sprintSpeed: 10.5,
  friction: 12,
  tile: 18,
  renderRadius: 3,
};

const materials = makeMaterials();
const reusable = {
  wall: new THREE.BoxGeometry(0.35, 3.2, 9.2),
  longWall: new THREE.BoxGeometry(0.35, 3.2, 14),
  corridorWall: new THREE.BoxGeometry(0.35, 3.2, 17.2),
  shortReturn: new THREE.BoxGeometry(0.35, 3.2, 3.4),
  column: new THREE.CylinderGeometry(0.9, 0.9, 3.2, 18),
  columnCap: new THREE.CylinderGeometry(1.04, 1.04, 0.16, 18),
  floor: new THREE.BoxGeometry(settings.tile, 0.08, settings.tile),
  ceiling: new THREE.BoxGeometry(settings.tile, 0.08, settings.tile),
  light: new THREE.BoxGeometry(3.2, 0.06, 1.15),
  lightFrame: new THREE.BoxGeometry(3.45, 0.075, 1.38),
  ceilingRunner: new THREE.BoxGeometry(settings.tile, 0.055, 0.045),
  floorSeam: new THREE.BoxGeometry(settings.tile, 0.018, 0.035),
  baseboard: new THREE.BoxGeometry(0.48, 0.18, 9.35),
  longBaseboard: new THREE.BoxGeometry(0.48, 0.18, 14.15),
  corridorBaseboard: new THREE.BoxGeometry(0.48, 0.18, 17.35),
  shortBaseboard: new THREE.BoxGeometry(0.48, 0.18, 3.55),
  crown: new THREE.BoxGeometry(0.42, 0.16, 9.35),
  longCrown: new THREE.BoxGeometry(0.42, 0.16, 14.15),
  corridorCrown: new THREE.BoxGeometry(0.42, 0.16, 17.35),
  shortCrown: new THREE.BoxGeometry(0.42, 0.16, 3.55),
  shadow: new THREE.PlaneGeometry(4.8, 9.6),
  longShadow: new THREE.PlaneGeometry(5.4, 14.7),
  corridorShadow: new THREE.PlaneGeometry(6.2, 17.8),
  shortShadow: new THREE.PlaneGeometry(3.6, 4.2),
  columnShadow: new THREE.CircleGeometry(1.55, 28),
  monsterLimb: new THREE.CylinderGeometry(0.035, 0.055, 1, 8),
  monsterJoint: new THREE.SphereGeometry(0.085, 10, 8),
  monsterHead: new THREE.SphereGeometry(0.34, 18, 12),
  monsterEye: new THREE.SphereGeometry(0.035, 8, 6),
  monsterBody: new THREE.SphereGeometry(0.42, 14, 10),
  monsterShadow: new THREE.CircleGeometry(2.2, 32),
};

const tiles = new Map();
const tilePatterns = [
  [
    { type: "corridorWall", x: -7.6, z: 0, rot: 0 },
    { type: "longWall", x: 7.4, z: -2.5, rot: 0 },
    { type: "shortReturn", x: 3.8, z: 5.45, rot: Math.PI / 2 },
    { type: "column", x: -3.2, z: -4.8 },
  ],
  [
    { type: "longWall", x: -7.3, z: 2.2, rot: 0 },
    { type: "corridorWall", x: 7.5, z: 0.4, rot: 0 },
    { type: "shortReturn", x: -2.4, z: -5.6, rot: Math.PI / 2 },
    { type: "column", x: 3.4, z: 4.7 },
  ],
  [
    { type: "corridorWall", x: 0.2, z: -7.4, rot: Math.PI / 2 },
    { type: "longWall", x: -7.4, z: 0.8, rot: 0 },
    { type: "shortReturn", x: 5.5, z: 3.8, rot: Math.PI / 2 },
    { type: "column", x: 0.8, z: 5.1 },
  ],
  [
    { type: "longWall", x: -3.8, z: -7.5, rot: Math.PI / 2 },
    { type: "corridorWall", x: 7.5, z: 0, rot: 0 },
    { type: "shortReturn", x: -6.1, z: 4.4, rot: Math.PI / 2 },
    { type: "column", x: -4.6, z: -2.2 },
  ],
];

const blockerObjects = [];
const flickerLights = [];
const monster = createMonster();
const monsterTarget = new THREE.Vector3();
let pointerLocked = false;

scene.add(new THREE.HemisphereLight(0xd6c064, 0x141005, 0.32));
scene.add(new THREE.AmbientLight(0x2c250d, 0.46));
world.add(monster.group);
hideMonster(0);

function makeCanvasTexture(size, paint) {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = size;
  canvasTexture.height = size;
  const ctx = canvasTexture.getContext("2d");
  paint(ctx, size);

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSoftWallShadowTexture() {
  const width = 512;
  const height = 128;
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = width;
  canvasTexture.height = height;
  const ctx = canvasTexture.getContext("2d");
  const image = ctx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const lengthFade = Math.min(1, v / 0.12, (1 - v) / 0.12);
      const wallFade = Math.pow(1 - u, 2.15);
      const farFade = Math.max(0, 1 - Math.pow(u, 1.25));
      const softEdge = Math.min(1, u / 0.06);
      const noise = 0.9 + Math.sin(x * 0.37 + y * 0.19) * 0.035;
      const alpha = Math.floor(170 * lengthFade * wallFade * farFade * softEdge * noise);
      const index = (y * width + x) * 4;
      image.data[index] = 7;
      image.data[index + 1] = 6;
      image.data[index + 2] = 0;
      image.data[index + 3] = alpha;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSoftColumnShadowTexture() {
  const size = 256;
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = size;
  canvasTexture.height = size;
  const ctx = canvasTexture.getContext("2d");
  const gradient = ctx.createRadialGradient(size * 0.48, size * 0.5, 10, size * 0.48, size * 0.5, size * 0.5);
  gradient.addColorStop(0, "rgba(7, 6, 0, 0.64)");
  gradient.addColorStop(0.42, "rgba(7, 6, 0, 0.3)");
  gradient.addColorStop(1, "rgba(7, 6, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeMaterials() {
  const wallTexture = makeCanvasTexture(256, (ctx, size) => {
    ctx.fillStyle = "#c8bf69";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(82, 88, 31, 0.24)";
    ctx.lineWidth = 1.1;
    for (let y = -24; y < size + 24; y += 24) {
      ctx.beginPath();
      for (let x = -24; x <= size + 24; x += 24) {
        ctx.lineTo(x, y + Math.abs(((x / 12) % 4) - 2) * 4);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(238, 232, 129, 0.18)";
    for (let x = -24; x < size + 24; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 42, size);
      ctx.moveTo(x + 42, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,190,0.07)";
    for (let i = 0; i < 900; i += 1) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
  });
  wallTexture.repeat.set(1.25, 1.05);

  const carpetTexture = makeCanvasTexture(256, (ctx, size) => {
    ctx.fillStyle = "#8d8142";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 4200; i += 1) {
      const light = 34 + Math.random() * 34;
      ctx.fillStyle = `rgba(${light + 74}, ${light + 63}, ${light + 24}, 0.15)`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1.2, 1.2);
    }
  });
  carpetTexture.repeat.set(3.2, 3.2);

  const ceilingTexture = makeCanvasTexture(256, (ctx, size) => {
    ctx.fillStyle = "#b7a75a";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(52,43,19,0.56)";
    ctx.lineWidth = 4;
    for (let x = 0; x <= size; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,245,185,0.1)";
    for (let i = 0; i < 1000; i += 1) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
  });
  ceilingTexture.repeat.set(3, 3);

  return {
    wall: new THREE.MeshBasicMaterial({
      map: wallTexture,
      color: 0xc7b85f,
      side: THREE.DoubleSide,
    }),
    carpet: new THREE.MeshBasicMaterial({
      map: carpetTexture,
      color: 0x9e8742,
      side: THREE.DoubleSide,
    }),
    ceiling: new THREE.MeshBasicMaterial({
      map: ceilingTexture,
      color: 0x8f813f,
      side: THREE.DoubleSide,
    }),
    trim: new THREE.MeshBasicMaterial({
      color: 0x5f5524,
    }),
    ceilingGrid: new THREE.MeshBasicMaterial({
      color: 0x60572a,
    }),
    carpetSeam: new THREE.MeshBasicMaterial({
      color: 0x7d6b36,
    }),
    lightFrame: new THREE.MeshBasicMaterial({
      color: 0x665d39,
    }),
    wallShadow: new THREE.MeshBasicMaterial({
      map: makeSoftWallShadowTexture(),
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    columnShadow: new THREE.MeshBasicMaterial({
      map: makeSoftColumnShadowTexture(),
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    monster: new THREE.MeshBasicMaterial({
      color: 0x030302,
      fog: true,
    }),
    monsterEdge: new THREE.MeshBasicMaterial({
      color: 0x1b1707,
      transparent: true,
      opacity: 0.82,
      fog: true,
    }),
    monsterEye: new THREE.MeshBasicMaterial({
      color: 0xfff2a0,
      fog: false,
    }),
    monsterShadow: new THREE.MeshBasicMaterial({
      map: makeSoftColumnShadowTexture(),
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    light: new THREE.MeshBasicMaterial({ color: 0xfff3bf }),
  };
}

function createMonster() {
  const group = new THREE.Group();
  group.visible = false;

  const shadow = new THREE.Mesh(reusable.monsterShadow, materials.monsterShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  shadow.scale.set(0.55, 1.55, 1);
  group.add(shadow);

  const torso = new THREE.Mesh(reusable.monsterBody, materials.monster);
  torso.name = "torso";
  torso.position.set(0, 1.95, 0);
  torso.scale.set(0.55, 1.45, 0.28);
  group.add(torso);

  const chestRidge = new THREE.Mesh(reusable.monsterBody, materials.monsterEdge);
  chestRidge.position.set(0.02, 2.08, -0.03);
  chestRidge.scale.set(0.38, 1.18, 0.16);
  group.add(chestRidge);

  const neck = addMonsterLimb(group, new THREE.Vector3(0, 2.52, 0), new THREE.Vector3(0, 2.83, -0.03), 0.08);

  const head = new THREE.Mesh(reusable.monsterHead, materials.monster);
  head.name = "head";
  head.position.set(0, 2.96, -0.06);
  head.scale.set(0.72, 0.48, 0.56);
  group.add(head);

  for (const x of [-0.105, 0.105]) {
    const eye = new THREE.Mesh(reusable.monsterEye, materials.monsterEye.clone());
    eye.name = "eye";
    eye.position.set(x, 2.98, -0.36);
    eye.scale.set(1, 0.72, 1);
    group.add(eye);
  }

  const limbPoints = [
    [new THREE.Vector3(-0.28, 2.34, 0), new THREE.Vector3(-0.88, 1.42, 0.1), new THREE.Vector3(-1.15, 0.1, -0.35)],
    [new THREE.Vector3(0.28, 2.3, 0), new THREE.Vector3(0.92, 1.28, -0.08), new THREE.Vector3(1.24, 0.08, -0.5)],
    [new THREE.Vector3(-0.18, 1.34, 0), new THREE.Vector3(-0.52, 0.78, 0.25), new THREE.Vector3(-0.72, 0.05, 0.66)],
    [new THREE.Vector3(0.18, 1.34, 0), new THREE.Vector3(0.45, 0.72, -0.12), new THREE.Vector3(0.68, 0.05, -0.6)],
  ];

  for (const points of limbPoints) {
    addSegmentedMonsterLimb(group, points);
  }

  for (let i = 0; i < 7; i += 1) {
    const hair = addMonsterLimb(
      group,
      new THREE.Vector3((Math.random() - 0.5) * 0.28, 3.06, -0.1),
      new THREE.Vector3((Math.random() - 0.5) * 0.68, 2.62 - Math.random() * 0.34, -0.2 - Math.random() * 0.2),
      0.014,
    );
    hair.name = "hair";
  }

  neck.name = "neck";
  return {
    group,
    baseScale: 1,
    state: "hidden",
    stateUntil: 0,
    nextRelocate: 7,
    stareTime: 0,
    chargeSpeed: 0,
  };
}

function addSegmentedMonsterLimb(group, points) {
  for (let i = 0; i < points.length - 1; i += 1) {
    addMonsterLimb(group, points[i], points[i + 1], i === 0 ? 0.045 : 0.032);
  }
  for (const point of points) {
    const joint = new THREE.Mesh(reusable.monsterJoint, materials.monster);
    joint.position.copy(point);
    joint.scale.setScalar(0.8 + Math.random() * 0.45);
    group.add(joint);
  }
}

function addMonsterLimb(group, from, to, radius) {
  const limb = new THREE.Mesh(reusable.monsterLimb, materials.monster);
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  limb.position.copy(from).add(to).multiplyScalar(0.5);
  limb.scale.set(radius / 0.045, length, radius / 0.045);
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  group.add(limb);
  return limb;
}

function tileKey(x, z) {
  return `${x},${z}`;
}

function createTile(tileX, tileZ) {
  const group = new THREE.Group();
  const baseX = tileX * settings.tile;
  const baseZ = tileZ * settings.tile;
  const patternIndex = Math.abs((tileX * 92821 + tileZ * 68917) % tilePatterns.length);

  const floor = new THREE.Mesh(reusable.floor, materials.carpet);
  floor.position.set(baseX, -0.04, baseZ);
  group.add(floor);
  addFloorSeams(group, baseX, baseZ);

  const ceiling = new THREE.Mesh(reusable.ceiling, materials.ceiling);
  ceiling.position.set(baseX, 3.24, baseZ);
  group.add(ceiling);
  addCeilingGrid(group, baseX, baseZ);

  tilePatterns[patternIndex].forEach((item) => {
    if (item.type === "column") {
      addColumn(group, baseX + item.x, baseZ + item.z);
      return;
    }

    const mesh = addWall(group, item, baseX, baseZ);
    blockerObjects.push(mesh);

    const trimGeometry = pickWallGeometry(item.type, "baseboard");
    const trim = new THREE.Mesh(trimGeometry, materials.trim);
    trim.position.set(baseX + item.x, 0.18, baseZ + item.z);
    trim.rotation.y = item.rot || 0;
    group.add(trim);

    const crownGeometry = pickWallGeometry(item.type, "crown");
    const crown = new THREE.Mesh(crownGeometry, materials.trim);
    crown.position.set(baseX + item.x, 3.02, baseZ + item.z);
    crown.rotation.y = item.rot || 0;
    group.add(crown);

    const shadowGeometry = pickWallGeometry(item.type, "shadow");
    const shadow = new THREE.Mesh(shadowGeometry, materials.wallShadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = -(item.rot || 0);
    shadow.position.set(baseX + item.x, 0.014, baseZ + item.z);
    const shadowOffset = pickWallShadowSpread(item.type) * 0.5 - 0.18;
    if (Math.abs(item.rot || 0) < 0.01) {
      shadow.position.x += item.x > 0 ? -shadowOffset : shadowOffset;
      shadow.scale.x = item.x > 0 ? -1 : 1;
    } else {
      shadow.position.z += item.z > 0 ? -shadowOffset : shadowOffset;
      shadow.scale.x = item.z > 0 ? -1 : 1;
    }
    group.add(shadow);
  });

  for (let i = -1; i <= 1; i += 1) {
    const lightMaterial = materials.light.clone();
    const light = addLightFixture(
      group,
      baseX + i * 5.4,
      baseZ + ((tileX + tileZ + i) % 2) * 3.6,
      lightMaterial,
    );

    const point = new THREE.PointLight(0xffe47d, 1.8, 12, 2.2);
    point.position.copy(light.position).y = 2.75;
    group.add(point);
    flickerLights.push({
      point,
      material: lightMaterial,
      base: 1.05 + Math.random() * 0.75,
      phase: Math.random() * Math.PI * 2,
      speed: 4.2 + Math.random() * 8.5,
    });
  }

  world.add(group);
  tiles.set(tileKey(tileX, tileZ), group);
}

function addWall(group, item, baseX, baseZ) {
  const mesh = new THREE.Mesh(reusable[item.type], materials.wall);
  mesh.position.set(baseX + item.x, 1.6, baseZ + item.z);
  mesh.rotation.y = item.rot || 0;
  group.add(mesh);

  const offset = Math.abs(item.rot || 0) < 0.01 ? "x" : "z";
  const side = offset === "x" ? Math.sign(item.x || 1) : Math.sign(item.z || 1);
  const faceLine = new THREE.Mesh(
    pickWallGeometry(item.type, "baseboard"),
    materials.ceilingGrid,
  );
  faceLine.position.copy(mesh.position);
  faceLine.position.y = 1.62;
  faceLine.rotation.y = item.rot || 0;
  faceLine.scale.set(0.34, 0.22, 1.002);
  if (offset === "x") faceLine.position.x -= side * 0.19;
  if (offset === "z") faceLine.position.z -= side * 0.19;
  group.add(faceLine);

  return mesh;
}

function pickWallGeometry(type, part) {
  const prefix =
    type === "corridorWall" ? "corridor" : type === "longWall" ? "long" : type === "shortReturn" ? "short" : "";
  if (part === "baseboard") return reusable[`${prefix}Baseboard`] || reusable.baseboard;
  if (part === "crown") return reusable[`${prefix}Crown`] || reusable.crown;
  if (part === "shadow") return reusable[`${prefix}Shadow`] || reusable.shadow;
  return reusable[type];
}

function pickWallShadowSpread(type) {
  if (type === "corridorWall") return 6.2;
  if (type === "longWall") return 5.4;
  if (type === "shortReturn") return 3.6;
  return 4.8;
}

function addColumn(group, x, z) {
  const column = new THREE.Mesh(reusable.column, materials.wall);
  column.position.set(x, 1.6, z);
  group.add(column);
  blockerObjects.push(column);

  for (const y of [0.08, 3.12]) {
    const cap = new THREE.Mesh(reusable.columnCap, materials.trim);
    cap.position.set(x, y, z);
    group.add(cap);
  }

  const shadow = new THREE.Mesh(reusable.columnShadow, materials.columnShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x + 0.24, 0.016, z - 0.2);
  shadow.scale.set(1.25, 0.74, 1);
  group.add(shadow);
}

function addFloorSeams(group, baseX, baseZ) {
  for (let offset = -6; offset <= 6; offset += 6) {
    const seamA = new THREE.Mesh(reusable.floorSeam, materials.carpetSeam);
    seamA.position.set(baseX, 0.012, baseZ + offset);
    group.add(seamA);

    const seamB = new THREE.Mesh(reusable.floorSeam, materials.carpetSeam);
    seamB.rotation.y = Math.PI / 2;
    seamB.position.set(baseX + offset, 0.013, baseZ);
    group.add(seamB);
  }
}

function addCeilingGrid(group, baseX, baseZ) {
  for (let offset = -6; offset <= 6; offset += 3) {
    const runnerA = new THREE.Mesh(reusable.ceilingRunner, materials.ceilingGrid);
    runnerA.position.set(baseX, 3.292, baseZ + offset);
    group.add(runnerA);

    const runnerB = new THREE.Mesh(reusable.ceilingRunner, materials.ceilingGrid);
    runnerB.rotation.y = Math.PI / 2;
    runnerB.position.set(baseX + offset, 3.294, baseZ);
    group.add(runnerB);
  }
}

function addLightFixture(group, x, z, lightMaterial) {
  const frame = new THREE.Mesh(reusable.lightFrame, materials.lightFrame);
  frame.position.set(x, 3.165, z);
  group.add(frame);

  const light = new THREE.Mesh(reusable.light, lightMaterial);
  light.position.set(x, 3.12, z);
  group.add(light);
  return light;
}

function syncTiles() {
  const centerX = Math.floor((player.position.x + settings.tile / 2) / settings.tile);
  const centerZ = Math.floor((player.position.z + settings.tile / 2) / settings.tile);
  const needed = new Set();

  for (let z = centerZ - settings.renderRadius; z <= centerZ + settings.renderRadius; z += 1) {
    for (let x = centerX - settings.renderRadius; x <= centerX + settings.renderRadius; x += 1) {
      const key = tileKey(x, z);
      needed.add(key);
      if (!tiles.has(key)) {
        createTile(x, z);
      }
    }
  }

  for (const [key, group] of tiles) {
    if (!needed.has(key)) {
      group.traverse((child) => {
        const index = blockerObjects.indexOf(child);
        if (index !== -1) blockerObjects.splice(index, 1);
        const lightIndex = flickerLights.findIndex((entry) => entry.point === child);
        if (lightIndex !== -1) flickerLights.splice(lightIndex, 1);
      });
      world.remove(group);
      tiles.delete(key);
    }
  }
}

function hideMonster(elapsed) {
  monster.group.visible = false;
  monster.state = "hidden";
  monster.nextRelocate = elapsed + 7 + Math.random() * 13;
  monster.chargeSpeed = 0;
}

function relocateMonster(elapsed) {
  const forward = new THREE.Vector3(Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const side = new THREE.Vector3(forward.z, 0, -forward.x);
  const sideSign = Math.random() > 0.5 ? 1 : -1;
  const distance = 18 + Math.random() * 12;
  const sideOffset = sideSign * (4 + Math.random() * 5);

  monster.group.position.copy(player.position);
  monster.group.position.y = 0;
  monster.group.position.addScaledVector(forward, distance);
  monster.group.position.addScaledVector(side, sideOffset);
  monster.baseScale = 0.92 + Math.random() * 0.16;
  monster.group.scale.setScalar(monster.baseScale);
  monster.group.visible = true;
  monster.state = "stare";
  monster.stateUntil = elapsed + 1.2 + Math.random() * 1.4;
  monster.stareTime = elapsed;
  monster.chargeSpeed = 12 + Math.random() * 4;
}

function updateMonster(elapsed, delta) {
  if (player.dead) return;

  if (monster.state === "hidden") {
    if (pointerLocked && elapsed >= monster.nextRelocate) {
      relocateMonster(elapsed);
    }
    return;
  }

  const monsterPosition = monster.group.position;
  monsterTarget.set(player.position.x, 1.55, player.position.z);
  monster.group.lookAt(monsterTarget);
  monster.group.rotation.z = Math.sin(elapsed * 6.8) * 0.035;
  monster.group.position.y = Math.sin(elapsed * 9.0) * 0.025;

  const distance = monsterPosition.distanceTo(player.position);
  if (monster.state === "stare") {
    const starePulse = 1 + Math.sin(elapsed * 18) * 0.035;
    monster.group.scale.setScalar(monster.baseScale * starePulse);
    if (elapsed >= monster.stateUntil || distance < 11) {
      monster.state = "charge";
      monster.stateUntil = elapsed + 5;
    }
    return;
  }

  if (monster.state === "charge") {
    const direction = new THREE.Vector3(player.position.x - monsterPosition.x, 0, player.position.z - monsterPosition.z);
    const horizontalDistance = direction.length();
    if (horizontalDistance > 0.001) {
      direction.normalize();
      monsterPosition.addScaledVector(direction, monster.chargeSpeed * delta);
    }
    monster.group.scale.setScalar(1.05 + Math.sin(elapsed * 24) * 0.04);

    if (horizontalDistance < 1.15) {
      killPlayer();
      return;
    }

    if (elapsed >= monster.stateUntil || horizontalDistance > 55) {
      hideMonster(elapsed);
    }
  }
}

function killPlayer() {
  player.dead = true;
  velocity.set(0, 0, 0);
  document.body.classList.add("dead");
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
}

function resetPlayer() {
  player.dead = false;
  player.position.set(0, settings.eyeHeight, 0);
  player.yaw = 0;
  player.pitch = 0;
  player.onGround = true;
  velocity.set(0, 0, 0);
  document.body.classList.remove("dead");
  hideMonster(clock.elapsedTime);
  syncTiles();
}

function movePlayer(delta) {
  if (player.dead) return;

  const wish = new THREE.Vector3();
  const forward = Number(keys.has("KeyW")) - Number(keys.has("KeyS"));
  const right = Number(keys.has("KeyD")) - Number(keys.has("KeyA"));

  if (forward || right) {
    wish.set(right, 0, -forward).normalize();
    wish.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
  }

  const speed = keys.has("ShiftLeft") ? settings.sprintSpeed : settings.moveSpeed;
  velocity.x += wish.x * speed * settings.friction * delta;
  velocity.z += wish.z * speed * settings.friction * delta;

  const damping = Math.exp(-settings.friction * delta);
  velocity.x *= damping;
  velocity.z *= damping;

  velocity.y -= settings.gravity * delta;
  if (player.onGround && keys.has("Space")) {
    velocity.y = settings.jumpPower;
    player.onGround = false;
  }

  const oldX = player.position.x;
  const oldZ = player.position.z;

  player.position.x += velocity.x * delta;
  resolveHorizontalCollision("x", oldX);
  player.position.z += velocity.z * delta;
  resolveHorizontalCollision("z", oldZ);
  player.position.y += velocity.y * delta;

  if (player.position.y >= settings.ceilingLimit) {
    player.position.y = settings.ceilingLimit;
    if (velocity.y > 0) velocity.y = -1.5;
  }

  if (player.position.y <= settings.eyeHeight) {
    player.position.y = settings.eyeHeight;
    velocity.y = 0;
    player.onGround = true;
  }
}

function resolveHorizontalCollision(axis, previousPosition) {
  const radius = 0.42;
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(player.position.x, 1.35, player.position.z),
    new THREE.Vector3(radius * 2, 2.6, radius * 2),
  );

  for (const object of blockerObjects) {
    const box = new THREE.Box3().setFromObject(object).expandByScalar(0.04);
    if (playerBox.intersectsBox(box)) {
      if (axis === "x") {
        player.position.x = previousPosition;
        velocity.x = 0;
      } else {
        player.position.z = previousPosition;
        velocity.z = 0;
      }
    }
  }
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  movePlayer(delta);
  syncTiles();
  updateLights(elapsed);
  updateMonster(elapsed, delta);

  camera.position.copy(player.position);
  const walking = !player.dead && player.onGround && (Math.abs(velocity.x) + Math.abs(velocity.z) > 0.45);
  if (walking) {
    camera.position.y += Math.sin(elapsed * 10.5) * 0.025;
    camera.rotation.z = Math.sin(elapsed * 5.2) * 0.006;
  } else {
    camera.rotation.z = 0;
  }
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updateLights(elapsed) {
  for (const entry of flickerLights) {
    const buzz = Math.sin(elapsed * entry.speed + entry.phase) * 0.16;
    const pulse = Math.sin(elapsed * 21.0 + entry.phase * 1.7) > 0.94 ? -0.55 : 0;
    const intensity = Math.max(0.32, entry.base + buzz + pulse);
    entry.point.intensity = intensity;
    entry.material.color.setScalar(0.78 + intensity * 0.18);
  }
}

function onPointerMove(event) {
  if (!pointerLocked) return;
  const sensitivity = 0.0022;
  player.yaw -= event.movementX * sensitivity;
  player.pitch -= event.movementY * sensitivity;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.35, 1.35);
}

startButton.addEventListener("click", () => {
  if (player.dead) resetPlayer();
  document.body.requestPointerLock();
});

restartButton.addEventListener("click", () => {
  resetPlayer();
  document.body.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === document.body;
  document.body.classList.toggle("playing", pointerLocked);
});

document.addEventListener("mousemove", onPointerMove);

document.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Space") event.preventDefault();
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

syncTiles();
animate();
