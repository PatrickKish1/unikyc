"use client"

import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { kycService } from '@/lib/kyc/service'
import { ensResolver } from '@/lib/ens/resolver'
import type {
  KycVerificationRequest,
  KycVerificationResult,
  BiometricVerificationRequest,
  ThresholdDecryptionRequest,
  ThresholdDecryptionResult,
} from '@/lib/kyc/types'

export interface UseKycVerificationReturn {
  // KYC Verification
  initiateVerification: (request: KycVerificationRequest) => Promise<KycVerificationResult>
  isInitiating: boolean
  verificationResult: KycVerificationResult | null
  
  // Biometric Verification
  verifyBiometric: (request: BiometricVerificationRequest) => Promise<any>
  isVerifyingBiometric: boolean
  biometricResult: any | null
  
  // Threshold Decryption
  decryptData: (request: ThresholdDecryptionRequest) => Promise<ThresholdDecryptionResult>
  isDecrypting: boolean
  decryptionResult: ThresholdDecryptionResult | null
  
  // General state
  isLoading: boolean
  error: string | null
  clearError: () => void
}

export function useKycVerification(): UseKycVerificationReturn {
  const { address, isConnected } = useAccount()
  const [isInitiating, setIsInitiating] = useState(false)
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [verificationResult, setVerificationResult] = useState<KycVerificationResult | null>(null)
  const [biometricResult, setBiometricResult] = useState<any | null>(null)
  const [decryptionResult, setDecryptionResult] = useState<ThresholdDecryptionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const initiateVerification = useCallback(async (request: KycVerificationRequest): Promise<KycVerificationResult> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsInitiating(true)
      setError(null)
      
      // Ensure the request address matches connected wallet
      if (request.address.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Request address does not match connected wallet')
      }

      // Validate ENS name format
      if (!ensResolver.isValidName(request.ensName)) {
        throw new Error('Invalid ENS name format')
      }

      const result = await kycService.initiateKycVerification(request)
      setVerificationResult(result)
      
      if (!result.success) {
        setError(result.message || 'Verification failed')
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate KYC verification'
      setError(errorMessage)
      throw err
    } finally {
      setIsInitiating(false)
    }
  }, [isConnected, address])

  const verifyBiometric = useCallback(async (request: BiometricVerificationRequest): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsVerifyingBiometric(true)
      setError(null)
      
      const result = await kycService.verifyBiometric(request)
      setBiometricResult(result)
      
      if (!result.success) {
        setError(result.error || 'Biometric verification failed')
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify biometric'
      setError(errorMessage)
      throw err
    } finally {
      setIsVerifyingBiometric(false)
    }
  }, [isConnected, address])

  const decryptData = useCallback(async (request: ThresholdDecryptionRequest): Promise<ThresholdDecryptionResult> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsDecrypting(true)
      setError(null)
      
      const result = await kycService.decryptKycData(request)
      setDecryptionResult(result)
      
      if (!result.success) {
        setError(result.error || 'Decryption failed')
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt data'
      setError(errorMessage)
      throw err
    } finally {
      setIsDecrypting(false)
    }
  }, [isConnected, address])

  const isLoading = isInitiating || isVerifyingBiometric || isDecrypting

  return {
    initiateVerification,
    isInitiating,
    verificationResult,
    verifyBiometric,
    isVerifyingBiometric,
    biometricResult,
    decryptData,
    isDecrypting,
    decryptionResult,
    isLoading,
    error,
    clearError,
  }
}

// Specialized hook for initiating KYC verification
export function useKycInitiation() {
  const { initiateVerification, isInitiating, verificationResult, error, clearError } = useKycVerification()
  
  return {
    initiateVerification,
    isInitiating,
    verificationResult,
    error,
    clearError,
  }
}

// Specialized hook for biometric verification
export function useBiometricVerification() {
  const { verifyBiometric, isVerifyingBiometric, biometricResult, error, clearError } = useKycVerification()
  
  return {
    verifyBiometric,
    isVerifyingBiometric,
    biometricResult,
    error,
    clearError,
  }
}

// Specialized hook for threshold decryption
export function useThresholdDecryption() {
  const { decryptData, isDecrypting, decryptionResult, error, clearError } = useKycVerification()
  
  return {
    decryptData,
    isDecrypting,
    decryptionResult,
    error,
    clearError,
  }
}
