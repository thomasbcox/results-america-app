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
  return isAuthenticated ? localStorage : sessionStorage
}

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])
  const [sessionExpiryWarning, setSessionExpiryWarning] = useState(false)

  // Load user and selections from storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const storage = getStorage(!!savedUser)
    
    const savedStates = storage.getItem('selectedStates')
    const savedCategory = storage.getItem('selectedCategory')
    const savedMeasure = storage.getItem('selectedMeasure')
    const savedFavorites = storage.getItem('favorites')

    // Check if user session is still valid
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser.sessionExpiry && !isSessionExpired(parsedUser.sessionExpiry)) {
          setUser(parsedUser)
        } else {
          // Session expired, clear user data
          localStorage.removeItem('user')
          // Switch to sessionStorage for selections
          const sessionStates = sessionStorage.getItem('selectedStates')
          const sessionCategory = sessionStorage.getItem('selectedCategory')
          const sessionMeasure = sessionStorage.getItem('selectedMeasure')
          const sessionFavorites = sessionStorage.getItem('favorites')
          
          if (sessionStates) setSelectedStates(JSON.parse(sessionStates))
          if (sessionCategory) setSelectedCategory(sessionCategory)
          if (sessionMeasure) setSelectedMeasure(JSON.parse(sessionMeasure))
          if (sessionFavorites) setFavorites(JSON.parse(sessionFavorites))
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('user')
      }
    } else {
      // No authenticated user, load from sessionStorage
      if (savedStates) setSelectedStates(JSON.parse(savedStates))
      if (savedCategory) setSelectedCategory(savedCategory)
      if (savedMeasure) setSelectedMeasure(JSON.parse(savedMeasure))
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
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

  // Save selections to appropriate storage when they change
  useEffect(() => {
    const storage = getStorage(!!user)
    storage.setItem('selectedStates', JSON.stringify(selectedStates))
  }, [selectedStates, user])

  useEffect(() => {
    const storage = getStorage(!!user)
    if (selectedCategory) {
      storage.setItem('selectedCategory', selectedCategory)
    } else {
      storage.removeItem('selectedCategory')
    }
  }, [selectedCategory, user])

  useEffect(() => {
    const storage = getStorage(!!user)
    if (selectedMeasure) {
      storage.setItem('selectedMeasure', JSON.stringify(selectedMeasure))
    } else {
      storage.removeItem('selectedMeasure')
    }
  }, [selectedMeasure, user])

  useEffect(() => {
    const storage = getStorage(!!user)
    storage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites, user])

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
    
    // Migrate sessionStorage data to localStorage
    const sessionStates = sessionStorage.getItem('selectedStates')
    const sessionCategory = sessionStorage.getItem('selectedCategory')
    const sessionMeasure = sessionStorage.getItem('selectedMeasure')
    const sessionFavorites = sessionStorage.getItem('favorites')
    
    if (sessionStates) {
      localStorage.setItem('selectedStates', sessionStates)
      sessionStorage.removeItem('selectedStates')
    }
    if (sessionCategory) {
      localStorage.setItem('selectedCategory', sessionCategory)
      sessionStorage.removeItem('selectedCategory')
    }
    if (sessionMeasure) {
      localStorage.setItem('selectedMeasure', sessionMeasure)
      sessionStorage.removeItem('selectedMeasure')
    }
    if (sessionFavorites) {
      localStorage.setItem('favorites', sessionFavorites)
      sessionStorage.removeItem('favorites')
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
    
    // Migrate localStorage data to sessionStorage before clearing
    const localStates = localStorage.getItem('selectedStates')
    const localCategory = localStorage.getItem('selectedCategory')
    const localMeasure = localStorage.getItem('selectedMeasure')
    const localFavorites = localStorage.getItem('favorites')
    
    if (localStates) {
      sessionStorage.setItem('selectedStates', localStates)
      localStorage.removeItem('selectedStates')
    }
    if (localCategory) {
      sessionStorage.setItem('selectedCategory', localCategory)
      localStorage.removeItem('selectedCategory')
    }
    if (localMeasure) {
      sessionStorage.setItem('selectedMeasure', localMeasure)
      localStorage.removeItem('selectedMeasure')
    }
    if (localFavorites) {
      sessionStorage.setItem('favorites', localFavorites)
      localStorage.removeItem('favorites')
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
    
    const storage = getStorage(!!user)
    storage.removeItem('selectedStates')
    storage.removeItem('selectedCategory')
    storage.removeItem('selectedMeasure')
    storage.removeItem('favorites')
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