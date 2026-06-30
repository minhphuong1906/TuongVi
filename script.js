let scene, camera, renderer, controls;
let cakeGroup, candleFlame, flameLight;
let particles = [];
let fireworks = [];
let cakePieces = [];
let started = false;

const sceneEl = document.getElementById("scene");
const overlay = document.getElementById("overlay");
const btnStart = document.getElementById("btnStart");
const btnFireworks = document.getElementById("btnFireworks");

btnStart.addEventListener("click", startShow);
btnFireworks.addEventListener("click", burstFireworks);

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090411, 0.02);

  camera = new THREE.PerspectiveCamera(
    45,
    sceneEl.clientWidth / sceneEl.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 24);

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
  controls.autoRotateSpeed = 1.1;
  controls.minDistance = 12;
  controls.maxDistance = 34;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;

  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffd7ee, 1.25);
  dir.position.set(6, 16, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  scene.add(dir);

  const pinkLight = new THREE.PointLight(0xff5ca8, 1.0, 30);
  pinkLight.position.set(10, 5, 8);
  scene.add(pinkLight);

  const purpleLight = new THREE.PointLight(0x8b5cf6, 1.0, 30);
  purpleLight.position.set(-10, 7, -8);
  scene.add(purpleLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 64),
    new THREE.MeshStandardMaterial({
      color: 0x120817,
      roughness: 1,
      metalness: 0
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.2;
  floor.receiveShadow = true;
  scene.add(floor);

  cakeGroup = new THREE.Group();
  scene.add(cakeGroup);

  createCake();
  createSparkles();
  createFloatingBubbles();

  window.addEventListener("resize", onResize);
}

function startShow() {
  if (started) return;
  started = true;
  overlay.classList.add("hide");

  for (let i = 0; i < 3; i++) {
    setTimeout(burstFireworks, i * 700);
  }
}

function createCake() {
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(7.1, 7.1, 0.28, 64),
    new THREE.MeshStandardMaterial({
      color: 0xf9f7fb,
      roughness: 0.15,
      metalness: 0.1
    })
  );
  plate.position.y = -2.95;
  plate.receiveShadow = true;
  cakeGroup.add(plate);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(7.0, 0.12, 16, 120),
    new THREE.MeshStandardMaterial({
      color: 0xd7b56d,
      roughness: 0.2,
      metalness: 0.8
    })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -2.82;
  cakeGroup.add(rim);

  const tier1 = new THREE.Mesh(
    new THREE.CylinderGeometry(5.2, 5.2, 2.2, 64),
    new THREE.MeshStandardMaterial({
      color: 0xffaac7,
      roughness: 0.42
    })
  );
  tier1.position.y = -1.45;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  cakeGroup.add(tier1);

  const tier2 = new THREE.Mesh(
    new THREE.CylinderGeometry(4.0, 4.0, 1.9, 64),
    new THREE.MeshStandardMaterial({
      color: 0xfff7fb,
      roughness: 0.32
    })
  );
  tier2.position.y = 0.55;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  cakeGroup.add(tier2);

  const tier3 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 2.7, 1.6, 64),
    new THREE.MeshStandardMaterial({
      color: 0xffd7e6,
      roughness: 0.35
    })
  );
  tier3.position.y = 2.15;
  tier3.castShadow = true;
  tier3.receiveShadow = true;
  cakeGroup.add(tier3);

  const syrup1 = new THREE.Mesh(
    new THREE.CylinderGeometry(5.24, 5.24, 0.42, 64),
    new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.12,
      transparent: true,
      opacity: 0.93
    })
  );
  syrup1.position.y = -0.35;
  cakeGroup.add(syrup1);

  const syrup2 = new THREE.Mesh(
    new THREE.CylinderGeometry(4.04, 4.04, 0.36, 64),
    new THREE.MeshStandardMaterial({
      color: 0xdb2777,
      roughness: 0.12,
      transparent: true,
      opacity: 0.92
    })
  );
  syrup2.position.y = 1.15;
  cakeGroup.add(syrup2);

  const syrup3 = new THREE.Mesh(
    new THREE.CylinderGeometry(2.74, 2.74, 0.32, 64),
    new THREE.MeshStandardMaterial({
      color: 0xff66ad,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95
    })
  );
  syrup3.position.y = 2.88;
  cakeGroup.add(syrup3);

  addDrips(5.2, -0.35, 0xe11d48, 28);
  addDrips(4.0, 1.15, 0xdb2777, 20);
  addDrips(2.7, 2.88, 0xff66ad, 14);

  addSprinkles(5.12, -0.22, 60);
  addCreamDots(4.05, 1.46, 22);
  addCreamDots(2.72, 3.12, 14);

  addStrawberries(2.6, 3.15, 6);

  createCandle(0, 3.42, 0);

  const ageTag = makeTextPlane("15", {
    width: 700,
    height: 340,
    fontSize: 200,
    textColor: "#fff8ea",
    background: "rgba(223, 100, 147, 0.92)",
    stroke: "rgba(255,255,255,0.45)",
    strokeWidth: 12,
    radius: 38
  });
  ageTag.position.set(0, 4.15, 0.2);
  ageTag.rotation.x = -0.15;
  ageTag.castShadow = true;
  cakeGroup.add(ageTag);

  const nameTag = makeTextPlane("Trịnh Ngọc Tường Vi", {
    width: 1200,
    height: 300,
    fontSize: 92,
    textColor: "#fff8fb",
    background: "rgba(79, 70, 229, 0.86)",
    stroke: "rgba(255,255,255,0.35)",
    strokeWidth: 8,
    radius: 36
  });
  nameTag.position.set(0, -1.15, 5.05);
  nameTag.rotation.y = 0;
  nameTag.rotation.x = 0;
  cakeGroup.add(nameTag);
}

