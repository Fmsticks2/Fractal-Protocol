import LandingHeader from './components/LandingHeader'
import HeroSection from './components/HeroSection'
import FeaturesSection from './components/FeaturesSection'
import HowItWorksSection from './components/HowItWorksSection'
import LandingFooter from './components/LandingFooter'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>

      <LandingFooter />
    </div>
  )
}

export default App
