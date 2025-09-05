/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Camera } from 'lucide-react'
import { iproovService, IProovToken, IProovResult } from '@/lib/kyc/iproov'

interface IProovVerificationProps {
  userId: string
  type: 'enrol' | 'verify'
  onComplete: (result: IProovResult) => void
  onError: (error: string) => void
}

export function IProovVerification({ userId, type, onComplete, onError }: IProovVerificationProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'scanning' | 'processing' | 'complete' | 'error'>('loading')
  const [token, setToken] = useState<IProovToken | null>(null)
  const [error, setError] = useState<string | null>(null)
  const iproovRef = useRef<HTMLDivElement>(null)

  
  const initializeIProov = useCallback(async () => {
    try {
      setStatus('loading')
      setError(null)

      // Generate token
      const iproovToken = type === 'enrol' 
        ? await iproovService.generateEnrolToken(userId)
        : await iproovService.generateVerifyToken(userId)
      
      setToken(iproovToken)
      setStatus('ready')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize face verification'
      setError(errorMessage)
      setStatus('error')
      onError(errorMessage)
    }
  }, [userId, type, onError])
  
  useEffect(() => {
    initializeIProov()
  }, [userId, type, initializeIProov])

  const startIProov = () => {
    if (!token || !iproovRef.current) return

    setStatus('scanning')

    // Create iProov element
    const iproovElement = document.createElement('iproov-me')
    iproovElement.setAttribute('token', token.token)
    iproovElement.setAttribute('base_url', 'https://eu.rp.secure.iproov.me')
    iproovElement.setAttribute('logo', '/logo.png')
    iproovElement.setAttribute('filter', 'shaded')
    
    // Add event listeners
    iproovElement.addEventListener('ready', () => {
      console.log('iProov ready')
    })

    iproovElement.addEventListener('started', () => {
      setStatus('scanning')
    })

    iproovElement.addEventListener('streaming', () => {
      console.log('iProov streaming')
    })

    iproovElement.addEventListener('streamed', () => {
      setStatus('processing')
    })

    iproovElement.addEventListener('passed', async (event: any) => {
      try {
        const result = await iproovService.validateResult(token.token, type)
        setStatus('complete')
        onComplete(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Validation failed'
        setError(errorMessage)
        setStatus('error')
        onError(errorMessage)
      }
    })

    iproovElement.addEventListener('failed', (event: any) => {
      const reason = event.detail?.reason || 'Face verification failed'
      setError(reason)
      setStatus('error')
      onError(reason)
    })

    iproovElement.addEventListener('error', (event: any) => {
      const reason = event.detail?.reason || 'An error occurred during verification'
      setError(reason)
      setStatus('error')
      onError(reason)
    })

    iproovElement.addEventListener('canceled', () => {
      setStatus('ready')
    })

    // Clear container and add iProov element
    iproovRef.current.innerHTML = ''
    iproovRef.current.appendChild(iproovElement)
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p>Initializing face verification...</p>
          </div>
        )

      case 'ready':
        return (
          <div className="text-center space-y-4">
            <Camera className="h-12 w-12 mx-auto text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">
                {type === 'enrol' ? 'Register Your Face' : 'Verify Your Identity'}
              </h3>
              <p className="text-muted-foreground">
                {type === 'enrol' 
                  ? 'We\'ll capture your face to create a secure biometric template'
                  : 'Look at the camera to verify your identity'
                }
              </p>
            </div>
            <Button onClick={startIProov} className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Start Face {type === 'enrol' ? 'Registration' : 'Verification'}
            </Button>
          </div>
        )

      case 'scanning':
        return (
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="h-64 w-64 mx-auto border-2 border-blue-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <p>Look at the camera and follow the instructions</p>
          </div>
        )

      case 'processing':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p>Processing your verification...</p>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Verification Successful</h3>
              <p className="text-muted-foreground">
                Your face has been {type === 'enrol' ? 'registered' : 'verified'} successfully
              </p>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-700">Verification Failed</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={initializeIProov} variant="outline">
              Try Again
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Face Verification</CardTitle>
        <CardDescription>
          {type === 'enrol' 
            ? 'Register your face for secure identity verification'
            : 'Verify your identity using face recognition'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && status !== 'error' && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div ref={iproovRef} className="min-h-[300px] flex items-center justify-center">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  )
}
