interface IconProps { size?: number; filled?: boolean }

function Svg({ size = 18, filled = false, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconTrash = (p: IconProps) => (
  <Svg {...p}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></Svg>
)
export const IconStar = (p: IconProps) => (
  <Svg {...p}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></Svg>
)
export const IconCheck = (p: IconProps) => (
  <Svg {...p}><path d="M5 12l5 5L20 7" /></Svg>
)
export const IconX = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
)
