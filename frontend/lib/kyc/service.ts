/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ensResolver, EnsProfile } from '../ens/resolver'
import { thresholdCrypto, KeyShare } from '../crypto/threshold'
import { biometricVerification, BiometricVerificationResult } from '../auth/biometric'
import { uploadFile } from '../storage/storacha'
import { Randomness } from 'randomness-js'
import { Blocklock, encodeCiphertextToSolidity, encodeCondition } from 'blocklock-js'
import { JsonRpcProvider } from 'ethers'
import {
  KycRecord,
  KycStatus,
  KycVerificationRequest,
  KycVerificationResult,
  BiometricVerificationRequest,
  ThresholdDecryptionRequest,
  ThresholdDecryptionResult,
  KycProvider,
  THRESHOLD_CONFIGS,
  ThresholdConfig,
} from './types'

export class KycService {
  private readonly storageKey = 'unikyc_kyc_records'
  private readonly biometricKey = 'unikyc_biometric_credentials'
  
  // Dcipher network configuration
  private readonly dcipherConfig = {
    providers: {
      baseSepolia: new JsonRpcProvider('https://sepolia.base.org'),
      filecoinCalibration: new JsonRpcProvider('https://api.calibration.node.glif.io/rpc/v1'),
      polygon: new JsonRpcProvider('https://polygon-rpc.com')
    },
    contracts: {
      randomness: {
        baseSepolia: '0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779',
        filecoinCalibration: '0x94C5774DEa83a921244BF362a98c12A5aAD18c87',
        polygon: '0xf4e080Db4765C856c0af43e4A8C4e31aA3b48779'
      },
      blocklock: {
        baseSepolia: '0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e',
        filecoinCalibration: '0xF00aB3B64c81b6Ce51f8220EB2bFaa2D469cf702',
        polygon: '0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e'
      }
    }
  }

  /**
   * Check KYC status for a user by ENS name or address
   */
  async checkKycStatus(identifier: string): Promise<KycStatus> {
    try {
      // Resolve ENS name to address if needed
      let address: `0x${string}`
      let ensName: string | null = null

      if (identifier.startsWith('0x')) {
        address = identifier as `0x${string}`
        ensName = await ensResolver.lookupAddress(address)
      } else {
        const resolvedAddress = await ensResolver.resolveName(identifier)
        if (!resolvedAddress) {
          return { hasKyc: false, status: 'none' }
        }
        address = resolvedAddress
        ensName = identifier
      }

      if (!ensName) {
        return { hasKyc: false, status: 'none' }
      }

      // Check for stored KYC record
      const record = await this.getKycRecord(ensName)
      if (!record) {
        return { hasKyc: false, status: 'none' }
      }

      // Check if KYC is expired
      if (record.status === 'expired' || record.status === 'revoked') {
        return {
          hasKyc: true,
          record,
          status: record.status === 'expired' ? 'expired' : 'rejected',
          lastVerified: record.lastVerifiedAt,
          expiryDate: record.verificationData.expiryDate,
        }
      }

      // Check if KYC is still valid
      if (record.verificationData.expiryDate) {
        const expiryDate = new Date(record.verificationData.expiryDate)
        if (expiryDate < new Date()) {
          record.status = 'expired'
          await this.updateKycRecord(record)
          return {
            hasKyc: true,
            record,
            status: 'expired',
            lastVerified: record.lastVerifiedAt,
            expiryDate: record.verificationData.expiryDate,
          }
        }
      }

      return {
        hasKyc: true,
        record,
        status: record.verificationData.verificationStatus === 'approved' ? 'approved' : 'pending',
        lastVerified: record.lastVerifiedAt,
        expiryDate: record.verificationData.expiryDate,
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error)
      return { hasKyc: false, status: 'none' }
    }
  }

