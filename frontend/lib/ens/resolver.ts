/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createPublicClient, http, getAddress, isAddress, createWalletClient, custom } from 'viem'
import { mainnet } from 'wagmi/chains'
import { normalize } from 'viem/ens'
import { ensResolverAddress, ABI } from '@/contracts/abi'
import type { KycRecord } from '../kyc/types'

export interface EnsProfile {
  name: string
  address: `0x${string}`
  avatar?: string
  description?: string
  url?: string
  twitter?: string
  github?: string
  email?: string
}

export interface EnsResolution {
  name: string | null
  address: `0x${string}`
  isPrimary: boolean
  profile?: EnsProfile
}

class EnsResolver {
  private client = createPublicClient({
    chain: mainnet,
    transport: http(),
  })

  /**
   * Resolve ENS name to address
   */
  async resolveName(name: string): Promise<`0x${string}` | null> {
    try {
      // Check if name is empty or invalid
      if (!name || name.trim() === '' || name === '‎') {
        return null
      }
      
      const normalizedName = normalize(name)
      const address = await this.client.getEnsAddress({
        name: normalizedName,
      })
      return address
    } catch (error) {
      console.error('Failed to resolve ENS name:', error)
      return null
    }
  }

  /**
   * Resolve address to primary ENS name
   */
  async lookupAddress(address: `0x${string}`): Promise<string | null> {
    try {
      const name = await this.client.getEnsName({
        address,
      })
      return name
    } catch (error) {
      console.error('Failed to lookup ENS name:', error)
      return null
    }
  }

  /**
   * Get full ENS profile including text records
   */
  async getProfile(nameOrAddress: string): Promise<EnsProfile | null> {
    try {
      let name: string
      let address: `0x${string}`

      if (isAddress(nameOrAddress)) {
        address = nameOrAddress as `0x${string}`
        const resolvedName = await this.lookupAddress(address)
        if (!resolvedName) return null
        name = resolvedName
      } else {
        name = nameOrAddress
        const resolvedAddress = await this.resolveName(name)
        if (!resolvedAddress) return null
        address = resolvedAddress
      }

      const normalizedName = normalize(name)
      
      // Get avatar
      const avatar = await this.client.getEnsAvatar({
        name: normalizedName,
      })

      // Get text records
      const resolverAddress = await this.client.getEnsResolver({
        name: normalizedName,
      })

      if (!resolverAddress) {
        return {
          name,
          address,
          avatar: avatar || undefined,
        }
      }

      // Get text records using the client directly
      const [description, url, twitter, github, email] = await Promise.all([
        this.client.getEnsText({ name: normalizedName, key: 'description' }).catch(() => null),
        this.client.getEnsText({ name: normalizedName, key: 'url' }).catch(() => null),
        this.client.getEnsText({ name: normalizedName, key: 'com.twitter' }).catch(() => null),
        this.client.getEnsText({ name: normalizedName, key: 'com.github' }).catch(() => null),
        this.client.getEnsText({ name: normalizedName, key: 'email' }).catch(() => null),
      ])

      return {
        name,
        address,
        avatar: avatar || undefined,
        description: description || undefined,
        url: url || undefined,
        twitter: twitter || undefined,
        github: github || undefined,
        email: email || undefined,
      }
    } catch (error) {
      console.error('Failed to get ENS profile:', error)
      return null
    }
  }

  /**
   * Check if an ENS name is available for registration
   */
  async isNameAvailable(name: string): Promise<boolean> {
    try {
      const normalizedName = normalize(name)
      const address = await this.resolveName(normalizedName)
      return address === null
    } catch (error) {
      console.error('Failed to check name availability:', error)
      return false
    }
  }

  /**
   * Get all ENS names owned by an address
   */
  async getNamesByAddress(address: `0x${string}`): Promise<string[]> {
    try {
      // This would typically use The Graph subgraph
      // For now, we'll just return the primary name
      const primaryName = await this.lookupAddress(address)
      return primaryName ? [primaryName] : []
    } catch (error) {
      console.error('Failed to get names by address:', error)
      return []
    }
  }

