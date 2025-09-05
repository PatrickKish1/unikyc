"use client"

import { useState, useCallback } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { ensResolver } from '@/lib/ens/resolver'

export interface UseEnsRegistrationReturn {
  registerEns: (label?: string) => Promise<{ ensName: string; isNew: boolean; txHash?: string }>
  isRegistering: boolean
  error: string | null
  clearError: () => void
}

export function useEnsRegistration(): UseEnsRegistrationReturn {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const registerEns = useCallback(async (label?: string) => {
    if (!address || !walletClient) {
      throw new Error('Wallet not connected')
    }

    setIsRegistering(true)
    setError(null)

    try {
      const result = await ensResolver.getOrCreateEnsForKyc(address, walletClient)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ENS registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsRegistering(false)
    }
  }, [address, walletClient])

  return {
    registerEns,
    isRegistering,
    error,
    clearError,
  }
}
