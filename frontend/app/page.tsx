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
} from "@coinbase/onchainkit/wallet";
import { useMemo, useState, useCallback } from "react";
import { Icon, Button } from "../components/DemoComponents";
import { ArrowRight, Users, Lock, Globe, CheckCircle, Star, ArrowUpRight, Play } from 'lucide-react';

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const heroRef = useRef<HTMLDivElement>(null);

  console.log(heroRef);

  const addFrame = useAddFrame();
  const openUrl = useOpenUrl();

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
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative text-center py-8">
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/90 text-sm font-medium mb-6 animate-fade-in-up">
          <Star className="w-4 h-4 mr-2 text-yellow-400" />
          Next-Generation Decentralized Identity
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight animate-fade-in-up animation-delay-200">
          The Future of
          <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Digital Identity
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-white/80 mb-6 leading-relaxed animate-fade-in-up animation-delay-400">
          UniKYC combines blockchain technology, threshold cryptography, and the dcipher network 
          to create a secure, privacy-preserving, and interoperable identity verification system.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 justify-center items-center mb-8 animate-fade-in-up animation-delay-600">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 text-base font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 w-full max-w-xs"
            onClick={() => setActiveTab("features")}
          >
            <Play className="w-4 h-4 mr-2" />
            Try Demo
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-white/30 bg-white/10 text-white hover:bg-white/10 px-6 py-3 text-base font-semibold backdrop-blur-sm transition-all duration-300 transform hover:scale-105 w-full max-w-xs"
          >
            View Documentation
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto animate-fade-in-up animation-delay-800">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white mb-1">100%</div>
            <div className="text-white/70 text-xs">Privacy Preserved</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white mb-1">5+</div>
            <div className="text-white/70 text-xs">Blockchain Networks</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-white mb-1">∞</div>
            <div className="text-white/70 text-xs">Reusable Identity</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 animate-on-scroll">
          Why Choose UniKYC?
        </h2>
        <p className="text-base text-white/70 animate-on-scroll">
          A revolutionary approach to identity verification that puts users in control 
          while maintaining the highest security standards.
        </p>
      </div>

      <div className="space-y-4">
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
            className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 transform hover:scale-105 animate-on-scroll"
            style={{ animationDelay: `${index * 200}ms` }}
          >
            <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-white/70 leading-relaxed text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Technology Stack */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4 text-center animate-on-scroll">
          Built on Proven Technology
        </h3>
        <div className="grid grid-cols-2 gap-3">
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
              className="text-center p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105 animate-on-scroll"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-2xl mb-2">{tech.icon}</div>
              <h4 className="font-bold text-white mb-1 text-sm">{tech.name}</h4>
              <p className="text-xs text-white/70">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl animate-on-scroll">
        <h3 className="text-xl font-bold text-white mb-4">
          Revolutionizing Identity Verification
        </h3>
        <p className="text-white/70 mb-6 leading-relaxed text-sm">
          {`UniKYC represents a paradigm shift in how we think about digital identity. 
          By combining blockchain technology with advanced cryptography, we've created 
          a system that's both more secure and more user-friendly than traditional solutions.`}
        </p>
        
        <div className="space-y-3">
          {[
            "Self-sovereign identity management",
            "Cross-chain interoperability",
            "Zero-knowledge proof verification",
            "Biometric authentication support",
            "Decentralized document storage",
            "Conditional data release"
          ].map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-white/80 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full"
            onClick={() => setActiveTab("home")}
          >
            Launch Demo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <Button variant="outline" onClick={() => setActiveTab("home")} className="w-full">
        Back to Home
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="flex flex-col min-h-screen font-sans text-white relative z-10">
        <div className="w-full max-w-md mx-auto px-4 py-3 overflow-y-auto">
          <header className="flex justify-between items-center mb-3 h-11">
            <div>{saveFrameButton}</div>
            <div>
              <div className="flex items-center space-x-2">
                <Wallet className="z-10">
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
                </Wallet>
              </div>
            </div>
          </header>

          <main className="flex-1 pb-20">
            {activeTab === "home" && renderHome()}
            {activeTab === "features" && renderFeatures()}
          </main>

          <footer className="mt-2 pt-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 text-xs"
              onClick={() => openUrl("https://base.org/builders/minikit")}
            >
              Built on Base with MiniKit
            </Button>
          </footer>
        </div>
      </div>
    </div>
  );
}
