/* eslint-disable @typescript-eslint/no-explicit-any */
export interface KycDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement'
  fileId: string // Filecoin CID
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  verified: boolean
  verificationDate?: string
}

export interface KycVerificationData {
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  documents: KycDocument[]
  selfieFileId?: string
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'expired'
  verificationDate?: string
  expiryDate?: string
  rejectionReason?: string
  kycProvider: string
  providerReference: string
}

export interface ThresholdKey {
  id: string
  publicKey: string
  encryptedPrivateKey: string // Encrypted with user's device key
  keyShare: string // Shamir's Secret Sharing
  index: number // Position in the threshold scheme
}

export interface ThresholdScheme {
  totalKeys: number
  requiredKeys: number
  keys: ThresholdKey[]
  encryptedData: string // KYC data encrypted with threshold scheme
  createdAt: string
  expiresAt?: string
}

export interface KycRecord {
  id: string
  ensName: string // Primary identifier
  address: `0x${string}`
  verificationData: KycVerificationData
  thresholdScheme: ThresholdScheme
  blocklockData?: {
    ciphertext: any
    condition: string
    unlockBlockHeight: number
    chainId: number
  }
  randomnessId?: string
  status: 'active' | 'expired' | 'revoked'
  createdAt: string
  updatedAt: string
  lastVerifiedAt?: string
  metadata: {
    version: string
    schema: string
    tags: string[]
  }
}

export interface KycStatus {
  hasKyc: boolean
  record?: KycRecord
  status: 'none' | 'pending' | 'approved' | 'expired' | 'rejected'
  lastVerified?: string
  expiryDate?: string
}

export interface KycVerificationRequest {
  ensName: string
  address: `0x${string}`
  chainId?: number
  documents: File[]
  personalInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    nationality: string
    address: {
      street: string
      city: string
      state: string
      country: string
      postalCode: string
    }
  }
  selfie?: File
}

export interface KycVerificationResult {
  success: boolean
  recordId?: string
  status: 'pending' | 'approved' | 'rejected'
  message: string
  errors?: string[]
  estimatedTime?: string
}

export interface BiometricVerificationRequest {
  type: 'face_id' | 'fingerprint' | 'passkey'
  challenge: string
  userId: string
  ensName: string
}

export interface BiometricVerificationResult {
  success: boolean
  verified: boolean
  userId: string
  ensName: string
  timestamp: string
  deviceInfo: {
    type: string
    id: string
    name: string
  }
}

export interface ThresholdDecryptionRequest {
  ensName: string
  keyShares: string[] // At least requiredKeys number of shares
  encryptedData: string
}

export interface ThresholdDecryptionResult {
  success: boolean
  decryptedData?: string
  error?: string
  usedKeys: number
  requiredKeys: number
}

export type KycProvider = 'jumio' | 'veriff' | 'onfido' | 'sumsub' | 'custom'

export interface KycProviderConfig {
  name: KycProvider
  apiKey: string
  apiSecret: string
  webhookUrl?: string
  config: Record<string, any>
}

export interface KycWebhookPayload {
  provider: KycProvider
  event: string
  data: any
  signature?: string
  timestamp: string
}

// Threshold cryptography configuration
export const THRESHOLD_CONFIGS = {
  HIGH_SECURITY: { total: 5, required: 3 }, // 3-of-5
  MEDIUM_SECURITY: { total: 3, required: 2 }, // 2-of-3
  BASIC_SECURITY: { total: 2, required: 1 }, // 1-of-2
} as const

export type ThresholdConfig = keyof typeof THRESHOLD_CONFIGS
