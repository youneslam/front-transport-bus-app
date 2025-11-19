export default function FeaturesSection() {
  const features = [
    {
      title: "Real-time Tracking",
      description: "Track your bus location in real-time with live GPS updates",
      icon: "📍",
      gradient: "from-primary/20 to-transparent",
    },
    {
      title: "Easy Booking",
      description: "Book tickets in seconds with our intuitive booking system",
      icon: "🎫",
      gradient: "from-accent/20 to-transparent",
    },
    {
      title: "Flexible Plans",
      description: "Choose from daily, weekly, or monthly subscriptions",
      icon: "📅",
      gradient: "from-primary/20 to-accent/20",
    },
    {
      title: "Notifications",
      description: "Get alerts for departures, arrivals, and delays",
      icon: "🔔",
      gradient: "from-accent/20 to-primary/20",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-card/20 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold gradient-text mb-4">Why Choose UrbanGo?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the future of urban transportation with our premium features
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-premium rounded-xl p-6 border border-border/30 hover:border-primary/60 group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
              ></div>
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
