import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import CinematicLanding from '../components/landing/CinematicLanding'

export default function Home() {
  return (
    <main style={{ background: 'var(--background)' }}>
      <Navbar />
      <CinematicLanding />
      <Footer />
    </main>
  )
}
