document.addEventListener("DOMContentLoaded", () => {
  setupSmoothScroll();
  setupProjectCardHover();
  setFooterYear();
  initChaosNameAnimation();
});

function setupSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setupProjectCardHover() {
  const cards = document.querySelectorAll(".project-card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-6px) scale(1.01)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0) scale(1)";
    });
  });
}

function setFooterYear() {
  const yearElement = document.getElementById("year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();
}

function initChaosNameAnimation() {
  const canvas = document.getElementById("chaos-bg");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const particles = [];
  const textPoints = [];
  const particleCount = 850;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let frame = 0;
  let mode = "attractor";
  let morphStart = 0;
  const attractorDuration = 180;

  const lorenz = {
    sigma: 10,
    rho: 28,
    beta: 8 / 3,
    dt: 0.006,
    x: 0.1,
    y: 0,
    z: 0,
    scale: 12
  };

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTextPoints();
  }

  function stepLorenz() {
    const dx = lorenz.sigma * (lorenz.y - lorenz.x);
    const dy = lorenz.x * (lorenz.rho - lorenz.z) - lorenz.y;
    const dz = lorenz.x * lorenz.y - lorenz.beta * lorenz.z;
    lorenz.x += dx * lorenz.dt;
    lorenz.y += dy * lorenz.dt;
    lorenz.z += dz * lorenz.dt;

    return {
      x: width / 2 + lorenz.x * lorenz.scale,
      y: height / 2 + lorenz.z * lorenz.scale * 0.95
    };
  }

  function buildTextPoints() {
    textPoints.length = 0;
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.max(500, Math.floor(width));
    offscreen.height = Math.max(240, Math.floor(height * 0.4));
    const octx = offscreen.getContext("2d");

    const fontSize = Math.max(64, Math.min(180, width * 0.18));
    octx.fillStyle = "#ffffff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.font = `700 ${fontSize}px Inter, sans-serif`;
    octx.fillText("HARRIS", offscreen.width / 2, offscreen.height / 2);

    const data = octx.getImageData(0, 0, offscreen.width, offscreen.height).data;
    const spacing = Math.max(3, Math.floor(width / 360));

    for (let y = 0; y < offscreen.height; y += spacing) {
      for (let x = 0; x < offscreen.width; x += spacing) {
        const idx = (y * offscreen.width + x) * 4 + 3;
        if (data[idx] > 120) {
          textPoints.push({
            x: x + (width - offscreen.width) / 2,
            y: y + height * 0.16
          });
        }
      }
    }
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < particleCount; i += 1) {
      const p = stepLorenz();
      particles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        size: Math.random() * 1.5 + 0.45,
        tx: p.x,
        ty: p.y,
        seed: Math.random() * Math.PI * 2
      });
    }
  }

  function assignTextTargets() {
    if (!textPoints.length) return;
    const stride = Math.max(1, Math.floor(textPoints.length / particleCount));
    particles.forEach((particle, index) => {
      const point = textPoints[(index * stride) % textPoints.length];
      particle.tx = point.x;
      particle.ty = point.y;
    });
  }

  function drawParticle(particle, alpha = 1) {
    const glow = 8 + particle.size * 3;
    const gradient = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      glow
    );
    gradient.addColorStop(0, `rgba(143, 211, 255, ${0.9 * alpha})`);
    gradient.addColorStop(1, `rgba(99, 164, 255, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, glow, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateAttractor() {
    particles.forEach((particle) => {
      const p = stepLorenz();
      particle.x += (p.x - particle.x) * 0.1;
      particle.y += (p.y - particle.y) * 0.1;
      drawParticle(particle, 0.82);
    });
  }

  function updateMorph() {
    const progress = Math.min(1, (frame - morphStart) / 150);
    const ease = 1 - Math.pow(1 - progress, 3);

    particles.forEach((particle) => {
      particle.x += (particle.tx - particle.x) * (0.06 + ease * 0.05);
      particle.y += (particle.ty - particle.y) * (0.06 + ease * 0.05);
      drawParticle(particle, 0.95);
    });

    if (progress >= 1) mode = "name";
  }

  function updateName() {
    particles.forEach((particle, index) => {
      const drift = Math.sin(frame * 0.02 + particle.seed + index * 0.002) * 0.45;
      particle.x += (particle.tx + drift - particle.x) * 0.055;
      particle.y += (particle.ty + drift * 0.5 - particle.y) * 0.055;
      drawParticle(particle, 0.96);
    });
  }

  function animate() {
    frame += 1;
    ctx.clearRect(0, 0, width, height);

    if (mode === "attractor") {
      updateAttractor();
      if (frame > attractorDuration) {
        assignTextTargets();
        mode = "morph";
        morphStart = frame;
      }
    } else if (mode === "morph") {
      updateMorph();
    } else {
      updateName();
    }

    requestAnimationFrame(animate);
  }

  resizeCanvas();
  initParticles();
  window.addEventListener("resize", () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    resizeCanvas();
    assignTextTargets();
  });

  animate();
}
