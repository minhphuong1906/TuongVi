let scene, camera, renderer, controls;
let cakeGroup;
let candleFlameOuter, candleFlameInner, candleLight;
let audio = null;
let musicReady = null;
let autoRotate = true;
let candleOn = true;
let musicOn = true;
let started = false;

const sceneEl = document.getElementById("scene");
const overlay = document.getElementById("overlay");
const btnStart = document.getElementById("btnStart");
const btnMusic = document.getElementById("btnMusic");
const btnCandle = document.getElementById("btnCandle");
const btnOrbit = document.getElementById("btnOrbit");
const musicState = document.getElementById("musicState");
const candleState = document.getElementById("candleState");
const orbitState = document.getElementById("orbitState");
const bgMusic = document.getElementById("bgMusic");

const sparkleParticles = [];
const driftOrbs = [];
const smokeParticles = [];

btnStart.addEventListener("click", startExperience);
btnMusic.addEventListener("click", toggleMusic);
btnCandle.addEventListener("click", toggleCandle);
btnOrbit.addEventListener("click", toggleAutoRotate);

init();
animate();
loadMusicConfig();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090411);
  scene.fog = new THREE.FogExp2(0x090411, 0.018);

  camera = new THREE.PerspectiveCamera(
    45,
    sceneEl.clientWidth / sceneEl.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 8.8, 24.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(sceneEl.clientWidth, sceneEl.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  sceneEl.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.95;
  controls.enablePan = false;
  controls.minDistance = 12;
  controls.maxDistance = 34;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = Math.PI / 2 - 0.08;
  controls.target.set(0, 0.55, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.48);
  scene.add(ambient);

  const warm = new THREE.DirectionalLight(0xffd6e8, 1.25);
  warm.position.set(6, 16, 10);
  warm.castShadow = true;
  warm.shadow.mapSize.set(1024, 1024);
  scene.add(warm);

  const pink = new THREE.PointLight(0xff5fa5, 1.3, 40);
  pink.position.set(12, 6, 10);
  scene.add(pink);

  const purple = new THREE.PointLight(0x8b5cf6, 1.1, 40);
  purple.position.set(-12, 7, -8);
  scene.add(purple);

  const blue = new THREE.PointLight(0x22d3ee, 0.6, 35);
  blue.position.set(0, 10, -14);
  scene.add(blue);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(32, 80),
    new THREE.MeshStandardMaterial({
      color: 0x130919,
      roughness: 1,
      metalness: 0
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.25;
  floor.receiveShadow = true;
  scene.add(floor);

  cakeGroup = new THREE.Group();
  cakeGroup.position.y = -0.15;
  scene.add(cakeGroup);

  createCake();
  createStarField();
  createFloatingOrbs();
  createSoftGlowRings();

  window.addEventListener("resize", onResize);
}

function loadMusicConfig() {
  musicReady = fetch("music.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("music.json not found");
      return res.json();
    })
    .then((data) => {
      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.tracks)) {
        list = data.tracks;
      } else if (typeof data.music === "string") {
        list = [data.music];
      }

      const firstTrack = list[0];
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
  if (musicReady) {
    await musicReady;
  }
}

async function startExperience() {
  if (started) return;
  started = true;

  overlay.classList.add("hide");

  await ensureMusicReady();

  if (bgMusic.src) {
    bgMusic.volume = 0.38;
    try {
      await bgMusic.play();
      musicOn = true;
      updateMusicButton();
    } catch (err) {
      console.log("Play blocked by browser:", err);
    }
  }
}

async function toggleMusic() {
  await ensureMusicReady();

  if (!bgMusic.src) {
    return;
  }

  if (bgMusic.paused) {
    try {
      await bgMusic.play();
      musicOn = true;
    } catch (err) {
      console.log("Play blocked by browser:", err);
    }
  } else {
    bgMusic.pause();
    musicOn = false;
  }

  updateMusicButton();
}

function updateMusicButton() {
  if (musicOn) {
    musicState.textContent = "Đang Phát";
    btnMusic.classList.remove("music-off");
    btnMusic.classList.add("music-on");
  } else {
    musicState.textContent = "Bật Nhạc";
    btnMusic.classList.remove("music-on");
    btnMusic.classList.add("music-off");
  }
}

function toggleCandle() {
  candleOn = !candleOn;

  if (candleFlameOuter && candleFlameInner) {
    candleFlameOuter.visible = candleOn;
    candleFlameInner.visible = candleOn;
  }

  if (candleLight) {
    candleLight.visible = candleOn;
  }

  if (candleOn) {
    candleState.textContent = "Thổi Tắt Nến";
    btnCandle.classList.remove("off");
    puffTinySparkles(10);
  } else {
    candleState.textContent = "Thắp Lại Nến";
    btnCandle.classList.add("off");
    createSmokeBurst();
  }
}

function toggleAutoRotate() {
  autoRotate = !autoRotate;
  controls.autoRotate = autoRotate;

  if (autoRotate) {
    orbitState.textContent = "Tự Xoay Bật";
    btnOrbit.classList.remove("off");
  } else {
    orbitState.textContent = "Tự Xoay Tắt";
    btnOrbit.classList.add("off");
  }
}

function createCake() {
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(7.4, 7.4, 0.28, 64),
    new THREE.MeshStandardMaterial({
      color: 0xfaf7fc,
      roughness: 0.14,
      metalness: 0.08
    })
  );
  plate.position.y = -2.95;
  plate.receiveShadow = true;
  cakeGroup.add(plate);

  const plateRim = new THREE.Mesh(
    new THREE.TorusGeometry(7.25, 0.11, 16, 120),
    new THREE.MeshStandardMaterial({
      color: 0xd7b56d,
      roughness: 0.22,
      metalness: 0.82
    })
  );
  plateRim.rotation.x = Math.PI / 2;
  plateRim.position.y = -2.82;
  cakeGroup.add(plateRim);

  const tier1 = new THREE.Mesh(
    new THREE.CylinderGeometry(5.3, 5.3, 2.2, 72),
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
    new THREE.CylinderGeometry(4.05, 4.05, 1.9, 72),
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
    new THREE.CylinderGeometry(2.75, 2.75, 1.55, 72),
    new THREE.MeshStandardMaterial({
      color: 0xffd9e8,
      roughness: 0.3
    })
  );
  tier3.position.y = 2.15;
  tier3.castShadow = true;
  tier3.receiveShadow = true;
  cakeGroup.add(tier3);

  const syrup1 = new THREE.Mesh(
    new THREE.CylinderGeometry(5.36, 5.36, 0.42, 72),
    new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.12,
      transparent: true,
      opacity: 0.95
    })
  );
  syrup1.position.y = -0.33;
  cakeGroup.add(syrup1);

  const syrup2 = new THREE.Mesh(
    new THREE.CylinderGeometry(4.1, 4.1, 0.35, 72),
    new THREE.MeshStandardMaterial({
      color: 0xdb2777,
      roughness: 0.12,
      transparent: true,
      opacity: 0.95
    })
  );
  syrup2.position.y = 1.1;
  cakeGroup.add(syrup2);

  const syrup3 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 2.8, 0.3, 72),
    new THREE.MeshStandardMaterial({
      color: 0xff66ad,
      roughness: 0.1,
      transparent: true,
      opacity: 0.96
    })
  );
  syrup3.position.y = 2.83;
  cakeGroup.add(syrup3);

  addDrips(5.3, -0.31, 0xe11d48, 30);
  addDrips(4.03, 1.1, 0xdb2777, 22);
  addDrips(2.76, 2.83, 0xff66ad, 16);

  addSprinkles(5.2, -0.18, 68);
  addCreamDots(4.1, 1.37, 24);
  addCreamDots(2.8, 3.05, 16);

  addStrawberries(2.55, 3.08, 6);
  addRibbon(5.28, -1.15);

  createCandle(0, 3.35, 0);

  createCurvedText("15", {
    radius: 2.95,
    y: 3.95,
    arc: 0.34,
    fontSize: 140,
    color: "#fff8e8",
    tiltX: -0.14
  });

  createCurvedText("Trịnh Ngọc Tường Vi", {
    radius: 5.55,
    y: -1.18,
    arc: 1.02,
    fontSize: 92,
    color: "#fff8fb",
    tiltX: 0.0
  });
}

