import { motion } from 'framer-motion'
import { clsx } from 'clsx'

/**
 * GlassPanel - Reusable glassmorphism panel component
 *
 * The core visual building block for the "Unified Dark Glass" design system.
 * Uses backdrop-filter for blur effects and translucent backgrounds.
 */
export function GlassPanel({
  children,
  className,
  variant = 'default', // 'default' | 'active' | 'inactive' | 'accent'
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  rounded = 'lg', // 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  border = true,
  glow = false,
  as = 'div',
  animate = true,
  ...props
}) {
  const Component = animate ? motion[as] || motion.div : as

  const variantStyles = {
    default: 'bg-white/[0.08] border-white/[0.12]',
    active: 'bg-white/[0.12] border-white/[0.20]',
    inactive: 'bg-black/40 border-white/[0.05]',
    accent: 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-400/30'
  }

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  }

  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full'
  }

  const baseStyles = clsx(
    'backdrop-blur-xl',
    border && 'border',
    variantStyles[variant],
    paddingStyles[padding],
    roundedStyles[rounded],
    glow && 'shadow-lg shadow-cyan-500/10',
    className
  )

  const animationProps = animate ? {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  } : {}

  return (
    <Component className={baseStyles} {...animationProps} {...props}>
      {children}
    </Component>
  )
}

export default GlassPanel
