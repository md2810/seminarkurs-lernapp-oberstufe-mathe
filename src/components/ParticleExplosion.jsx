import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const ParticleExplosion = ({ trigger, onComplete }) => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (trigger) {
      // Create 50 particles with random properties
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
        scale: Math.random() * 2 + 0.5,
        rotation: Math.random() * 360,
        color: ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#fef3c7'][Math.floor(Math.random() * 5)],
        emoji: ['✨', '⭐', '💫', '🎉', '🎊', '💥', '🌟', '✨', '💎', '🏆'][Math.floor(Math.random() * 10)]
      }))
      setParticles(newParticles)

      // Clear particles after animation
      setTimeout(() => {
        setParticles([])
        if (onComplete) onComplete()
      }, 2000)
    }
  }, [trigger, onComplete])

  if (particles.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          style={{
            position: 'absolute',
            fontSize: '24px',
            color: particle.color
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 1,
            rotateZ: 0
          }}
          animate={{
            x: particle.x * 5,
            y: particle.y * 5,
            scale: [0, particle.scale, 0],
            opacity: [1, 1, 0],
            rotateZ: [0, particle.rotation * 3, particle.rotation * 6]
          }}
          transition={{
            duration: 2,
            ease: [0.34, 1.56, 0.64, 1],
            times: [0, 0.5, 1]
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}
    </div>
  )
}

export default ParticleExplosion