function createCandle(x, y, z) {
  const candleGroup = new THREE.Group();
  candleGroup.position.set(x, y, z);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 2.05, 18),
    new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.28
    })
  );
  body.position.y = 1.02;
  body.castShadow = true;
  candleGroup.add(body);

  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(
      new THREE.TorusGeometry(0.225, 0.028, 10, 20),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xffdf6c : 0xfff1f7,
        roughness: 0.2
      })
    );
    stripe.position.y = 0.28 + i * 0.29;
    stripe.rotation.x = Math.PI / 2 + 0.17;
    candleGroup.add(stripe);
  }

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.25, 8),
    new THREE.MeshBasicMaterial({ color: 0x2f2f2f })
  );
  wick.position.y = 2.12;
  candleGroup.add(wick);

  candleFlameOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffa84c,
      transparent: true,
      opacity: 0.92
    })
  );
  candleFlameOuter.scale.set(0.9, 1.38, 0.8);
  candleFlameOuter.position.y = 2.46;
  candleGroup.add(candleFlameOuter);

  candleFlameInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.94
    })
  );
  candleFlameInner.scale.set(0.7, 1.2, 0.6);
  candleFlameInner.position.y = 2.5;
  candleGroup.add(candleFlameInner);

  candleLight = new THREE.PointLight(0xffd39a, 1.45, 10);
  candleLight.position.set(0, 2.5, 0);
  candleGroup.add(candleLight);

  cakeGroup.add(candleGroup);
}

