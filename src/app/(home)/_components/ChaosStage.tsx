'use client';

import { useEffect, useRef } from 'react';

const CHAOS_ICONS = [
  { label: 'N',    bg: '#1a1a1a', color: '#e5e5e5', border: '#333',    mono: false },
  { label: 'GH',   bg: '#24292e', color: '#c9d1d9', border: '#444c56', mono: false },
  { label: '#',    bg: '#4a154b', color: '#e8d5e9', border: '#611f69', mono: false },
  { label: '</>', bg: '#0078d4', color: '#ffffff', border: '#106ebe', mono: true  },
  { label: '⊞',   bg: '#1a3a5c', color: '#60a5fa', border: '#1d4ed8', mono: false },
  { label: '>_',  bg: '#0d1407', color: '#22c55e', border: '#166534', mono: true  },
  { label: '≡',   bg: '#1e1e2e', color: '#a78bfa', border: '#5b21b6', mono: false },
  { label: '⌘',   bg: '#2c1810', color: '#fb923c', border: '#9a3412', mono: false },
];

const ICON_SIZE    = 46;
const DAMPING      = 0.985;
const MAX_SPEED    = 2.2;
const MIN_SPEED    = 0.55;
const RANDOM_FORCE = 0.045;
const REPEL_RADIUS = 120;
const REPEL_FORCE  = 4.5;

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function ChaosStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number | null>(null);
  const particles = useRef<Particle[]>([]);
  const mouse     = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const W = stage.clientWidth;
    const H = stage.clientHeight;
    if (W === 0 || H === 0) return;

    stage.innerHTML = '';
    particles.current = [];

    const cols = 4;
    const rows = Math.ceil(CHAOS_ICONS.length / cols);

    CHAOS_ICONS.forEach((icon, idx) => {
      const el = document.createElement('div');
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = [
        'position:absolute',
        `width:${ICON_SIZE}px`,
        `height:${ICON_SIZE}px`,
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'border-radius:10px',
        'font-weight:600',
        'user-select:none',
        `background:${icon.bg}`,
        `color:${icon.color}`,
        `outline:1px solid ${icon.border}`,
        `font-family:${icon.mono ? "'JetBrains Mono','Fira Code',monospace" : "system-ui,sans-serif"}`,
        `font-size:${icon.label.length > 2 ? '0.62rem' : '0.78rem'}`,
      ].join(';');
      el.textContent = icon.label;
      stage.appendChild(el);

      const cellW = (W - ICON_SIZE) / cols;
      const cellH = (H - ICON_SIZE) / rows;
      const col   = idx % cols;
      const row   = Math.floor(idx / cols);
      const jitter = 0.35;
      const spawnX = cellW * col + cellW * (0.5 + (Math.random() - 0.5) * jitter);
      const spawnY = cellH * row + cellH * (0.5 + (Math.random() - 0.5) * jitter);
      const angle  = (idx / CHAOS_ICONS.length) * Math.PI * 2 + Math.random() * 0.8;
      const speed  = MIN_SPEED + Math.random() * (MAX_SPEED * 0.5 - MIN_SPEED);

      const p: Particle = {
        el,
        x: Math.min(Math.max(spawnX, 0), W - ICON_SIZE),
        y: Math.min(Math.max(spawnY, 0), H - ICON_SIZE),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
      el.style.left = `${p.x}px`;
      el.style.top  = `${p.y}px`;
      particles.current.push(p);
    });

    const onMouseMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouse.current = { x: null, y: null }; };
    stage.addEventListener('mousemove', onMouseMove);
    stage.addEventListener('mouseleave', onMouseLeave);

    const tick = () => {
      const W2 = stage.clientWidth;
      const H2 = stage.clientHeight;
      const { x: mx, y: my } = mouse.current;

      particles.current.forEach((p) => {
        p.vx += (Math.random() - 0.5) * RANDOM_FORCE;
        p.vy += (Math.random() - 0.5) * RANDOM_FORCE;

        if (mx !== null && my !== null) {
          const cx = p.x + ICON_SIZE / 2;
          const cy = p.y + ICON_SIZE / 2;
          const dx = cx - mx;
          const dy = cy - my;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_RADIUS && dist > 0) {
            const strength = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
            p.vx += (dx / dist) * strength;
            p.vy += (dy / dist) * strength;
          }
        }

        p.vx *= DAMPING;
        p.vy *= DAMPING;

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

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0)              { p.x = 0;               p.vx =  Math.abs(p.vx); }
        if (p.y < 0)              { p.y = 0;               p.vy =  Math.abs(p.vy); }
        if (p.x > W2 - ICON_SIZE) { p.x = W2 - ICON_SIZE;  p.vx = -Math.abs(p.vx); }
        if (p.y > H2 - ICON_SIZE) { p.y = H2 - ICON_SIZE;  p.vy = -Math.abs(p.vy); }

        p.el.style.left = `${p.x}px`;
        p.el.style.top  = `${p.y}px`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stage.removeEventListener('mousemove', onMouseMove);
      stage.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full overflow-hidden rounded-lg bg-zinc-900/50 border border-zinc-800"
      style={{ minHeight: 200 }}
    />
  );
}
