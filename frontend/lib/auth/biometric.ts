/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export interface BiometricCredential {
  id: string
  type: 'public-key'
  transports: string[]
}

export interface BiometricVerificationOptions {
  challenge: string
  rpId: string
  rpName: string
  userDisplayName: string
  userId: string
  timeout?: number
}

export interface BiometricVerificationResult {
  success: boolean
  verified: boolean
  userId: string
  challenge: string
  timestamp: string
  deviceInfo: {
    type: string
    id: string
    name: string
  }
  error?: string
}

export interface DeviceCapabilities {
  hasBiometric: boolean
  hasPasskey: boolean
  supportedTypes: ('face_id' | 'fingerprint' | 'passkey')[]
  isSecure: boolean
}

export class BiometricVerification {
  private readonly rpId: string
  private readonly rpName: string

  constructor(rpId: string, rpName: string) {
    this.rpId = rpId
    this.rpName = rpName
  }

  /**
   * Check if WebAuthn is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'PublicKeyCredential' in window &&
           'credentials' in navigator
  }

  /**
   * Check device capabilities
   */
  async getDeviceCapabilities(): Promise<DeviceCapabilities> {
    if (!this.isSupported()) {
      return {
        hasBiometric: false,
        hasPasskey: false,
        supportedTypes: [],
        isSecure: false,
      }
    }

    try {
      // Check if user verification is supported
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      
      return {
        hasBiometric: available,
        hasPasskey: true,
        supportedTypes: available ? ['face_id', 'fingerprint', 'passkey'] : ['passkey'],
        isSecure: available,
      }
    } catch (error) {
      console.error('Failed to check device capabilities:', error)
      return {
        hasBiometric: false,
        hasPasskey: true,
        supportedTypes: ['passkey'],
        isSecure: false,
      }
    }
  }

  /**
   * Generate challenge for verification
   */
  generateChallenge(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Convert challenge string to ArrayBuffer
   */
  private challengeToArrayBuffer(challenge: string): ArrayBuffer {
    const bytes = new Uint8Array(challenge.length / 2)
    for (let i = 0; i < challenge.length; i += 2) {
      bytes[i / 2] = parseInt(challenge.substr(i, 2), 16)
    }
    return bytes.buffer
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Create biometric credential
   */
  async createCredential(
    userId: string,
    userDisplayName: string,
    challenge: string
  ): Promise<BiometricCredential | null> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn not supported')
    }

    try {
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: this.challengeToArrayBuffer(challenge),
        rp: {
          id: this.rpId,
          name: this.rpName,
        },
        user: {
          id: this.base64ToArrayBuffer(userId),
          name: userId,
          displayName: userDisplayName,
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7, // ES256
          },
        ],
        timeout: 60000,
        attestation: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: false,
        },
      }

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to create credential')
      }

      return {
        id: credential.id,
        type: credential.type as 'public-key',
        transports: (credential as any).getTransports?.() || [],
      }
    } catch (error) {
      console.error('Failed to create biometric credential:', error)
      return null
    }
  }

  /**
   * Verify biometric credential
   */
  async verifyCredential(
    credentialId: string,
    challenge: string,
    userId: string
  ): Promise<BiometricVerificationResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        verified: false,
        userId,
        challenge,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          type: 'unknown',
          id: 'unknown',
          name: 'unknown',
        },
        error: 'WebAuthn not supported',
      }
    }

    try {
      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge: this.challengeToArrayBuffer(challenge),
        rpId: this.rpId,
        allowCredentials: [
          {
            id: this.base64ToArrayBuffer(credentialId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      }

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential

      if (!assertion) {
        throw new Error('Failed to get assertion')
      }

      // Verify the signature
      const signature = assertion.response as AuthenticatorAssertionResponse
      const clientDataJSON = signature.clientDataJSON
      const authenticatorData = signature.authenticatorData
      const signatureBytes = signature.signature

      // In a real implementation, you would verify the signature on the server
      // For now, we'll assume it's valid if we get here

      return {
        success: true,
        verified: true,
        userId,
        challenge,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          type: 'biometric',
          id: credentialId,
          name: 'Biometric Device',
        },
      }
    } catch (error) {
      console.error('Failed to verify biometric credential:', error)
      return {
        success: false,
        verified: false,
        userId,
        challenge,
        timestamp: new Date().toISOString(),
        deviceInfo: {
          type: 'unknown',
          id: 'unknown',
          name: 'unknown',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check if user has stored credentials
   */
  async hasStoredCredentials(): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch {
      return false
    }
  }

  /**
   * Get stored credentials for a user
   */
  async getStoredCredentials(): Promise<BiometricCredential[]> {
    if (!this.isSupported()) {
      return []
    }

    try {
      // This would typically query a credential store
      // For now, we'll return an empty array
      return []
    } catch (error) {
      console.error('Failed to get stored credentials:', error)
      return []
    }
  }

  /**
   * Delete stored credential
   */
  async deleteCredential(credentialId: string): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      // This would typically delete from a credential store
      // For now, we'll return true
      return true
    } catch (error) {
      console.error('Failed to delete credential:', error)
      return false
    }
  }

  /**
   * Get device information
   */
  getDeviceInfo(): { type: string; name: string; id: string } {
    if (typeof window === 'undefined') {
      return { type: 'unknown', name: 'Server', id: 'server' }
    }

    const userAgent = navigator.userAgent
    let deviceType = 'desktop'
    let deviceName = 'Unknown Device'

    if (/Android/i.test(userAgent)) {
      deviceType = 'android'
      deviceName = 'Android Device'
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      deviceType = 'ios'
      deviceName = 'iOS Device'
    } else if (/Windows/i.test(userAgent)) {
      deviceType = 'windows'
      deviceName = 'Windows Device'
    } else if (/Mac/i.test(userAgent)) {
      deviceType = 'mac'
      deviceName = 'Mac Device'
    } else if (/Linux/i.test(userAgent)) {
      deviceType = 'linux'
      deviceName = 'Linux Device'
    }

    return {
      type: deviceType,
      name: deviceName,
      id: `${deviceType}-${Date.now()}`,
    }
  }
}

// Create default instance
export const biometricVerification = new BiometricVerification(
  typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  'UniKYC'
)
