"use client";

import { useEffect, useRef } from 'react';
import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletModal,
} from "@coinbase/onchainkit/wallet";
import { useMemo, useState, useCallback } from "react";
import { Icon, Button } from "../components/DemoComponents";
import { ArrowRight, Users, Lock, Globe, CheckCircle, Star, ArrowUpRight, Play, Menu, X, Shield, Zap, Database, UserPlus, Network } from 'lucide-react';
import Link from 'next/link';

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [modalOpen, setModalOpen] = useState(false);
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

  // Ensure component is mounted before rendering wallet components
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame();
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  const renderHome = () => (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              Next-Generation Decentralized Identity
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              The Future of
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Digital Identity
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/80 mb-8 leading-relaxed max-w-3xl mx-auto">
              UniKYC combines blockchain technology, threshold cryptography, and the dcipher network 
              to create a secure, privacy-preserving, and interoperable identity verification system.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                onClick={() => setActiveTab("demo")}
              >
                <Play className="w-5 h-5 mr-2" />
                Try Demo
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
              >
                View Documentation
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">100%</div>
                <div className="text-white/70 text-sm sm:text-base">Privacy Preserved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">5+</div>
                <div className="text-white/70 text-sm sm:text-base">Blockchain Networks</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">∞</div>
                <div className="text-white/70 text-sm sm:text-base">Reusable Identity</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Preview */}
      <section className="py-16 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose UniKYC?
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              A revolutionary approach to identity verification that puts users in control 
              while maintaining the highest security standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "User Control",
                description: "Full self-sovereign identity with complete control over personal data and disclosure preferences.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Lock,
                title: "Privacy First",
                description: "Zero-knowledge proofs and threshold cryptography ensure privacy while maintaining verifiability.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Globe,
                title: "Interoperable",
                description: "Works seamlessly across different platforms, services, and blockchain networks.",
                color: "from-blue-500 to-cyan-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 transform hover:scale-105"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Graph Preview */}
      <section className="py-16 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Decentralized Social Network
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Connect with verified users, build trust through social vouching, and discover 
              the power of decentralized identity relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Social Features */}
            <div className="space-y-6">
              {[
                {
                  icon: Network,
                  title: "Social Discovery",
                  description: "Find and connect with other verified users in the network. Search by ENS name or address.",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: UserPlus,
                  title: "Follow System",
                  description: "Follow users you trust and build your social graph. See who follows whom.",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: Shield,
                  title: "Social Vouching",
                  description: "Vouch for users you know and trust. Build reputation through social proof.",
                  color: "from-green-500 to-emerald-500"
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
                >
                  <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview Cards */}
            <div className="space-y-4">
              {/* Sample Profile Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">vitalik.eth</div>
                      <div className="text-white/60 text-xs">4,289 followers</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs">
                      Follow
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs">
                      Vouch
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">jefflau.eth</div>
                      <div className="text-white/60 text-xs">1,234 followers</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs">
                      Follow
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs">
                      Vouch
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link href="/social">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold"
                  >
                    <Network className="w-5 h-5 mr-2" />
                    Explore Social Graph
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderFeatures = () => (
    <div className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Advanced Features
          </h2>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
            A comprehensive suite of tools and technologies that make UniKYC the most advanced 
            decentralized identity solution available.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Users,
              title: "Self-Sovereign Identity",
              description: "Complete control over your digital identity with no central authority. Manage your data, control access, and maintain privacy.",
              color: "from-green-500 to-emerald-500"
            },
            {
              icon: Lock,
              title: "Zero-Knowledge Proofs",
              description: "Prove your identity without revealing sensitive information. Advanced cryptography ensures privacy while maintaining verifiability.",
              color: "from-purple-500 to-pink-500"
            },
            {
              icon: Globe,
              title: "Cross-Chain Interoperability",
              description: "Works seamlessly across multiple blockchain networks. Your identity follows you wherever you go in the Web3 ecosystem.",
              color: "from-blue-500 to-cyan-500"
            },
            {
              icon: Shield,
              title: "Threshold Cryptography",
              description: "Distributed key management ensures maximum security. No single point of failure while maintaining user control.",
              color: "from-orange-500 to-red-500"
            },
            {
              icon: Zap,
              title: "Instant Verification",
              description: "Lightning-fast identity verification using advanced algorithms. Get verified in seconds, not days.",
              color: "from-yellow-500 to-orange-500"
            },
            {
              icon: Database,
              title: "Decentralized Storage",
              description: "Your documents and data are stored on IPFS and Filecoin. Truly decentralized, censorship-resistant storage.",
              color: "from-indigo-500 to-purple-500"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 transform hover:scale-105"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/70 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
            Built on Proven Technology
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { name: "ENS", desc: "Ethereum Name Service", icon: "🔗" },
              { name: "SIWE", desc: "Sign-In with Ethereum", icon: "🔐" },
              { name: "Filecoin", desc: "Decentralized Storage", icon: "💾" },
              { name: "WebAuthn", desc: "Biometric Security", icon: "👆" },
              { name: "dcipher", desc: "Verifiable Randomness", icon: "🎲" },
              { name: "Blocklock", desc: "Conditional Encryption", icon: "⏰" },
              { name: "Threshold", desc: "Multi-Key Crypto", icon: "🔑" },
              { name: "Multi-Chain", desc: "Cross-Network Support", icon: "🌐" }
            ].map((tech, index) => (
              <div 
                key={index}
                className="text-center p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-2xl mb-2">{tech.icon}</div>
                <h4 className="font-bold text-white mb-1 text-sm">{tech.name}</h4>
                <p className="text-xs text-white/70">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Experience the Future?
            </h3>
            <p className="text-white/70 mb-8 text-lg">
              Join thousands of users who have already discovered the power of decentralized identity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold"
                onClick={() => setActiveTab("demo")}
              >
                Try Demo Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-8 py-4 text-lg font-semibold"
                onClick={() => setActiveTab("home")}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDemo = () => (
    <div className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Try UniKYC Demo
          </h2>
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
            Experience the power of decentralized identity verification. Connect your wallet and 
            start your KYC journey in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Demo Content */}
          <div className="space-y-8">
            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Step 1: Connect Wallet</h3>
              <p className="text-white/70 mb-4">
                Connect your Ethereum wallet to get started. We support all major wallets including MetaMask, WalletConnect, and more.
              </p>
              <div className="flex items-center space-x-2 text-sm text-white/60">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Secure wallet connection</span>
              </div>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Step 2: Verify Identity</h3>
              <p className="text-white/70 mb-4">
                Complete our streamlined KYC process using advanced biometric verification and document upload.
              </p>
              <div className="flex items-center space-x-2 text-sm text-white/60">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Biometric verification</span>
              </div>
            </div>

            <div className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Step 3: Get Verified</h3>
              <p className="text-white/70 mb-4">
                Receive your decentralized identity credential that works across all supported platforms and services.
              </p>
              <div className="flex items-center space-x-2 text-sm text-white/60">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cross-platform compatibility</span>
              </div>
            </div>
          </div>

          {/* Demo Interface Placeholder */}
          <div className="relative">
            <div className="p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Demo Interface</h3>
                <p className="text-white/70">Interactive demo coming soon</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold"
                >
                  Connect Wallet
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 py-4 text-lg font-semibold"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("home")} 
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-6 py-3"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">UniKYC</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setActiveTab("home")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "home" ? "text-blue-400" : "text-white/80 hover:text-white"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab("features")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "features" ? "text-blue-400" : "text-white/80 hover:text-white"
                }`}
              >
                Features
              </button>
              <button
                onClick={() => setActiveTab("demo")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "demo" ? "text-blue-400" : "text-white/80 hover:text-white"
                }`}
              >
                Demo
              </button>
              <Link
                href="/social"
                className="text-sm font-medium transition-colors text-white/80 hover:text-white"
              >
                Social Graph
              </Link>
            </div>

            {/* Wallet & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Wallet */}
              {mounted ? (
                <Wallet>
                  <ConnectWallet>
                    <Name className="text-inherit" />
                  </ConnectWallet>
                  <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address />
                      <EthBalance />
                    </Identity>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                  <WalletModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
                </Wallet>
              ) : (
                <div className="w-24 h-8 bg-white/10 rounded-lg animate-pulse" />
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "home" ? "text-blue-400 bg-blue-400/10" : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => { setActiveTab("features"); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "features" ? "text-blue-400 bg-blue-400/10" : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => { setActiveTab("demo"); setMobileMenuOpen(false); }}
                  className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "demo" ? "text-blue-400 bg-blue-400/10" : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Demo
                </button>
                <Link
                  href="/social"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white/80 hover:text-white hover:bg-white/10"
                >
                  Social Graph
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
        {activeTab === "home" && renderHome()}
        {activeTab === "features" && renderFeatures()}
        {activeTab === "demo" && renderDemo()}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-white/60 text-sm">
              Built on Base with MiniKit • Powered by Web3
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
