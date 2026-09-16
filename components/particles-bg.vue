<template>
  <canvas
    ref="canvasRef"
    class="particles-bg"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  color: string
}

const props = withDefaults(defineProps<{
  count?: number
  color?: string
  speed?: number
}>(), {
  count: 80,
  color: '#6366f1',
  speed: 0.5,
})

const canvasRef = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let animationId: number
let mouseX = 0
let mouseY = 0

const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#3b82f6', '#06b6d4']

function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function createParticle(): Particle {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0, vx: 0, vy: 0, radius: 0, opacity: 0, color: '' }
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * props.speed,
    vy: (Math.random() - 0.5) * props.speed,
    radius: Math.random() * 2 + 1,
    opacity: Math.random() * 0.5 + 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}

function initParticles() {
  const canvas = canvasRef.value
  if (!canvas) return
  particles = Array.from({ length: props.count }, createParticle)
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw particles
  particles.forEach((p) => {
    // Mouse repulsion
    const dx = p.x - mouseX
    const dy = p.y - mouseY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 120) {
      const force = (120 - dist) / 120
      p.vx += (dx / dist) * force * 0.3
      p.vy += (dy / dist) * force * 0.3
    }

    // Apply velocity
    p.x += p.vx
    p.y += p.vy

    // Damping
    p.vx *= 0.98
    p.vy *= 0.98

    // Boundary wrap
    if (p.x < 0) p.x = canvas.width
    if (p.x > canvas.width) p.x = 0
    if (p.y < 0) p.y = canvas.height
    if (p.y > canvas.height) p.y = 0

    // Draw
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.globalAlpha = p.opacity
    ctx.fill()
    ctx.globalAlpha = 1
  })

  // Draw connections
  particles.forEach((p1, i) => {
    particles.slice(i + 1).forEach((p2) => {
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 150) {
        ctx.beginPath()
        ctx.moveTo(p1.x, p1.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.strokeStyle = p1.color
        ctx.globalAlpha = (1 - dist / 150) * 0.15
        ctx.lineWidth = 0.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    })
  })

  animationId = requestAnimationFrame(draw)
}

function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX
  mouseY = e.clientY
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  resize()
  initParticles()
  draw()
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<style scoped>
.particles-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>
