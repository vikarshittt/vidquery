import type { Variants } from 'framer-motion'

/** Fade in while sliding up. Pass `custom={i}` for stagger delay. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
}

/** Simple opacity fade-in. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } },
}

/** Scale up from 80% while fading in. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
}

/** Card hover lift effect — use with `initial="rest" whileHover="hover"`. */
export const hoverLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -10, scale: 1.02, transition: { duration: 0.3, ease: 'easeOut' } },
}

/** Button hover/tap effect — use with `initial="rest" whileHover="hover" whileTap="tap"`. */
export const buttonHover: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2, ease: 'easeOut' } },
  tap: { scale: 0.95 },
}
