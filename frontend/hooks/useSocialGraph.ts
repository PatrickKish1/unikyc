"use client";

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

export interface SocialProfile {
  address: string;
  ensName?: string;
  isKycVerified: boolean;
  kycLevel: 'high' | 'medium' | 'low' | 'none';
  followers: number;
  following: number;
  vouches: number;
  lastActive: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
}

export interface SocialStats {
  totalProfiles: number;
  kycVerified: number;
  totalFollowers: number;
  totalVouches: number;
}

export function useSocialGraph() {
  const { address, isConnected } = useAccount();
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [vouches, setVouches] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockProfiles: SocialProfile[] = [
    {
      address: '0x983110309620d911731ac0932219af06091b6744',
      ensName: 'vitalik.eth',
      isKycVerified: true,
      kycLevel: 'high',
      followers: 4289,
      following: 108,
      vouches: 156,
      lastActive: '2 hours ago',
      bio: 'Ethereum co-founder. Building the future of decentralized technology.',
      socialLinks: {
        twitter: 'VitalikButerin',
        github: 'vbuterin',
        website: 'vitalik.ca'
      }
    },
    {
      address: '0x866B4c4ab134ac8b35545b1b9a589027a971dc0e9368',
      ensName: 'jefflau.eth',
      isKycVerified: true,
      kycLevel: 'medium',
      followers: 1234,
      following: 89,
      vouches: 45,
      lastActive: '1 day ago',
      bio: 'Web3 developer and ENS contributor.',
      socialLinks: {
        twitter: 'jefflau',
        github: 'jefflau'
      }
    },
    {
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      ensName: 'nick.eth',
      isKycVerified: false,
      kycLevel: 'none',
      followers: 567,
      following: 234,
      vouches: 12,
      lastActive: '3 days ago',
      bio: 'ENS lead developer and Ethereum Foundation alum.'
    },
    {
      address: '0x4c4ab134ac8b35545b1b9a589027a971dc0e9368',
      ensName: 'cottons.eth',
      isKycVerified: true,
      kycLevel: 'high',
      followers: 892,
      following: 156,
      vouches: 78,
      lastActive: '5 hours ago',
      bio: 'Building decentralized identity solutions.',
      socialLinks: {
        twitter: 'cottons',
        website: 'baecafe.xyz'
      }
    }
  ];

  const discoverProfiles = useCallback(async (query?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let filteredProfiles = mockProfiles;
      
      if (query) {
        filteredProfiles = mockProfiles.filter(profile => 
          profile.ensName?.toLowerCase().includes(query.toLowerCase()) ||
          profile.address.toLowerCase().includes(query.toLowerCase()) ||
          profile.bio?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      setProfiles(filteredProfiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover profiles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const followUser = useCallback(async (targetAddress: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet');
    }

    try {
      // In a real implementation, this would:
      // 1. Create a follow transaction using EFP
      // 2. Update the on-chain follow state
      // 3. Update local state
      
      console.log(`Following ${targetAddress} from ${address}`);
      
      // For now, just update local state
      setFollowing(prev => new Set([...prev, targetAddress]));
      
      // Update profile followers count
      setProfiles(prev => prev.map(profile => 
        profile.address === targetAddress 
          ? { ...profile, followers: profile.followers + 1 }
          : profile
      ));
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to follow user');
    }
  }, [address, isConnected]);

  const unfollowUser = useCallback(async (targetAddress: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet');
    }

    try {
      console.log(`Unfollowing ${targetAddress} from ${address}`);
      
      setFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetAddress);
        return newSet;
      });
      
      // Update profile followers count
      setProfiles(prev => prev.map(profile => 
        profile.address === targetAddress 
          ? { ...profile, followers: Math.max(0, profile.followers - 1) }
          : profile
      ));
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to unfollow user');
    }
  }, [address, isConnected]);

  const vouchForUser = useCallback(async (targetAddress: string, confidence: number = 9, notes?: string) => {
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet');
    }

    try {
      // In a real implementation, this would:
      // 1. Create an EAS attestation with the following schema:
      //    - attester: current user address
      //    - recipient: target user address
      //    - isKycVerified: true
      //    - confidence: confidence level (1-10)
      //    - notes: optional notes
      //    - timestamp: current timestamp
      // 2. Sign the attestation with the user's wallet
      // 3. Store the attestation on-chain via EAS
      
      console.log(`Creating KYC attestation for ${targetAddress}`, { 
        confidence, 
        notes,
        attester: address,
        recipient: targetAddress
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just update local state
      setVouches(prev => new Set([...prev, targetAddress]));
      
      // Update profile vouches count
      setProfiles(prev => prev.map(profile => 
        profile.address === targetAddress 
          ? { ...profile, vouches: profile.vouches + 1 }
          : profile
      ));
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to vouch for user');
    }
  }, [address, isConnected]);

  const getSocialStats = useCallback((): SocialStats => {
    return {
      totalProfiles: profiles.length,
      kycVerified: profiles.filter(p => p.isKycVerified).length,
      totalFollowers: profiles.reduce((sum, p) => sum + p.followers, 0),
      totalVouches: profiles.reduce((sum, p) => sum + p.vouches, 0)
    };
  }, [profiles]);

  const isFollowing = useCallback((address: string) => {
    return following.has(address);
  }, [following]);

  const hasVouched = useCallback((address: string) => {
    return vouches.has(address);
  }, [vouches]);

  return {
    profiles,
    following: Array.from(following),
    vouches: Array.from(vouches),
    isLoading,
    error,
    discoverProfiles,
    followUser,
    unfollowUser,
    vouchForUser,
    getSocialStats,
    isFollowing,
    hasVouched
  };
}
