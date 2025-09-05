"use client";

import { useState, useEffect } from 'react';
import { useAccount, useEnsName } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, UserPlus, Shield, CheckCircle, AlertCircle, Network } from 'lucide-react';
import { ProfileCard } from '@/components/social/ProfileCard';
import { useSocialGraph } from '@/hooks/useSocialGraph';
import { ensResolver } from '@/lib/ens/resolver';

export default function SocialPage() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [userEnsName, setUserEnsName] = useState<string | null>(null);
  const [showEnsRegistration, setShowEnsRegistration] = useState(false);

  // Get user's ENS name
  const { data: ensName } = useEnsName({ 
    address, 
    chainId: 1 
  });

  // Use social graph hook
  const {
    profiles,
    isLoading,
    error,
    discoverProfiles,
    followUser,
    unfollowUser,
    vouchForUser,
    getSocialStats,
    isFollowing,
    hasVouched
  } = useSocialGraph();

  useEffect(() => {
    if (ensName) {
      setUserEnsName(ensName);
    } else if (address && isConnected) {
      // Check if user needs ENS registration
      setShowEnsRegistration(true);
    }
  }, [ensName, address, isConnected]);

  // Load initial profiles
  useEffect(() => {
    discoverProfiles();
  }, [discoverProfiles]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      discoverProfiles();
      return;
    }
    
    await discoverProfiles(query);
  };

  const handleVouch = async (profileAddress: string, confidence: number, notes: string) => {
    try {
      await vouchForUser(profileAddress, confidence, notes);
    } catch (error) {
      console.error('Vouch failed:', error);
    }
  };

  const handleFollow = async (profileAddress: string) => {
    try {
      if (isFollowing(profileAddress)) {
        await unfollowUser(profileAddress);
      } else {
        await followUser(profileAddress);
      }
    } catch (error) {
      console.error('Follow failed:', error);
    }
  };

  const socialStats = getSocialStats();

  const handleEnsRegistration = async () => {
    if (!address) return;
    
    try {
      // Generate a suggested ENS name based on address
      const suggestedName = `user${address.slice(-6)}.kycgraph.eth`;
      
      // In a real implementation, this would call your custom resolver
      console.log('Registering ENS:', suggestedName);
      
      // For demo purposes, just set it locally
      setUserEnsName(suggestedName);
      setShowEnsRegistration(false);
    } catch (error) {
      console.error('ENS registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">KYC Social Graph</h1>
              <p className="text-white/70">
                Discover and connect with verified users in the decentralized identity network
              </p>
            </div>
            
            {/* User Profile Summary */}
            {isConnected && address && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {userEnsName || `${address.slice(0, 6)}...${address.slice(-4)}`}
                      </div>
                      <div className="text-white/60 text-sm">
                        {userEnsName ? 'Verified Identity' : 'Unregistered'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ENS Registration Prompt */}
        {showEnsRegistration && (
          <Card className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Register Your ENS Name
              </CardTitle>
              <CardDescription className="text-white/70">
                Get your unique identity in the KYC network. This will be your permanent identifier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="user123.kycgraph.eth"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    value={`user${address?.slice(-6)}.kycgraph.eth`}
                    readOnly
                  />
                </div>
                <Button 
                  onClick={handleEnsRegistration}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Register ENS
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <Input
              placeholder="Search by ENS name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{socialStats.totalProfiles}</div>
              <div className="text-white/70 text-sm">Total Profiles</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{socialStats.kycVerified}</div>
              <div className="text-white/70 text-sm">KYC Verified</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{socialStats.totalFollowers.toLocaleString()}</div>
              <div className="text-white/70 text-sm">Total Followers</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{socialStats.totalVouches.toLocaleString()}</div>
              <div className="text-white/70 text-sm">Total Vouches</div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-white/20 rounded mb-2"></div>
                        <div className="h-3 bg-white/20 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="h-6 bg-white/20 rounded mb-1"></div>
                        <div className="h-3 bg-white/20 rounded"></div>
                      </div>
                      <div className="text-center">
                        <div className="h-6 bg-white/20 rounded mb-1"></div>
                        <div className="h-3 bg-white/20 rounded"></div>
                      </div>
                      <div className="text-center">
                        <div className="h-6 bg-white/20 rounded mb-1"></div>
                        <div className="h-3 bg-white/20 rounded"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-8 bg-white/20 rounded"></div>
                      <div className="w-20 h-8 bg-white/20 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.address}
                address={profile.address}
                ensName={profile.ensName}
                isKycVerified={profile.isKycVerified}
                kycLevel={profile.kycLevel}
                followers={profile.followers}
                following={profile.following}
                vouches={profile.vouches}
                lastActive={profile.lastActive}
                bio={profile.bio}
                socialLinks={profile.socialLinks}
                onFollow={handleFollow}
                onVouch={handleVouch}
                isFollowing={isFollowing(profile.address)}
                isVouched={hasVouched(profile.address)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {profiles.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No profiles found</h3>
            <p className="text-white/70 mb-6">
              {searchQuery ? 'Try searching for a different ENS name or address' : 'No profiles available at the moment'}
            </p>
            {searchQuery && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  discoverProfiles();
                }}
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Show All Profiles
              </Button>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error loading profiles</h3>
            <p className="text-white/70 mb-6">{error}</p>
            <Button
              onClick={() => discoverProfiles()}
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
