import { notFound } from 'next/navigation'
import InfoPage from '../../components/landing/InfoPage'

const PUBLIC_INFO_PAGES = ['integrations', 'security', 'about', 'careers', 'contact', 'help-center', 'docs', 'status']

export function generateStaticParams() {
  return PUBLIC_INFO_PAGES.map((slug) => ({ slug }))
}

export default async function PublicInfoRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!PUBLIC_INFO_PAGES.includes(slug)) notFound()
  return <InfoPage slug={slug} />
}
