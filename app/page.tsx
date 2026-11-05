import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import CinematicLanding from '../components/landing/CinematicLanding'
import SmoothScroll from '../components/ui/SmoothScroll'

export default function Home() {
  return (
    <SmoothScroll>
      <main style={{ background: 'var(--background)' }}>
        <Navbar />
        <CinematicLanding />
        <Footer />
      </main>
    </SmoothScroll>
  )
}
