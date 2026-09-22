import Background from './components/Background.jsx'
import Header from './components/Header.jsx'
import StoreCard from './components/StoreCard.jsx'
import Footer from './components/Footer.jsx'
import { stores } from './data/stores.jsx'

export default function App() {
  return (
    <>
      <Background />

      <main className="page">
        <Header />

        <section className="stores" aria-label="Tiendas afiliadas">
          <div className="stores__grid">
            {stores.map((store, index) => (
              <StoreCard key={store.id} store={store} index={index} />
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
