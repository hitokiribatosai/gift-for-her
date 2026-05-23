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
      text: 'Every melody we share becomes the soundtrack of us. From late-night car rides singing off-key to kitchen dancing on rainy afternoons — these songs hold our heartbeats.',
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
      text: 'The way you laugh with your whole body. How you remember the tiniest details. Your stubborn optimism. The warmth of your hand finding mine in the dark. Everything.',
      quote: '"I love you not only for what you are, but for what I am when I am with you."',
      image: 'images/things-i-love.png',
    },
    {
      id: 'jokes',
      label: 'Inside Jokes',
      icon: '😂',
      color: '#ffd6a5',   // peach
      radius: 30,
      text: 'Nobody else would understand why "duck" makes us cry-laugh, or why we can\'t look at each other in elevators. Our private language of absurdity is my favorite thing.',
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
      text: 'That pasta we accidentally perfected at midnight. Your grandmother\'s soup that tastes like a hug. The pancakes we make every Sunday morning. Love is the secret ingredient.',
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
      text: 'Your hoodie that still smells like you. The playlist we fall asleep to. Hot chocolate on cold nights. That one show we\'ve rewatched four times and still love.',
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
  // Each leaf gets a gentle, continuous oscillation
  leaves.each(function (d, i) {
    const g = d3.select(this);
    const amp   = 3 + Math.random() * 4;     // px sway amplitude
    const dur   = 3000 + Math.random() * 2000; // ms cycle
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

    // Start sway after simulation cools down
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
    // Mark discovered
    markDiscovered(mem.id);

    // Populate card
    document.getElementById('card-icon').textContent  = mem.icon;
    document.getElementById('card-title').textContent = mem.label.replace('\n', ' ');
    document.getElementById('card-text').textContent  = mem.text;

    // Image
    const imgWrapper = document.getElementById('card-image-wrapper');
    const img        = document.getElementById('card-image');
    if (mem.image) {
      img.src = mem.image;
      img.alt = mem.label.replace('\n', ' ');
      imgWrapper.classList.add('has-image');
    } else {
      imgWrapper.classList.remove('has-image');
    }

    // Quote
    const quote = document.getElementById('card-quote');
    if (mem.quote) {
      quote.textContent = mem.quote;
      quote.classList.add('has-quote');
    } else {
      quote.classList.remove('has-quote');
    }

    // Set accent color on card border
    const card = overlay.querySelector('.detail-card');
    card.style.borderColor = `${mem.color}33`;
    card.style.boxShadow = `
      0 24px 80px rgba(0,0,0,0.5),
      0 0 60px ${mem.color}22,
      inset 0 1px 0 rgba(255,255,255,0.06)
    `;

    // Show
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function closeCard() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }

  closeBtn.addEventListener('click', closeCard);
  overlay.querySelector('.overlay-backdrop').addEventListener('click', closeCard);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeCard();
  });

  /* ── Discovery tracking ───────────────────────── */
  function markDiscovered(id) {
    if (discoveredSet.has(id)) return;
    discoveredSet.add(id);

    // Add CSS class
    d3.select(`#node-${id}`).classed('discovered', true);

    // Update counter
    const total = MEMORIES.length;
    const found = discoveredSet.size;
    document.getElementById('counter-text').textContent = `${found} / ${total} discovered`;

    if (found === total) {
      document.getElementById('discovery-counter').classList.add('all-found');
      document.getElementById('counter-icon').textContent = '🌟';
    }
  }

  /* ── Ambient particles ────────────────────────── */
  function spawnParticles() {
    const container = document.getElementById('particles-bg');
    const palette   = ['#c9a0ff', '#ffc2d4', '#90c9ff', '#a0e7e5', '#fdcb6e', '#ff9ff3'];

    for (let i = 0; i < 35; i++) {
      const el = document.createElement('div');
      el.classList.add('particle');
      const size = 2 + Math.random() * 5;
      el.style.width  = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left   = `${Math.random() * 100}%`;
      el.style.background = palette[Math.floor(Math.random() * palette.length)];
      el.style.animationDuration = `${12 + Math.random() * 18}s`;
      el.style.animationDelay    = `${Math.random() * 15}s`;
      container.appendChild(el);
    }
  }
  spawnParticles();

})();
