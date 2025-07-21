"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  email: string
  name?: string
  sessionExpiry: number // Unix timestamp when session expires
}

interface SelectionContextType {
  user: User | null
  selectedStates: string[]
  selectedCategory: string | null
  selectedMeasure: number | null
  favorites: number[]
  signIn: (email: string, name?: string) => void
  signOut: () => void
  setSelectedStates: (states: string[]) => void
  setSelectedCategory: (category: string | null) => void
  setSelectedMeasure: (measure: number | null) => void
  toggleFavorite: (measureId: number) => void
  clearSelections: () => void
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

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMeasure, setSelectedMeasure] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])

  // Load user and selections from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedStates = localStorage.getItem('selectedStates')
    const savedCategory = localStorage.getItem('selectedCategory')
    const savedMeasure = localStorage.getItem('selectedMeasure')
    const savedFavorites = localStorage.getItem('favorites')

    // Check if user session is still valid
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser.sessionExpiry && !isSessionExpired(parsedUser.sessionExpiry)) {
          setUser(parsedUser)
        } else {
          // Session expired, clear user data
          localStorage.removeItem('user')
          localStorage.removeItem('selectedStates')
          localStorage.removeItem('selectedCategory')
          localStorage.removeItem('selectedMeasure')
          localStorage.removeItem('favorites')
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('user')
      }
    }

    // Only load selections if user session is valid
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        if (parsedUser.sessionExpiry && !isSessionExpired(parsedUser.sessionExpiry)) {
          if (savedStates) setSelectedStates(JSON.parse(savedStates))
          if (savedCategory) setSelectedCategory(savedCategory)
          if (savedMeasure) setSelectedMeasure(JSON.parse(savedMeasure))
          if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
        }
      } catch (error) {
        console.error('Error loading saved selections:', error)
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

  // Save selections to localStorage when they change (only if user is logged in)
  useEffect(() => {
    if (user) {
      localStorage.setItem('selectedStates', JSON.stringify(selectedStates))
    }
  }, [selectedStates, user])

  useEffect(() => {
    if (user) {
      if (selectedCategory) {
        localStorage.setItem('selectedCategory', selectedCategory)
      } else {
        localStorage.removeItem('selectedCategory')
      }
    }
  }, [selectedCategory, user])

  useEffect(() => {
    if (user) {
      if (selectedMeasure) {
        localStorage.setItem('selectedMeasure', JSON.stringify(selectedMeasure))
      } else {
        localStorage.removeItem('selectedMeasure')
      }
    }
  }, [selectedMeasure, user])

  useEffect(() => {
    if (user) {
      localStorage.setItem('favorites', JSON.stringify(favorites))
    }
  }, [favorites, user])

  const signIn = (email: string, name?: string) => {
    const sessionExpiry = createSessionExpiry()
    setUser({ email, name, sessionExpiry })
  }

  const signOut = () => {
    setUser(null)
    // Clear all selections when signing out
    setSelectedStates([])
    setSelectedCategory(null)
    setSelectedMeasure(null)
    setFavorites([])
    // Clear localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('selectedStates')
    localStorage.removeItem('selectedCategory')
    localStorage.removeItem('selectedMeasure')
    localStorage.removeItem('favorites')
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
  }

  return (
    <SelectionContext.Provider value={{
      user,
      selectedStates,
      selectedCategory,
      selectedMeasure,
      favorites,
      signIn,
      signOut,
      setSelectedStates,
      setSelectedCategory,
      setSelectedMeasure,
      toggleFavorite,
      clearSelections
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