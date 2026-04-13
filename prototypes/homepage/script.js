/* ============================================================
   script.js — Devhub Homepage
   - Chaos physics engine (rAF, bounce, mouse repulsion)
   - Navbar scroll opacity
   - Scroll reveal (IntersectionObserver)
   - Pricing toggle (monthly / yearly)
   - Footer year
============================================================ */

'use strict';

// ============================================================
// CHAOS PHYSICS ENGINE
// ============================================================

const CHAOS_ICONS = [
  { label: 'N',   bg: '#1a1a1a', color: '#e5e5e5', border: '#333'    }, // Notion
  { label: 'GH',  bg: '#24292e', color: '#c9d1d9', border: '#444c56' }, // GitHub
  { label: '#',   bg: '#4a154b', color: '#e8d5e9', border: '#611f69' }, // Slack
  { label: '</>',  bg: '#0078d4', color: '#ffffff', border: '#106ebe', mono: true }, // VS Code
  { label: '⊞',   bg: '#1a3a5c', color: '#60a5fa', border: '#1d4ed8' }, // Browser
  { label: '>_',   bg: '#0d1407', color: '#22c55e', border: '#166534', mono: true }, // Terminal
  { label: '≡',   bg: '#1e1e2e', color: '#a78bfa', border: '#5b21b6' }, // Text file
  { label: '⌘',   bg: '#2c1810', color: '#fb923c', border: '#9a3412' }, // Bookmark
];

const ICON_SIZE    = 46;
const DAMPING      = 0.985;
const MAX_SPEED    = 2.2;
const MIN_SPEED    = 0.55;
const RANDOM_FORCE = 0.045;
const REPEL_RADIUS = 120;
const REPEL_FORCE  = 4.5;

let chaosParticles = [];
let mouseRelX = null;
let mouseRelY = null;
let chaosRunning = false;

function initChaos() {
  const stage = document.getElementById('chaosStage');
  if (!stage) return;

  const W = stage.clientWidth;
  const H = stage.clientHeight;

  // Bail gracefully if stage has zero size (e.g. display:none)
  if (W === 0 || H === 0) return;

  stage.innerHTML = '';
  chaosParticles = [];

  CHAOS_ICONS.forEach((icon) => {
    const el = document.createElement('div');
    el.className = 'chaos-icon';
    el.textContent = icon.label;
    el.setAttribute('aria-hidden', 'true');

    const fontFamily = icon.mono
      ? "'JetBrains Mono', 'Fira Code', monospace"
      : "'Inter', system-ui, sans-serif";

    const fontSize = icon.label.length > 2 ? '0.62rem' : '0.78rem';

    el.style.cssText = [
      `background: ${icon.bg}`,
      `color: ${icon.color}`,
      `outline: 1px solid ${icon.border}`,
      `font-family: ${fontFamily}`,
      `font-size: ${fontSize}`,
    ].join(';');

    stage.appendChild(el);

    // Distribute icons evenly across a 4×2 grid with jitter so they
    // never all pile up in the same corner on load.
    const idx = chaosParticles.length; // index before push
    const cols = 4;
    const rows = Math.ceil(CHAOS_ICONS.length / cols);
    const cellW = (W - ICON_SIZE) / cols;
    const cellH = (H - ICON_SIZE) / rows;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const jitter = 0.35; // fraction of cell to randomise within
    const spawnX = cellW * col + cellW * (0.5 + (Math.random() - 0.5) * jitter);
    const spawnY = cellH * row + cellH * (0.5 + (Math.random() - 0.5) * jitter);

    // Give every icon a unique direction spread evenly around a circle
    const angle = (idx / CHAOS_ICONS.length) * Math.PI * 2 + Math.random() * 0.8;
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED * 0.5 - MIN_SPEED);

    const particle = {
      el,
      x: Math.min(Math.max(spawnX, 0), W - ICON_SIZE),
      y: Math.min(Math.max(spawnY, 0), H - ICON_SIZE),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };

    setIconPos(particle);
    chaosParticles.push(particle);
  });

  // Mouse repulsion within the stage
  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    mouseRelX = e.clientX - rect.left;
    mouseRelY = e.clientY - rect.top;
  });

  stage.addEventListener('mouseleave', () => {
    mouseRelX = null;
    mouseRelY = null;
  });

  if (!chaosRunning) {
    chaosRunning = true;
    requestAnimationFrame(chaosTick);
  }
}

