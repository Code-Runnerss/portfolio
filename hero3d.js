// Hero scene: Chintan's 3D avatar portrait surrounded by floating Shopify UI
// panels (storefront, Liquid code, cart), glow rings and particles. Lighter on small screens, paused off-screen.
import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
const hero = document.getElementById('hero');

if (canvas && hero) init();

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    document.documentElement.classList.add('no-webgl');
    return;
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  /* ---------- Lights ---------- */
  scene.add(new THREE.HemisphereLight(0xfff4ec, 0x1c1e26, 1.9));
  const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(2.5, 4, 5); scene.add(key);
  const rimL = new THREE.DirectionalLight(0xff642d, 3); rimL.position.set(-4, 2, -3); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xff8a5c, 1.6); rimR.position.set(4, 0, -2); scene.add(rimR);
  const under = new THREE.PointLight(0xff642d, 7, 9, 2); under.position.set(0, -2.4, 2.6); scene.add(under);

  /* ---------- Avatar: Chintan's 3D avatar portrait ---------- */
  // The avatar render sits in the scene as a soft-edged card: it tilts toward the
  // pointer and floats, while the glow, rings and UI panels move around it in 3D.
  const avatar = new THREE.Group();
  scene.add(avatar);
  const AV_H = 3.9, AV_W = AV_H * (310 / 387);   // keep the image's aspect ratio
  const radial = (w, h, stops, sy = 1) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.translate(w / 2, h / 2); g.scale(1, sy);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
    stops.forEach(([o, col]) => grad.addColorStop(o, col));
    g.fillStyle = grad; g.fillRect(-w, -h, w * 2, h * 2);
    return new THREE.CanvasTexture(c);
  };
  // soft oval fade so the cropped hair and shoulders melt into the dark hero
  const fadeMask = radial(256, 320, [[0, '#fff'], [0.6, '#fff'], [1, '#000']], 1.25);
  // warm glow behind the portrait
  const haloTex = radial(256, 256, [[0, 'rgba(255,100,45,.55)'], [0.45, 'rgba(255,100,45,.18)'], [1, 'rgba(255,100,45,0)']]);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(AV_W * 1.9, AV_W * 1.9), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  halo.position.set(0, -0.2, -0.6);
  avatar.add(halo);
  const portraitMat = new THREE.MeshBasicMaterial({ alphaMap: fadeMask, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
  const portraitCard = new THREE.Mesh(new THREE.PlaneGeometry(AV_W, AV_H), portraitMat);
  portraitCard.position.y = -0.35;
  avatar.add(portraitCard);
  new THREE.TextureLoader().load('assets/avatar.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    portraitMat.map = tex;
    portraitMat.opacity = 1;
    portraitMat.needsUpdate = true;
    if (reduce) renderer.render(scene, camera);
  });

  /* ---------- Floating UI panels ---------- */
  const panel = (draw, w = 512, h = 340) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.closePath();
    g.save(); g.clip(); draw(g, w, h); g.restore();
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,100,45,.85)'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2 * h / w), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
    scene.add(mesh);
    return mesh;
  };
  const dots = (g) => ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(34 + i * 22, 30, 7, 0, 7); g.fill(); });
  const bar = (g, x, y, w, h, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fill(); };

  const store = panel((g, w, h) => {
    g.fillStyle = '#121318'; g.fillRect(0, 0, w, h); dots(g);
    const grd = g.createRadialGradient(150, 175, 10, 150, 175, 110); grd.addColorStop(0, '#ffc49f'); grd.addColorStop(0.45, '#ff642d'); grd.addColorStop(1, '#3a1406');
    g.fillStyle = '#1c1e24'; g.beginPath(); g.roundRect(34, 62, 232, 240, 18); g.fill();
    g.fillStyle = grd; g.beginPath(); g.arc(150, 180, 74, 0, 7); g.fill();
    g.fillStyle = '#f4f1eb'; g.font = '700 30px Manrope, Arial'; g.fillText('New drop', 290, 104);
    g.fillStyle = '#ff642d'; g.font = '700 26px Manrope, Arial'; g.fillText('$68.00', 290, 146);
    bar(g, 290, 172, 180, 12, '#3a3d45'); bar(g, 290, 196, 140, 12, '#3a3d45');
    bar(g, 290, 244, 186, 46, '#ff642d');
    g.fillStyle = '#121318'; g.font = '600 18px "DM Mono", monospace'; g.fillText('ADD TO CART', 318, 274);
  });
  const code = panel((g, w, h) => {
    g.fillStyle = '#0d0e11'; g.fillRect(0, 0, w, h); dots(g);
    g.font = '500 21px "DM Mono", monospace';
    const lines = [
      [['{% ', '#ff8a5c'], ['for', '#ff8a5c'], [' variant ', '#d9d6d0'], ['in', '#ff8a5c'], [' product.variants %}', '#d9d6d0']],
      [['  <', '#e8a87c'], ['option', '#e8a87c'], [' value=', '#9ecbff'], ['"{{ variant.id }}"', '#a8d8a0'], ['>', '#e8a87c']],
      [['    {{ variant.title }}', '#d9d6d0']],
      [['  </option>', '#e8a87c']],
      [['{% endfor %}', '#ff8a5c']],
      [['{{ ', '#ff8a5c'], ['product.price', '#ffd479'], [' | money }}', '#ff8a5c']],
      [['{% render ', '#ff8a5c'], ["'cart-drawer'", '#a8d8a0'], [' %}', '#ff8a5c']],
    ];
    lines.forEach((parts, i) => { let x = 30; parts.forEach(([t, c]) => { g.fillStyle = c; g.fillText(t, x, 92 + i * 36); x += g.measureText(t).width; }); });
  });
  const cartPanel = panel((g, w, h) => {
    g.fillStyle = '#f4f1eb'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#16171a'; g.font = '800 30px Manrope, Arial'; g.fillText('Your cart (2)', 32, 58);
    [['#17191e', 'Runner Hoodie', '$68.00'], ['#ff642d', 'Runner Cap', '$24.00']].forEach(([c, t, p], i) => {
      const y = 92 + i * 78;
      g.fillStyle = '#e4dfd6'; g.beginPath(); g.roundRect(32, y, 60, 60, 12); g.fill();
      g.fillStyle = c; g.beginPath(); g.arc(62, y + 30, 18, 0, 7); g.fill();
      g.fillStyle = '#16171a'; g.font = '700 22px Manrope, Arial'; g.fillText(t, 110, y + 26);
      g.fillStyle = '#7a776f'; g.font = '500 17px "DM Mono", monospace'; g.fillText('Qty 1', 110, y + 52);
      g.fillStyle = '#16171a'; g.font = '700 22px Manrope, Arial'; g.fillText(p, 380, y + 38);
    });
    g.fillStyle = '#ff642d'; g.beginPath(); g.roundRect(32, 262, w - 64, 48, 12); g.fill();
    g.fillStyle = '#fff'; g.font = '600 19px "DM Mono", monospace'; g.fillText('CHECKOUT · $92.00', 150, 293);
  });
  const panels = [store, code, cartPanel];

  /* ---------- Atmosphere ---------- */
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,100,45,.9)'); grd.addColorStop(0.4, 'rgba(255,100,45,.25)'); grd.addColorStop(1, 'rgba(255,100,45,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
  glow.scale.set(7, 7, 1); glow.position.set(0, 0, -3);
  scene.add(glow);

  const rings = [2.3, 2.9].map((r, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 160), new THREE.MeshBasicMaterial({ color: i ? 0xf4f1eb : 0xff642d, transparent: true, opacity: i ? 0.12 : 0.45 }));
    ring.rotation.set(1.25, 0.2 * (i ? -1 : 1), 0);
    ring.position.y = -0.2;
    scene.add(ring);
    return ring;
  });

  const N = small ? 110 : 260;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 2.6 + Math.random() * 3, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * 0.7, r * Math.sin(p) * Math.sin(t) - 1.5], i * 3);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xff642d, size: 0.035, transparent: true, opacity: 0.8, depthWrite: false }));
  scene.add(particles);

  /* ---------- Responsive layout ---------- */
  let baseZ = 9;
  const layout = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const aspect = camera.aspect;
    baseZ = Math.max(9, 1.6 / (aspect * Math.tan(THREE.MathUtils.degToRad(16))));
    camera.position.set(0, 0.25, baseZ);
    camera.updateProjectionMatrix();
    const portrait = aspect < 0.9;
    avatar.scale.setScalar(portrait ? 0.62 : 0.78);
    avatar.position.set(0, portrait ? 0.2 : 0.22, 0);
    avatar.userData.y = avatar.position.y;
    const spots = portrait
      ? [[-1.2, -0.15, -1.6, 0.55, 0.35], [1.22, 1.0, -1.9, 0.55, -0.35], [0, 0, -9, 0.1, 0]]
      : [[-2.2, 1.85, -1.4, 0.85, 0.35], [2.3, 1.55, -1.9, 0.85, -0.35], [2.35, -1.5, -0.9, 0.8, -0.3]];
    panels.forEach((m, i) => {
      const [x, y, z, s, ry] = spots[i];
      m.userData.base = { x, y, z, ry };
      m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.y = ry;
      m.visible = !(portrait && i === 2);
    });
  };

  /* ---------- Interaction + loop ---------- */
  let tx = 0, ty = 0, mx = 0, my = 0, sp = 0;
  addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  const clock = new THREE.Clock();

  const frame = () => {
    const t = clock.getElapsedTime();
    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;
    const target = Math.min(1, Math.max(0, scrollY / hero.offsetHeight));
    sp += (target - sp) * 0.1;

    avatar.position.y = avatar.userData.y + Math.sin(t * 1.1) * 0.05 + sp * 0.9;
    avatar.rotation.set(my * 0.12, mx * 0.3 + sp * 0.6, 0);
    halo.material.opacity = 0.85 + Math.sin(t * 1.6) * 0.15;

    panels.forEach((m, i) => {
      const b = m.userData.base;
      m.position.x = b.x * (1 + sp * 0.7);
      m.position.y = b.y + Math.sin(t * 0.8 + i * 2.1) * 0.09 + sp * 0.5;
      m.rotation.y = b.ry + mx * 0.12;
      m.rotation.x = -my * 0.06;
    });
    rings[0].rotation.z = t * 0.12;
    rings[1].rotation.z = -t * 0.08;
    particles.rotation.y = t * 0.03;
    camera.position.z = baseZ + sp * 2;
    renderer.render(scene, camera);
  };

  layout();
  addEventListener('resize', () => { layout(); if (reduce) frame(); });

  if (reduce) {
    frame();
    return;
  }
  let visible = true;
  const run = () => renderer.setAnimationLoop(visible && !document.hidden ? frame : null);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; run(); }).observe(hero);
  document.addEventListener('visibilitychange', run);
  run();
}
