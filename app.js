/* ═══════════════════════════════════════════════════════════════════════════════
 *  app.js — Ultra-Premium Cinematic Developer Portfolio
 *  Three.js r150 · GSAP + ScrollTrigger · Lenis Smooth Scroll
 * ═══════════════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ── Global refs ──────────────────────────────────────────────────────────── */
  let scene, camera, renderer;
  let shapes = [], nodes = [], nodeLines, particles;
  let mouse = { x: 0, y: 0, target: { x: 0, y: 0 } };
  let lenis;
  let rafId;
  const isMobile =
    window.innerWidth < 768 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  const COLORS = {
    accent1: 0x00d4ff,   // cyan
    accent2: 0x7b2fff,   // purple
    accent3: 0x00ff88,   // green-neon
    accent4: 0xff2d95,   // magenta
  };

  const SECTION_COLORS = {
    hero:            { fog: 0x0a0a2e, ambient: 0x1a1a5e },
    projects:        { fog: 0x0a1a2e, ambient: 0x1a3a5e },
    'system-design': { fog: 0x0a0a2e, ambient: 0x1a1a5e },
    skills:          { fog: 0x1a0a2e, ambient: 0x3a1a5e },
    contact:         { fog: 0x0a0a15, ambient: 0x1a1a30 },
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   *  1. CINEMATIC LOADER
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initLoader() {
    const loader    = document.getElementById('cinematic-loader');
    const content   = loader ? loader.querySelector('.loader-content') : null;
    const textEl    = document.getElementById('loader-text');
    const percentEl = document.getElementById('loader-percentage');
    const barFill   = loader ? loader.querySelector('.loader-bar-fill') : null;

    if (!loader) { initAll(); return; }

    /* 1. Blur -> Sharp Entry Effect via CSS transition class */
    setTimeout(() => {
      if (content) content.classList.add('sharp-reveal');
    }, 100);

    /* 2. Typewriter Effect (Vanilla JS) */
    const messages = [
      'Initializing developer portfolio system…'
    ];

    let currentMsgIdx = 0;
    let currentCharIdx = 0;
    let isTyping = true;

    function runTypewriter() {
      if (!textEl) return;
      
      const currentText = messages[currentMsgIdx];
      
      if (isTyping) {
        currentCharIdx++;
        textEl.textContent = currentText.substring(0, currentCharIdx);
        
        if (currentCharIdx === currentText.length) {
          isTyping = false;
          // Hold the line on screen without fading out
        } else {
          // Slight random delay for natural typewriter typing feel
          setTimeout(runTypewriter, randomRange(30, 65));
        }
      }
    }

    // Start typewriter
    setTimeout(runTypewriter, 400);

    /* 3. Bottom Progress Bar updates (0% to 100% using 60fps requestAnimationFrame) */
    let progress = 0;
    
    function animateProgress() {
      if (progress < 100) {
        // Silky-smooth progress increments (adjusted for faster ~2.8s speed)
        let increment = 0.85; // Base speed
        
        // Easing effect: slow down slightly in the middle and near the end
        if (progress > 40 && progress < 65) {
          increment = 0.6;
        } else if (progress > 85) {
          increment = 0.28; // Slow down near 100% for suspense
        }
        
        progress = Math.min(100, progress + increment);
        const displayVal = Math.floor(progress);
        
        if (percentEl) percentEl.textContent = `${displayVal}%`;
        if (barFill) barFill.style.width = `${progress}%`;
        
        requestAnimationFrame(animateProgress);
      } else {
        // Reached 100%! Pause 500ms then trigger exit
        setTimeout(() => {
          // 4. Exit Transition: opacity, scale, blur via exit-loader class
          loader.classList.add('exit-loader');
          
          // Wait for exit transition (800ms) then remove from flow and initialize page
          setTimeout(() => {
            loader.style.display = 'none';
            initAll();
          }, 800);
        }, 500);
      }
    }

    // Start progress loop
    setTimeout(() => {
      requestAnimationFrame(animateProgress);
    }, 400);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  2. THREE.JS SCENE
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initThreeScene() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    /* ── Renderer ────────────────────────────────────────────────────────── */
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a2e, 1);

    /* ── Scene + Fog ─────────────────────────────────────────────────────── */
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a2e, 0.018);

    /* ── Camera ──────────────────────────────────────────────────────────── */
    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 30);

    /* ── Lights ──────────────────────────────────────────────────────────── */
    const ambientLight = new THREE.AmbientLight(0x1a1a5e, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1.2, 80);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7b2fff, 1.0, 80);
    pointLight2.position.set(-20, -15, 15);
    scene.add(pointLight2);

    /* ── Floating shapes ─────────────────────────────────────────────────── */
    createFloatingShapes();

    /* ── Node network ────────────────────────────────────────────────────── */
    createNodeNetwork();

    /* ── Particle system ─────────────────────────────────────────────────── */
    createParticleSystem();

    /* ── Mouse tracking ──────────────────────────────────────────────────── */
    window.addEventListener(
      'mousemove',
      throttle((e) => {
        mouse.target.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.target.y = -(e.clientY / window.innerHeight) * 2 + 1;
      }, 16),
      { passive: true }
    );

    /* ── Resize ──────────────────────────────────────────────────────────── */
    window.addEventListener('resize', onWindowResize, { passive: true });

    /* ── Kick animation loop ─────────────────────────────────────────────── */
    animateScene();
  }

  /* ─── 2a. Floating wireframe shapes ──────────────────────────────────────── */
  function createFloatingShapes() {
    const count = isMobile ? 8 : 18;
    const geometries = [
      () => new THREE.IcosahedronGeometry(randomRange(0.6, 1.8), 0),
      () => new THREE.OctahedronGeometry(randomRange(0.6, 1.6), 0),
      () => new THREE.TetrahedronGeometry(randomRange(0.8, 1.6), 0),
      () => new THREE.BoxGeometry(
        randomRange(0.8, 1.6),
        randomRange(0.8, 1.6),
        randomRange(0.8, 1.6)
      ),
      () => new THREE.DodecahedronGeometry(randomRange(0.6, 1.4), 0),
    ];
    const colorPool = [COLORS.accent1, COLORS.accent2, COLORS.accent3, COLORS.accent4];

    for (let i = 0; i < count; i++) {
      const geo = geometries[Math.floor(Math.random() * geometries.length)]();
      const mat = new THREE.MeshPhongMaterial({
        color: colorPool[Math.floor(Math.random() * colorPool.length)],
        wireframe: true,
        transparent: true,
        opacity: randomRange(0.15, 0.45),
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        randomRange(-30, 30),
        randomRange(-25, 25),
        randomRange(-20, 10)
      );
      mesh.userData = {
        rotSpeed: {
          x: randomRange(0.001, 0.008) * (Math.random() > 0.5 ? 1 : -1),
          y: randomRange(0.001, 0.008) * (Math.random() > 0.5 ? 1 : -1),
          z: randomRange(0.001, 0.005) * (Math.random() > 0.5 ? 1 : -1),
        },
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: randomRange(0.3, 0.8),
        floatAmplitude: randomRange(0.3, 1.0),
        baseY: mesh.position.y,
      };
      scene.add(mesh);
      shapes.push(mesh);
    }
  }

  /* ─── 2b. Microservice node network ──────────────────────────────────────── */
  function createNodeNetwork() {
    const nodeCount = isMobile ? 6 : 10;
    const nodePositions = [];
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.7,
    });

    for (let i = 0; i < nodeCount; i++) {
      const geo = new THREE.SphereGeometry(0.12, 12, 12);
      const sphere = new THREE.Mesh(geo, nodeMat.clone());
      sphere.position.set(
        randomRange(-15, 15),
        randomRange(-12, 12),
        randomRange(-5, 5)
      );
      sphere.userData = {
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: randomRange(1.0, 2.5),
        baseScale: 1,
      };
      scene.add(sphere);
      nodes.push(sphere);
      nodePositions.push(sphere.position.x, sphere.position.y, sphere.position.z);
    }

    /* Connect nearby nodes with lines */
    const lineVerts = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position);
        if (dist < 18) {
          lineVerts.push(
            nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
            nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
          );
        }
      }
    }

    if (lineVerts.length) {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(lineVerts, 3)
      );
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      });
      nodeLines = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(nodeLines);
    }
  }

  /* ─── 2c. Particle system ────────────────────────────────────────────────── */
  function createParticleSystem() {
    const count = isMobile ? 500 : 1800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      /* Spherical distribution */
      const r     = randomRange(5, 50);
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: isMobile ? 0.08 : 0.06,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      sizeAttenuation: true,
    });

    particles = new THREE.Points(geo, mat);
    scene.add(particles);
  }

  /* ─── 2d. Animation loop ─────────────────────────────────────────────────── */
  function animateScene() {
    rafId = requestAnimationFrame(animateScene);
    const t = performance.now() * 0.001;

    /* Smooth mouse lerp */
    mouse.x += (mouse.target.x - mouse.x) * 0.05;
    mouse.y += (mouse.target.y - mouse.y) * 0.05;

    /* Camera parallax */
    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    /* Rotate shapes + float */
    shapes.forEach((s) => {
      const d = s.userData;
      s.rotation.x += d.rotSpeed.x;
      s.rotation.y += d.rotSpeed.y;
      s.rotation.z += d.rotSpeed.z;
      s.position.y =
        d.baseY + Math.sin(t * d.floatSpeed + d.floatOffset) * d.floatAmplitude;
    });

    /* Pulse nodes */
    nodes.forEach((n) => {
      const scale =
        n.userData.baseScale +
        Math.sin(t * n.userData.pulseSpeed + n.userData.pulseOffset) * 0.4;
      n.scale.setScalar(Math.max(scale, 0.3));
      n.material.opacity = 0.4 + Math.sin(t * n.userData.pulseSpeed + n.userData.pulseOffset) * 0.3;
    });

    /* Update node line positions dynamically */
    if (nodeLines) {
      const pos = nodeLines.geometry.attributes.position;
      let idx = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].position.distanceTo(nodes[j].position) < 18 && idx < pos.count) {
            pos.setXYZ(idx, nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
            idx++;
            pos.setXYZ(idx, nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
            idx++;
          }
        }
      }
      pos.needsUpdate = true;
      nodeLines.material.opacity = 0.08 + Math.sin(t * 0.5) * 0.06;
    }

    /* Slow-rotate particles */
    if (particles) {
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;
    }

    renderer.render(scene, camera);
  }

  /* ─── 2e. Resize ─────────────────────────────────────────────────────────── */
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  3. CUSTOM CURSOR
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initCursor() {
    if (isMobile) return;

    const dot  = document.getElementById('custom-cursor');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    /* Hide default cursor */
    document.body.style.cursor = 'none';

    const pos  = { x: 0, y: 0 };

    document.addEventListener(
      'mousemove',
      (e) => {
        pos.x = e.clientX;
        pos.y = e.clientY;
        dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      },
      { passive: true }
    );

    /* Ring follows with GSAP lerp */
    gsap.ticker.add(() => {
      gsap.set(ring, {
        x: pos.x,
        y: pos.y,
        duration: 0,
        overwrite: 'auto',
      });
    });
    gsap.to(ring, {
      duration: 0.5,
      ease: 'power3.out',
      repeat: -1,
      onUpdate() {},       /* keep ticker alive */
    });

    /* We use a cleaner approach: quickTo for the ring */
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });

    /* Override with quickTo */
    gsap.ticker.remove(gsap.ticker.getLast);
    document.addEventListener(
      'mousemove',
      (e) => {
        ringX(e.clientX);
        ringY(e.clientY);
      },
      { passive: true }
    );

    /* ── Hover scaling ───────────────────────────────────────────────────── */
    const interactives =
      'a, button, .case-study, .tech-chip, .nav-links a, input, textarea, .btn';

    document.querySelectorAll(interactives).forEach((el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(ring, {
          scale: 1.8,
          borderColor: 'rgba(0,212,255,0.6)',
          duration: 0.3,
          ease: 'power2.out',
        });
        gsap.to(dot, { scale: 0.5, duration: 0.3 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(ring, {
          scale: 1,
          borderColor: 'rgba(0,212,255,0.3)',
          duration: 0.3,
          ease: 'power2.out',
        });
        gsap.to(dot, { scale: 1, duration: 0.3 });
      });
    });

    /* ── Magnetic effect on buttons ──────────────────────────────────────── */
    document.querySelectorAll('.btn, .nav-links a').forEach((btn) => {
      btn.addEventListener(
        'mousemove',
        (e) => {
          const rect = btn.getBoundingClientRect();
          const cx   = rect.left + rect.width / 2;
          const cy   = rect.top + rect.height / 2;
          const dx   = e.clientX - cx;
          const dy   = e.clientY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const pull = (1 - dist / 100) * 0.35;
            gsap.to(btn, {
              x: dx * pull,
              y: dy * pull,
              duration: 0.3,
              ease: 'power2.out',
            });
          }
        },
        { passive: true }
      );
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  4. SMOOTH SCROLLING (LENIS)
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initSmoothScroll() {
    if (typeof Lenis === 'undefined') return;

    lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      smoothTouch: false,
    });

    /* Connect Lenis → GSAP ScrollTrigger */
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  5. GSAP SCROLL ANIMATIONS
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    /* ── Nav show / hide ─────────────────────────────────────────────────── */
    const nav = document.querySelector('nav.glass-nav');
    if (nav) {
      let lastScroll = 0;
      ScrollTrigger.create({
        start: 'top top',
        end: 'max',
        onUpdate(self) {
          const direction = self.direction;         // 1 = down, -1 = up
          const scrollY   = self.scroll();
          if (scrollY > 80) {
            gsap.to(nav, {
              y: direction === 1 ? -120 : 0,
              duration: 0.4,
              ease: 'power2.out',
            });
          } else {
            gsap.to(nav, { y: 0, duration: 0.3 });
          }
          lastScroll = scrollY;
        },
      });
    }

    /* ── Hero parallax ───────────────────────────────────────────────────── */
    const heroSection = document.getElementById('hero');
    if (heroSection) {
      const profileImg = heroSection.querySelector('.profile-image-container');
      const heroText   = heroSection.querySelectorAll(
        'h1, h2, p, .hero-cta, .typewriter'
      );

      if (profileImg) {
        gsap.to(profileImg, {
          y: -80,
          scale: 0.92,
          scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      }

      heroText.forEach((el) => {
        gsap.to(el, {
          y: -50,
          opacity: 0,
          scrollTrigger: {
            trigger: heroSection,
            start: '30% top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });
    }

    /* ── Section headers ─────────────────────────────────────────────────── */
    gsap.utils.toArray('.section-header, .section-title').forEach((header) => {
      gsap.from(header, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    /* ── Case study cards ────────────────────────────────────────────────── */
    gsap.utils.toArray('.case-study').forEach((card, i) => {
      gsap.from(card, {
        y: 80,
        opacity: 0,
        scale: 0.92,
        duration: 0.9,
        delay: i * 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    /* ── System design diagram SVG paths ─────────────────────────────────── */
    gsap.utils.toArray('.diagram-canvas').forEach((svg) => {
      const paths = svg.querySelectorAll('path, line, polyline');
      paths.forEach((path) => {
        const len = path.getTotalLength ? path.getTotalLength() : 0;
        if (len) {
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.8,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: svg,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          });
        }
      });

      /* Nodes / circles */
      const nodesEls = svg.querySelectorAll('circle, rect, ellipse');
      gsap.from(nodesEls, {
        scale: 0,
        opacity: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: 'back.out(1.7)',
        transformOrigin: 'center center',
        scrollTrigger: {
          trigger: svg,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    /* ── Skill chips ─────────────────────────────────────────────────────── */
    const chips = gsap.utils.toArray('.tech-chip');
    const skillsSec = document.getElementById('skills');
    if (chips.length && skillsSec) {
      let floatTweens = [];

      ScrollTrigger.create({
        trigger: skillsSec,
        start: 'top 75%',
        toggleActions: 'play none none reverse',
        onEnter() {
          skillsSec.classList.add('skills-active');
          
          /* Start subtle float after entrance transition completes */
          if (!floatTweens.length) {
            chips.forEach((chip, idx) => {
              const tween = gsap.to(chip, {
                y: -6,
                duration: randomRange(1.8, 2.8),
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                delay: idx * 0.08 + 0.6,
              });
              floatTweens.push(tween);
            });
          } else {
            floatTweens.forEach(t => t.play());
          }
        },
        onEnterBack() {
          skillsSec.classList.add('skills-active');
          floatTweens.forEach(t => t.play());
        },
        onLeaveBack() {
          skillsSec.classList.remove('skills-active');
          floatTweens.forEach(t => {
            t.pause();
            gsap.to(t.targets(), { y: 0, duration: 0.3 });
          });
        }
      });

      /* Double-safety manual scroll check */
      window.addEventListener('scroll', throttle(() => {
        if (!skillsSec.classList.contains('skills-active')) {
          const rect = skillsSec.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.8) {
            skillsSec.classList.add('skills-active');
            chips.forEach((chip, idx) => {
              gsap.to(chip, {
                y: -6,
                duration: randomRange(1.8, 2.8),
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
                delay: idx * 0.08 + 0.6,
              });
            });
          }
        }
      }, 150), { passive: true });
    }

    /* ── Contact section ─────────────────────────────────────────────────── */
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      gsap.from(contactSection.children, {
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: contactSection,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    }

    /* ── Section color transitions ───────────────────────────────────────── */
    const sectionIds = ['hero', 'projects', 'system-design', 'skills', 'contact'];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => updateSceneColors(id),
        onEnterBack: () => updateSceneColors(id),
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  6. TYPEWRITER EFFECT
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initTypewriter() {
    const el = document.querySelector('.typewriter');
    if (!el) return;

    const titles = [
      'Java Backend Developer',
      'Spring Boot Engineer',
      'Backend System Architect',
      'API Design Specialist',
    ];

    let titleIdx  = 0;
    let charIdx   = 0;
    let isDeleting = false;

    function tick() {
      const current = titles[titleIdx];

      if (!isDeleting) {
        /* Typing */
        charIdx++;
        el.textContent = current.substring(0, charIdx);
        if (charIdx === current.length) {
          isDeleting = true;
          setTimeout(tick, 2000);        // pause before delete
          return;
        }
        setTimeout(tick, 50);
      } else {
        /* Deleting */
        charIdx--;
        el.textContent = current.substring(0, charIdx);
        if (charIdx === 0) {
          isDeleting = false;
          titleIdx = (titleIdx + 1) % titles.length;
          setTimeout(tick, 400);         // brief pause before next title
          return;
        }
        setTimeout(tick, 30);
      }
    }

    setTimeout(tick, 600);               // initial delay for dramatic effect
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  7. 3D TILT EFFECT ON CARDS
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initTiltEffect() {
    if (isMobile) return;

    const cards = document.querySelectorAll('.case-study');
    cards.forEach((card) => {
      card.style.transformStyle  = 'preserve-3d';
      card.style.willChange      = 'transform';

      let tiltRAF = null;
      let targetRotX = 0, targetRotY = 0;
      let currentRotX = 0, currentRotY = 0;

      card.addEventListener(
        'mousemove',
        (e) => {
          const rect = card.getBoundingClientRect();
          const cx   = e.clientX - rect.left - rect.width / 2;
          const cy   = e.clientY - rect.top - rect.height / 2;

          targetRotY = (cx / (rect.width / 2)) * 10;
          targetRotX = -(cy / (rect.height / 2)) * 10;

          if (!tiltRAF) tiltRAF = requestAnimationFrame(updateTilt);
        },
        { passive: true }
      );

      function updateTilt() {
        currentRotX += (targetRotX - currentRotX) * 0.15;
        currentRotY += (targetRotY - currentRotY) * 0.15;

        card.style.transform =
          `perspective(800px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg) translateZ(10px)`;

        if (
          Math.abs(targetRotX - currentRotX) > 0.1 ||
          Math.abs(targetRotY - currentRotY) > 0.1
        ) {
          tiltRAF = requestAnimationFrame(updateTilt);
        } else {
          tiltRAF = null;
        }
      }

      card.addEventListener('mouseleave', () => {
        targetRotX = 0;
        targetRotY = 0;
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          translateZ: 0,
          duration: 0.6,
          ease: 'power3.out',
          clearProps: 'transform',
        });
        tiltRAF = null;
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  8. RIPPLE EFFECT
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initRippleEffect() {
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.style.position = 'relative';
      btn.style.overflow  = 'hidden';

      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const x    = e.clientX - rect.left;
        const y    = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height) * 2.5;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        Object.assign(ripple.style, {
          position: 'absolute',
          left: `${x}px`,
          top: `${y}px`,
          width: `${size}px`,
          height: `${size}px`,
          marginLeft: `${-size / 2}px`,
          marginTop: `${-size / 2}px`,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          transform: 'scale(0)',
          pointerEvents: 'none',
          zIndex: '1',
        });
        btn.appendChild(ripple);

        gsap.to(ripple, {
          scale: 1,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          onComplete() { ripple.remove(); },
        });
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  9. NAVIGATION
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initNavigation() {
    const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');
    const indicator = document.querySelector('.nav-indicator');
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const sections  = [];

    /* Mobile menu hamburger toggle */
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
      });
    }

    /* Handle mobile link clicks */
    mobileLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const dest = document.querySelector(link.getAttribute('href'));
        
        // Close menu
        if (hamburger) hamburger.classList.remove('active');
        if (mobileMenu) mobileMenu.classList.remove('active');

        if (!dest) return;
        setTimeout(() => {
          if (lenis) {
            lenis.scrollTo(dest, { offset: -70, duration: 1.2 });
          } else {
            dest.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300); // Small delay to let menu close transition start
      });
    });

    navLinks.forEach((link) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) sections.push({ link, target });

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const dest = document.querySelector(link.getAttribute('href'));
        if (!dest) return;

        if (lenis) {
          lenis.scrollTo(dest, { offset: -80, duration: 1.4 });
        } else {
          dest.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    /* Active section detection */
    if (sections.length) {
      ScrollTrigger.create({
        start: 'top top',
        end: 'max',
        onUpdate() {
          const scrollCenter = window.scrollY + window.innerHeight / 3;
          let active = sections[0];
          sections.forEach((s) => {
            if (s.target.offsetTop <= scrollCenter) active = s;
          });
          navLinks.forEach((l) => l.classList.remove('active'));
          active.link.classList.add('active');

          /* Update active class on mobile links too */
          mobileLinks.forEach((l) => {
            if (l.getAttribute('href') === active.link.getAttribute('href')) {
              l.classList.add('active');
            } else {
              l.classList.remove('active');
            }
          });

          /* Move indicator */
          if (indicator) {
            const rect = active.link.getBoundingClientRect();
            const navRect = active.link.closest('.nav-links').getBoundingClientRect();
            gsap.to(indicator, {
              x: rect.left - navRect.left,
              width: rect.width,
              duration: 0.35,
              ease: 'power2.out',
            });
          }
        },
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  10. CONTACT FORM
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    /* Floating label / input focus glow */
    form.querySelectorAll('input, textarea').forEach((field) => {
      field.addEventListener('focus', () => {
        gsap.to(field, { borderColor: '#00d4ff', duration: 0.3 });
      });
      field.addEventListener('blur', () => {
        gsap.to(field, { borderColor: 'rgba(255,255,255,0.1)', duration: 0.3 });
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      /* Basic validation */
      const name    = form.querySelector('[name="name"]');
      const email   = form.querySelector('[name="email"]');
      const message = form.querySelector('[name="message"]');
      let valid = true;

      [name, email, message].forEach((f) => {
        if (f && !f.value.trim()) {
          valid = false;
          gsap.fromTo(
            f,
            { x: -6 },
            { x: 6, duration: 0.08, repeat: 5, yoyo: true, ease: 'power1.inOut' }
          );
          gsap.to(f, { borderColor: '#ff2d55', duration: 0.3 });
        }
      });

      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        valid = false;
        gsap.to(email, { borderColor: '#ff2d55', duration: 0.3 });
      }

      if (!valid) return;

      /* Success animation */
      const btn = form.querySelector('.btn, button[type="submit"]');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = '✓ Message Sent!';
        gsap.fromTo(
          btn,
          { scale: 0.95 },
          { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' }
        );
        setTimeout(() => { btn.textContent = original; }, 3000);
      }

      /* mailto fallback */
      const mailTo =
        `mailto:contact@example.com?subject=${encodeURIComponent(
          'Portfolio Contact from ' + (name ? name.value : '')
        )}&body=${encodeURIComponent(message ? message.value : '')}`;

      window.open(mailTo, '_blank');
      form.reset();
    });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  11. SECTION COLOR TRANSITIONS (Three.js)
   * ═══════════════════════════════════════════════════════════════════════════ */
  function updateSceneColors(sectionId) {
    if (!scene || !renderer) return;

    const colors = SECTION_COLORS[sectionId] || SECTION_COLORS.hero;
    const fogTarget     = new THREE.Color(colors.fog);
    const ambientTarget = new THREE.Color(colors.ambient);

    /* Animate fog */
    if (scene.fog) {
      gsap.to(scene.fog.color, {
        r: fogTarget.r,
        g: fogTarget.g,
        b: fogTarget.b,
        duration: 1.2,
        ease: 'power2.inOut',
      });
    }

    /* Animate clear color */
    const clearColor = new THREE.Color();
    renderer.getClearColor(clearColor);
    gsap.to(clearColor, {
      r: fogTarget.r,
      g: fogTarget.g,
      b: fogTarget.b,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate() { renderer.setClearColor(clearColor); },
    });

    /* Animate ambient light */
    const ambient = scene.children.find((c) => c.isAmbientLight);
    if (ambient) {
      gsap.to(ambient.color, {
        r: ambientTarget.r,
        g: ambientTarget.g,
        b: ambientTarget.b,
        duration: 1.2,
        ease: 'power2.inOut',
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  12. PERFORMANCE UTILITIES
   * ═══════════════════════════════════════════════════════════════════════════ */
  function throttle(fn, ms) {
    let last = 0;
    return function (...args) {
      const now = performance.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
   *  13. INITIALIZATION
   * ═══════════════════════════════════════════════════════════════════════════ */
  function initAll() {
    initSmoothScroll();
    initThreeScene();
    initCursor();
    initTypewriter();
    initScrollAnimations();
    initTiltEffect();
    initRippleEffect();
    initNavigation();
    initContactForm();

    /* Refresh ScrollTrigger offsets after styles and Three.js canvas size calculations settle */
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    window.addEventListener('load', () => {
      ScrollTrigger.refresh();
    });
  }

  /* Entry point */
  document.addEventListener('DOMContentLoaded', initLoader);
})();
