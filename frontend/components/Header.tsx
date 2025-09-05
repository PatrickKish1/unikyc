/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield } from 'lucide-react';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletModal,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";


export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className={`p-2 rounded-lg transition-all duration-300 ${
              isScrolled ? 'bg-blue-600' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <Shield className="w-6 h-6 transition-colors duration-300 text-white" />
            </div>
            <span className={`text-xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}>
              UniKYC
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="#features" 
              className={`font-medium transition-colors duration-300 hover:text-blue-600 ${
                isScrolled ? 'text-gray-700' : 'text-white/90'
              }`}
            >
              Features
            </Link>
            <Link 
              href="#technology" 
              className={`font-medium transition-colors duration-300 hover:text-blue-600 ${
                isScrolled ? 'text-gray-700' : 'text-white/90'
              }`}
            >
              Technology
            </Link>
            <Link 
              href="#about" 
              className={`font-medium transition-colors duration-300 hover:text-blue-600 ${
                isScrolled ? 'text-gray-700' : 'text-white/90'
              }`}
            >
              About
            </Link>
            <Link 
              href="/demo" 
              className={`font-medium transition-colors duration-300 hover:text-blue-600 ${
                isScrolled ? 'text-gray-700' : 'text-white/90'
              }`}
            >
              Demo
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              className={`transition-all text-gray-700 duration-300 ${
                isScrolled 
                  ? 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-50' 
                  : 'border-white/30 text-gray-700 hover:bg-white/10'
              }`}
            >
              Documentation
            </Button>
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
              <WalletModal isOpen={showModal} onClose={() => {setShowModal(false)}} />
            </Wallet>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? 'text-gray-700' : 'text-white'}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200/20">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="#features" 
                className="font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#technology" 
                className="font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Technology
              </Link>
              <Link 
                href="#about" 
                className="font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/demo" 
                className="font-medium text-gray-700 hover:text-blue-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Demo
              </Link>
              <div className="pt-4 space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Documentation
                </Button>
                <div className="w-full">
                  <ConnectWallet />
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
