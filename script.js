let scene, camera, renderer, controls;
let cakeGroup;
let candleFlameOuter, candleFlameInner, candleLight;
let audio = null;
let musicReady = null;
let autoRotate = true;
let candleOn = true;
let started = false;

const sceneEl = document.getElementById("scene");
const overlay = document.getElementById("overlay");
const btnStart = document.getElementById("btnStart");
const btnCandle = document.getElementById("btnCandle");
const btnOrbit = document.getElementById("btnOrbit");
const btnMusic = document.getElementById("btnMusic");
const musicState = document.getElementById("musicState");
const candleState = document.getElementById("candleState");
const orbitState = document.getElementById("orbitState");
const bgMusic = document.getElementById("bgMusic");

const textMeshes = [];
const dustParticles = [];
const glowOrbs = [];
const smokeParticles = [];

const isMobile = window.matchMedia("(max-width: 768px)").matches;
const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.6 : 2);

const SETTINGS = {
  starCount: isMobile ? 180 : 360,
  orbCount: isMobile ? 10 : 18,
  dustCount: isMobile ? 110 : 180,
  sprinkleCount: isMobile ? 38 : 60,
  creamCount: isMobile ? 12 : 18,
  strawberryCount: 6
};

if (btnMusic) btnMusic.style.display = "none";
if (musicState) musicState.style.display = "none";

btnStart?.addEventListener("click", startExperience);
btnCandle?.addEventListener("click", toggleCandle);
btnOrbit?.addEventListener("click", toggleAutoRotate);

init();
animate();
loadMusicConfig();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090411);
  scene.fog = new THREE.FogExp2(0x090411, isMobile ? 0.022 : 0.016);

  camera = new THREE.PerspectiveCamera(
    45,
    sceneEl.clientWidth / sceneEl.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, isMobile ? 9.2 : 8.6, isMobile ? 27 : 24.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(DPR);
  renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  sceneEl.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.9;
  controls.enablePan = false;
  controls.minDistance = isMobile ? 14 : 12;
  controls.maxDistance = isMobile ? 36 : 34;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI / 2 - 0.09;
  controls.target.set(0, 0.8, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.52);
  scene.add(ambient);

  const warm = new THREE.DirectionalLight(0xffd9ea, 1.15);
  warm.position.set(7, 16, 10);
  warm.castShadow = true;
  warm.shadow.mapSize.set(1024, 1024);
  scene.add(warm);

  const pink = new THREE.PointLight(0xff5fa5, 1.15, 40);
  pink.position.set(11, 6, 10);
  scene.add(pink);

  const purple = new THREE.PointLight(0x8b5cf6, 0.95, 40);
  purple.position.set(-12, 8, -8);
  scene.add(purple);

  const cyan = new THREE.PointLight(0x22d3ee, 0.45, 35);
  cyan.position.set(0, 10, -14);
  scene.add(cyan);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(32, 72),
    new THREE.MeshStandardMaterial({
      color: 0x130919,
      roughness: 1,
      metalness: 0
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.35;
  floor.receiveShadow = true;
  scene.add(floor);

  cakeGroup = new THREE.Group();
  cakeGroup.position.y = -0.18;
  scene.add(cakeGroup);

  createCake();
  createCurvedText("15", {
    radius: 3.06,
    y: 4.04,
    arc: 0.35,
    fontSize: 156,
    color: "#fff8e8",
    tiltX: -0.10
  });

  createCurvedText("Trịnh Ngọc Tường Vi", {
    radius: 5.72,
    y: -1.16,
    arc: 1.14,
    fontSize: 96,
    color: "#fff8fb",
    tiltX: 0.0
  });

  createStarField();
  createFloatingOrbs();
  createSoftRings();

  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", () => setTimeout(onResize, 120));
}

function loadMusicConfig() {
  musicReady = fetch("music.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("music.json not found");
      return res.json();
    })
    .then((data) => {
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data.tracks)) list = data.tracks;
      else if (typeof data.music === "string") list = [data.music];

      const firstTrack = list.find(Boolean);
      if (firstTrack) {
        bgMusic.src = firstTrack;
        bgMusic.load();
      }
    })
    .catch(() => {
      bgMusic.removeAttribute("src");
      bgMusic.load();
    });
}

async function ensureMusicReady() {
  if (musicReady) await musicReady;
}

async function startExperience() {
  if (started) return;
  started = true;

  overlay.classList.add("hide");

  await ensureMusicReady();

  if (bgMusic.src) {
    bgMusic.volume = 0.34;
    try {
      await bgMusic.play();
    } catch (err) {
      console.log("Music play blocked by browser:", err);
    }
  }
}