function createCandle(x, y, z) {
  const candleGroup = new THREE.Group();
  candleGroup.position.set(x, y, z);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 2.0, 18),
    new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.3
    })
  );
  body.castShadow = true;
  body.position.y = 1.0;
  candleGroup.add(body);

  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.225, 0.028, 10, 20),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xffdf6c : 0xfff0f5,
        roughness: 0.2
      })
    );
    ring.position.y = 0.25 + i * 0.28;
    ring.rotation.x = Math.PI / 2 + 0.15;
    candleGroup.add(ring);
  }

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8),
    new THREE.MeshBasicMaterial({ color: 0x2c2c2c })
  );
  wick.position.y = 2.08;
  candleGroup.add(wick);

  const flameOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 18),
    new THREE.MeshBasicMaterial({ color: 0xffa94d, transparent: true, opacity: 0.92 })
  );
  flameOuter.scale.set(0.9, 1.35, 0.8);
  flameOuter.position.y = 2.42;
  candleGroup.add(flameOuter);

  const flameInner = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 18, 18),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 })
  );
  flameInner.scale.set(0.75, 1.2, 0.65);
  flameInner.position.y = 2.47;
  candleGroup.add(flameInner);

  flameLight = new THREE.PointLight(0xffcc88, 1.4, 11);
  flameLight.position.set(0, 2.48, 0);
  candleGroup.add(flameLight);

  candleFlame = { outer: flameOuter, inner: flameInner };
  cakeGroup.add(candleGroup);
}

function addSprinkles(radius, y, count) {
  const colors = [0xffeb3b, 0x00d2ff, 0x8b5cf6, 0x4ade80, 0xff7ab6, 0xffffff];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const r = radius + (Math.random() * 0.15 - 0.07);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const sprinkle = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 10, 10),
      new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.22
      })
    );
    sprinkle.position.set(x, y + (Math.random() * 0.25), z);
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
        roughness: 0.28
      })
    );
    dollop.scale.set(1, 1.35, 1);
    dollop.position.set(x, y, z);
    dollop.rotation.y = -angle;
    cakeGroup.add(dollop);
  }
}

function addStrawberries(radius, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.35;
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
      new THREE.CylinderGeometry(0.045, 0.06, 0.18, 8),
      new THREE.MeshStandardMaterial({ color: 0x2f8f3a, roughness: 0.65 })
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
    const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.12);
    const r = radius + (Math.random() * 0.1 - 0.05);
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
    drip.position.set(x, y - 0.12 - Math.random() * 0.45, z);
    drip.scale.set(0.72, 1.25 + Math.random() * 0.5, 0.72);
    cakeGroup.add(drip);
  }
}

