import Image from 'next/image'

interface BrandWordmarkProps {
  className?: string
  priority?: boolean
  width?: string
}

/** Dark-backed version of the full neon wordmark, sized for brand moments. */
export default function BrandWordmark({ className = '', priority = false, width = 'min(62vw, 220px)' }: BrandWordmarkProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#050617] p-2 shadow-[0_0_32px_rgba(58,80,255,0.16)] ${className}`}
      style={{ width }}
    >
      <Image
        src="/icons/Nazeer Business Neon Logo.png"
        alt="Nazeer Business"
        width={1945}
        height={808}
        sizes="(max-width: 640px) 78vw, 320px"
        priority={priority}
        className="block h-auto w-full object-contain"
      />
    </span>
  )
}