function addRibbon(radius, y) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.16, 20, 150),
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
  bowLeft.position.set(-0.35, y + 0.08, radius + 0.14);
  cakeGroup.add(bowLeft);

  const bowRight = bowLeft.clone();
  bowRight.position.x = 0.35;
  cakeGroup.add(bowRight);
}

function addSprinkles(radius, y, count) {
  const colors = [0xffeb3b, 0x00d2ff, 0x8b5cf6, 0x4ade80, 0xff7ab6, 0xffffff];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.25;
    const r = radius + (Math.random() * 0.18 - 0.08);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const sprinkle = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 10, 10),
      new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.2
      })
    );
    sprinkle.position.set(x, y + Math.random() * 0.22, z);
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
    dollop.scale.set(1, 1.38, 1);
    dollop.position.set(x, y, z);
    dollop.rotation.y = -angle;
    cakeGroup.add(dollop);
  }
}

function addStrawberries(radius, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.28;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const berryGroup = new THREE.Group();

    const berry = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.78, 16),
      new THREE.MeshStandardMaterial({
        color: 0xdf1a2e,
        roughness: 0.12,
        metalness: 0.06
      })
    );
    berry.rotation.x = Math.PI;
    berry.rotation.z = 0.18;
    berryGroup.add(berry);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.18, 8),
      new THREE.MeshStandardMaterial({
        color: 0x2f8f3a,
        roughness: 0.66
      })
    );
    stem.position.y = 0.43;
    berryGroup.add(stem);

    berryGroup.position.set(x, y, z);
    berryGroup.lookAt(0, y, 0);
    cakeGroup.add(berryGroup);
  }
}

function addDrips(radius, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.12;
    const r = radius + (Math.random() * 0.08 - 0.04);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const drip = new THREE.Mesh(
      new THREE.SphereGeometry(0.16 + Math.random() * 0.08, 12, 12),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.18,
        transparent: true,
        opacity: 0.98
      })
    );
    drip.position.set(x, y - 0.1 - Math.random() * 0.46, z);
    drip.scale.set(0.72, 1.22 + Math.random() * 0.5, 0.72);
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
  const count = chars.length;
  const totalArc = arc;
  const start = -totalArc / 2;
  const step = count > 1 ? totalArc / (count - 1) : 0;

  chars.forEach((char, i) => {
    const mesh = makeTextCharMesh(char, {
      fontSize,
      color
    });

    const angle = start + i * step;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;

    mesh.position.set(x, y, z);
    mesh.rotation.y = angle * 0.45;
    mesh.rotation.x = tiltX;
    mesh.scale.set(0.19, 0.19, 0.19);

    cakeGroup.add(mesh);
  });
}

