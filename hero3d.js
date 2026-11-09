// Hero scene: an original stylized 3D developer avatar surrounded by floating
// Shopify UI panels (storefront, Liquid code, cart). Built from primitives so
// it needs no model downloads. Lighter on small screens, paused off-screen.
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

  /* ---------- Materials ---------- */
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
  const M = {
    skin: std(0xe6ac86, { roughness: 0.5 }),
    skinDark: std(0xcd9070, { roughness: 0.55 }),
    hair: std(0x1b1714, { roughness: 0.5 }),
    hairHi: std(0x262120, { roughness: 0.42 }),
    fade: std(0x3a302a, { roughness: 0.9 }),
    beard: std(0x221b17, { roughness: 0.85 }),
    iris: std(0x6b4423, { roughness: 0.3 }),
    mouth: std(0x3b1412, { roughness: 0.6, side: THREE.DoubleSide }),
    hoodie: std(0x24272e, { roughness: 0.85 }),
    hoodieDark: std(0x1a1c22, { roughness: 0.9 }),
    orange: std(0xff642d, { roughness: 0.35, metalness: 0.2 }),
    dark: std(0x0d0e11, { roughness: 0.4 }),
    white: std(0xf7f5f0, { roughness: 0.3 }),
    lip: std(0xb87566, { roughness: 0.5 }),
    gold: std(0xd9b04a, { roughness: 0.25, metalness: 1 }),
  };
  const sphere = new THREE.SphereGeometry(1, 40, 28);
  const add = (parent, geo, mat, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos); m.scale.set(...scale); m.rotation.set(...rot);
    parent.add(m);
    return m;
  };

  /* ---------- Avatar ---------- */
  const avatar = new THREE.Group();
  scene.add(avatar);
  const body = new THREE.Group();
  avatar.add(body);

  const torso = add(body, new THREE.CapsuleGeometry(1, 1, 12, 32), M.hoodie, [0, -2.25, 0], [1.25, 1, 0.78]);
  add(body, new THREE.TorusGeometry(0.62, 0.2, 20, 48), M.hoodieDark, [0, -1.02, -0.05], [1, 1, 1], [Math.PI / 2 - 0.25, 0, 0]);
  add(body, new THREE.CylinderGeometry(0.27, 0.3, 0.6, 24), M.skin, [0, -0.85, 0]);
  for (const x of [-0.16, 0.16]) add(body, new THREE.CylinderGeometry(0.022, 0.022, 0.5, 8), M.white, [x, -1.5, 0.76], [1, 1, 1], [0.15, 0, 0]);

  // headphones resting around the neck (gap at the front)
  const phones = new THREE.Group();
  phones.position.y = -1.12;
  body.add(phones);
  add(phones, new THREE.TorusGeometry(0.68, 0.06, 14, 64, Math.PI * 1.3), M.orange, [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, -1.15 * Math.PI]);
  for (const s of [-1, 1]) {
    const cup = add(phones, new THREE.CylinderGeometry(0.2, 0.2, 0.14, 28), M.dark, [0.6 * s, 0, 0.32], [1, 1, 1], [0, 0, Math.PI / 2]);
    cup.rotation.y = -0.5 * s;
    add(phones, new THREE.TorusGeometry(0.2, 0.035, 10, 32), M.orange, [0.6 * s + 0.07 * s, 0, 0.32 + 0.04], [1, 1, 1], [0, Math.PI / 2 - 0.5 * s, 0]);
  }

  // Code Runners mark on the chest
  new THREE.TextureLoader().load('assets/cr-logo.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    add(body, new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6 }), [0.46, -1.78, 0.745], [1, 1, 1], [0, 0.32, 0]);
    if (reduce) renderer.render(scene, camera);
  });

  // head — modelled on Chintan's avatar reference: swept-back volume hair with
  // tight faded sides, thick straight brows, calm brown eyes, trimmed full beard
  // with a clean cheek line, moustache + chin patch, closed neutral mouth, stud earring
  const head = new THREE.Group();
  head.position.y = 0.35;
  avatar.add(head);
  const HX = 0.8, HY = 0.97, HZ = 0.84;
  add(head, sphere, M.skin, [0, 0, 0], [HX, HY, HZ]);
  // slightly squarer jaw under the beard
  add(head, sphere, M.skin, [0, -0.42, 0.06], [0.66, 0.46, 0.68]);
  for (const s of [-1, 1]) {
    add(head, sphere, M.skin, [0.79 * s, -0.02, -0.04], [0.12, 0.21, 0.1]);
    add(head, sphere, M.skinDark, [0.82 * s, -0.02, -0.02], [0.055, 0.12, 0.05]);
  }
  // small gold stud on the viewer-right ear lobe
  add(head, sphere, M.gold, [0.86, -0.17, 0.0], [0.028, 0.028, 0.028]);

  // tight fade on the sides and back (dark, close to the head)
  add(head, new THREE.SphereGeometry(1, 48, 24, Math.PI / 2 + 0.9, Math.PI * 2 - 1.8, Math.PI * 0.26, Math.PI * 0.27), M.fade, [0, 0.02, -0.01], [HX + 0.012, HY + 0.01, HZ + 0.012], [-0.12, 0, 0]);
  // hair mass: a dome that sits high and juts forward over the forehead (the quiff)
  const HC = new THREE.Vector3(0, 0.56, -0.04), HR = new THREE.Vector3(0.79, 0.7, 0.97);
  const dome = add(head, new THREE.SphereGeometry(1, 56, 28, 0, Math.PI * 2, 0, Math.PI * 0.5), M.hair, HC.toArray(), HR.toArray(), [-0.2, 0, 0]);
  // combed strands lying on the dome: rise up off the front, then sweep back and slightly to one side
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const strandGeo = new THREE.CapsuleGeometry(0.075, 0.62, 6, 12);
  const comb = new THREE.Vector3(0.25, -0.1, -1);
  const tilt = new THREE.Quaternion().setFromEuler(dome.rotation);
  const bx = new THREE.Vector3(), basis = new THREE.Matrix4();
  for (let i = 0; i < 64; i++) {
    const th = Math.acos(1 - rand() * 0.9);                    // polar angle from the top, biased up
    const ph = rand() * Math.PI * 2;
    const u = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    if (u.y < 0.18 && u.z < 0.35) continue;                    // keep strands off the faded sides
    const p = u.clone().multiply(HR).applyQuaternion(tilt).add(HC);
    const n = u.clone().divide(HR).normalize().applyQuaternion(tilt);
    const dir = comb.clone().addScaledVector(n, -comb.dot(n)).normalize();
    bx.crossVectors(dir, n).normalize();
    basis.makeBasis(bx, dir, n);
    const m = new THREE.Mesh(strandGeo, i % 5 ? M.hair : M.hairHi);
    m.quaternion.setFromRotationMatrix(basis);
    m.position.copy(p).addScaledVector(n, 0.005);
    m.scale.set(1 + rand() * 0.45, 0.8 + rand() * 0.4, 0.32);
    head.add(m);
  }

  // eyes: almond whites, brown iris, lids resting a little low (calm look)
  const eyes = new THREE.Group();
  head.add(eyes);
  const pupils = [];
  for (const s of [-1, 1]) {
    const x = 0.27 * s, y = 0.06;
    add(eyes, sphere, M.white, [x, y, 0.775], [0.13, 0.085, 0.06]);
    const iris = new THREE.Group();
    iris.position.set(x, y - 0.005, 0);
    iris.userData = { x, y: y - 0.005 };
    add(iris, sphere, M.iris, [0, 0, 0.815], [0.066, 0.066, 0.03]);
    add(iris, sphere, M.dark, [0, 0, 0.836], [0.032, 0.032, 0.015]);
    add(iris, sphere, M.white, [0.022, 0.024, 0.85], [0.014, 0.014, 0.008]);
    eyes.add(iris);
    pupils.push(iris);
    // upper lid + crease
    add(eyes, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.4), M.skin, [x, y + 0.012, 0.775], [0.138, 0.094, 0.068], [0.5, 0, 0]);
    add(eyes, new THREE.TorusGeometry(0.12, 0.009, 8, 24, Math.PI * 0.8), M.skinDark, [x, y + 0.03, 0.81], [1, 0.55, 1], [0.35, 0, Math.PI * 0.1]);
    // thick, straight brows: low inner end, slight lift toward the tail
    add(head, new THREE.CapsuleGeometry(0.042, 0.2, 4, 10), M.hair, [x + 0.01 * s, 0.205, 0.8], [1, 1, 0.55], [0.2, -0.25 * s, Math.PI / 2 - 0.1 * s]);
  }

  // nose: straight bridge, rounded tip, soft nostrils
  add(head, new THREE.CapsuleGeometry(0.055, 0.16, 4, 12), M.skin, [0, -0.01, 0.84], [1, 1, 0.9], [0.18, 0, 0]);
  add(head, sphere, M.skin, [0, -0.13, 0.885], [0.085, 0.07, 0.075]);
  for (const s of [-1, 1]) add(head, sphere, M.skinDark, [0.065 * s, -0.155, 0.85], [0.04, 0.03, 0.035]);

  // closed, neutral mouth (lower lip; the moustache covers the upper lip)
  add(head, sphere, M.lip, [0, -0.335, 0.85], [0.115, 0.032, 0.045]);

  // trimmed full beard. One shell over the lower face and sides, trimmed by two
  // head-local planes into a clean diagonal cheek line: high at the sideburns,
  // down to the mouth corners (an inverted V; the shell is kept below EITHER line).
  const CHEEK = { ear: [0.8, -0.02], corner: [0.2, -0.3] };
  const slope = (CHEEK.ear[1] - CHEEK.corner[1]) / (CHEEK.ear[0] - CHEEK.corner[0]);  // rise per unit toward the ear (> 0)
  const yAt0 = CHEEK.ear[1] - slope * CHEEK.ear[0];                                     // where each line meets x = 0 (< mouth)
  // Plane keeps points with normal·p + constant >= 0
  const beardPlanesLocal = [
    new THREE.Plane(new THREE.Vector3(-slope, -1, 0), yAt0).normalize(),  // left side:  keep y <= yAt0 - slope * x
    new THREE.Plane(new THREE.Vector3(slope, -1, 0), yAt0).normalize(),   // right side: keep y <= yAt0 + slope * x
  ];
  const beardPlanes = beardPlanesLocal.map((p) => p.clone());
  renderer.localClippingEnabled = true;
  const beardCut = M.beard.clone();
  beardCut.clippingPlanes = beardPlanes;
  beardCut.clipIntersection = true;  // clip only where outside both planes
  add(head, new THREE.SphereGeometry(1, 64, 32, -0.12, Math.PI + 0.24, Math.PI * 0.42, Math.PI * 0.56), beardCut, [0, -0.02, 0.0], [HX + 0.035, HY + 0.03, HZ + 0.05], [0.08, 0, 0]);
  add(head, sphere, beardCut, [0, -0.78, 0.4], [0.38, 0.2, 0.3]);       // chin fullness
  for (const s of [-1, 1]) add(head, sphere, M.beard, [0.775 * s, 0.03, -0.08], [0.05, 0.2, 0.1]);  // sideburns up to the fade
  // keep the cut planes glued to the head as it turns
  const syncBeard = () => {
    head.updateWorldMatrix(true, false);
    beardPlanes.forEach((p, i) => p.copy(beardPlanesLocal[i]).applyMatrix4(head.matrixWorld));
  };
  // moustache: one continuous bar over the upper lip, ends drooping into the beard
  add(head, new THREE.CapsuleGeometry(0.048, 0.2, 4, 12), M.beard, [0, -0.255, 0.87], [1, 1, 0.7], [0.2, 0, Math.PI / 2]);
  for (const s of [-1, 1]) add(head, sphere, M.beard, [0.15 * s, -0.29, 0.835], [0.06, 0.06, 0.05], [0, 0, 0.5 * s]);

  // chin patch under the lower lip
  add(head, sphere, M.beard, [0, -0.43, 0.855], [0.07, 0.05, 0.05]);

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

    head.rotation.set(my * 0.22, mx * 0.5, -mx * 0.05);
    body.rotation.y = mx * 0.16;
    pupils.forEach((p) => { p.position.x = p.userData.x + mx * 0.025; p.position.y = p.userData.y - my * 0.018; });
    const blink = t % 4.3 < 0.12 ? 0.12 : 1;
    eyes.scale.y += (blink - eyes.scale.y) * 0.5;
    torso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;
    avatar.position.y = avatar.userData.y + Math.sin(t * 1.1) * 0.035 + sp * 0.9;
    avatar.rotation.y = sp * 0.6;

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
    syncBeard();
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
