import Image from 'next/image'

export default function BrandLoading({ label = 'Loading NazBiz' }: { label?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-6" role="status" aria-label={label}>
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-brand/20 bg-surface-elevated shadow-lg shadow-brand/10">
          <Image src="/icons/logo_icon.png" alt="NazBiz" width={34} height={34} priority className="h-9 w-9 object-contain" />
          <span className="absolute -inset-1 animate-ping rounded-[1.15rem] border border-brand/20" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      </div>
    </main>
  )
}
