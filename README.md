# 🪞 Fractal Protocol

### *Evolving Prediction Markets for a Dynamic World*

Fractal Protocol is an AI-enhanced **prediction market platform** where each event dynamically spawns new, conditional sub-markets based on its outcome — forming an evolving, tree-like network of interrelated predictions.

The system leverages **Linera's microchain architecture** to achieve linear scalability, instant finality, and cross-chain message propagation — allowing markets to evolve in real time as events unfold.

## 🎯 Key Features

- **Dynamic Market Creation**: Create prediction markets with automatic sub-market spawning
- **Cross-Chain Messaging**: Seamless communication between markets using Linera's stack
- **AI Integration**: AI agents act as Market Architects and Liquidity Providers
- **Interactive Visualization**: Beautiful tree-like visualization of market relationships
- **Instant Finality**: Fast, low-cost transactions with predictable outcomes

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓
Smart Contracts (Linera Microchains)
    ├── Market Contract
    ├── Factory Contract
    └── Spawn Handler
    ↓
Backend Services
    ├── AI Agent Layer
    └── Oracle System
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Linera CLI
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fractal-protocol

# Install dependencies
npm install

# Build smart contracts
cd contracts
cargo build --release

# Start development server
cd ../frontend
npm run dev
```

## 📁 Project Structure

```
fractal-protocol/
├── contracts/           # Linera smart contracts
│   ├── market/         # Core market contract
│   ├── factory/        # Market factory contract
│   └── spawn-handler/  # Cross-chain spawn handler
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API and blockchain services
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
├── backend/            # Optional backend services
│   ├── ai-agent/       # AI market architect
│   └── oracle/         # Oracle service
└── docs/               # Documentation
```

## 🧪 Development Waves

- **Wave 1**: Foundation - Single market prototype ✅
- **Wave 2**: Spawning Mechanism - Dynamic sub-market creation 🚧
- **Wave 3**: Functional Product - Multi-market demo
- **Wave 4**: Polished Experience - Graph visualization
- **Wave 5**: Intelligent Platform - AI agent integration
- **Wave 6**: Scalable Ecosystem - Mainnet readiness

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](./docs/)
- [Linera Documentation](https://linera.dev/)
- [Project Roadmap](./docs/roadmap.md)