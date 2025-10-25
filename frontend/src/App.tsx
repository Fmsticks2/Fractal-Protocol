import { Routes, Route } from 'react-router-dom'
import LandingHeader from './components/LandingHeader'
import HeroSection from './components/HeroSection'
import FeaturesSection from './components/FeaturesSection'
import HowItWorksSection from './components/HowItWorksSection'
import LandingFooter from './components/LandingFooter'
import './App.css'
import CreateMarket from './pages/CreateMarket'
import ExploreMarkets from './pages/ExploreMarkets'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <FeaturesSection />
                <HowItWorksSection />
              </>
            }
          />
          <Route path="/create" element={<CreateMarket />} />
          <Route path="/explore" element={<ExploreMarkets />} />
        </Routes>
      </main>

      <LandingFooter />
    </div>
  )
}

export default App
