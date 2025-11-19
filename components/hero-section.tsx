"use client"

import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  onGetStarted: () => void
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-40 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight gradient-text">
              Your City, Your Journey, Your Way
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Book tickets, track buses in real-time, and manage your commute with UrbanGo. Fast, reliable, and always
              on time.
            </p>
            <div className="flex gap-4 pt-4">
              <Button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-6 text-lg border-0 glow-primary"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                className="px-8 py-6 text-lg border-primary/40 text-accent hover:bg-accent/10 hover:border-accent/60 transition-all bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative h-96 card-premium rounded-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>
            <div className="relative text-center">
              <div className="text-8xl mb-4" style={{ animation: "float 2s infinite" }}>
                🚌
              </div>
              <p className="text-muted-foreground text-lg">Real-time Bus Tracking</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const float = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`