  /**
   * Validate ENS name format
   */
  isValidName(name: string): boolean {
    try {
      normalize(name)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get the primary ENS name for an address (most recent)
   */
  async getPrimaryName(address: `0x${string}`): Promise<string | null> {
    try {
      const name = await this.lookupAddress(address)
      if (!name) return null

      // Verify it's still the primary name by checking reverse resolution
      const reverseAddress = await this.resolveName(name)
      if (reverseAddress?.toLowerCase() === address.toLowerCase()) {
        return name
      }

      return null
    } catch (error) {
      console.error('Failed to get primary name:', error)
      return null
    }
  }

  /**
   * Register a new ENS name using the resolver contract
   */
  async registerEnsName(
    label: string, 
    owner: `0x${string}`,
    walletClient: any
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const normalizedLabel = normalize(label)
      
      // Create subnode under .eth domain
      const parentNode = '0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae' // .eth node
      
      const { request } = await this.client.simulateContract({
        address: ensResolverAddress,
        abi: ABI,
        functionName: 'createSubnode',
        args: [parentNode, normalizedLabel, owner, []],
        account: owner,
      })
      
      const txHash = await walletClient.writeContract(request)
      
      return {
        success: true,
        txHash
      }
    } catch (error) {
      console.error('Failed to register ENS name:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }

  /**
   * Check if ENS name is available for registration
   */
  async checkAvailability(label: string): Promise<boolean> {
    try {
      const fullName = `${label}.eth`
      const address = await this.resolveName(fullName)
      return address === null
    } catch {
      return true
    }
  }

  /**
   * Generate a unique ENS name for a user if none exists
   */
  async generateUniqueEnsName(address: `0x${string}`): Promise<string> {
    const baseLabel = `user-${address.slice(2, 8).toLowerCase()}`
    
    // Check if base name is available
    if (await this.checkAvailability(baseLabel)) {
      return `${baseLabel}.eth`
    }
    
    // Try with incrementing numbers
    for (let i = 1; i <= 999; i++) {
      const label = `${baseLabel}-${i}`
      if (await this.checkAvailability(label)) {
        return `${label}.eth`
      }
    }
    
    // Fallback to timestamp
    const timestamp = Date.now().toString().slice(-6)
    return `${baseLabel}-${timestamp}.eth`
  }

  /**
   * Get or create ENS name for KYC identification
   */
  async getOrCreateEnsForKyc(
    address: `0x${string}`,
    walletClient?: any
  ): Promise<{ ensName: string; isNew: boolean; txHash?: string }> {
    try {
      // First, check if user already has an ENS name
      const existingName = await this.getPrimaryName(address)
      
      if (existingName) {
        return {
          ensName: existingName,
          isNew: false
        }
      }
      
      // No ENS name found, generate and register one
      if (!walletClient) {
        throw new Error('Wallet client required for ENS registration')
      }
      
      const suggestedName = await this.generateUniqueEnsName(address)
      const label = suggestedName.replace('.eth', '')
      
      const result = await this.registerEnsName(label, address, walletClient)
      
      if (result.success) {
        return {
          ensName: suggestedName,
          isNew: true,
          txHash: result.txHash
        }
      } else {
        throw new Error(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Failed to get or create ENS for KYC:', error)
      throw error
    }
  }
}

export const ensResolver = new EnsResolver()


// KYC Storage Service
class KycStorageService {
  private storageKey = 'unikyc_records'
  
  /**
   * Store KYC record using ENS name as identifier
   */
  async storeKycRecord(record: KycRecord): Promise<void> {
    try {
      const records = await this.getAllRecords()
      records[record.ensName] = record
      
      // In production, this would be stored on IPFS/Filecoin
      localStorage.setItem(this.storageKey, JSON.stringify(records))
    } catch (error) {
      console.error('Failed to store KYC record:', error)
      throw error
    }
  }
  
  /**
   * Retrieve KYC record by ENS name
   */
  async getKycRecord(ensName: string): Promise<KycRecord | null> {
    try {
      const records = await this.getAllRecords()
      return records[ensName] || null
    } catch (error) {
      console.error('Failed to get KYC record:', error)
      return null
    }
  }
  
  /**
   * Get KYC record by address (resolve ENS first)
   */
  async getKycRecordByAddress(address: `0x${string}`): Promise<KycRecord | null> {
    try {
      const ensName = await ensResolver.getPrimaryName(address)
      if (!ensName) return null
      
      return await this.getKycRecord(ensName)
    } catch (error) {
      console.error('Failed to get KYC record by address:', error)
      return null
    }
  }
  
  /**
   * Update KYC record status
   */
  async updateKycStatus(
    ensName: string, 
    status: KycRecord['status'],
    lastVerifiedAt?: string
  ): Promise<void> {
    try {
      const record = await this.getKycRecord(ensName)
      if (!record) throw new Error('KYC record not found')
      
      record.status = status
      if (lastVerifiedAt) {
        record.lastVerifiedAt = lastVerifiedAt
      }
      
      await this.storeKycRecord(record)
    } catch (error) {
      console.error('Failed to update KYC status:', error)
      throw error
    }
  }
  
  /**
   * Check if KYC exists and get status
   */
  async checkKycStatus(ensName: string): Promise<{
    hasKyc: boolean
    status?: KycRecord['status']
    record?: KycRecord
  }> {
    try {
      const record = await this.getKycRecord(ensName)
      
      if (!record) {
        return { hasKyc: false }
      }
      
      return {
        hasKyc: true,
        status: record.status,
        record
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error)
      return { hasKyc: false }
    }
  }
  
  private async getAllRecords(): Promise<Record<string, KycRecord>> {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }
}

export const kycStorage = new KycStorageService()
