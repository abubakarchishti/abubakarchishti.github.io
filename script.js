// ---------- Games data ----------
const PLAY = "https://play.google.com/store/apps/details?id=";
const GAMES = [
  { title: "Car Driving School US Car 3D", id: "car.driving.school.us.car.simulator.game", img: "driving-school", cat: "driving", genre: "Driving" },
  { title: "Police Car Driving Cop Game 3D", id: "com.dng.police.game.gunshooting.game", img: "police-cop", cat: "police", genre: "Police" },
  { title: "Mini Bus Driving: Coach Sim 3D", id: "com.dng.mini.bus.driving.sim", img: "mini-bus", cat: "driving", genre: "Bus Sim" },
  { title: "Car Driving School: Car Sim 3D", id: "com.dng.us.car.racing.driving", img: "car-sim", cat: "driving", genre: "Driving" },
  { title: "Car Repair Car Mechanic Game", id: "com.sg.car.mechanic.game", img: "car-mechanic", cat: "sim", genre: "Simulation" },
  { title: "Police Car Game US Cop Duty", id: "com.rc.police.car.chase.cop.simulator", img: "police-chase", cat: "police", genre: "Police" },
  { title: "Real Flight Game: Pilot Sim 3D", id: "com.rc.airplane.simulator.game.flight.simulator.airplane.games", img: "flight-sim", cat: "sim", genre: "Flight Sim" },
  { title: "Coach Bus Real Bus Simulator", id: "com.rc.coach.bus.real.bus.game", img: "coach-bus", cat: "driving", genre: "Bus Sim" },
];

const grid = document.getElementById("gamesGrid");
grid.innerHTML = GAMES.map((g) => {
  const art = `<img src="assets/games/${g.img}.webp" alt="${g.title} icon" loading="lazy" width="512" height="512">`;
  return `<article class="game reveal" data-cat="${g.cat}">
    <div class="game-art">${art}<span class="genre">${g.genre}</span></div>
    <div class="game-info">
      <h3>${g.title}</h3>
      <a href="${PLAY}${g.id}" target="_blank" rel="noopener">Google Play <svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg></a>
    </div>
  </article>`;
}).join("");

// Filters
document.querySelectorAll(".filters button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filters button").forEach((b) => b.classList.toggle("active", b === btn));
    const f = btn.dataset.filter;
    grid.querySelectorAll(".game").forEach((card) => {
      card.classList.toggle("hide", f !== "all" && card.dataset.cat !== f);
    });
  });
});

// 3D tilt on game cards (pointer devices only)
if (matchMedia("(hover: hover)").matches) {
  grid.querySelectorAll(".game").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
}

// Spotlight on skill cards
document.querySelectorAll(".skill-card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

// ---------- Nav ----------
const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 20), { passive: true });
menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", false);
}));

// Active section highlight
const sections = [...document.querySelectorAll("main section[id]")];
const sectionObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => sectionObs.observe(s));

// ---------- Reveal on scroll ----------
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el, i) => {
  if (el.classList.contains("game") || el.classList.contains("skill-card")) el.style.transitionDelay = `${(i % 4) * 70}ms`;
  revealObs.observe(el);
});

