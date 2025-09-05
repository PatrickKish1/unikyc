/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useKycStatus } from '../../hooks/useKycStatus'
import { useKycVerification } from '../../hooks/useKycVerification'
import { useEnsRegistration } from '../../hooks/useEnsRegistration'
import { kycService } from '@/lib/kyc/service'
import { ensResolver } from '@/lib/ens/resolver'
import { biometricVerification } from '@/lib/auth/biometric'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, AlertCircle, Shield, User, FileText, Camera } from 'lucide-react'
import { ConnectWallet } from "@coinbase/onchainkit/wallet"
import { DocumentUpload, DocumentFile } from './DocumentUpload'
import { IProovVerification } from './IProovVerification'
import { LoadingBackdrop } from './loading-spinner'
export interface KycButtonProps {
  identifier?: string
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  onKycComplete?: (status: any) => void
  onKycError?: (error: string) => void
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children?: React.ReactNode
  showFullFlow?: boolean
}

export function KycButton({
  identifier,
  onSuccess,
  onError,
  onKycComplete,
  onKycError,
  className = '',
  variant = 'default',
  size = 'default',
  children,
  showFullFlow = false,
}: KycButtonProps) {
  const { address, isConnected } = useAccount()
  const [showModal, setShowModal] = useState(false)
  const [currentStep, setCurrentStep] = useState<'check' | 'kyc' | 'biometric' | 'complete'>('check')
  const [ensName, setEnsName] = useState<string>('')
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
  })
  const [selectedChainId, setSelectedChainId] = useState(84532) // Default to Base Sepolia
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [selfie, setSelfie] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Hooks
  const { kycStatus, isLoading: statusLoading, refetch: refetchStatus } = useKycStatus(ensName)
  const { initiateVerification, isInitiating, verificationResult, error, clearError } = useKycVerification()
  const { registerEns, isRegistering, error: ensError, clearError: clearEnsError } = useEnsRegistration()

  
  const detectEnsName = useCallback(async () => {
    if (!address) return
    
    try {
      const name = await ensResolver.lookupAddress(address)
      if (name) {
        setEnsName(name)
        // Auto-check KYC status
        await refetchStatus()
      } else {
        // No ENS name found, suggest registration
        console.log('No ENS name found for address, user can register one')
      }
    } catch (error) {
      console.error('Failed to detect ENS name:', error)
    }
  }, [address, refetchStatus])
  
  // Auto-detect ENS name when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      detectEnsName()
    }
  }, [isConnected, address, detectEnsName])

  const handleOpenModal = async () => {
    clearError()
    
    if (!isConnected || !address) {
      onKycError?.('Please connect your wallet first')
      return
    }

    setIsLoading(true)
    setLoadingMessage('Checking KYC status...')

    try {
      // Check KYC status first
      await refetchStatus()
      
      if (kycStatus?.hasKyc && kycStatus.status === 'approved') {
        setLoadingMessage('Verified KYC found. Preparing biometric verification...')
        setTimeout(() => {
          setIsLoading(false)
          setCurrentStep('biometric')
          setShowModal(true)
        }, 1500)
      } else if (kycStatus?.hasKyc) {
        setLoadingMessage('Existing KYC found. Loading verification flow...')
        setTimeout(() => {
          setIsLoading(false)
          setCurrentStep('check')
          setShowModal(true)
        }, 1000)
      } else {
        setLoadingMessage('No KYC found. Starting new verification...')
        setTimeout(() => {
          setIsLoading(false)
          setCurrentStep('check')
          setShowModal(true)
        }, 1000)
      }
    } catch (error) {
      setIsLoading(false)
      onKycError?.('Failed to check KYC status')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setCurrentStep('check')
    clearError()
  }

  const handleEnsSubmit = async () => {
    if (!ensName || !ensResolver.isValidName(ensName)) {
      onKycError?.('Invalid ENS name')
      return
    }

    // Check KYC status
    await refetchStatus()
    
    if (kycStatus?.hasKyc) {
      if (kycStatus.status === 'approved') {
        setCurrentStep('biometric')
      } else {
        setCurrentStep('kyc')
      }
    } else {
      setCurrentStep('kyc')
    }
  }

  const handleEnsRegistration = async () => {
    if (!address) {
      onKycError?.('Please connect your wallet first')
      return
    }

    setIsLoading(true)
    setLoadingMessage('Registering ENS name...')
    clearEnsError()

    try {
      const result = await registerEns()
      
      if (result.isNew) {
        setLoadingMessage('ENS registration successful! Waiting for confirmation...')
        // Wait a bit for transaction confirmation
        setTimeout(() => {
          setEnsName(result.ensName)
          setIsLoading(false)
          onSuccess?.({ ensName: result.ensName, txHash: result.txHash })
        }, 3000)
      } else {
        setEnsName(result.ensName)
        setIsLoading(false)
        onSuccess?.({ ensName: result.ensName })
      }
    } catch (error) {
      setIsLoading(false)
      const errorMessage = error instanceof Error ? error.message : 'ENS registration failed'
      onKycError?.(errorMessage)
    }
  }

  const handleKycSubmit = async () => {
    if (!address || !ensName) return

    try {
      const request = {
        ensName,
        address,
        chainId: selectedChainId,
        documents: documents.map(doc => doc.file), // Extract File objects
        personalInfo,
        selfie: selfie || undefined,
      }

      const result = await initiateVerification(request)
      
      if (result.success) {
        setCurrentStep('complete')
        onKycComplete?.(result)
      } else {
        onKycError?.(result.message || 'KYC verification failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onKycError?.(errorMessage)
    }
  }

  const handleBiometricVerification = async () => {
    if (!ensName) return

    try {
      // Generate challenge and verify biometric
      const challenge = biometricVerification.generateChallenge()
      const result = await kycService.verifyBiometric({
        type: 'face_id',
        challenge,
        userId: address || '',
        ensName,
      })

      if (result.verified) {
        setCurrentStep('complete')
        onKycComplete?.({ status: 'verified', result })
      } else {
        onKycError?.(result.error || 'Biometric verification failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onKycError?.(errorMessage)
    }
  }

  const handleDocumentsChange = (docs: DocumentFile[]) => {
    setDocuments(docs)
  }

  const handleDocumentError = (error: string) => {
    onKycError?.(error)
  }

  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet'
    if (statusLoading) return 'Checking KYC...'
    if (kycStatus?.hasKyc) {
      if (kycStatus.status === 'approved') return 'KYC Verified ✓'
      if (kycStatus.status === 'pending') return 'KYC Pending...'
      if (kycStatus.status === 'expired') return 'KYC Expired'
      return 'KYC Rejected'
    }
    return children || 'Verify KYC'
  }

  const getButtonVariant = () => {
    if (!isConnected) return 'outline'
    if (kycStatus?.hasKyc && kycStatus.status === 'approved') return 'secondary'
    return variant
  }

  const getButtonIcon = () => {
    if (!isConnected) return <User className="w-4 h-4" />
    if (kycStatus?.hasKyc && kycStatus.status === 'approved') return <CheckCircle className="w-4 h-4" />
    if (statusLoading) return <Loader2 className="w-4 h-4 animate-spin" />
    return <Shield className="w-4 h-4" />
  }

  // If not connected, show wallet connection button
  if (!isConnected) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Connect your wallet to start KYC verification</p>
        <ConnectWallet />
      </div>
    )
  }

  return (
    <>
      {/* Loading Backdrop */}
      <LoadingBackdrop 
        isVisible={isLoading}
        message={loadingMessage}
        size="xl"
        onCancel={() => setIsLoading(false)}
      />

      <Button
        onClick={handleOpenModal}
        variant={getButtonVariant()}
        size={size}
        className={className}
        disabled={statusLoading || isLoading}
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                KYC Verification
              </CardTitle>
              <CardDescription>
                {currentStep === 'check' && 'Check your KYC status or start verification'}
                {currentStep === 'kyc' && 'Complete your KYC verification'}
                {currentStep === 'biometric' && 'Verify your identity with biometrics'}
                {currentStep === 'complete' && 'KYC verification complete'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Step 1: Check Status */}
              {currentStep === 'check' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ensName">ENS Name</Label>
                    <Input
                      id="ensName"
                      placeholder="Enter your ENS name (e.g., alice.eth)"
                      value={ensName}
                      onChange={(e) => setEnsName(e.target.value)}
                    />
                  </div>

                  {ensName && (
                    <div className="space-y-2">
                      <Label>KYC Status</Label>
                      {statusLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Checking status...</span>
                        </div>
                      ) : kycStatus ? (
                        <div className="flex items-center gap-2">
                          {kycStatus.hasKyc ? (
                            <>
                              <Badge variant={kycStatus.status === 'approved' ? 'default' : 'secondary'}>
                                {kycStatus.status.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {kycStatus.status === 'approved' 
                                  ? 'Ready for biometric verification'
                                  : 'Verification in progress'
                                }
                              </span>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline">NO KYC</Badge>
                              <span className="text-sm text-muted-foreground">
                                Start your KYC verification
                              </span>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleEnsSubmit} disabled={!ensName || statusLoading}>
                      Continue
                    </Button>
                    {!ensName && (
                      <Button onClick={handleEnsRegistration} disabled={isRegistering || !address}>
                        {isRegistering ? 'Registering...' : 'Register ENS'}
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: KYC Form */}
              {currentStep === 'kyc' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="chainId">Blockchain Network</Label>
                    <Select value={selectedChainId.toString()} onValueChange={(value) => setSelectedChainId(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="84532">Base Sepolia (Testnet)</SelectItem>
                        <SelectItem value="314159">Filecoin Calibration (Testnet)</SelectItem>
                        <SelectItem value="137">Polygon (Mainnet)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={personalInfo.dateOfBirth}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={personalInfo.nationality}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, nationality: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={personalInfo.address.street}
                      onChange={(e) => setPersonalInfo(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, street: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={personalInfo.address.city}
                        onChange={(e) => setPersonalInfo(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={personalInfo.address.state}
                        onChange={(e) => setPersonalInfo(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, state: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={personalInfo.address.postalCode}
                        onChange={(e) => setPersonalInfo(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, postalCode: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={personalInfo.address.country}
                      onChange={(e) => setPersonalInfo(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, country: e.target.value }
                      }))}
                    />
                  </div>

                  {/* Document Upload Component */}
                  <DocumentUpload
                    onDocumentsChange={handleDocumentsChange}
                    onError={handleDocumentError}
                    maxFiles={5}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <XCircle className="w-4 h-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleKycSubmit} disabled={isInitiating}>
                      {isInitiating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit KYC'
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentStep('check')}>
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Biometric Verification */}
              {currentStep === 'biometric' && (
                <div className="space-y-4">
                  <Alert>
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      Your KYC is verified. Please complete face verification to access your data.
                    </AlertDescription>
                  </Alert>

                  {/* iProov Face Verification Component */}
                  <IProovVerification
                    userId={address || ''}
                    type="verify"
                    onComplete={(result) => {
                      if (result.success) {
                        setCurrentStep('complete')
                        onKycComplete?.({ status: 'verified', result })
                      } else {
                        onKycError?.(result.error || 'Face verification failed')
                      }
                    }}
                    onError={(error) => onKycError?.(error)}
                  />

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep('check')}>
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 'complete' && (
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Verification Complete!</h3>
                      <p className="text-sm text-muted-foreground">
                        Your KYC verification has been completed successfully.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCloseModal} className="flex-1">
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
