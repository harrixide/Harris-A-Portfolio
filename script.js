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

    width = window.innerWidth
    height = window.innerHeight

    canvas.width = width * dpr
    canvas.height = height * dpr

    canvas.style.width = width + "px"
    canvas.style.height = height + "px"

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  }

  resize()
  window.addEventListener("resize", resize)

  let x = 0.1
  let y = 0
  let z = 0

  const sigma = 10
  const rho = 28
  const beta = 8 / 3
  const dt = 0.005

  const scale = 14

  let angle = 0

  function stepLorenz() {

    const dx = sigma * (y - x)
    const dy = x * (rho - z) - y
    const dz = x * y - beta * z

    x += dx * dt
    y += dy * dt
    z += dz * dt

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

  function drawPoint(px, py) {

    const glow = ctx.createRadialGradient(px, py, 0, px, py, 6)

    glow.addColorStop(0, "rgba(143,211,255,0.9)")
    glow.addColorStop(1, "rgba(99,164,255,0)")

    ctx.fillStyle = glow

    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()

  }

  function animate() {

    angle += 0.001

    ctx.fillStyle = "rgba(11,15,20,0.08)"
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < 6; i++) {

      stepLorenz()

      const p = project(x, y, z)

      drawPoint(p.x, p.y)

    }

    requestAnimationFrame(animate)

  }

  animate()

}
