# UniKYC Social Graph

A decentralized social network built on the Ethereum Follow Protocol (EFP) that enables trust-based interactions within the UniKYC ecosystem. This MiniKit application serves as the social interface for the main KYC registry protocol, allowing users to discover, follow, and vouch for verified identities.

## 🌟 What is UniKYC Social Graph?

UniKYC Social Graph is a **Base MiniKit application** that creates a social layer on top of the main KYC registry protocol. While the core KYC system handles one-time identity verification and stores records on blockchain using ENS and Filecoin, this social graph enables users to:

- **Discover verified users** in the KYC network
- **Follow and connect** with trusted identities
- **Vouch for others** through on-chain attestations
- **Build reputation** through social proof and trust relationships

## 🔗 How It Works

### Core KYC Registry Integration
The main UniKYC protocol performs one-time KYC verification and stores identity records on:
- **ENS (Ethereum Name Service)** - For human-readable identity names
- **Filecoin** - For decentralized document storage
- **Blockchain** - For immutable verification records

### Social Graph Layer
This MiniKit app adds a social dimension by:
- **Fetching verified identities** from the KYC registry
- **Displaying user profiles** with ENS names and verification status
- **Enabling social interactions** through the Ethereum Follow Protocol
- **Creating trust attestations** using Ethereum Attestation Service (EAS)

## 🚀 Key Features

### 👥 Profile Discovery
- Search users by ENS name or wallet address
- View verification status and trust levels
- See follower counts and social connections
- Browse verified users in the network

### 🤝 Social Interactions
- **Follow System**: Follow users you trust using EFP standards
- **Social Vouching**: Create on-chain attestations vouching for others
- **Trust Levels**: Visual indicators of verification and trust status
- **Activity Tracking**: See when users were last active

### 🔐 Trust & Verification
- **KYC Status**: Clear indicators of verification levels
- **Confidence Scoring**: Rate your trust in other users (1-10 scale)
- **Attestation Notes**: Add context to your vouches
- **On-chain Storage**: All trust relationships stored permanently

### 📱 Mobile-First Design
- Responsive design that works on all devices
- Touch-friendly interface for mobile interactions
- Smooth animations and loading states
- Dark theme optimized for Web3 aesthetics

## 🛠 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type-safe development
- **Framer Motion** - Smooth animations

### Web3 Integration
- **Wagmi** - Ethereum wallet connection
- **Ethereum Identity Kit** - Follow Protocol components
- **OnchainKit** - Base ecosystem integration
- **MiniKit** - Base MiniKit framework

### Blockchain & Storage
- **ENS** - Human-readable names
- **Filecoin** - Decentralized storage
- **EAS** - Attestation storage
- **Base** - L2 blockchain for transactions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A Base-compatible wallet (MetaMask, Coinbase Wallet, etc.)
- ENS name (optional, can be registered through the app)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd ethkyc/frontend
pnpm install
```

2. **Set up environment variables:**
```bash
# Copy the example file
cp .env.example .env.local

# Add your configuration
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME="UniKYC Social Graph"
NEXT_PUBLIC_URL="https://your-domain.com"
NEXT_PUBLIC_ICON_URL="https://your-domain.com/icon.png"
NEXT_PUBLIC_ONCHAINKIT_API_KEY="your-api-key"
```

3. **Start the development server:**
```bash
pnpm dev
```

4. **Open your browser:**
Navigate to `http://localhost:3000`

## 🎯 How to Use

### For New Users
1. **Connect your wallet** using the wallet button
2. **Register an ENS name** if you don't have one (e.g., `yourname.kycgraph.eth`)
3. **Complete KYC verification** through the main UniKYC protocol
4. **Start exploring** the social graph and connecting with others

### For Verified Users
1. **Browse profiles** in the social graph
2. **Follow users** you know and trust
3. **Vouch for others** by creating trust attestations
4. **Build your reputation** through social interactions

### Social Features
- **Search**: Find users by ENS name or address
- **Follow**: Build your social network
- **Vouch**: Create trust attestations for others
- **Discover**: Explore verified users and their connections

## 🔧 Architecture

### Component Structure
```
components/
├── social/
│   ├── ProfileCard.tsx      # User profile display
│   └── CompactProfileCard.tsx # List view profiles
├── kyc/
│   └── VouchModal.tsx       # Trust attestation creation
└── ui/                       # Reusable UI components

hooks/
└── useSocialGraph.ts         # Social graph state management

app/
├── page.tsx                  # Main landing page
├── social/
│   └── page.tsx             # Social graph interface
└── providers.tsx            # Web3 providers setup
```

### Data Flow
1. **KYC Registry** → Stores verified identities on blockchain
2. **Social Graph** → Fetches and displays user profiles
3. **EFP Protocol** → Handles follow/unfollow relationships
4. **EAS Attestations** → Stores trust vouches on-chain

## 🌐 Integration with Main KYC Protocol

This social graph is designed to work seamlessly with the main UniKYC protocol:

- **Identity Resolution**: Fetches verified users from the KYC registry
- **ENS Integration**: Uses the same ENS resolver for name resolution
- **Trust Building**: Creates social proof for verified identities
- **Network Effects**: Amplifies the value of KYC verification through social connections

## 🎨 Design Philosophy

### User-Centric
- **Mobile-first** responsive design
- **Intuitive** social interactions
- **Clear** trust indicators
- **Smooth** user experience

### Web3 Native
- **Decentralized** identity management
- **On-chain** trust relationships
- **Self-sovereign** user control
- **Interoperable** with other dApps

### Trust-Focused
- **Transparent** verification status
- **Verifiable** social connections
- **Reputation-based** interactions
- **Sybil-resistant** design

## 🚀 Future Roadmap

- **Enhanced Discovery**: AI-powered user recommendations
- **Group Features**: Communities and interest-based groups
- **Cross-chain**: Support for multiple blockchain networks
- **Mobile App**: Native mobile application
- **Advanced Analytics**: Social graph insights and metrics

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on how to:
- Report bugs
- Suggest features
- Submit pull requests
- Join our community

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- **Main UniKYC Protocol**: [Repository Link]
- **Documentation**: [Docs Link]
- **Live Demo**: [Demo Link]
- **Community**: [Discord/Twitter Links]

---

Built with ❤️ on Base using MiniKit, Ethereum Follow Protocol, and the UniKYC ecosystem.