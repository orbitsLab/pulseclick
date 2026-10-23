export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

export const SPRING_PRESS = {
  type: "spring",
  stiffness: 450,
  damping: 28,
} as const

export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 380,
  damping: 32,
} as const

export const SPRING_GENTLE = {
  type: "spring",
  stiffness: 260,
  damping: 24,
} as const
