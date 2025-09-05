"use client";

import { useState } from 'react';
import { useEnsName, useEnsAvatar } from 'wagmi';
import { ProfileCard as EFPProfileCard, ProfileStats } from 'ethereum-identity-kit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Shield, CheckCircle, AlertCircle, Heart, MessageCircle, Share } from 'lucide-react';
import { VouchModal } from '@/components/kyc/VouchModal';

interface ProfileCardProps {
  address: string;
  ensName?: string;
  isKycVerified?: boolean;
  kycLevel?: 'high' | 'medium' | 'low' | 'none';
  followers?: number;
  following?: number;
  vouches?: number;
  lastActive?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  onFollow?: (address: string) => void;
  onVouch?: (address: string) => void;
  onMessage?: (address: string) => void;
  isFollowing?: boolean;
  isVouched?: boolean;
  showActions?: boolean;
  className?: string;
}

export function ProfileCard({
  address,
  ensName,
  isKycVerified = false,
  kycLevel = 'none',
  followers = 0,
  following = 0,
  vouches = 0,
  lastActive,
  bio,
  socialLinks,
  onFollow,
  onVouch,
  onMessage,
  isFollowing = false,
  isVouched = false,
  showActions = true,
  className = ""
}: ProfileCardProps) {
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isVouchLoading, setIsVouchLoading] = useState(false);
  const [showVouchModal, setShowVouchModal] = useState(false);

  // Get ENS data if not provided
  const { data: resolvedEnsName } = useEnsName({ 
    address: address as `0x${string}`, 
    chainId: 1 
  });
  const { data: avatar } = useEnsAvatar({ 
    name: ensName || resolvedEnsName, 
    chainId: 1 
  });

  const displayName = ensName || resolvedEnsName || `${address.slice(0, 6)}...${address.slice(-4)}`;
  const isEnsName = displayName.includes('.eth');

  const handleFollow = async () => {
    if (!onFollow) return;
    setIsFollowLoading(true);
    try {
      await onFollow(address);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleVouch = async (confidence: number, notes: string) => {
    if (!onVouch) return;
    setIsVouchLoading(true);
    try {
      await onVouch(address, confidence, notes);
    } finally {
      setIsVouchLoading(false);
    }
  };

  const getKycBadgeVariant = () => {
    switch (kycLevel) {
      case 'high':
        return { variant: "default" as const, className: "bg-green-500/20 text-green-400 border-green-500/30" };
      case 'medium':
        return { variant: "secondary" as const, className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
      case 'low':
        return { variant: "secondary" as const, className: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
      default:
        return { variant: "secondary" as const, className: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
    }
  };

  const kycBadge = getKycBadgeVariant();

  return (
    <Card className={`bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
              )}
              {isKycVerified && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-white truncate">
                  {displayName}
                </h3>
                {isEnsName && (
                  <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                    ENS
                  </Badge>
                )}
              </div>
              <p className="text-white/60 text-sm font-mono">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              {bio && (
                <p className="text-white/70 text-sm mt-1 line-clamp-2">
                  {bio}
                </p>
              )}
            </div>
          </div>
          
          <Badge 
            variant={kycBadge.variant}
            className={kycBadge.className}
          >
            {isKycVerified ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> KYC Verified</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" /> Unverified</>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{followers.toLocaleString()}</div>
            <div className="text-white/60 text-xs">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{following.toLocaleString()}</div>
            <div className="text-white/60 text-xs">Following</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{vouches.toLocaleString()}</div>
            <div className="text-white/60 text-xs">Vouches</div>
          </div>
        </div>

        {/* Social Links */}
        {socialLinks && (
          <div className="flex items-center space-x-4 mb-4">
            {socialLinks.twitter && (
              <a
                href={`https://twitter.com/${socialLinks.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
            {socialLinks.github && (
              <a
                href={`https://github.com/${socialLinks.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Share className="w-4 h-4" />
              </a>
            )}
            {socialLinks.website && (
              <a
                href={socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Heart className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={`flex-1 ${
                isFollowing 
                  ? "bg-white/20 text-white border-white/30" 
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              }`}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              {isFollowLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </Button>
            
            {isKycVerified && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowVouchModal(true)}
                disabled={isVouchLoading || isVouched}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Shield className="w-4 h-4 mr-1" />
                {isVouchLoading ? "..." : isVouched ? "Vouched" : "Vouch"}
              </Button>
            )}

            {onMessage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMessage(address)}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {lastActive && (
          <div className="text-white/50 text-xs mt-3 text-center">
            Last active: {lastActive}
          </div>
        )}
      </CardContent>

      {/* Vouch Modal */}
      <VouchModal
        isOpen={showVouchModal}
        onClose={() => setShowVouchModal(false)}
        onVouch={handleVouch}
        targetUser={{
          address,
          ensName: ensName || resolvedEnsName,
          isKycVerified
        }}
        isLoading={isVouchLoading}
      />
    </Card>
  );
}

// Compact version for lists
export function CompactProfileCard({
  address,
  ensName,
  isKycVerified = false,
  followers = 0,
  onFollow,
  isFollowing = false,
  className = ""
}: Pick<ProfileCardProps, 'address' | 'ensName' | 'isKycVerified' | 'followers' | 'onFollow' | 'isFollowing' | 'className'>) {
  const { data: resolvedEnsName } = useEnsName({ 
    address: address as `0x${string}`, 
    chainId: 1 
  });
  const { data: avatar } = useEnsAvatar({ 
    name: ensName || resolvedEnsName, 
    chainId: 1 
  });

  const displayName = ensName || resolvedEnsName || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className={`flex items-center space-x-3 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 ${className}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-white font-medium text-sm truncate">
            {displayName}
          </span>
          {isKycVerified && (
            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
          )}
        </div>
        <span className="text-white/60 text-xs">
          {followers.toLocaleString()} followers
        </span>
      </div>

      {onFollow && (
        <Button
          size="sm"
          onClick={() => onFollow(address)}
          className={`text-xs ${
            isFollowing 
              ? "bg-white/20 text-white" 
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
