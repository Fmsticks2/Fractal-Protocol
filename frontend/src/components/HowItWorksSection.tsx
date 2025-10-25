import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Create Market",
      description: "Define your prediction market with event details, possible outcomes, and resolution criteria. Each market gets its own microchain for optimal performance.",
      icon: "mdi:target",
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: "02", 
      title: "Place Predictions",
      description: "Users stake tokens on outcomes with instant finality. Smart contracts automatically calculate odds and manage liquidity pools in real-time.",
      icon: "mdi:trending-up",
      color: "from-purple-500 to-pink-500"
    },
    {
      number: "03",
      title: "Market Resolution",
      description: "When events conclude, oracles or admins resolve markets. Winners receive payouts while the system prepares for conditional spawning.",
      icon: "mdi:check-circle",
      color: "from-green-500 to-emerald-500"
    },
    {
      number: "04",
      title: "Dynamic Spawning",
      description: "Resolved outcomes trigger cross-chain messages that automatically create new conditional sub-markets, forming an evolving prediction tree.",
      icon: "mdi:lightning-bolt",
      color: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '<100ms', label: 'Response Time' },
    { value: '24/7', label: 'Support Available' },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 text-sm font-medium mb-6"
          >
            <Icon icon="mdi:cog" className="w-4 h-4 mr-2" />
            How It Works
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-white">
              How Fractal Markets
            </span>
            <br />
            <span className="text-white">
              Work
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From market creation to dynamic spawning - discover how our prediction markets evolve
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500/20 via-secondary-500/40 to-primary-500/20 transform -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.2
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className="relative group"
              >
                {/* Step Card */}
                <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 text-center hover:bg-card/80 hover:border-primary-500/30 transition-all duration-300">
                  {/* Step Number */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.2 + 0.3,
                      type: "spring",
                      stiffness: 200
                    }}
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                  >
                    {step.number}
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-primary-500/25 transition-all duration-300"
                  >
                    <Icon icon={step.icon} className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary-400 transition-colors duration-300">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Hover Effect */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 rounded-2xl border-2 border-primary-500/20 pointer-events-none"
                  />
                </div>

                {/* Arrow for larger screens */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
                    className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10"
                  >
                    <div className="w-4 h-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center bg-card/30 backdrop-blur-sm border border-border rounded-2xl p-6 hover:bg-card/50 transition-all duration-300"
            >
              <div className="text-3xl font-bold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300"
          >
            Start Building Today
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;