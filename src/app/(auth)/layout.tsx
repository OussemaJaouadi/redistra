"use client"

import * as React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Key, CirclesThree } from "@phosphor-icons/react"

// Redis-themed animated background
function RedisBackground() {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect
            setDimensions({ width, height })
            canvas.width = width
            canvas.height = height
        })

        resizeObserver.observe(canvas.parentElement as Element)
        return () => resizeObserver.disconnect()
    }, [])

    React.useEffect(() => {
        if (!dimensions.width || !dimensions.height) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId: number
        const startTime = Date.now()

        // Floating key-value pairs
        const keyValuePairs = [
            { x: 50, y: 100, key: "user:1001", speed: 0.3 },
            { x: 200, y: 50, key: "session:abc", speed: 0.5 },
            { x: 100, y: 180, key: "cache:data", speed: 0.4 },
            { x: 250, y: 150, key: "queue:jobs", speed: 0.6 },
        ]

        function animate() {
            if (!ctx) return
            ctx.clearRect(0, 0, dimensions.width, dimensions.height)
            const currentTime = (Date.now() - startTime) / 1000

            // Draw grid pattern
            ctx.strokeStyle = "rgba(239, 68, 68, 0.1)"
            ctx.lineWidth = 1
            for (let x = 0; x < dimensions.width; x += 40) {
                ctx.beginPath()
                ctx.moveTo(x, 0)
                ctx.lineTo(x, dimensions.height)
                ctx.stroke()
            }
            for (let y = 0; y < dimensions.height; y += 40) {
                ctx.beginPath()
                ctx.moveTo(0, y)
                ctx.lineTo(dimensions.width, y)
                ctx.stroke()
            }

            // Draw floating key-value pairs
            keyValuePairs.forEach((pair, i) => {
                const y = pair.y + Math.sin(currentTime * pair.speed + i) * 20

                // Key text
                ctx.fillStyle = "rgba(239, 68, 68, 0.6)"
                ctx.font = "12px monospace"
                ctx.fillText(pair.key, pair.x, y)

                // Connection line
                ctx.strokeStyle = "rgba(239, 68, 68, 0.3)"
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.moveTo(pair.x - 10, y - 5)
                ctx.lineTo(pair.x + 100, y - 5)
                ctx.stroke()

                // Pulsing dot
                const pulseSize = 3 + Math.sin(currentTime * 2 + i) * 1
                ctx.fillStyle = "rgba(239, 68, 68, 0.8)"
                ctx.beginPath()
                ctx.arc(pair.x - 15, y - 5, pulseSize, 0, Math.PI * 2)
                ctx.fill()
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        animate()
        return () => cancelAnimationFrame(animationFrameId)
    }, [dimensions])

    return (
        <div className="relative w-full h-full overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
    )
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Middleware handles redirecting authenticated users - no client-side check needed
    
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-5xl overflow-hidden rounded-2xl flex bg-card shadow-2xl border border-border"
            >
                {/* Left side - Redis Branding */}
                <div className="hidden lg:block lg:w-1/2 h-162.5 relative overflow-hidden border-r border-border">
                    <div className="absolute inset-0 bg-linear-to-br from-brick-red-950 via-brick-red-900 to-black">
                        <RedisBackground />

                        {/* Content overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-10">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                className="mb-6"
                            >
                                <Image
                                    src="/Redistra-removebg-preview.png"
                                    alt="RediStra Logo"
                                    width={200}
                                    height={60}
                                    className="h-auto w-48 object-contain"
                                    priority
                                />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                                className="text-3xl font-bold mb-3 text-center text-white"
                            >
                                Redis Management
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="text-sm text-center text-white/70 max-w-xs"
                            >
                                Self-hosted, secure, and powerful Redis management interface for teams
                            </motion.p>

                            {/* Feature badges */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9, duration: 0.5 }}
                                className="flex gap-3 mt-8"
                            >
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                                    <Key size={14} className="text-white" />
                                    <span className="text-xs text-white font-medium">Multi-User</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                                    <CirclesThree size={14} className="text-white" />
                                    <span className="text-xs text-white font-medium">Self-Hosted</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-card">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                    >
                        {children}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