function makeTextPlane(text, options = {}) {
  const {
    width = 1024,
    height = 256,
    fontSize = 96,
    textColor = "#ffffff",
    background = "rgba(0,0,0,0.5)",
    stroke = "rgba(255,255,255,0.3)",
    strokeWidth = 8,
    radius = 26
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  roundRect(ctx, 0, 0, width, height, radius, background);

  ctx.font = `800 ${fontSize}px Quicksand, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = stroke;
  ctx.fillStyle = textColor;
  ctx.strokeText(text, width / 2, height / 2);
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true
  });

  const aspect = width / height;
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6 * aspect, 4.6),
    material
  );

  return plane;
}

function roundRect(ctx, x, y, w, h, r, fillStyle) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function createSparkles() {
  for (let i = 0; i < 150; i++) {
    const geo = new THREE.SphereGeometry(0.045 + Math.random() * 0.03, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: [0xff7ab6, 0xc4b5fd, 0x7dd3fc, 0xfff1a8, 0xffffff][Math.floor(Math.random() * 5)]
    });
    const p = new THREE.Mesh(geo, mat);
    resetSparkle(p, true);
    scene.add(p);
    particles.push({
      mesh: p,
      speed: 0.008 + Math.random() * 0.02,
      wobble: Math.random() * Math.PI * 2
    });
  }
}

function resetSparkle(mesh, randomHeight = false) {
  const radius = 24 + Math.random() * 10;
  const angle = Math.random() * Math.PI * 2;
  mesh.position.set(
    Math.cos(angle) * radius,
    randomHeight ? -1 + Math.random() * 12 : 10 + Math.random() * 10,
    Math.sin(angle) * radius
  );
}

function createFloatingBubbles() {
  for (let i = 0; i < 24; i++) {
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 + Math.random() * 0.18, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffd8eb,
        transparent: true,
        opacity: 0.18,
        roughness: 0.1,
        metalness: 0.1
      })
    );
    bubble.position.set(
      (Math.random() - 0.5) * 20,
      -2 + Math.random() * 10,
      (Math.random() - 0.5) * 20
    );
    bubble.userData = {
      driftX: (Math.random() - 0.5) * 0.006,
      driftY: 0.006 + Math.random() * 0.01,
      driftZ: (Math.random() - 0.5) * 0.006
    };
    scene.add(bubble);
    cakePieces.push(bubble);
  }
}

function burstFireworks() {
  const colors = [0xff4da6, 0x8b5cf6, 0x22d3ee, 0xffdf6c, 0xffffff];

  for (let i = 0; i < 28; i++) {
    const m = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)]
    });
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), m);
    s.position.set(
      (Math.random() - 0.5) * 3,
      4 + Math.random() * 3,
      (Math.random() - 0.5) * 3
    );

    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 0.18,
      0.08 + Math.random() * 0.16,
      (Math.random() - 0.5) * 0.18
    );

    fireworks.push({
      mesh: s,
      velocity: dir,
      life: 90 + Math.random() * 25
    });

    scene.add(s);
  }
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  if (cakeGroup) {
    cakeGroup.rotation.y += 0.0014;
  }

  if (candleFlame) {
    const t = performance.now() * 0.01;
    const sx = 1 + Math.sin(t * 1.2) * 0.08;
    const sy = 1 + Math.sin(t * 1.7) * 0.12;
    candleFlame.outer.scale.set(0.9 * sx, 1.35 * sy, 0.8 * sx);
    candleFlame.inner.scale.set(0.75 * sx, 1.2 * sy, 0.65 * sx);
    candleFlame.outer.position.x = Math.sin(t * 0.8) * 0.03;
    candleFlame.outer.position.z = Math.cos(t * 0.6) * 0.03;
    candleFlame.inner.position.x = Math.sin(t * 0.9) * 0.02;
    candleFlame.inner.position.z = Math.cos(t * 0.7) * 0.02;

    if (flameLight) {
      flameLight.intensity = 1.2 + Math.sin(t * 1.8) * 0.22;
    }
  }

  for (const p of particles) {
    p.mesh.position.y += p.speed * 0.3;
    p.mesh.position.x += Math.sin(p.wobble + performance.now() * 0.001) * 0.004;
    p.mesh.position.z += Math.cos(p.wobble + performance.now() * 0.001) * 0.004;

    if (p.mesh.position.y > 18) {
      resetSparkle(p.mesh, false);
    }
  }

  for (const b of cakePieces) {
    b.position.x += b.userData.driftX;
    b.position.y += b.userData.driftY;
    b.position.z += b.userData.driftZ;

    if (b.position.y > 10) {
      b.position.y = -3.4 - Math.random() * 1.5;
      b.position.x = (Math.random() - 0.5) * 16;
      b.position.z = (Math.random() - 0.5) * 16;
    }
  }

  for (let i = fireworks.length - 1; i >= 0; i--) {
    const f = fireworks[i];
    f.mesh.position.add(f.velocity);
    f.velocity.y -= 0.0032;
    f.life -= 1;

    if (f.life <= 0) {
      scene.remove(f.mesh);
      fireworks.splice(i, 1);
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