function toggleCandle() {
  candleOn = !candleOn;

  if (candleFlameOuter) candleFlameOuter.visible = candleOn;
  if (candleFlameInner) candleFlameInner.visible = candleOn;
  if (candleLight) candleLight.visible = candleOn;

  if (candleState) candleState.textContent = candleOn ? "Thổi Tắt Nến" : "Thắp Lại Nến";
  if (btnCandle) btnCandle.classList.toggle("off", !candleOn);

  if (candleOn) {
    burstTinySparkles(8);
  } else {
    createSmokeBurst();
  }
}

function toggleAutoRotate() {
  autoRotate = !autoRotate;
  controls.autoRotate = autoRotate;

  if (orbitState) orbitState.textContent = autoRotate ? "Tự Xoay Bật" : "Tự Xoay Tắt";
  if (btnOrbit) btnOrbit.classList.toggle("off", !autoRotate);
}

function createCake() {
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(7.35, 7.35, 0.26, 64),
    new THREE.MeshStandardMaterial({
      color: 0xfaf7fc,
      roughness: 0.15,
      metalness: 0.08
    })
  );
  plate.position.y = -2.95;
  plate.receiveShadow = true;
  cakeGroup.add(plate);

  const plateRim = new THREE.Mesh(
    new THREE.TorusGeometry(7.2, 0.1, 16, 120),
    new THREE.MeshStandardMaterial({
      color: 0xd7b56d,
      roughness: 0.22,
      metalness: 0.8
    })
  );
  plateRim.rotation.x = Math.PI / 2;
  plateRim.position.y = -2.83;
  cakeGroup.add(plateRim);

  const tier1 = new THREE.Mesh(
    new THREE.CylinderGeometry(5.25, 5.25, 2.18, 72),
    new THREE.MeshStandardMaterial({
      color: 0xffa7c6,
      roughness: 0.42
    })
  );
  tier1.position.y = -1.35;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  cakeGroup.add(tier1);

  const tier2 = new THREE.Mesh(
    new THREE.CylinderGeometry(4.02, 4.02, 1.9, 72),
    new THREE.MeshStandardMaterial({
      color: 0xfff8fc,
      roughness: 0.28
    })
  );
  tier2.position.y = 0.55;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  cakeGroup.add(tier2);

  const tier3 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.72, 2.72, 1.52, 72),
    new THREE.MeshStandardMaterial({
      color: 0xffd9e8,
      roughness: 0.3
    })
  );
  tier3.position.y = 2.15;
  tier3.castShadow = true;
  tier3.receiveShadow = true;
  cakeGroup.add(tier3);

  addDrips(5.28, -0.31, 0xe11d48, 26);
  addDrips(4.06, 1.11, 0xdb2777, 18);
  addDrips(2.75, 2.83, 0xff66ad, 12);

  addSprinkles(5.16, -0.16, SETTINGS.sprinkleCount);
  addCreamDots(4.08, 1.37, SETTINGS.creamCount);
  addCreamDots(2.74, 3.03, 10);

  addStrawberries(2.52, 3.08, SETTINGS.strawberryCount);
  addRibbon(5.24, -1.12);

  createCandle(0, 3.34, 0);
}

function createCandle(x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 2.0, 18),
    new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.28
    })
  );
  body.position.y = 1.0;
  body.castShadow = true;
  g.add(body);

  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.225, 0.028, 10, 20),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xffdf6c : 0xfff1f7,
        roughness: 0.2
      })
    );
    stripe.position.y = 0.28 + i * 0.29;
    stripe.rotation.x = Math.PI / 2 + 0.18;
    g.add(stripe);
  }

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.24, 8),
    new THREE.MeshBasicMaterial({ color: 0x2f2f2f })
  );
  wick.position.y = 2.08;
  g.add(wick);

  candleFlameOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffa84c,
      transparent: true,
      opacity: 0.92
    })
  );
  candleFlameOuter.scale.set(0.9, 1.35, 0.8);
  candleFlameOuter.position.y = 2.4;
  g.add(candleFlameOuter);

  candleFlameInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.94
    })
  );
  candleFlameInner.scale.set(0.72, 1.18, 0.62);
  candleFlameInner.position.y = 2.44;
  g.add(candleFlameInner);

  candleLight = new THREE.PointLight(0xffd39a, 1.35, 10);
  candleLight.position.set(0, 2.45, 0);
  g.add(candleLight);

  cakeGroup.add(g);
}

