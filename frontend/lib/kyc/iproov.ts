export interface IProovConfig {
  baseUrl: string
  apiKey: string
  apiSecret: string
}

export interface IProovToken {
  token: string
  type: 'enrol' | 'verify'
  userId: string
}

export interface IProovResult {
  success: boolean
  token: string
  frame?: string
  feedback?: string
  reason?: string
  error?: string
  type: 'enrol' | 'verify'
}

export class IProovService {
  private config: IProovConfig

  constructor(config: IProovConfig) {
    this.config = config
  }

  /**
   * Generate an enrollment token for new users
   */
  async generateEnrolToken(userId: string): Promise<IProovToken> {
    try {
      const response = await fetch(`${this.config.baseUrl}/claim/enrol/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.config.apiKey}:${this.config.apiSecret}`)}`
        },
        body: JSON.stringify({
          user_id: userId,
          resource: 'unikyc-enrol'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate enrol token')
      }

      return {
        token: data.token,
        type: 'enrol',
        userId
      }
    } catch (error) {
      console.error('Failed to generate iProov enrol token:', error)
      throw error
    }
  }

  /**
   * Generate a verification token for existing users
   */
  async generateVerifyToken(userId: string): Promise<IProovToken> {
    try {
      const response = await fetch(`${this.config.baseUrl}/claim/verify/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.config.apiKey}:${this.config.apiSecret}`)}`
        },
        body: JSON.stringify({
          user_id: userId,
          resource: 'unikyc-verify'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate verify token')
      }

      return {
        token: data.token,
        type: 'verify',
        userId
      }
    } catch (error) {
      console.error('Failed to generate iProov verify token:', error)
      throw error
    }
  }

  /**
   * Validate the result from iProov
   */
  async validateResult(token: string, type: 'enrol' | 'verify'): Promise<IProovResult> {
    try {
      const endpoint = type === 'enrol' ? 'enrol' : 'verify'
      const response = await fetch(`${this.config.baseUrl}/claim/${endpoint}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.config.apiKey}:${this.config.apiSecret}`)}`
        },
        body: JSON.stringify({
          token,
          ip: 'unknown', // In production, get real IP
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate iProov result')
      }

      return {
        success: data.passed || false,
        token,
        frame: data.frame,
        feedback: data.feedback_code,
        reason: data.reason,
        type
      }
    } catch (error) {
      console.error('Failed to validate iProov result:', error)
      throw error
    }
  }
}

// Default configuration - should be moved to environment variables
const defaultConfig: IProovConfig = {
  baseUrl: process.env.NEXT_PUBLIC_IPROOV_BASE_URL || 'https://eu.rp.secure.iproov.me',
  apiKey: process.env.IPROOV_API_KEY || '',
  apiSecret: process.env.IPROOV_API_SECRET || ''
}

export const iproovService = new IProovService(defaultConfig)
