import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

const FeaturesSection = () => {
  const features = [
    {
      title: "Dynamic Market Creation",
      description: "Create prediction markets that automatically spawn conditional sub-markets based on outcomes, forming an evolving tree of interconnected predictions.",
      icon: "mdi:chart-tree",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Cross-Chain Messaging",
      description: "Seamless communication between markets using Linera's microchain architecture for instant finality and linear scalability.",
      icon: "mdi:link-variant",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "AI Market Architects",
      description: "AI agents analyze real-world data to suggest new markets and provide intelligent liquidity management for optimal market health.",
      icon: "mdi:robot-outline",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Interactive Visualization",
      description: "Beautiful tree-like visualization of market relationships, allowing users to explore the fractal nature of interconnected predictions.",
      icon: "mdi:graph-outline",
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Instant Finality",
      description: "Fast, low-cost transactions with predictable outcomes powered by Linera's microchain technology for superior user experience.",
      icon: "mdi:lightning-bolt",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      title: "Scalable Architecture",
      description: "Each market runs on its own microchain, enabling linear scalability and handling thousands of concurrent prediction markets.",
      icon: "mdi:server-network",
      gradient: "from-teal-500 to-green-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
          duration: 0.6,
        },
    },
  };

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6"
          >
            <Icon icon="mdi:layers" className="w-4 h-4 mr-2" />
            Platform Features
          </motion.div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-white">
              Evolving Prediction
            </span>
            <br />
            <span className="text-white">
              Markets
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Experience the future of prediction markets with dynamic spawning, AI integration, and Linera's microchain architecture.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
              className="group relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 hover:bg-card/80 hover:border-primary-500/30 transition-all duration-300"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
              
              {/* Icon */}
              <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-primary-500/25 transition-all duration-300`}
                >
                  <Icon icon={feature.icon} className="w-8 h-8 text-white" />
                </motion.div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary-400 transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect Border */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 rounded-2xl border-2 border-primary-500/20 pointer-events-none"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition-all duration-300"
          >
            Explore All Features
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;