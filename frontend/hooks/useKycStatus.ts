"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { kycService } from '@/lib/kyc/service'
import { kycStorage } from '@/lib/ens/resolver'
import { ensResolver } from '@/lib/ens/resolver'
import type { KycStatus, KycRecord } from '@/lib/kyc/types'

export interface UseKycStatusReturn {
  kycStatus: KycStatus | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  checkStatus: (identifier: string) => Promise<KycStatus>
}

export function useKycStatus(identifier?: string): UseKycStatusReturn {
  const { address, isConnected } = useAccount()
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async (checkIdentifier: string): Promise<KycStatus> => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Check if identifier is ENS name or address
      let kycResult
      if (checkIdentifier.endsWith('.eth')) {
        // Direct ENS lookup
        kycResult = await kycStorage.checkKycStatus(checkIdentifier)
      } else {
        // Address lookup - resolve ENS first
        kycResult = await kycStorage.getKycRecordByAddress(checkIdentifier as `0x${string}`)
        if (kycResult) {
          kycResult = {
            hasKyc: true,
            status: kycResult.status,
            record: kycResult
          }
        } else {
          kycResult = { hasKyc: false }
        }
      }
      
      // Map KycRecord status to KycStatus status
      const mapRecordStatusToKycStatus = (recordStatus?: string): 'none' | 'pending' | 'approved' | 'expired' | 'rejected' => {
        switch (recordStatus) {
          case 'active':
            return 'approved'
          case 'expired':
            return 'expired'
          case 'revoked':
            return 'rejected'
          default:
            return 'none'
        }
      }

      const status: KycStatus = {
        hasKyc: kycResult.hasKyc,
        status: mapRecordStatusToKycStatus(kycResult.status),
        record: kycResult.record
      }
      
      setKycStatus(status)
      return status
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check KYC status'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    if (!identifier) return
    
    try {
      await checkStatus(identifier)
    } catch (err) {
      // Error already set in checkStatus
    }
  }, [identifier, checkStatus])

  // Auto-check status when identifier changes
  useEffect(() => {
    if (!identifier) {
      setKycStatus(null)
      return
    }

    checkStatus(identifier).catch(() => {
      // Error already handled
    })
  }, [identifier, checkStatus])

  // Auto-check status when wallet connects/disconnects
  useEffect(() => {
    if (!isConnected || !address) {
      setKycStatus(null)
      return
    }

    // If no specific identifier provided, check by address
    if (!identifier) {
      checkStatus(address).catch(() => {
        // Error already handled
      })
    }
  }, [isConnected, address, identifier, checkStatus])

  return {
    kycStatus,
    isLoading,
    error,
    refetch,
    checkStatus,
  }
}

// Hook for checking KYC status by ENS name
export function useKycStatusByEns(ensName?: string): UseKycStatusReturn {
  return useKycStatus(ensName)
}

// Hook for checking KYC status by address
export function useKycStatusByAddress(address?: string): UseKycStatusReturn {
  return useKycStatus(address)
}

// Hook for checking KYC status of connected wallet
export function useConnectedKycStatus(): UseKycStatusReturn {
  const { address, isConnected } = useAccount()
  
  if (!isConnected || !address) {
    return {
      kycStatus: null,
      isLoading: false,
      error: null,
      refetch: async () => {},
      checkStatus: async () => ({ hasKyc: false, status: 'none' }),
    }
  }

  return useKycStatus(address)
}
