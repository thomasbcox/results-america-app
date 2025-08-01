"use client"

import React, { useState, useEffect } from 'react'

/**
 * Hook to prevent hydration mismatches by ensuring content only renders on client
 * Use this when content depends on browser-only APIs or context that differs between server/client
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Component wrapper for client-only content
 * Prevents hydration mismatches by showing loading state during SSR
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const isClient = useClientOnly()

  if (!isClient) {
    return fallback
  }

  return children
}

/**
 * Hook to safely access context values that might differ between server/client
 * Returns null during SSR, actual value after hydration
 */
export function useSafeContextValue<T>(value: T | null | undefined): T | null {
  const isClient = useClientOnly()
  
  if (!isClient) {
    return null
  }
  
  return value || null
}

/**
 * Utility to detect if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Utility to detect if we're in a server environment
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
} 