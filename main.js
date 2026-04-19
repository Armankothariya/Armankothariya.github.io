/**
 * OBSIDIAN SILENCE — main.js
 * Hero: CSS keyframe sequence (no JS needed).
 * Scroll: IntersectionObserver fade+rise reveal.
 * Observatory: slow-moving star dot on canvas.
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     0. SCRAMBLE ENGINE — Technical Reveal
  ───────────────────────────────────────────── */
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}—=+*^?#________';
      this.update = this.update.bind(this);
    }
    setText(newText) {
      const oldText = this.el.innerText;
      const length = Math.max(oldText.length, newText.length);
      const promise = new Promise((resolve) => this.resolve = resolve);
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 40);
        const end = start + Math.floor(Math.random() * 40);
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return promise;
    }
    update() {
      let output = '';
      let complete = 0;
      for (let i = 0, n = this.queue.length; i < n; i++) {
        let { from, to, start, end, char } = this.queue[i];
        if (this.frame >= end) {
          complete++;
          output += `<span class="scramble-char" data-char="${to}">${to}</span>`;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.queue[i].char = char;
          }
          output += `<span class="scramble-drip">${char}</span>`;
        } else {
          output += from;
        }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) {
        this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }
  }

  /* ─────────────────────────────────────────────
     1. ACTIVE NAV — highlight on scroll
  ───────────────────────────────────────────── */
  const sections  = document.querySelectorAll('.section');
  const navLinks  = document.querySelectorAll('.nav-links a');

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    { threshold: 0.35 }
  );

  sections.forEach((s) => navObserver.observe(s));

  // Inject active nav style
  const navStyle = document.createElement('style');
  navStyle.textContent = `
    .nav-links a.active {
      color: #ffffff;
      border-bottom-color: rgba(255,255,255,0.35);
    }
  `;
  document.head.appendChild(navStyle);


  /* ─────────────────────────────────────────────
     2. SCROLL REVEAL
     Marks elements with .reveal or .reveal-group,
     then adds .is-visible when they enter viewport.
  ───────────────────────────────────────────── */

  // Skip on reduced-motion preference
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReduced) {

    // Individual reveal targets — each animates as a whole
    const revealSelectors = [
      '.section-header',
      '.arch-layout',
      '.obs-body',
      '.link-header',
      '.link-list',
      '.obs-role-row',
      '.obs-statement',
      '.vol-card',
      '.link-item',
    ];

    // Group reveal targets — children stagger in sequence
    const groupSelectors = [
      '.grid.grid--3',   // system cards
      '.vol-grid',       // project archive
    ];

    // Mark individual reveals
    revealSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        // Don't mark elements inside the hero
        if (!el.closest('.section--hero')) {
          el.classList.add('reveal');
        }
      });
    });

    // Mark group reveals
    groupSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.closest('.section--hero')) {
          el.classList.add('reveal-group');
        }
      });
    });

    // Observe and trigger reveals
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .reveal-group').forEach((el) => {
      revealObserver.observe(el);

      // Scramble trigger for non-hero elements
      if (el.hasAttribute('data-scramble')) {
        const scrambler = new TextScramble(el);
        const scObs = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            scObs.unobserve(el);
            scrambler.setText(el.innerText);
          }
        }, { threshold: 0.5 });
        scObs.observe(el);
      }
    });
  }


  /* ─────────────────────────────────────────────
     3. OBSERVATORY — Moving star dot
  ───────────────────────────────────────────── */
  (function initObservatoryDot() {
    const canvas = document.getElementById('obs-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const dot = {
      x:       0,
      y:       0,
      vx:      0.22,   // very slow drift
      vy:      0.07,
      radius:  1.5,
      opacity: 0.45,
    };

    let rafId     = null;

    function resize() {
      const rect  = canvas.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
      if (dot.x === 0 && dot.y === 0) {
        dot.x = canvas.width  * 0.15;
        dot.y = canvas.height * 0.25;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
      ctx.fill();
    }

    function tick() {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x >  canvas.width  + dot.radius) dot.x = -dot.radius;
      if (dot.x < -dot.radius)                  dot.x =  canvas.width + dot.radius;
      if (dot.y >  canvas.height + dot.radius) dot.y = -dot.radius;
      if (dot.y < -dot.radius)                  dot.y =  canvas.height + dot.radius;
      draw();
      rafId = requestAnimationFrame(tick);
    }

    function start() { if (!rafId) { resize(); rafId = requestAnimationFrame(tick); } }
    function stop()  { if (rafId)  { cancelAnimationFrame(rafId); rafId = null; } }

    // Only run when section is on screen
    const dotObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting ? start() : stop()),
      { threshold: 0.05 }
    );

    const obsSection = document.getElementById('observatory');
    if (obsSection) dotObserver.observe(obsSection);

    window.addEventListener('resize', resize);
  })();

  /* ─────────────────────────────────────────────
     4. CURSOR & PARALLAX — Unified Tracking
  ───────────────────────────────────────────── */
  (function initPointerInteractions() {
    // Disable completely on mobile devices for battery & performance
    if (window.innerWidth <= 768) return;

    const cursor = document.getElementById('custom-cursor');
    const coordEl = cursor.querySelector('.cursor-coords');
    const horizon = document.querySelector('.digital-horizon');
    const statusLabels = document.querySelectorAll('.status-label');
    const heroSilhouette = document.getElementById('hero-silhouette');
    if (!cursor || prefersReduced) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let paraX = 0;
    let paraY = 0;
    let moveTimer;

    // Magnetic and orbital stats
    let tickTime = 0;

    function tick() {
      tickTime += 0.01;
      
      // 1. Update Cursor (Follow)
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;

      // 2. Parallax (Static silhouette drift)
      if (document.querySelector('.section--hero').classList.contains('in-focus')) {
        paraX += (mouseX - paraX) * 0.05;
        paraY += (mouseY - paraY) * 0.05;
        
        if (heroSilhouette) {
          const sx = -paraX * 0.008;
          const sy = -paraY * 0.008;
          heroSilhouette.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
        }
      }

      // 3. Coordinates
      if (coordEl) coordEl.innerText = `${Math.round(cursorX)}, ${Math.round(cursorY)}`;

      requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Coords toggle
      cursor.classList.add('is-moving');
      clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        cursor.classList.remove('is-moving');
      }, 500);
    });

    // Event Delegation: Detect interactive elements for cursor scale
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('a, button, .card, .vol-card, .link-item');
      if (target) {
        cursor.classList.add('is-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('a, button, .card, .vol-card, .link-item');
      if (target) {
        cursor.classList.remove('is-hover');
      }
    });

    tick();
  })();

  /* ─────────────────────────────────────────────
     5. DEPTH & FOCUS — Layered scroll experience
  ───────────────────────────────────────────── */
  (function initDepthScroll() {
    const sections = document.querySelectorAll('.section');
    const body     = document.body;

    const depthObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-focus');
            
            // Shift bg color for technical sections
            const id = entry.target.getAttribute('id');
            const technicalSections = ['system', 'archive'];
            
            if (technicalSections.includes(id)) {
              body.classList.add('bg-alt');
            } else {
              body.classList.remove('bg-alt');
            }
          } else {
            entry.target.classList.remove('in-focus');
          }
        });
      },
      { 
        threshold: 0.25, // Lower for a wider "sharpness" window
        rootMargin: '-10% 0px -10% 0px' 
      }
    );

    sections.forEach((s) => depthObserver.observe(s));
  })();

  /* ─────────────────────────────────────────────
     6. CARD GLOW — Interactive soft lighting
  ───────────────────────────────────────────── */
  (function initCardGlow() {
    // Disable dynamic lighting natively on mobile
    if (window.innerWidth <= 768) return;

    const cards = document.querySelectorAll('.vol-card'); // Project cards only
    
    cards.forEach(card => {
      let isTicking = false;
      let lastHoverEvent = null;

      card.addEventListener('mousemove', e => {
        lastHoverEvent = e;
        
        // Decouple native event polling (e.g. 1000hz mice) from DOM updates (60hz rendering)
        if (!isTicking) {
          window.requestAnimationFrame(() => {
            if (!lastHoverEvent) return;
            const rect = card.getBoundingClientRect();
            
            // Calculate relative coordinates
            const x = lastHoverEvent.clientX - rect.left;
            const y = lastHoverEvent.clientY - rect.top;
            
            // Update CSS variables exactly once per render tick
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            
            isTicking = false;
          });
          isTicking = true;
        }
      });
    });
  })();

})();

