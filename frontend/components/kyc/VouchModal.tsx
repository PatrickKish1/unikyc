/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Star } from 'lucide-react';

interface VouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVouch: (confidence: number, notes: string) => Promise<void>;
  targetUser: {
    address: string;
    ensName?: string;
    isKycVerified: boolean;
  };
  isLoading?: boolean;
}

export function VouchModal({
  isOpen,
  onClose,
  onVouch,
  targetUser,
  isLoading = false
}: VouchModalProps) {
  const [confidence, setConfidence] = useState(9);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onVouch(confidence, notes);
      onClose();
      setNotes('');
      setConfidence(9);
    } catch (error) {
      console.error('Vouch failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceLabel = (value: number) => {
    if (value >= 9) return { label: 'Very High', color: 'text-green-400' };
    if (value >= 7) return { label: 'High', color: 'text-blue-400' };
    if (value >= 5) return { label: 'Medium', color: 'text-yellow-400' };
    if (value >= 3) return { label: 'Low', color: 'text-orange-400' };
    return { label: 'Very Low', color: 'text-red-400' };
  };

  const confidenceInfo = getConfidenceLabel(confidence);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Vouch for User
          </CardTitle>
          <CardDescription className="text-white/70">
            Create a trust attestation for this user. This will be stored on-chain and visible to others.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Target User Info */}
          <div className="p-4 bg-white/5 rounded-lg mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-medium">
                  {targetUser.ensName || `${targetUser.address.slice(0, 6)}...${targetUser.address.slice(-4)}`}
                </div>
                <div className="text-white/60 text-sm font-mono">
                  {targetUser.address}
                </div>
              </div>
              {targetUser.isKycVerified && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  KYC Verified
                </Badge>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Confidence Level */}
            <div>
              <Label className="text-white mb-3 block">
                Confidence Level: <span className={confidenceInfo.color}>{confidenceInfo.label}</span>
              </Label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>1 - Very Low</span>
                  <span>10 - Very High</span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(10)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < confidence ? 'text-yellow-400 fill-current' : 'text-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-white mb-2 block">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional context about why you're vouching for this user..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px]"
                maxLength={500}
              />
              <div className="text-xs text-white/60 mt-1">
                {notes.length}/500 characters
              </div>
            </div>

            {/* Warning */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-200">
                  <strong>Important:</strong> Vouching creates an on-chain attestation that others can see. 
                  Only vouch for users you personally know and trust.
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-white/30 bg-white/10 text-white hover:bg-white/20"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating Attestation...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Vouch for User
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// CSS for custom slider
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: linear-gradient(45deg, #3b82f6, #8b5cf6);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = sliderStyles;
  document.head.appendChild(styleSheet);
}