function setIconPos(p) {
  p.el.style.left = `${p.x}px`;
  p.el.style.top  = `${p.y}px`;
}

function chaosTick() {
  const stage = document.getElementById('chaosStage');
  if (!stage) return;

  const W = stage.clientWidth;
  const H = stage.clientHeight;

  chaosParticles.forEach((p) => {
    // Random drift so icons never stop completely
    p.vx += (Math.random() - 0.5) * RANDOM_FORCE;
    p.vy += (Math.random() - 0.5) * RANDOM_FORCE;

    // Mouse repulsion
    if (mouseRelX !== null && mouseRelY !== null) {
      const cx = p.x + ICON_SIZE / 2;
      const cy = p.y + ICON_SIZE / 2;
      const dx = cx - mouseRelX;
      const dy = cy - mouseRelY;
      const dist = Math.hypot(dx, dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const strength = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
        p.vx += (dx / dist) * strength;
        p.vy += (dy / dist) * strength;
      }
    }

    // Dampen
    p.vx *= DAMPING;
    p.vy *= DAMPING;

    // Speed clamp — enforce both min and max so icons never stall
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    } else if (speed < MIN_SPEED && speed > 0) {
      p.vx = (p.vx / speed) * MIN_SPEED;
      p.vy = (p.vy / speed) * MIN_SPEED;
    } else if (speed === 0) {
      const a = Math.random() * Math.PI * 2;
      p.vx = Math.cos(a) * MIN_SPEED;
      p.vy = Math.sin(a) * MIN_SPEED;
    }

    // Move
    p.x += p.vx;
    p.y += p.vy;

    // Bounce off walls
    if (p.x < 0)             { p.x = 0;             p.vx =  Math.abs(p.vx); }
    if (p.y < 0)             { p.y = 0;             p.vy =  Math.abs(p.vy); }
    if (p.x > W - ICON_SIZE) { p.x = W - ICON_SIZE; p.vx = -Math.abs(p.vx); }
    if (p.y > H - ICON_SIZE) { p.y = H - ICON_SIZE; p.vy = -Math.abs(p.vy); }

    setIconPos(p);
  });

  requestAnimationFrame(chaosTick);
}

// ============================================================
// NAVBAR — gets more opaque on scroll
// ============================================================

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

// ============================================================
// SCROLL REVEAL — fade up when elements enter viewport
// ============================================================

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve after revealing to save resources
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

// ============================================================
// PRICING TOGGLE — monthly / yearly
// ============================================================

function initPricingToggle() {
  const toggle     = document.getElementById('billingToggle');
  const proPrice   = document.getElementById('proPrice');
  const proPeriod  = document.getElementById('proPeriod');
  const yearlyNote = document.getElementById('yearlyNote');
  const lblMonthly = document.getElementById('lblMonthly');
  const lblYearly  = document.getElementById('lblYearly');

  if (!toggle) return;

  let yearly = false;

  const update = () => {
    toggle.classList.toggle('active', yearly);
    toggle.setAttribute('aria-pressed', String(yearly));

    if (yearly) {
      proPrice.textContent  = '$72';
      proPeriod.textContent = '/year';
      yearlyNote.style.display  = 'block';
      lblYearly.style.color     = 'var(--text)';
      lblMonthly.style.color    = 'var(--text-muted)';
    } else {
      proPrice.textContent  = '$8';
      proPeriod.textContent = '/month';
      yearlyNote.style.display  = 'none';
      lblMonthly.style.color    = 'var(--text)';
      lblYearly.style.color     = 'var(--text-muted)';
    }
  };

  toggle.addEventListener('click', () => {
    yearly = !yearly;
    update();
  });

  update(); // set initial state
}

// ============================================================
// FOOTER YEAR
// ============================================================

function initFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initChaos();
  initPricingToggle();
  initFooterYear();
});