function makeTextCharMesh(char, options = {}) {
  const {
    fontSize = 100,
    color = "#ffffff"
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (char !== " ") {
    ctx.font = `900 ${fontSize}px Quicksand, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(255,255,255,0.35)";
    ctx.shadowBlur = 18;
    ctx.fillText(char, canvas.width / 2, canvas.height / 2 + 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  });

  return new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.8),
    material
  );
}

function createStarField() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 700;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 36 + Math.random() * 35;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    starPositions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.cos(phi) * 0.55;
    starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  sparkleParticles.push({
    mesh: stars,
    type: "stars"
  });
}

function createFloatingOrbs() {
  const orbColors = [0xff7ab6, 0xc4b5fd, 0x7dd3fc, 0xfff1a8, 0xffffff];

  for (let i = 0; i < 26; i++) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 + Math.random() * 0.18, 16, 16),
      new THREE.MeshStandardMaterial({
        color: orbColors[i % orbColors.length],
        transparent: true,
        opacity: 0.18,
        roughness: 0.1,
        metalness: 0.1
      })
    );

    orb.position.set(
      (Math.random() - 0.5) * 22,
      -1.8 + Math.random() * 12,
      (Math.random() - 0.5) * 22
    );

    orb.userData = {
      vx: (Math.random() - 0.5) * 0.008,
      vy: 0.005 + Math.random() * 0.01,
      vz: (Math.random() - 0.5) * 0.008
    };

    scene.add(orb);
    driftOrbs.push(orb);
  }
}

function createSoftGlowRings() {
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(9 + i * 2.4, 0.045, 10, 180),
      new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xff7ab6 : i === 1 ? 0x8b5cf6 : 0x22d3ee,
        transparent: true,
        opacity: 0.08
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.15 + i * 0.15;
    scene.add(ring);
  }
}

function puffTinySparkles(count) {
  for (let i = 0; i < count; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.05 + Math.random() * 0.03, 8, 8),
      new THREE.MeshBasicMaterial({
        color: [0xff7ab6, 0xc4b5fd, 0x7dd3fc, 0xfff1a8, 0xffffff][Math.floor(Math.random() * 5)],
        transparent: true,
        opacity: 1
      })
    );

    spark.position.set(
      (Math.random() - 0.5) * 0.35,
      3.2 + Math.random() * 0.8,
      (Math.random() - 0.5) * 0.35
    );

    spark.userData = {
      vx: (Math.random() - 0.5) * 0.02,
      vy: 0.02 + Math.random() * 0.03,
      vz: (Math.random() - 0.5) * 0.02,
      life: 45 + Math.random() * 20
    };

    scene.add(spark);
    smokeParticles.push(spark);
  }
}

function createSmokeBurst() {
  for (let i = 0; i < 18; i++) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xb8b8c6,
        transparent: true,
        opacity: 0.35,
        roughness: 1
      })
    );

    smoke.position.set(
      (Math.random() - 0.5) * 0.22,
      3.1 + Math.random() * 0.25,
      (Math.random() - 0.5) * 0.22
    );

    smoke.userData = {
      vx: (Math.random() - 0.5) * 0.008,
      vy: 0.012 + Math.random() * 0.018,
      vz: (Math.random() - 0.5) * 0.008,
      life: 80 + Math.random() * 35
    };

    scene.add(smoke);
    smokeParticles.push(smoke);
  }
}

function animate() {
  requestAnimationFrame(animate);

  controls.autoRotate = autoRotate;
  controls.update();

  if (cakeGroup) {
    cakeGroup.rotation.y += 0.0012;
  }

  const t = performance.now() * 0.01;

  if (candleFlameOuter && candleFlameInner) {
    const flicker = 1 + Math.sin(t * 1.25) * 0.08;
    const flickerY = 1 + Math.sin(t * 1.95) * 0.1;

    candleFlameOuter.scale.set(0.9 * flicker, 1.38 * flickerY, 0.8 * flicker);
    candleFlameInner.scale.set(0.7 * flicker, 1.2 * flickerY, 0.6 * flicker);

    candleFlameOuter.position.x = Math.sin(t * 0.85) * 0.03;
    candleFlameOuter.position.z = Math.cos(t * 0.7) * 0.03;
    candleFlameInner.position.x = Math.sin(t * 0.95) * 0.02;
    candleFlameInner.position.z = Math.cos(t * 0.75) * 0.02;
  }

  if (candleLight) {
    candleLight.intensity = candleOn ? 1.3 + Math.sin(t * 1.8) * 0.18 : 0;
  }

  sparkleParticles.forEach((group) => {
    if (group.type === "stars") {
      group.mesh.rotation.y += 0.00015;
    }
  });

  driftOrbs.forEach((orb) => {
    orb.position.x += orb.userData.vx;
    orb.position.y += orb.userData.vy;
    orb.position.z += orb.userData.vz;

    if (orb.position.y > 10.5) {
      orb.position.y = -2.2;
      orb.position.x = (Math.random() - 0.5) * 22;
      orb.position.z = (Math.random() - 0.5) * 22;
    }
  });

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
