"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  email: string
  name?: string
  role?: string
  sessionExpiry: number // Unix timestamp when session expires
}

interface SelectionContextType {
  user: User | null
  selectedStates: string[]
  selectedCategory: string | null
  selectedMeasure: number | null
  favorites: number[]
  sessionExpiryWarning: boolean
  signIn: (email: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  setSelectedStates: (states: string[]) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedMeasure: (measure: number | null) => void
  toggleFavorite: (measureId: number) => void
  clearSelections: () => void
  dismissSessionWarning: () => void
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined)

// Helper function to check if session is expired
const isSessionExpired = (sessionExpiry: number): boolean => {
  return Date.now() > sessionExpiry
}

// Helper function to create session expiry (30 days from now)
const createSessionExpiry = (): number => {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  return thirtyDaysFromNow.getTime()
}

// Helper function to get storage based on authentication status
const getStorage = (isAuthenticated: boolean) => {
  // Always use sessionStorage for simplicity and reliability
  return sessionStorage
}

export function SelectionProvider({ children }: { children: ReactNode }) {
  // Always start with empty state to prevent hydration mismatches
  const initialState = {
    selectedStates: [],
    selectedCategory: null,
    selectedMeasure: null,
    favorites: []
  }
  
  const [user, setUser] = useState<User | null>(null)
  const [selectedStates, setSelectedStatesState] = useState<string[]>(initialState.selectedStates)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialState.selectedCategory)
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(initialState.selectedMeasure)
  const [favorites, setFavorites] = useState<number[]>(initialState.favorites)
  const [sessionExpiryWarning, setSessionExpiryWarning] = useState(false)

  // Custom setter with debug logging
  const setSelectedStates = (states: string[]) => {
    setSelectedStatesState(states)
  }

  // Load saved state from sessionStorage after hydration
  useEffect(() => {
    try {
      const savedStates = sessionStorage.getItem('selectedStates')
      const savedCategory = sessionStorage.getItem('selectedCategory')
      const savedMeasure = sessionStorage.getItem('selectedMeasure')
      const savedFavorites = sessionStorage.getItem('favorites')
      
      if (savedStates) {
        setSelectedStatesState(JSON.parse(savedStates))
      }
      if (savedCategory) {
        setSelectedCategory(savedCategory)
      }
      if (savedMeasure) {
        setSelectedMeasure(JSON.parse(savedMeasure))
      }
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites))
      }
    } catch (error) {
      console.error('Error loading saved state:', error)
    }
  }, [])

  // Load user from localStorage on mount
  useEffect(() => {
    console.log(`🔄 Context: Loading user from localStorage...`)
    
    const savedUser = localStorage.getItem('user')
    console.log(`🔄 Context: Saved user found:`, !!savedUser)
    
    // Check if user session is still valid
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser.sessionExpiry && !isSessionExpired(parsedUser.sessionExpiry)) {
          console.log('✅ Context: Valid user session found, loading from localStorage')
          setUser(parsedUser)
        } else {
          // Session expired, clear user data
          console.log('❌ Context: User session expired, clearing localStorage')
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('user')
      }
    }
  }, [])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  // Save selections to sessionStorage when they change
  useEffect(() => {
    sessionStorage.setItem('selectedStates', JSON.stringify(selectedStates))
  }, [selectedStates])

  useEffect(() => {
    if (selectedCategory) {
      sessionStorage.setItem('selectedCategory', selectedCategory)
    } else {
      sessionStorage.removeItem('selectedCategory')
    }
  }, [selectedCategory])

  useEffect(() => {
    if (selectedMeasure) {
      sessionStorage.setItem('selectedMeasure', JSON.stringify(selectedMeasure))
    } else {
      sessionStorage.removeItem('selectedMeasure')
    }
  }, [selectedMeasure])

  useEffect(() => {
    sessionStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  const signIn = async (email: string, name?: string) => {
    console.log('🔐 signIn called with:', { email, name })
    // After magic link verification, fetch the actual user data from server
    try {
      console.log('📡 Fetching user data from /api/auth/me...')
      const response = await fetch('/api/auth/me')
      console.log('📡 /api/auth/me response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📡 /api/auth/me response data:', data)
        
        if (data.success && data.user) {
          // The API response structure is: { success: true, user: {...} }
          const userData = data.user
          console.log('✅ Server user data:', userData)
          
          const newUser = { 
            email: userData.email, 
            name: userData.name, 
            role: userData.role,
            sessionExpiry: createSessionExpiry() 
          }
          console.log('👤 Setting user in context:', newUser)
          setUser(newUser)
        } else {
          console.error('❌ Failed to get user data from server - no data in response')
          // Fallback to basic user if server fetch fails
          const sessionExpiry = createSessionExpiry()
          const newUser = { email, name, sessionExpiry }
          console.log('👤 Setting fallback user in context (no data):', newUser)
          setUser(newUser)
        }
      } else {
        console.error('❌ Failed to fetch user data from server - response not ok')
        // Fallback to basic user if server fetch fails
        const sessionExpiry = createSessionExpiry()
        const newUser = { email, name, sessionExpiry }
        console.log('👤 Setting fallback user in context (response not ok):', newUser)
        setUser(newUser)
      }
    } catch (error) {
      console.error('❌ Failed to fetch user data from server:', error)
      // Fallback to basic user if server fetch fails
      const sessionExpiry = createSessionExpiry()
      const newUser = { email, name, sessionExpiry }
      console.log('👤 Setting fallback user in context (catch error):', newUser)
      setUser(newUser)
    }
  }

  const signOut = async () => {
    console.log('🚪 signOut called')
    // Call server logout endpoint to clear session cookie
    try {
      console.log('📡 Calling /api/auth/logout...')
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      console.log('📡 /api/auth/logout response status:', response.status)
    } catch (error) {
      console.error('❌ Failed to logout from server:', error)
    }
    
    setUser(null)
    localStorage.removeItem('user')
  }

  const toggleFavorite = (measureId: number) => {
    setFavorites(prev => 
      prev.includes(measureId) 
        ? prev.filter(id => id !== measureId)
        : [...prev, measureId]
    )
  }

  const clearSelections = () => {
    setSelectedStates([])
    setSelectedCategory(null)
    setSelectedMeasure(null)
    setFavorites([])
    
    sessionStorage.removeItem('selectedStates')
    sessionStorage.removeItem('selectedCategory')
    sessionStorage.removeItem('selectedMeasure')
    sessionStorage.removeItem('favorites')
  }

  const dismissSessionWarning = () => {
    setSessionExpiryWarning(false)
  }



  return (
    <SelectionContext.Provider value={{
      user,
      selectedStates,
      selectedCategory,
      selectedMeasure,
      favorites,
      sessionExpiryWarning,
      signIn,
      signOut,
      setSelectedStates,
      setSelectedCategory,
      setSelectedMeasure,
      toggleFavorite,
      clearSelections,
      dismissSessionWarning
    }}>
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelection() {
  const context = useContext(SelectionContext)
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider')
  }
  return context
} 