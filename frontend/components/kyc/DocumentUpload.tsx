/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, FileText, CheckCircle, X } from 'lucide-react'
import { uploadFile } from '@/lib/storage/storacha'
import Image from 'next/image'

export interface DocumentFile {
  file: File
  type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement'
  preview: string
  cid?: string
}

interface DocumentUploadProps {
  onDocumentsChange: (documents: DocumentFile[]) => void
  onError: (error: string) => void
  maxFiles?: number
}

export function DocumentUpload({ onDocumentsChange, onError, maxFiles = 5 }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [uploading, setUploading] = useState<boolean>(false)
  const [dragOver, setDragOver] = useState<boolean>(false)

  const handleFileSelect = useCallback(async (files: FileList | null, documentType?: string) => {
    if (!files || files.length === 0) return

    const newDocuments: DocumentFile[] = []
    
    for (let i = 0; i < files.length && documents.length + newDocuments.length < maxFiles; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        onError('Please upload only images (JPG, PNG) or PDF files')
        continue
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        onError('File size must be less than 10MB')
        continue
      }

      // Create preview
      const preview = URL.createObjectURL(file)
      
      const docFile: DocumentFile = {
        file,
        type: (documentType as any) || 'passport',
        preview
      }

      newDocuments.push(docFile)
    }

    if (newDocuments.length > 0) {
      const updatedDocuments = [...documents, ...newDocuments]
      setDocuments(updatedDocuments)
      onDocumentsChange(updatedDocuments)
    }
  }, [documents, maxFiles, onDocumentsChange, onError])

  const uploadDocuments = async () => {
    if (documents.length === 0) return

    setUploading(true)
    try {
      const uploadedDocs = await Promise.all(
        documents.map(async (doc) => {
          if (doc.cid) return doc // Already uploaded
          
          const cid = await uploadFile(doc.file)
          return { ...doc, cid }
        })
      )

      setDocuments(uploadedDocs)
      onDocumentsChange(uploadedDocs)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to upload documents')
    } finally {
      setUploading(false)
    }
  }

  const removeDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index)
    setDocuments(updatedDocuments)
    onDocumentsChange(updatedDocuments)
  }

  const updateDocumentType = (index: number, type: string) => {
    const updatedDocuments = documents.map((doc, i) => 
      i === index ? { ...doc, type: type as any } : doc
    )
    setDocuments(updatedDocuments)
    onDocumentsChange(updatedDocuments)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Documents</CardTitle>
        <CardDescription>
          {`Upload your government-issued ID documents (passport, driver's license, national ID)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">Drop your documents here</p>
            <p className="text-sm text-muted-foreground">
              or click to browse files (JPG, PNG, PDF up to 10MB)
            </p>
            <Input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="document-upload"
            />
            <Label htmlFor="document-upload">
              <Button variant="outline" className="cursor-pointer">
                Browse Files
              </Button>
            </Label>
          </div>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Uploaded Documents ({documents.length}/{maxFiles})</h4>
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {doc.file.type.startsWith('image/') ? (
                    <Image
                      src={doc.preview} 
                      alt="Document preview" 
                      className="w-12 h-12 object-cover rounded"
                      width={48}
                      height={48}
                      unoptimized
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-red-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <Select 
                  value={doc.type} 
                  onValueChange={(value) => updateDocumentType(index, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">{`Driver's License`}</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="utility_bill">Utility Bill</SelectItem>
                    <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  {doc.cid && <CheckCircle className="w-4 h-4 text-green-500" />}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Upload Button */}
            {documents.some(doc => !doc.cid) && (
              <Button 
                onClick={uploadDocuments} 
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading Documents...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents to IPFS
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {documents.length === 0 && (
          <Alert>
            <AlertDescription>
              Please upload at least one government-issued identity document to proceed with KYC verification.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