function addRibbon(radius, y) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.15, 18, 150),
    new THREE.MeshStandardMaterial({
      color: 0xff7ab6,
      roughness: 0.35,
      metalness: 0.1
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  cakeGroup.add(ring);

  const bowLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xffd0e4, roughness: 0.25 })
  );
  bowLeft.scale.set(1.4, 0.9, 0.6);
  bowLeft.position.set(-0.35, y + 0.08, radius + 0.12);
  cakeGroup.add(bowLeft);

  const bowRight = bowLeft.clone();
  bowRight.position.x = 0.35;
  cakeGroup.add(bowRight);
}

function addSprinkles(radius, y, count) {
  const colors = [0xffeb3b, 0x00d2ff, 0x8b5cf6, 0x4ade80, 0xff7ab6, 0xffffff];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
    const r = radius + (Math.random() * 0.16 - 0.07);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const sprinkle = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshStandardMaterial({
        color: colors[(Math.random() * colors.length) | 0],
        roughness: 0.2
      })
    );
    sprinkle.position.set(x, y + Math.random() * 0.16, z);
    sprinkle.castShadow = true;
    cakeGroup.add(sprinkle);
  }
}

function addCreamDots(radius, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const dollop = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 14),
      new THREE.MeshStandardMaterial({
        color: 0xfff4f8,
        roughness: 0.26
      })
    );
    dollop.scale.set(1, 1.34, 1);
    dollop.position.set(x, y, z);
    dollop.rotation.y = -angle;
    cakeGroup.add(dollop);
  }
}

function addStrawberries(radius, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.3;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const group = new THREE.Group();

    const berry = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.76, 16),
      new THREE.MeshStandardMaterial({
        color: 0xdf1a2e,
        roughness: 0.12,
        metalness: 0.06
      })
    );
    berry.rotation.x = Math.PI;
    berry.rotation.z = 0.18;
    group.add(berry);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.18, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2f8f3a,
        roughness: 0.66
      })
    );
    stem.position.y = 0.42;
    group.add(stem);

    group.position.set(x, y, z);
    group.lookAt(0, y, 0);
    cakeGroup.add(group);
  }
}

function addDrips(radius, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.1;
    const r = radius + (Math.random() * 0.06 - 0.03);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const drip = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 + Math.random() * 0.06, 12, 12),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.18,
        transparent: true,
        opacity: 0.98
      })
    );
    drip.position.set(x, y - 0.08 - Math.random() * 0.35, z);
    drip.scale.set(0.78, 1.12 + Math.random() * 0.35, 0.78);
    cakeGroup.add(drip);
  }
}

function createCurvedText(text, options = {}) {
  const {
    radius = 5,
    y = 0,
    arc = 1,
    fontSize = 100,
    color = "#ffffff",
    tiltX = 0
  } = options;

  const chars = [...text];
  const visibleChars = chars.filter((c) => c !== " ");
  const total = visibleChars.length;
  const start = -arc / 2;
  const step = total > 1 ? arc / (total - 1) : 0;

  let visibleIndex = 0;

  chars.forEach((char) => {
    if (char === " ") {
      visibleIndex += 0.45;
      return;
    }

    const mesh = makeTextCharMesh(char, { fontSize, color });

    const angle = start + visibleIndex * step;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;

    mesh.position.set(x, y, z);
    mesh.userData.faceCamera = true;
    mesh.userData.baseTilt = tiltX;
    mesh.scale.set(0.28, 0.28, 0.28);
    mesh.renderOrder = 1000;
    mesh.material.depthTest = false;
    mesh.material.depthWrite = false;

    textMeshes.push(mesh);
    cakeGroup.add(mesh);

    visibleIndex += 1;
  });
}