  /**
   * Initiate KYC verification process
   */
  async initiateKycVerification(request: KycVerificationRequest): Promise<KycVerificationResult> {
    try {
      // Validate ENS name
      if (!ensResolver.isValidName(request.ensName)) {
        return {
          success: false,
          status: 'rejected',
          message: 'Invalid ENS name',
          errors: ['Invalid ENS name format'],
        }
      }

      // Check if KYC already exists
      const existingStatus = await this.checkKycStatus(request.ensName)
      if (existingStatus.hasKyc && existingStatus.status === 'approved') {
        return {
          success: false,
          status: 'rejected',
          message: 'KYC already exists and is approved',
          errors: ['KYC already verified'],
        }
      }

      // Upload documents to Filecoin
      const documentUploads = await Promise.all(
        request.documents.map(async (document) => {
          try {
            const result = await uploadFile(document)
            return {
              type: 'passport' as const, // Default type, should be determined from document
              fileId: result,
              fileName: document.name,
              fileSize: document.size,
              mimeType: document.type,
              uploadedAt: new Date().toISOString(),
              verified: false,
            }
          } catch (error) {
            console.error(`Failed to upload document ${document.name}:`, error)
            throw error
          }
        })
      )

      // Upload selfie if provided
      let selfieFileId: string | undefined
      if (request.selfie) {
        try {
          const result = await uploadFile(request.selfie)
          selfieFileId = result
        } catch (error) {
          console.error('Failed to upload selfie:', error)
          // Continue without selfie
        }
      }

      // Create KYC verification data
      const verificationData = {
        firstName: request.personalInfo.firstName,
        lastName: request.personalInfo.lastName,
        dateOfBirth: request.personalInfo.dateOfBirth,
        nationality: request.personalInfo.nationality,
        address: request.personalInfo.address,
        documents: documentUploads,
        selfieFileId,
        verificationStatus: 'pending' as const,
        kycProvider: 'unikyc',
        providerReference: `UNIKYC-${Date.now()}`,
      }

      // Generate threshold cryptography keys
      const thresholdConfig = { totalKeys: 5, requiredKeys: 3 }
      const masterKey = 'master-key-' + Date.now().toString() // Temporary implementation
      const keyShares = thresholdCrypto.generateKeyShares(masterKey, thresholdConfig)

      // Encrypt verification data
      const encryptedData = thresholdCrypto.encryptData(
        JSON.stringify(verificationData),
        masterKey
      )

      // Generate verifiable random ID and encrypt with blocklock if chainId provided
      let randomnessId: string | undefined
      let blocklockData: any | undefined
      
      if (request.chainId) {
        try {
          randomnessId = await this.generateRandomKycId(request.chainId)
          
          // Encrypt sensitive KYC data with blocklock for conditional release
          const sensitiveData = JSON.stringify({
            firstName: request.personalInfo.firstName,
            lastName: request.personalInfo.lastName,
            dateOfBirth: request.personalInfo.dateOfBirth,
            nationality: request.personalInfo.nationality,
            address: request.personalInfo.address
          })
          
          const unlockBlockHeight = Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
          blocklockData = await this.encryptKycDataWithBlocklock(
            sensitiveData,
            unlockBlockHeight,
            request.chainId
          )
        } catch (error) {
          console.error('Failed to generate randomness or blocklock encryption:', error)
          // Continue without these features
        }
      }

      // Create KYC record
      const record: KycRecord = {
        id: `kyc-${Date.now()}`,
        ensName: request.ensName,
        address: request.address,
        verificationData,
        thresholdScheme: {
          totalKeys: thresholdConfig.totalKeys,
          requiredKeys: thresholdConfig.requiredKeys,
          keys: keyShares.map((share, index) => ({
            id: `key-${index + 1}`,
            publicKey: share.value,
            encryptedPrivateKey: share.encryptedPrivateKey,
            keyShare: share.value,
            index: index + 1,
          })),
          encryptedData,
          createdAt: new Date().toISOString(),
        },
        randomnessId,
        blocklockData,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          version: '1.0.0',
          schema: 'kyc-v1',
          tags: ['kyc', 'verification'],
        },
      }

      // Store KYC record
      await this.storeKycRecord(record)

      return {
        success: true,
        recordId: record.id,
        status: 'pending',
        message: 'KYC verification initiated successfully',
        estimatedTime: '24-48 hours',
      }
    } catch (error) {
      console.error('Failed to initiate KYC verification:', error)
      return {
        success: false,
        status: 'rejected',
        message: 'Failed to initiate KYC verification',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * Verify user identity using biometric verification
   */
  async verifyBiometric(request: BiometricVerificationRequest): Promise<BiometricVerificationResult> {
    try {
      // Check if user has KYC record
      const kycStatus = await this.checkKycStatus(request.ensName)
      if (!kycStatus.hasKyc || kycStatus.status !== 'approved') {
        return {
          success: false,
          verified: false,
          userId: request.userId,
          challenge: request.challenge,
          timestamp: new Date().toISOString(),
          deviceInfo: biometricVerification.getDeviceInfo(),
        }
      }

      // Verify biometric credential
      const result = await biometricVerification.verifyCredential(
        request.userId,
        request.challenge,
        request.ensName
      )

      if (result.verified) {
        // Update last verification time
        const record = kycStatus.record!
        record.lastVerifiedAt = new Date().toISOString()
        await this.updateKycRecord(record)
      }

      return result
    } catch (error) {
      console.error('Failed to verify biometric:', error)
      return {
        success: false,
        verified: false,
        userId: request.userId,
        challenge: request.challenge,
        timestamp: new Date().toISOString(),
        deviceInfo: biometricVerification.getDeviceInfo(),
      }
    }
  }

  /**
   * Decrypt KYC data using threshold cryptography
   */
  async decryptKycData(request: ThresholdDecryptionRequest): Promise<ThresholdDecryptionResult> {
    try {
      // Get KYC record
      const kycStatus = await this.checkKycStatus(request.ensName)
      if (!kycStatus.hasKyc || !kycStatus.record) {
        return {
          success: false,
          error: 'KYC record not found',
          usedKeys: 0,
          requiredKeys: 0,
        }
      }

      const record = kycStatus.record
      const { totalKeys, requiredKeys, encryptedData } = record.thresholdScheme

      // Validate key shares
      if (request.keyShares.length < requiredKeys) {
        return {
          success: false,
          error: `Insufficient key shares. Required: ${requiredKeys}, Provided: ${request.keyShares.length}`,
          usedKeys: request.keyShares.length,
          requiredKeys,
        }
      }

      // Reconstruct master key from shares
      const masterKey = thresholdCrypto.reconstructSecret(
        request.keyShares.map((share, index) => ({
          index: index + 1,
          value: share,
          encryptedPrivateKey: '',
        }))
      )

      if (!masterKey) {
        return {
          success: false,
          error: 'Failed to reconstruct master key',
          usedKeys: request.keyShares.length,
          requiredKeys,
        }
      }

      // Decrypt KYC data
      const decryptedData = thresholdCrypto.decryptData(encryptedData, masterKey)
      if (!decryptedData) {
        return {
          success: false,
          error: 'Failed to decrypt KYC data',
          usedKeys: request.keyShares.length,
          requiredKeys,
        }
      }

      return {
        success: true,
        decryptedData,
        usedKeys: request.keyShares.length,
        requiredKeys,
      }
    } catch (error) {
      console.error('Failed to decrypt KYC data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        usedKeys: 0,
        requiredKeys: 0,
      }
    }
  }

  /**
   * Get KYC record by ENS name
   */
  private async getKycRecord(ensName: string): Promise<KycRecord | null> {
    try {
      if (typeof window === 'undefined') {
        // Server-side: would typically query database
        return null
      }

      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return null

      const records: Record<string, KycRecord> = JSON.parse(stored)
      return records[ensName] || null
    } catch (error) {
      console.error('Failed to get KYC record:', error)
      return null
    }
  }

  /**
   * Store KYC record
   */
  private async storeKycRecord(record: KycRecord): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        // Server-side: would typically store in database
        return
      }

      const stored = localStorage.getItem(this.storageKey)
      const records: Record<string, KycRecord> = stored ? JSON.parse(stored) : {}
      records[record.ensName] = record
      localStorage.setItem(this.storageKey, JSON.stringify(records))
    } catch (error) {
      console.error('Failed to store KYC record:', error)
      throw error
    }
  }

  /**
   * Update KYC record
   */
  private async updateKycRecord(record: KycRecord): Promise<void> {
    await this.storeKycRecord(record)
  }

  /**
   * Detect document type from filename
   */
  private detectDocumentType(filename: string): KycRecord['verificationData']['documents'][0]['type'] {
    const lower = filename.toLowerCase()
    
    if (lower.includes('passport')) return 'passport'
    if (lower.includes('license') || lower.includes('dl')) return 'drivers_license'
    if (lower.includes('id') || lower.includes('identity')) return 'national_id'
    if (lower.includes('utility') || lower.includes('bill')) return 'utility_bill'
    if (lower.includes('bank') || lower.includes('statement')) return 'bank_statement'
    
    return 'national_id' // Default
  }

  /**
   * Get device capabilities for biometric verification
   */
  async getDeviceCapabilities() {
    return await biometricVerification.getDeviceCapabilities()
  }

  /**
   * Create biometric credential for user
   */
  async createBiometricCredential(userId: string, userDisplayName: string) {
    const challenge = thresholdCrypto.generateChallenge()
    const credential = await biometricVerification.createCredential(
      userId,
      userDisplayName,
      challenge
    )
    
    if (credential) {
      // Store credential reference
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.biometricKey)
        const credentials: Record<string, any> = stored ? JSON.parse(stored) : {}
        credentials[userId] = credential
        localStorage.setItem(this.biometricKey, JSON.stringify(credentials))
      }
    }
    
    return { credential, challenge }
  }

  /**
   * Generate verifiable random ID for KYC records
   */
  async generateRandomKycId(chainId: number): Promise<string> {
    try {
      const randomness = this.getRandomnessInstance(chainId)
      const response = await randomness.requestRandomness({})
      return response.toString()
    } catch (error) {
      console.error('Failed to generate random KYC ID:', error)
      // Fallback to crypto.randomUUID if dcipher fails
      return crypto.randomUUID()
    }
  }

  /**
   * Encrypt KYC data with blocklock for conditional release
   */
  async encryptKycDataWithBlocklock(
    data: string,
    unlockBlockHeight: number,
    chainId: number
  ): Promise<{ ciphertext: any; condition: string }> {
    try {
      const blocklock = this.getBlocklockInstance(chainId)
      const encodedData = new TextEncoder().encode(data)
      const ciphertext = blocklock.encrypt(encodedData, BigInt(unlockBlockHeight))
      const condition = encodeCondition(BigInt(unlockBlockHeight))
      
      return {
        ciphertext: encodeCiphertextToSolidity(ciphertext),
        condition: condition.toString()
      }
    } catch (error) {
      console.error('Failed to encrypt KYC data with blocklock:', error)
      throw new Error('Blocklock encryption failed')
    }
  }

  /**
   * Get randomness instance for chain
   */
  private getRandomnessInstance(chainId: number) {
    switch (chainId) {
      case 84532: // Base Sepolia
        return Randomness.createBaseSepolia(this.dcipherConfig.providers.baseSepolia)
      case 314159: // Filecoin Calibration
        return Randomness.createFilecoinCalibnet(this.dcipherConfig.providers.filecoinCalibration)
      case 137: // Polygon
        return Randomness.createPolygonPos(this.dcipherConfig.providers.polygon)
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`)
    }
  }

  /**
   * Get blocklock instance for chain
   */
  private getBlocklockInstance(chainId: number) {
    switch (chainId) {
      case 84532: // Base Sepolia
        return Blocklock.createBaseSepolia(this.dcipherConfig.providers.baseSepolia)
      case 314159: // Filecoin Calibration
        return Blocklock.createFilecoinCalibnet(this.dcipherConfig.providers.filecoinCalibration)
      case 137: // Polygon
        return Blocklock.createPolygonPos(this.dcipherConfig.providers.polygon)
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`)
    }
  }
}

export const kycService = new KycService()
