/* =============================================
   MEMORY TREE — Interactive Force-Directed Graph
   ============================================= */

;(function () {
  'use strict';

  /* ── Node data (10 memory categories) ────────── */
  const MEMORIES = [
    {
      id: 'songs',
      label: 'Our Songs',
      icon: '🎵',
      color: '#c9a0ff',   // lavender
      radius: 34,
      text: 'All comes to my mind are eyes of you by pretty much and snowman by sia',
      quote: '"Music is the shorthand of emotion." — Leo Tolstoy',
      image: 'images/our-songs.png',
    },
    {
      id: 'places',
      label: 'Favorite Places',
      icon: '📍',
      color: '#90c9ff',   // sky
      radius: 32,
      text: 'The café where we had our first real conversation. That bench overlooking the city lights. The tiny bookstore that smelled like old pages and possibility. Every corner of the world is better with you.',
      quote: '"We travel not to escape life, but for life not to escape us."',
      image: 'images/favorite-places.png',
    },
    {
      id: 'love',
      label: 'Things I Love\nAbout You',
      icon: '💜',
      color: '#ffc2d4',   // rose
      radius: 36,
      text: 'The way you laugh with your whole body. How you remember the tiniest details. Your stubborn optimism. The warmth of your hand finding mine in the dark. Everything. I love your jealousy over the tiniest details, I love the way u send me u crying nd I love that and want to comfort it.',
      quote: '"I love you not only for what you are, but for what I am when I am with you."',
      image: 'images/things-i-love.png',
    },
    {
      id: 'jokes',
      label: 'Inside Jokes',
      icon: '😂',
      color: '#ffd6a5',   // peach
      radius: 30,
      text: 'I just like it when we laugh on the stupidest things in a convo',
      quote: '"We are all a little weird and life\'s a little weird…"',
      image: 'images/inside-jokes.png',
    },
    {
      id: 'trips',
      label: 'Dream Trips',
      icon: '✈️',
      color: '#a0e7e5',   // mint
      radius: 33,
      text: 'Someday — Tokyo cherry blossoms, Santorini sunsets, Northern Lights from a glass igloo, road-tripping Route 66. The destination doesn\'t matter. Anywhere with you is home.',
      quote: '"Let\'s find some beautiful place to get lost."',
      image: 'images/dream-trips.png',
    },
    {
      id: 'recipes',
      label: 'Our Recipes',
      icon: '🍳',
      color: '#fdcb6e',   // sunshine
      radius: 30,
      text: 'I just LOVE IT when you send me those recipes',
      quote: '"Cooking is love made visible."',
      image: 'images/our-recipes.png',
    },
    {
      id: 'firsts',
      label: 'First Memories',
      icon: '📸',
      color: '#dfe6e9',   // silver
      radius: 35,
      text: 'First hello, first laugh together, first walk where we lost track of time. The nervous excitement of discovering someone who feels like a missing puzzle piece.',
      quote: '"In all the world, there is no heart for me like yours."',
      image: 'images/first-memories.png',
    },
    {
      id: 'dreams',
      label: 'Shared Dreams',
      icon: '🌙',
      color: '#b8a9e8',   // twilight
      radius: 32,
      text: 'A little house with big windows. A garden full of lavender. Mornings with nowhere to rush. Growing old with someone who still gives you butterflies.',
      quote: '"You are my today and all of my tomorrows."',
      image: 'images/shared-dreams.png',
    },
    {
      id: 'comfort',
      label: 'Comfort Things',
      icon: '☕',
      color: '#fab1a0',   // coral
      radius: 31,
      text: 'Our convo nd me reading ur messages is my comfort, nd why not your voice in the future',
      quote: '"Home is not a place — it\'s a feeling."',
      image: 'images/comfort-things.png',
    },
    {
      id: 'letters',
      label: 'Love Letters',
      icon: '💌',
      color: '#ff9ff3',   // magenta-pink
      radius: 33,
      text: 'Words on paper carry a different weight. Every note — from the silly doodles to the late-night paragraphs — is a piece of our story, folded and kept forever.',
      quote: '"I would write you a love letter every day if ink could hold what I feel."',
      image: 'images/love-letters.png',
    },
  ];

  /* ── State ────────────────────────────────────── */
  const discoveredSet = new Set();
  let simulation;
  let nodeEls, linkEls;
  let currentMemoryIndex = 0; // for swipe navigation
  let isCardOpen = false;

  /* ── DOM refs ─────────────────────────────────── */
  const svg       = d3.select('#tree-svg');
  const container = document.getElementById('graph-container');
  const overlay   = document.getElementById('detail-overlay');
  const closeBtn  = document.getElementById('close-card');

  /* ── Dimensions ───────────────────────────────── */
  let W, H;
  function updateDimensions() {
    W = container.clientWidth;
    H = container.clientHeight;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
  }
  updateDimensions();
  window.addEventListener('resize', () => {
    updateDimensions();
    if (simulation) {
      simulation.force('center', d3.forceCenter(W / 2, H / 2));
      simulation.alpha(0.3).restart();
    }
  });

  /* ── Graph data ───────────────────────────────── */
  const centerNode = { id: '___center', fx: W / 2, fy: H / 2, isCenter: true };
  const nodes = [centerNode, ...MEMORIES.map(m => ({ ...m }))];
  const links = MEMORIES.map(m => ({ source: '___center', target: m.id }));

  /* ── SVG Defs (gradients, filters) ────────────── */
  const defs = svg.append('defs');

  // Center node gradient
  const cg = defs.append('radialGradient').attr('id', 'centerGradient');
  cg.append('stop').attr('offset', '0%').attr('stop-color', '#6c5ce7');
  cg.append('stop').attr('offset', '100%').attr('stop-color', '#341f97');

  // Glow filter
  const glow = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
  glow.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
  const merge = glow.append('feMerge');
  merge.append('feMergeNode').attr('in', 'blur');
  merge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Soft glow for discovered state
  const softGlow = defs.append('filter').attr('id', 'softGlow').attr('x', '-80%').attr('y', '-80%').attr('width', '260%').attr('height', '260%');
  softGlow.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
  const mergeS = softGlow.append('feMerge');
  mergeS.append('feMergeNode').attr('in', 'blur');
  mergeS.append('feMergeNode').attr('in', 'SourceGraphic');

  // Per-node radial gradients
  MEMORIES.forEach(m => {
    const grad = defs.append('radialGradient').attr('id', `grad-${m.id}`);
    grad.append('stop').attr('offset', '0%').attr('stop-color', d3.color(m.color).brighter(0.6));
    grad.append('stop').attr('offset', '100%').attr('stop-color', m.color);
  });

  /* ── Draw links ───────────────────────────────── */
  const linkGroup = svg.append('g').attr('class', 'links');
  linkEls = linkGroup.selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'link-line');

  /* ── Draw nodes ───────────────────────────────── */
  const nodeGroup = svg.append('g').attr('class', 'nodes');
  nodeEls = nodeGroup.selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', d => d.isCenter ? 'node-center' : 'node-leaf')
    .attr('id', d => `node-${d.id}`)
    .call(drag()); // attach drag

  // --- Center node ---
  nodeEls.filter(d => d.isCenter).each(function () {
    const g = d3.select(this);
    g.append('circle').attr('r', 28);
    g.append('text').text('🌳').attr('font-size', 26).attr('text-anchor', 'middle').attr('dominant-baseline', 'central');
  });

  // --- Leaf nodes ---
  const leaves = nodeEls.filter(d => !d.isCenter);

  // Discovered outer glow (hidden by default)
  leaves.append('circle')
    .attr('class', 'discovered-glow')
    .attr('r', d => d.radius + 14)
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 8)
    .attr('opacity', 0)
    .attr('filter', 'url(#softGlow)');

  // Node background circle
  leaves.append('circle')
    .attr('class', 'node-bg')
    .attr('r', d => d.radius)
    .attr('fill', d => `url(#grad-${d.id})`)
    .attr('opacity', 0.88);

  // Outer ring
  leaves.append('circle')
    .attr('class', 'node-ring')
    .attr('r', d => d.radius + 4)
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0.35);

  // Icon
  leaves.append('text')
    .attr('class', 'node-icon')
    .text(d => d.icon)
    .attr('y', -2);

  // Label (supports multi-line via \n)
  leaves.each(function (d) {
    const g = d3.select(this);
    const lines = d.label.split('\n');
    lines.forEach((line, i) => {
      g.append('text')
        .attr('class', 'node-label')
        .attr('y', d.radius + 16 + i * 14)
        .text(line);
    });
  });

  // Click handler
  leaves.on('click', (event, d) => {
    event.stopPropagation();
    currentMemoryIndex = MEMORIES.findIndex(m => m.id === d.id);
    playChime(d.color);
    openCard(d);
  });

  /* ── Force simulation ─────────────────────────── */
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(160).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-420))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide().radius(d => (d.radius || 28) + 20))
    .force('x', d3.forceX(W / 2).strength(0.04))
    .force('y', d3.forceY(H / 2).strength(0.04))
    .alphaDecay(0.015)
    .on('tick', ticked);

  function ticked() {
    // Clamp nodes inside viewport
    nodes.forEach(n => {
      if (n.isCenter) return;
      const r = (n.radius || 28) + 10;
      n.x = Math.max(r, Math.min(W - r, n.x));
      n.y = Math.max(r + 60, Math.min(H - r - 60, n.y));
    });

    linkEls
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodeEls.attr('transform', d => `translate(${d.x},${d.y})`);
  }

  /* ── Buoyancy / sway animation ────────────────── */
  leaves.each(function (d, i) {
    const g = d3.select(this);
    const amp   = 3 + Math.random() * 4;
    const dur   = 3000 + Math.random() * 2000;
    const delay = Math.random() * dur;

    function sway() {
      g.transition()
        .duration(dur)
        .delay(delay)
        .ease(d3.easeSinInOut)
        .attrTween('transform', () => {
          const baseX = d.x;
          const baseY = d.y;
          return t => {
            const angle = t * Math.PI * 2;
            const dx = Math.sin(angle) * amp;
            const dy = Math.cos(angle * 0.7) * amp * 0.6;
            return `translate(${baseX + dx},${baseY + dy})`;
          };
        })
        .on('end', sway);
    }

    setTimeout(sway, 3000 + i * 200);
  });

  /* ── Drag behaviour ───────────────────────────── */
  function drag() {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        if (!d.isCenter) { d.fx = null; d.fy = null; }
      });
  }

  /* ── Detail card ──────────────────────────────── */
  function openCard(mem) {
    markDiscovered(mem.id);

    document.getElementById('card-icon').textContent  = mem.icon;
    document.getElementById('card-title').textContent = mem.label.replace('\n', ' ');
    document.getElementById('card-text').textContent  = mem.text;

    const imgWrapper = document.getElementById('card-image-wrapper');
    const img        = document.getElementById('card-image');
    if (mem.image) {
      img.src = mem.image;
      img.alt = mem.label.replace('\n', ' ');
      imgWrapper.classList.add('has-image');
    } else {
      imgWrapper.classList.remove('has-image');
    }

    const quote = document.getElementById('card-quote');
    if (mem.quote) {
      quote.textContent = mem.quote;
      quote.classList.add('has-quote');
    } else {
      quote.classList.remove('has-quote');
    }

    const card = overlay.querySelector('.detail-card');
    card.style.borderColor = `${mem.color}33`;
    card.style.boxShadow = `
      0 24px 80px rgba(0,0,0,0.5),
      0 0 60px ${mem.color}22,
      inset 0 1px 0 rgba(255,255,255,0.06)
    `;

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    isCardOpen = true;

    // Show swipe hint on touch devices (first time only)
    if ('ontouchstart' in window) {
      showSwipeHint();
    }
  }

  function closeCard() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    isCardOpen = false;
    hideSwipeHint();
  }

  closeBtn.addEventListener('click', closeCard);
  overlay.querySelector('.overlay-backdrop').addEventListener('click', closeCard);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeCard();
    if (e.key === 'ArrowRight' && isCardOpen) navigateCard(1);
    if (e.key === 'ArrowLeft'  && isCardOpen) navigateCard(-1);
  });

  /* ── Discovery tracking ───────────────────────── */
  function markDiscovered(id) {
    if (discoveredSet.has(id)) return;
    discoveredSet.add(id);

    d3.select(`#node-${id}`).classed('discovered', true);

    const total = MEMORIES.length;
    const found = discoveredSet.size;
    document.getElementById('counter-text').textContent = `${found} / ${total} discovered`;

    if (found === total) {
      document.getElementById('discovery-counter').classList.add('all-found');
      document.getElementById('counter-icon').textContent = '🌟';
      // Delay celebration to let card open first
      setTimeout(() => {
        closeCard();
        launchCelebration();
      }, 1800);
    }
  }

  /* ══════════════════════════════════════════════
     ✨  FEATURE 1 — FIREFLIES + SHOOTING STARS
     ══════════════════════════════════════════════ */
  (function initFireflies() {
    const canvas = document.getElementById('firefly-canvas');
    const ctx    = canvas.getContext('2d');

    const PALETTE = ['#c9a0ff', '#ffc2d4', '#90c9ff', '#a0e7e5', '#fdcb6e', '#ff9ff3', '#fab1a0', '#b8a9e8'];
    const NUM_FIREFLIES = 40;

    let cW, cH;
    function resize() {
      cW = canvas.width  = window.innerWidth;
      cH = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* Firefly objects */
    const fireflies = Array.from({ length: NUM_FIREFLIES }, () => makeFirefly());

    function makeFirefly() {
      return {
        x:    Math.random() * (cW || window.innerWidth),
        y:    Math.random() * (cH || window.innerHeight),
        r:    1 + Math.random() * 2.5,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        vx:   (Math.random() - 0.5) * 0.4,
        vy:   (Math.random() - 0.5) * 0.4,
        alpha: 0,
        alphaDir: 1,
        alphaSpeed: 0.005 + Math.random() * 0.012,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    }

    /* Shooting stars */
    const shootingStars = [];

    function spawnShootingStar() {
      shootingStars.push({
        x: Math.random() * cW,
        y: Math.random() * cH * 0.5,
        len: 80 + Math.random() * 120,
        speed: 6 + Math.random() * 6,
        angle: Math.PI / 6 + (Math.random() - 0.5) * 0.3,
        alpha: 1,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      });
    }

    // Spawn a shooting star every 4–8 seconds
    function scheduleStar() {
      setTimeout(() => {
        spawnShootingStar();
        scheduleStar();
      }, 4000 + Math.random() * 4000);
    }
    scheduleStar();

    /* Animation loop */
    let t = 0;
    function animate() {
      ctx.clearRect(0, 0, cW, cH);
      t += 0.016;

      // Draw fireflies
      fireflies.forEach(f => {
        // Drift
        f.x += f.vx + Math.sin(t * 0.7 + f.pulseOffset) * 0.15;
        f.y += f.vy + Math.cos(t * 0.5 + f.pulseOffset) * 0.1;

        // Wrap around edges
        if (f.x < -10) f.x = cW + 10;
        if (f.x > cW + 10) f.x = -10;
        if (f.y < -10) f.y = cH + 10;
        if (f.y > cH + 10) f.y = -10;

        // Pulse alpha
        f.alpha += f.alphaDir * f.alphaSpeed;
        if (f.alpha >= 0.85) { f.alpha = 0.85; f.alphaDir = -1; }
        if (f.alpha <= 0.05) { f.alpha = 0.05; f.alphaDir = 1; }

        // Draw glow
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4);
        grad.addColorStop(0, f.color + 'cc');
        grad.addColorStop(1, f.color + '00');
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = f.alpha;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = f.alpha;
        ctx.fill();
      });

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        const dx = Math.cos(s.angle) * s.len;
        const dy = Math.sin(s.angle) * s.len;

        const grad = ctx.createLinearGradient(s.x, s.y, s.x - dx, s.y - dy);
        grad.addColorStop(0, s.color + Math.round(s.alpha * 255).toString(16).padStart(2, '0'));
        grad.addColorStop(1, s.color + '00');

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - dx, s.y - dy);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.globalAlpha = s.alpha;
        ctx.stroke();

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.alpha -= 0.025;

        if (s.alpha <= 0 || s.x > cW + 50 || s.y > cH + 50) {
          shootingStars.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }

    animate();
  })();

  /* ══════════════════════════════════════════════
     🔊  FEATURE 2 — CLICK CHIME SOUND (Web Audio)
     ══════════════════════════════════════════════ */
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playChime(color) {
    try {
      const ctx = getAudioCtx();

      // Map color to a pentatonic note frequency
      const colorNoteMap = {
        '#c9a0ff': 523.25,  // C5 — lavender
        '#90c9ff': 587.33,  // D5 — sky
        '#ffc2d4': 659.25,  // E5 — rose
        '#ffd6a5': 698.46,  // F5 — peach
        '#a0e7e5': 783.99,  // G5 — mint
        '#fdcb6e': 880.00,  // A5 — sunshine
        '#dfe6e9': 987.77,  // B5 — silver
        '#b8a9e8': 1046.50, // C6 — twilight
        '#fab1a0': 1174.66, // D6 — coral
        '#ff9ff3': 1318.51, // E6 — magenta-pink
      };

      const freq = colorNoteMap[color] || 660;
      const now  = ctx.currentTime;

      // Oscillator 1 — main tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.05);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc1.start(now);
      osc1.stop(now + 0.9);

      // Oscillator 2 — harmonic shimmer
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.07, now + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.start(now);
      osc2.stop(now + 0.5);

    } catch (e) {
      // Audio not available — silently skip
    }
  }

  /* ══════════════════════════════════════════════
     🎆  FEATURE 3 — CONFETTI + CELEBRATION MODAL
     ══════════════════════════════════════════════ */
  function launchCelebration() {
    const confettiCanvas = document.getElementById('confetti-canvas');
    const celebOverlay   = document.getElementById('celebration-overlay');
    const celebClose     = document.getElementById('celebration-close');
    const ctx = confettiCanvas.getContext('2d');

    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiCanvas.classList.add('active');

    const PALETTE = ['#c9a0ff', '#ffc2d4', '#90c9ff', '#fdcb6e', '#ff9ff3', '#a0e7e5', '#fab1a0', '#ffd6a5', '#ffffff'];
    const pieces  = [];
    const NUM     = 160;

    for (let i = 0; i < NUM; i++) {
      pieces.push({
        x:     confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
        y:     confettiCanvas.height / 2,
        vx:    (Math.random() - 0.5) * 14,
        vy:    -8 - Math.random() * 10,
        rot:   Math.random() * Math.PI * 2,
        rotV:  (Math.random() - 0.5) * 0.2,
        w:     6 + Math.random() * 8,
        h:     3 + Math.random() * 5,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        alpha: 1,
      });
    }

    let frame;
    function drawConfetti() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let allDone = true;

      pieces.forEach(p => {
        p.vy += 0.28;   // gravity
        p.vx *= 0.99;   // air resistance
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.rotV;
        if (p.y > confettiCanvas.height - 40) p.alpha -= 0.035;
        if (p.alpha > 0) allDone = false;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (!allDone) {
        frame = requestAnimationFrame(drawConfetti);
      } else {
        confettiCanvas.classList.remove('active');
      }
    }

    drawConfetti();

    // Play a sparkle chord
    try {
      const ac  = getAudioCtx();
      const now = ac.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.2);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 1.2);
      });
    } catch (e) { /* silent */ }

    // Show celebration modal after a brief pause
    setTimeout(() => {
      celebOverlay.classList.remove('hidden');
      celebOverlay.setAttribute('aria-hidden', 'false');
    }, 400);

    celebClose.addEventListener('click', () => {
      celebOverlay.classList.add('hidden');
      celebOverlay.setAttribute('aria-hidden', 'true');
      if (frame) cancelAnimationFrame(frame);
      confettiCanvas.classList.remove('active');
    }, { once: true });
  }

  /* ══════════════════════════════════════════════
     📱  FEATURE 4 — MOBILE SWIPE NAVIGATION
     ══════════════════════════════════════════════ */
  let touchStartX  = null;
  let touchStartY  = null;
  const SWIPE_THRESHOLD = 50; // px

  overlay.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  overlay.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    // Only handle horizontal swipes (not accidental vertical scrolls)
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigateCard(dx < 0 ? 1 : -1);
    }
    touchStartX = null;
    touchStartY = null;
  }, { passive: true });

  function navigateCard(direction) {
    const card      = overlay.querySelector('.detail-card');
    const outClass  = direction > 0 ? 'swipe-left'  : 'swipe-right';
    const inClass   = direction > 0 ? 'swipe-in-right' : 'swipe-in-left';

    card.classList.add(outClass);
    setTimeout(() => {
      card.classList.remove(outClass);
      currentMemoryIndex = (currentMemoryIndex + direction + MEMORIES.length) % MEMORIES.length;
      const nextMem = MEMORIES[currentMemoryIndex];
      playChime(nextMem.color);
      openCard(nextMem);
      card.classList.add(inClass);
      setTimeout(() => card.classList.remove(inClass), 350);
    }, 300);
  }

  /* ── Swipe hint helpers ───────────────────────── */
  let swipeHintShown = false;
  let swipeHintTimer = null;

  function showSwipeHint() {
    if (swipeHintShown) return;
    swipeHintShown = true;
    const hint = document.getElementById('swipe-hint');
    hint.classList.remove('hidden');
    requestAnimationFrame(() => hint.classList.add('visible'));
    swipeHintTimer = setTimeout(hideSwipeHint, 3000);
  }

  function hideSwipeHint() {
    clearTimeout(swipeHintTimer);
    const hint = document.getElementById('swipe-hint');
    hint.classList.remove('visible');
  }

})();
