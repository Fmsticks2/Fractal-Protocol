import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const HeroSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 60, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [-8, 8, -8],
      rotate: [0, 2, 0, -2, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const cardVariants = {
    animate: {
      y: [-15, 15, -15],
      x: [-5, 5, -5],
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Professional Background with Mesh Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/50 to-purple-950/30">
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-purple-900/20"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        {/* Animated Geometric Elements */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"
        />
        
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 270, 180, 90, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 rounded-full blur-3xl"
        />

        {/* Floating Geometric Shapes */}
        <motion.div
          variants={cardVariants}
          animate="animate"
          className="absolute top-1/4 left-1/6 w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-sm opacity-60"
        />
        <motion.div
          variants={cardVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
          className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-40"
        />
        <motion.div
          variants={cardVariants}
          animate="animate"
          style={{ animationDelay: '4s' }}
          className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-50"
        />
      </div>

      {/* Floating Cards */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-32 left-8 lg:left-32 z-10"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:trending-up" className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">$2.5M+</div>
              <div className="text-white/60 text-sm">Total Volume</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '3s' }}
        className="absolute top-48 right-8 lg:right-32 z-10"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:shield-check" className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">99.9%</div>
              <div className="text-white/60 text-sm">Accuracy</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '6s' }}
        className="absolute bottom-32 left-8 lg:left-48 z-10"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
              <Icon icon="mdi:account-group" className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">10K+</div>
              <div className="text-white/60 text-sm">Traders</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Premium Badge */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 shadow-2xl">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-white/90 tracking-wide">
                Next-Generation Prediction Markets
              </span>
              <Icon icon="mdi:sparkles" className="w-4 h-4 text-yellow-400" />
            </div>
          </motion.div>

          {/* Hero Title with Premium Typography */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight">
              <span className="block bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                Fractal
              </span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Protocol
              </span>
            </h1>
            
            <div className="flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </motion.div>

          {/* Premium Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed font-light tracking-wide"
          >
            AI-enhanced prediction markets that evolve in real-time. Create markets that dynamically spawn conditional sub-markets, forming an interconnected tree of predictions.
          </motion.p>

          {/* Premium CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <span className="text-lg">Create Market</span>
                <Icon icon="mdi:arrow-right" className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group px-10 py-5 bg-white/10 backdrop-blur-xl border-2 border-white/20 hover:border-white/40 text-white hover:bg-white/20 font-semibold rounded-2xl transition-all duration-300 shadow-xl"
            >
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:compass-outline" className="w-5 h-5" />
                <span className="text-lg">Explore Markets</span>
              </div>
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="pt-16 flex flex-wrap justify-center items-center gap-8 opacity-60"
          >
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:shield-check" className="w-5 h-5 text-green-400" />
              <span className="text-white/80 text-sm">Audited Smart Contracts</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:lightning-bolt" className="w-5 h-5 text-yellow-400" />
              <span className="text-white/80 text-sm">Instant Settlement</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:lock" className="w-5 h-5 text-blue-400" />
              <span className="text-white/80 text-sm">Decentralized</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Premium Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center space-y-2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center backdrop-blur-sm">
            <motion.div
              animate={{ y: [2, 14, 2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-3 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mt-2"
            />
          </div>
          <span className="text-white/50 text-xs tracking-wider">SCROLL</span>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;