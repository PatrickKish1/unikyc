"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  className?: string
}

export function LoadingSpinner({ size = 'lg', message, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: {
      outer: 'w-8 h-8 border-2',
      middle: 'w-6 h-6 border-2',
      inner: 'w-4 h-4 border-2'
    },
    md: {
      outer: 'w-12 h-12 border-2',
      middle: 'w-9 h-9 border-2',
      inner: 'w-6 h-6 border-2'
    },
    lg: {
      outer: 'w-16 h-16 border-3',
      middle: 'w-12 h-12 border-2',
      inner: 'w-8 h-8 border-2'
    },
    xl: {
      outer: 'w-20 h-20 border-4',
      middle: 'w-15 h-15 border-3',
      inner: 'w-10 h-10 border-2'
    }
  }

  const sizes = sizeClasses[size]

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {/* Three-layer spinner */}
      <div className="relative flex items-center justify-center">
        {/* Outer spinner - Blue */}
        <div 
          className={cn(
            sizes.outer,
            "absolute rounded-full border-blue-500 border-t-transparent animate-spin"
          )}
          style={{ animationDuration: '1.2s' }}
        />
        
        {/* Middle spinner - Purple */}
        <div 
          className={cn(
            sizes.middle,
            "absolute rounded-full border-purple-500 border-t-transparent animate-spin"
          )}
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        />
        
        {/* Inner spinner - Green */}
        <div 
          className={cn(
            sizes.inner,
            "rounded-full border-green-500 border-t-transparent animate-spin"
          )}
          style={{ animationDuration: '0.8s' }}
        />
      </div>

      {/* Loading message */}
      {message && (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 animate-pulse">
            {message}
          </p>
        </div>
      )}
    </div>
  )
}

interface LoadingBackdropProps {
  isVisible: boolean
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  onCancel?: () => void
}

export function LoadingBackdrop({ isVisible, message = "Processing...", size = 'xl', onCancel }: LoadingBackdropProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Loading content */}
      <div className="relative z-10 bg-white rounded-lg p-8 shadow-2xl max-w-sm w-full mx-4">
        <LoadingSpinner size={size} message={message} className="mb-4" />
        
        {onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
