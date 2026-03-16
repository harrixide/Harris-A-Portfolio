console.log("NEW SCRIPT RUNNING")

document.addEventListener("DOMContentLoaded", () => {
  setupSmoothScroll()
  setupProjectCardHover()
  setFooterYear()
  initLorenzAttractor()
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
    })

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0) scale(1)"
    })
  })
}

function setFooterYear() {
  const yearElement = document.getElementById("year")

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear()
  }
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

  /* Lorenz constants */

  const sigma = 10
  const rho = 28
  const beta = 8 / 3
  const dt = 0.005
  const scale = 14

  /* Two trajectories */

  let x1 = 0.1
  let y1 = 0
  let z1 = 0

  let x2 = 0.1001
  let y2 = 0
  let z2 = 0

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
    const ry = px * sin + py * cos

    return {
      x: width / 2 + rx * scale,
      y: height / 2 + pz * scale
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

  const state1 = { x: x1, y: y1, z: z1 }
  const state2 = { x: x2, y: y2, z: z2 }

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
