'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MessageSquare, Sparkles, ShieldCheck, Zap } from 'lucide-react'

interface Inbox3DVisualProps {
  isRTL?: boolean
  className?: string
}

export default function Inbox3DVisual({ isRTL = false, className = '' }: Inbox3DVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGLSupported, setWebGLSupported] = useState(true)

  useEffect(() => {
    // 1. WebGL Support Test
    const canvasTest = document.createElement('canvas')
    const gl = canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl')
    if (!gl) {
      setWebGLSupported(false)
      return
    }

    const container = containerRef.current
    if (!container) return

    // 2. Accessibility: Reduced Motion Check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setWebGLSupported(false)
      return
    }

    const width = container.clientWidth || 400
    const height = container.clientHeight || 280

    // 3. Scene & Camera Setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50)
    camera.position.set(0, 0, 4.8)

    // 4. Renderer with capped DPR
    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      container.appendChild(renderer.domElement)
    } catch {
      setWebGLSupported(false)
      return
    }

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x713cff, 3, 15)
    pointLight.position.set(3, 3, 3)
    scene.add(pointLight)

    const blueLight = new THREE.PointLight(0x00d9ff, 2.5, 15)
    blueLight.position.set(-3, -2, 2)
    scene.add(blueLight)

    // 6. Geometry Objects
    // A: Central Glowing Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(0.85, 1)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x1e2748,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    scene.add(coreMesh)

    // Inner Glowing Core
    const innerGeo = new THREE.IcosahedronGeometry(0.45, 0)
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x713cff,
      wireframe: true,
    })
    const innerMesh = new THREE.Mesh(innerGeo, innerMat)
    coreMesh.add(innerMesh)

    // B: Torus Rings (Orbit)
    const ringGeo1 = new THREE.TorusGeometry(1.4, 0.015, 16, 64)
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: 0.5 })
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1)
    ring1.rotation.x = Math.PI / 3
    ring1.rotation.y = Math.PI / 6
    scene.add(ring1)

    const ringGeo2 = new THREE.TorusGeometry(1.65, 0.012, 16, 64)
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x25d366, transparent: true, opacity: 0.4 })
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2)
    ring2.rotation.x = -Math.PI / 4
    ring2.rotation.y = -Math.PI / 5
    scene.add(ring2)

    // C: Satellite Nodes
    const satelliteColors = [0x25d366, 0xe4405f, 0x00d9ff, 0x713cff, 0xff9f43]
    const satellites: THREE.Mesh[] = []
    const satGeos: THREE.BufferGeometry[] = []
    const satMats: THREE.Material[] = []
    satelliteColors.forEach((col, i) => {
      const satGeo = new THREE.SphereGeometry(0.08, 12, 12)
      const satMat = new THREE.MeshBasicMaterial({ color: col })
      satGeos.push(satGeo)
      satMats.push(satMat)
      const sat = new THREE.Mesh(satGeo, satMat)
      scene.add(sat)
      satellites.push(sat)
    })

    // D: Ambient Dust Particles
    const particleCount = 60
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 6
      particlePositions[i + 1] = (Math.random() - 0.5) * 4
      particlePositions[i + 2] = (Math.random() - 0.5) * 4
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x8a99b5,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
    })
    const particleSystem = new THREE.Points(particleGeo, particleMat)
    scene.add(particleSystem)

    // 7. Mouse Parallax
    let targetX = 0
    let targetY = 0
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      targetX = ((e.clientX - rect.left) / width - 0.5) * 0.8
      targetY = -((e.clientY - rect.top) / height - 0.5) * 0.8
    }
    window.addEventListener('mousemove', onMouseMove)

    // 8. Animation Loop
    let animId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // Rotate core
      coreMesh.rotation.x = elapsed * 0.25 + targetY * 0.3
      coreMesh.rotation.y = elapsed * 0.35 + targetX * 0.3

      // Rotate rings
      ring1.rotation.z = elapsed * 0.2
      ring2.rotation.z = -elapsed * 0.15

      // Orbit satellites
      satellites.forEach((sat, i) => {
        const angle = elapsed * 0.5 + (i * Math.PI * 2) / satellites.length
        const radius = 1.45 + (i % 2) * 0.2
        sat.position.x = Math.cos(angle) * radius
        sat.position.y = Math.sin(angle) * Math.cos(elapsed * 0.2 + i) * radius * 0.6
        sat.position.z = Math.sin(angle) * radius * 0.8
      })

      // Drift particles
      particleSystem.rotation.y = elapsed * 0.03

      if (renderer) {
        renderer.render(scene, camera)
      }
    }
    animate()

    // 9. Resize Observer
    const ro = new ResizeObserver((entries) => {
      if (!entries[0] || !renderer) return
      const cr = entries[0].contentRect
      if (cr.width === 0 || cr.height === 0) return
      camera.aspect = cr.width / cr.height
      camera.updateProjectionMatrix()
      renderer.setSize(cr.width, cr.height)
    })
    ro.observe(container)

    // 10. Clean Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      ro.disconnect()
      cancelAnimationFrame(animId)

      // Geometries
      coreGeo.dispose()
      innerGeo.dispose()
      ringGeo1.dispose()
      ringGeo2.dispose()
      particleGeo.dispose()
      satGeos.forEach(g => g.dispose())

      // Materials
      coreMat.dispose()
      innerMat.dispose()
      ringMat1.dispose()
      ringMat2.dispose()
      particleMat.dispose()
      satMats.forEach(m => m.dispose())

      if (renderer) {
        renderer.forceContextLoss?.()
        renderer.dispose()
        if (renderer.domElement && renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement)
        }
      }
    }
  }, [])

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 text-center select-none ${className}`}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full max-w-[380px] h-[220px] sm:h-[240px] pointer-events-none"
      />

      {/* Static Fallback if WebGL Disabled */}
      {!webGLSupported && (
        <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-4 shadow-lg shadow-brand/10">
          <MessageSquare size={28} />
        </div>
      )}

      {/* Content */}
      <div className="max-w-md space-y-2.5 mt-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-bold text-brand">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          <span>{isRTL ? 'محرك الذكاء الاصطناعي نشط' : 'AI Omnichannel Studio Active'}</span>
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
          {isRTL ? 'اختر محادثة لبدء المتابعة' : 'Select a conversation to begin'}
        </h3>

        <p className="text-xs sm:text-[13px] text-text-tertiary leading-relaxed">
          {isRTL
            ? 'حدد أي محادثة من القائمة لعرض السجل المباشر، إرسال الردود، أو إدارة تدخل الذكاء الاصطناعي عبر كافة القنوات.'
            : 'Choose any thread from the queue to inspect real-time history, deploy automated bot replies, or take over across WhatsApp, Instagram, Telegram & Stores.'}
        </p>

        {/* Channels indicator row */}
        <div className="pt-3 flex items-center justify-center gap-2 text-[11px] font-medium text-text-disabled flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated/70 border border-border/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
            WhatsApp
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated/70 border border-border/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E4405F]" />
            Instagram
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated/70 border border-border/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2AABEE]" />
            Telegram
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated/70 border border-border/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF]" />
            Salla
          </span>
        </div>
      </div>
    </div>
  )
}