function makeTextCharMesh(char, options = {}) {
  const { fontSize = 100, color = "#ffffff" } = options;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `900 ${fontSize}px Quicksand, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(255,255,255,0.40)";
  ctx.shadowBlur = 18;
  ctx.fillText(char, canvas.width / 2, canvas.height / 2 + 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  });

  return new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), material);
}

function createStarField() {
  const geometry = new THREE.BufferGeometry();
  const count = SETTINGS.starCount;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = 34 + Math.random() * 32;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.5;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.075,
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  dustParticles.push(stars);
}

function createFloatingOrbs() {
  const colors = [0xff7ab6, 0xc4b5fd, 0x7dd3fc, 0xfff1a8, 0xffffff];

  for (let i = 0; i < SETTINGS.orbCount; i++) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 + Math.random() * 0.12, 16, 16),
      new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.16,
        roughness: 0.12,
        metalness: 0.06
      })
    );

    orb.position.set(
      (Math.random() - 0.5) * 22,
      -1.8 + Math.random() * 11,
      (Math.random() - 0.5) * 22
    );

    orb.userData = {
      vx: (Math.random() - 0.5) * 0.006,
      vy: 0.004 + Math.random() * 0.007,
      vz: (Math.random() - 0.5) * 0.006
    };

    scene.add(orb);
    glowOrbs.push(orb);
  }
}

function createSoftRings() {
  const rings = isMobile ? 2 : 3;
  for (let i = 0; i < rings; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(8.8 + i * 2.3, 0.04, 10, 160),
      new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xff7ab6 : i === 1 ? 0x8b5cf6 : 0x22d3ee,
        transparent: true,
        opacity: 0.06
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.15 + i * 0.12;
    scene.add(ring);
  }
}

function burstTinySparkles(count) {
  for (let i = 0; i < count; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.045 + Math.random() * 0.02, 8, 8),
      new THREE.MeshBasicMaterial({
        color: [0xff7ab6, 0xc4b5fd, 0x7dd3fc, 0xfff1a8, 0xffffff][(Math.random() * 5) | 0],
        transparent: true,
        opacity: 1
      })
    );

    spark.position.set(
      (Math.random() - 0.5) * 0.35,
      3.18 + Math.random() * 0.65,
      (Math.random() - 0.5) * 0.35
    );

    spark.userData = {
      vx: (Math.random() - 0.5) * 0.018,
      vy: 0.018 + Math.random() * 0.024,
      vz: (Math.random() - 0.5) * 0.018,
      life: 42 + Math.random() * 18
    };

    scene.add(spark);
    smokeParticles.push(spark);
  }
}

function createSmokeBurst() {
  for (let i = 0; i < 14; i++) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.07 + Math.random() * 0.04, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xb8b8c6,
        transparent: true,
        opacity: 0.28,
        roughness: 1
      })
    );

    smoke.position.set(
      (Math.random() - 0.5) * 0.22,
      3.08 + Math.random() * 0.18,
      (Math.random() - 0.5) * 0.22
    );

    smoke.userData = {
      vx: (Math.random() - 0.5) * 0.006,
      vy: 0.012 + Math.random() * 0.012,
      vz: (Math.random() - 0.5) * 0.006,
      life: 72 + Math.random() * 24
    };

    scene.add(smoke);
    smokeParticles.push(smoke);
  }
}

function animate() {
  requestAnimationFrame(animate);

  controls.autoRotate = autoRotate;
  controls.update();

  if (cakeGroup) cakeGroup.rotation.y += 0.00115;

  const t = performance.now() * 0.01;

  if (candleFlameOuter && candleFlameInner) {
    const flicker = 1 + Math.sin(t * 1.25) * 0.07;
    const flickerY = 1 + Math.sin(t * 1.95) * 0.09;

    candleFlameOuter.scale.set(0.9 * flicker, 1.35 * flickerY, 0.8 * flicker);
    candleFlameInner.scale.set(0.72 * flicker, 1.18 * flickerY, 0.62 * flicker);

    candleFlameOuter.position.x = Math.sin(t * 0.82) * 0.03;
    candleFlameOuter.position.z = Math.cos(t * 0.72) * 0.03;
    candleFlameInner.position.x = Math.sin(t * 0.92) * 0.02;
    candleFlameInner.position.z = Math.cos(t * 0.78) * 0.02;
  }

  if (candleLight) {
    candleLight.intensity = candleOn ? 1.22 + Math.sin(t * 1.7) * 0.15 : 0;
  }

  for (const mesh of textMeshes) {
    if (mesh.userData.faceCamera) {
      mesh.lookAt(camera.position);
      mesh.rotateY(Math.PI);
      mesh.rotateX(mesh.userData.baseTilt || 0);
    }
  }

  for (const group of dustParticles) {
    group.rotation.y += 0.00014;
  }

  for (const orb of glowOrbs) {
    orb.position.x += orb.userData.vx;
    orb.position.y += orb.userData.vy;
    orb.position.z += orb.userData.vz;

    if (orb.position.y > 10.5) {
      orb.position.y = -2.2;
      orb.position.x = (Math.random() - 0.5) * 22;
      orb.position.z = (Math.random() - 0.5) * 22;
    }
  }

  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const p = smokeParticles[i];
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;
    p.userData.life -= 1;

    if (p.material && p.material.opacity !== undefined) {
      p.material.opacity *= 0.985;
    }
    if (p.scale && p.scale.multiplyScalar) {
      p.scale.multiplyScalar(1.01);
    }

    if (p.userData.life <= 0) {
      scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
      smokeParticles.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

function onResize() {
  const w = sceneEl.clientWidth;
  const h = sceneEl.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
