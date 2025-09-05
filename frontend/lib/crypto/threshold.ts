/* eslint-disable @typescript-eslint/no-unused-vars */

import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto'
// import { scrypt } from 'crypto'

export interface KeyShare {
  index: number
  value: string
  encryptedPrivateKey: string
}

export interface ThresholdConfig {
  totalKeys: number
  requiredKeys: number
}

export class ThresholdCryptography {
  private readonly prime = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639747')
  private readonly generator = BigInt(2)

  /**
   * Generate a random secret key
   */
  private generateSecret(): bigint {
    return BigInt('0x' + randomBytes(32).toString('hex')) % this.prime
  }

  /**
   * Generate polynomial coefficients for Shamir's Secret Sharing
   */
  private generatePolynomial(secret: bigint, degree: number): bigint[] {
    const coefficients = [secret]
    for (let i = 1; i <= degree; i++) {
      coefficients.push(BigInt('0x' + randomBytes(32).toString('hex')) % this.prime)
    }
    return coefficients
  }

  /**
   * Evaluate polynomial at given point
   */
  private evaluatePolynomial(coefficients: bigint[], x: bigint): bigint {
    let result = BigInt(0)
    for (let i = 0; i < coefficients.length; i++) {
      result = (result + coefficients[i] * this.modPow(x, BigInt(i))) % this.prime
    }
    return result
  }

  /**
   * Modular exponentiation
   */
  private modPow(base: bigint, exponent: bigint): bigint {
    let result = BigInt(1)
    base = base % this.prime
    while (exponent > 0) {
      if (exponent % BigInt(2) === BigInt(1)) {
        result = (result * base) % this.prime
      }
      exponent = exponent >> BigInt(1)
      base = (base * base) % this.prime
    }
    return result
  }

  /**
   * Lagrange interpolation to reconstruct secret
   */
  private lagrangeInterpolate(points: { x: bigint; y: bigint }[]): bigint {
    let secret = BigInt(0)
    const n = points.length

    for (let i = 0; i < n; i++) {
      let numerator = BigInt(1)
      let denominator = BigInt(1)

      for (let j = 0; j < n; j++) {
        if (i !== j) {
          numerator = (numerator * (-points[j].x)) % this.prime
          denominator = (denominator * (points[i].x - points[j].x)) % this.prime
        }
      }

      const term = (points[i].y * numerator * this.modInverse(denominator)) % this.prime
      secret = (secret + term) % this.prime
    }

    return secret
  }

  /**
   * Modular multiplicative inverse
   */
  private modInverse(a: bigint): bigint {
    let [old_r, r] = [a, this.prime]
    let [old_s, s] = [BigInt(1), BigInt(0)]
    let [old_t, t] = [BigInt(0), BigInt(1)]

    while (r !== BigInt(0)) {
      const quotient = old_r / r
      ;[old_r, r] = [r, old_r - quotient * r]
      ;[old_s, s] = [s, old_s - quotient * s]
      ;[old_t, t] = [t, old_t - quotient * t]
    }

    return (old_s % this.prime + this.prime) % this.prime
  }

  /**
   * Generate key shares using Shamir's Secret Sharing
   */
  generateKeyShares(secret: string, config: ThresholdConfig): KeyShare[] {
    const secretBigInt = BigInt('0x' + Buffer.from(secret, 'utf8').toString('hex'))
    const degree = config.requiredKeys - 1
    const coefficients = this.generatePolynomial(secretBigInt, degree)
    const shares: KeyShare[] = []

    for (let i = 1; i <= config.totalKeys; i++) {
      const x = BigInt(i)
      const y = this.evaluatePolynomial(coefficients, x)
      
      // Encrypt the private key share
      const encryptedPrivateKey = this.encryptPrivateKey(y.toString(16))
      
      shares.push({
        index: i,
        value: y.toString(16),
        encryptedPrivateKey,
      })
    }

    return shares
  }

  /**
   * Reconstruct secret from key shares
   */
  reconstructSecret(shares: KeyShare[]): string | null {
    if (shares.length < 2) {
      throw new Error('At least 2 shares required for reconstruction')
    }

    try {
      const points = shares.map(share => ({
        x: BigInt(share.index),
        y: BigInt('0x' + share.value),
      }))

      const secret = this.lagrangeInterpolate(points)
      return Buffer.from(secret.toString(16), 'hex').toString('utf8')
    } catch (error) {
      console.error('Failed to reconstruct secret:', error)
      return null
    }
  }

  /**
   * Encrypt data using threshold scheme
   */
  encryptData(data: string, masterKey: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', Buffer.from(masterKey, 'hex').subarray(0, 32), iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    
    return JSON.stringify({
      encrypted,
      authTag: authTag.toString('hex'),
      iv: iv.toString('hex'),
    })
  }

  /**
   * Decrypt data using threshold scheme
   */
  decryptData(encryptedData: string, masterKey: string): string | null {
    try {
      const { encrypted, authTag, iv } = JSON.parse(encryptedData)
      const decipher = createDecipheriv('aes-256-gcm', Buffer.from(masterKey, 'hex').subarray(0, 32), Buffer.from(iv, 'hex'))
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Failed to decrypt data:', error)
      return null
    }
  }

  /**
   * Encrypt private key share
   */
  private encryptPrivateKey(privateKey: string): string {
    // In a real implementation, this would use the user's device key
    // For now, we'll use a simple encryption
    const key = randomBytes(32)
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', key, iv)
    let encrypted = cipher.update(privateKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return JSON.stringify({
      encrypted,
      authTag: cipher.getAuthTag().toString('hex'),
      iv: iv.toString('hex'),
      key: key.toString('hex'),
    })
  }

  /**
   * Decrypt private key share
   */
  decryptPrivateKey(encryptedPrivateKey: string, deviceKey?: Buffer): string | null {
    try {
      const { encrypted, authTag, iv, key } = JSON.parse(encryptedPrivateKey)
      const decryptionKey = deviceKey || Buffer.from(key, 'hex')
      const decipher = createDecipheriv('aes-256-gcm', decryptionKey, Buffer.from(iv, 'hex'))
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'))
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Failed to decrypt private key:', error)
      return null
    }
  }

  /**
   * Validate threshold configuration
   */
  validateConfig(config: ThresholdConfig): boolean {
    return (
      config.totalKeys > 0 &&
      config.requiredKeys > 0 &&
      config.requiredKeys <= config.totalKeys &&
      config.totalKeys <= 10 // Reasonable limit
    )
  }

  /**
   * Generate a secure random challenge for biometric verification
   */
  generateChallenge(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Hash data for verification
   */
  async hashData(data: string): Promise<string> {
    const {createHash} = await import('node:crypto');
    return createHash('sha256').update(data).digest('hex')
  }
}

export const thresholdCrypto = new ThresholdCryptography()
