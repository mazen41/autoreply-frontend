import Image from 'next/image'

interface BrandWordmarkProps {
  className?: string
  priority?: boolean
  width?: string
}

/** Dark-backed version of the full neon wordmark, sized for brand moments. */
export default function BrandWordmark({ className = '', priority = false, width = 'min(32vw, 75px)' }: BrandWordmarkProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center overflow-hidden ${className}`}
      style={{ width }}
    >
      <Image
        src="/icons/Nazeer Business Neon Logo.png"
        alt="Nazeer Business"
        width={1945}
        height={808}
        sizes="(max-width: 640px) 32vw, 75px"
        priority={priority}
        className="block h-auto w-full object-contain"
      />
    </span>
  )
}
