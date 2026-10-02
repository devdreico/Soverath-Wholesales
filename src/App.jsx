import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Background from './components/Background.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import PageTransition, { RouteFallback } from './components/PageTransition.jsx'

export default function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <Background />
      <ScrollProgress />
      <Nav />

      <main className="page" id="main-content" tabIndex={-1}>
        <PageTransition>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>

      <Footer />
    </>
  )
}
