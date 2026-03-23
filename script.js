console.log("NEW SCRIPT10 RUNNING")

document.addEventListener("DOMContentLoaded", () => {
  setupSmoothScroll()
  setupProjectCardHover()
  setFooterYear()
  initLorenzAttractor()
  setupDemoButtons()
  setupImageFallbacks()
})

function setupSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]')

  navLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault()

      const targetId = link.getAttribute("href")
      const target = document.querySelector(targetId)

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        })
      }
    })
  })
}

function setupProjectCardHover() {
  const cards = document.querySelectorAll(".project-card")

  cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-6px) scale(1.02)"
      card.style.boxShadow = "0 18px 40px rgba(0,0,0,0.28)"
    })

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0) scale(1)"
      card.style.boxShadow = "none"
    })
  })
}

function setFooterYear() {
  const yearElement = document.getElementById("year")

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear()
  }
}

function setupDemoButtons() {
  const buttons = document.querySelectorAll(".demo-btn")
  const demoSection = document.getElementById("demo-section")
  const demoTitle = document.getElementById("demo-title")
  const demoFrame = document.getElementById("demo-frame")

  if (!buttons.length || !demoSection || !demoTitle || !demoFrame) return

  let activeButton = null

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const title = button.dataset.demoTitle || "Project Demo"
      const src = button.dataset.demoSrc || ""
      const isOpen = demoSection.classList.contains("active")
      const isSameButton = activeButton === button

      if (isOpen && isSameButton) {
        demoSection.classList.remove("active")
        demoFrame.src = ""
        button.textContent = "View Demo"
        activeButton = null
        return
      }

      buttons.forEach(btn => {
        btn.textContent = "View Demo"
      })

      demoTitle.textContent = title
      demoFrame.src = src
      demoSection.classList.add("active")
      button.textContent = "Hide Demo"
      activeButton = button

      setTimeout(() => {
        demoSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        })
      }, 220)
    })
  })
}

function setupImageFallbacks() {
  const projectImages = document.querySelectorAll(".project-image")

  projectImages.forEach(image => {
    image.addEventListener("error", () => {
      const frame = image.closest(".project-image-frame")
      if (!frame) return

      frame.classList.add("missing-image")
      image.style.display = "none"

      if (!frame.querySelector(".missing-image-label")) {
        const label = document.createElement("div")
        label.className = "missing-image-label"
        label.textContent = "Drop image1.png into this project folder"
        frame.appendChild(label)
      }
    })
  })
}

function initLorenzAttractor() {
  const canvas = document.getElementById("chaos-bg")
  if (!canvas) return

  const ctx = canvas.getContext("2d")

  let width
  let height
  let dpr = Math.min(window.devicePixelRatio || 1, 2)

  function resize() {
    const hero = document.getElementById("hero")

    width = hero.offsetWidth
    height = hero.offsetHeight

    canvas.width = width * dpr
    canvas.height = height * dpr

    canvas.style.width = width + "px"
    canvas.style.height = height + "px"

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  resize()
  window.addEventListener("resize", resize)

  const sigma = 10
  const rho = 28
  const beta = 8 / 3
  const dt = 0.005
  const scale = 14

  const state1 = { x: 0.1, y: 0, z: 0 }
  const state2 = { x: 0.1001, y: 0, z: 0 }

  let angle = 0

  function stepLorenz(state) {
    const dx = sigma * (state.y - state.x)
    const dy = state.x * (rho - state.z) - state.y
    const dz = state.x * state.y - beta * state.z

    state.x += dx * dt
    state.y += dy * dt
    state.z += dz * dt
  }

  function project(px, py, pz) {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const rx = px * cos - py * sin
    const rz = px * sin + py * cos

    return {
      x: width / 2 + rx * scale,
      y: height / 2 - 55 + pz * scale * 0.95 + rz * 0.12
    }
  }

  function drawPoint(px, py, color) {
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 6)

    glow.addColorStop(0, color)
    glow.addColorStop(1, "rgba(0,0,0,0)")

    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  function animate() {
    angle += 0.001

    ctx.fillStyle = "rgba(11,15,20,0.08)"
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < 12; i++) {
      stepLorenz(state1)
      stepLorenz(state2)

      const p1 = project(state1.x, state1.y, state1.z)
      const p2 = project(state2.x, state2.y, state2.z)

      drawPoint(p1.x, p1.y, "rgba(120,180,255,0.9)")
      drawPoint(p2.x, p2.y, "rgba(255,120,200,0.9)")
    }

    requestAnimationFrame(animate)
  }

  animate()
}