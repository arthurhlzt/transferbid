const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23161b22'/%3E%3Ctext x='50%25' y='50%25' fill='%238a97a6' font-family='sans-serif' font-size='13' text-anchor='middle' dy='.3em'%3EFoto indispon%C3%ADvel%3C/text%3E%3C/svg%3E"

// <img> que troca por um placeholder quando a URL da foto está quebrada.
export function ImgComFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      loading="lazy"
      {...props}
      onError={(e) => {
        const alvo = e.currentTarget
        if (alvo.src !== PLACEHOLDER) alvo.src = PLACEHOLDER
      }}
    />
  )
}