// ---------- Counter ----------
document.querySelectorAll("[data-count]").forEach((el) => {
  const target = +el.dataset.count;
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min((t - start) / 1400, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Hero 3D scene (wireframe icosahedron + neon grid floor) ----------
(() => {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, dpr, mouseX = 0, mouseY = 0;

  // Icosahedron geometry
  const t = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const edges = [];
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(...verts[i].map((v, k) => v - verts[j][k]));
      if (Math.abs(d - 2) < 0.01) edges.push([i, j]);
    }

  // Floating particles
  const particles = Array.from({ length: 70 }, () => ({
    x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), s: Math.random() * 1.5 + 0.5,
  }));

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  addEventListener("mousemove", (e) => {
    mouseX = e.clientX / innerWidth - 0.5;
    mouseY = e.clientY / innerHeight - 0.5;
  });
  resize();

  function rotate([x, y, z], ax, ay) {
    let c = Math.cos(ay), s = Math.sin(ay);
    [x, z] = [x * c - z * s, x * s + z * c];
    c = Math.cos(ax); s = Math.sin(ax);
    [y, z] = [y * c - z * s, y * s + z * c];
    return [x, y, z];
  }

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  function frame(time) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const tm = reduce ? 0 : time * 0.001;
    ctx.clearRect(0, 0, w, h);

    // Grid floor
    const horizon = h * 0.62;
    const fov = 300;
    ctx.lineWidth = 1;
    const speed = (tm * 0.6) % 1;
    for (let i = 0; i < 22; i++) {
      const z = i + 1 - speed;
      const y = horizon + (fov * 1.4) / z;
      if (y > h) continue;
      const a = Math.max(0, 1 - z / 22) * 0.35;
      ctx.strokeStyle = `rgba(62,230,196,${a})`;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    const vx = w / 2 + mouseX * 80;
    for (let i = -20; i <= 20; i++) {
      const xBottom = vx + i * (w / 12);
      const g = ctx.createLinearGradient(0, horizon, 0, h);
      g.addColorStop(0, "rgba(139,92,246,0)");
      g.addColorStop(1, "rgba(139,92,246,.35)");
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(vx + i * 6, horizon); ctx.lineTo(xBottom + i * w * 0.08, h); ctx.stroke();
    }
    // horizon fade
    const fade = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 80);
    fade.addColorStop(0, "rgba(7,8,13,1)");
    fade.addColorStop(1, "rgba(7,8,13,0)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, horizon - 40, w, 120);

    // Particles
    particles.forEach((p) => {
      p.z -= reduce ? 0 : 0.0015;
      if (p.z <= 0.05) { p.z = 1; p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1; }
      const sx = w / 2 + (p.x / p.z) * w * 0.3;
      const sy = h / 2 + (p.y / p.z) * h * 0.3;
      ctx.fillStyle = `rgba(200,230,255,${(1 - p.z) * 0.6})`;
      ctx.beginPath(); ctx.arc(sx, sy, p.s * (1 - p.z) * 1.6, 0, Math.PI * 2); ctx.fill();
    });

    // Icosahedron
    const wide = w > 820;
    const cx = wide ? w * 0.74 : w * 0.5;
    const cy = wide ? h * 0.42 : h * 0.3;
    const size = Math.min(w, h) * (wide ? 0.17 : 0.2);
    const ax = tm * 0.35 + mouseY * 0.8;
    const ay = tm * 0.5 + mouseX * 0.8;
    const pts = verts.map((v) => {
      const [x, y, z] = rotate(v, ax, ay);
      const k = 4 / (4 + z);
      return [cx + x * size * k, cy + y * size * k + Math.sin(tm) * 10, z];
    });
    ctx.globalAlpha = wide ? 1 : 0.35;
    ctx.lineWidth = 1.4;
    edges.forEach(([a, b]) => {
      const depth = (pts[a][2] + pts[b][2]) / 2;
      const alpha = 0.25 + (1 - (depth + t) / (2 * t)) * 0.75;
      const g = ctx.createLinearGradient(pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
      g.addColorStop(0, `rgba(62,230,196,${alpha})`);
      g.addColorStop(1, `rgba(139,92,246,${alpha})`);
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); ctx.stroke();
    });
    pts.forEach(([x, y, z]) => {
      ctx.fillStyle = z < 0 ? "#3ee6c4" : "rgba(139,92,246,.6)";
      ctx.shadowColor = "#3ee6c4"; ctx.shadowBlur = z < 0 ? 12 : 0;
      ctx.beginPath(); ctx.arc(x, y, z < 0 ? 3 : 2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
})();
