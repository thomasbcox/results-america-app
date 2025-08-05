import { render, screen } from '@testing-library/react'
import { useClientOnly, ClientOnly, useSafeContextValue } from '../src/lib/utils/hydrationUtils'
import React from 'react'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}))

// Mock context
const mockContext = {
  selectedStates: ['California', 'Texas'],
  selectedCategory: 'Economy',
  selectedMeasure: 9,
  user: null,
  setSelectedStates: jest.fn(),
  setSelectedCategory: jest.fn(),
  setSelectedMeasure: jest.fn(),
  toggleFavorite: jest.fn(),
  clearSelections: jest.fn(),
  dismissSessionWarning: jest.fn(),
  favorites: [],
  sessionExpiryWarning: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('../src/lib/context', () => ({
  useSelection: () => mockContext,
  SelectionProvider: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}))

describe('Hydration Mismatch Prevention', () => {
  describe('useClientOnly', () => {
    it('should return false initially and true after mount', () => {
      const TestComponent = () => {
        const isClient = useClientOnly()
        return React.createElement('div', { 'data-testid': 'client-status' }, isClient ? 'client' : 'server')
      }

      render(React.createElement(TestComponent))
      
      // Initially should show server state
      expect(screen.getByTestId('client-status')).toHaveTextContent('server')
      
      // After a tick, should show client state
      setTimeout(() => {
        expect(screen.getByTestId('client-status')).toHaveTextContent('client')
      }, 0)
    })
  })

  describe('ClientOnly', () => {
    it('should show fallback during SSR', () => {
      const TestComponent = () => React.createElement(
        ClientOnly,
        { fallback: React.createElement('div', { 'data-testid': 'loading' }, 'Loading...') },
        React.createElement('div', { 'data-testid': 'content' }, 'Actual Content')
      )

      render(React.createElement(TestComponent))
      
      // Should show fallback initially
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('should show children after hydration', () => {
      const TestComponent = () => React.createElement(
        ClientOnly,
        { fallback: React.createElement('div', { 'data-testid': 'loading' }, 'Loading...') },
        React.createElement('div', { 'data-testid': 'content' }, 'Actual Content')
      )

      render(React.createElement(TestComponent))
      
      // After hydration, should show actual content
      setTimeout(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument()
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
      }, 0)
    })
  })

  describe('useSafeContextValue', () => {
    it('should return null during SSR', () => {
      const TestComponent = () => {
        const safeValue = useSafeContextValue('test-value')
        return React.createElement('div', { 'data-testid': 'safe-value' }, safeValue || 'null')
      }

      render(React.createElement(TestComponent))
      expect(screen.getByTestId('safe-value')).toHaveTextContent('null')
    })

    it('should return value after hydration', () => {
      const TestComponent = () => {
        const safeValue = useSafeContextValue('test-value')
        return React.createElement('div', { 'data-testid': 'safe-value' }, safeValue || 'null')
      }

      render(React.createElement(TestComponent))
      
      setTimeout(() => {
        expect(screen.getByTestId('safe-value')).toHaveTextContent('test-value')
      }, 0)
    })
  })

  describe('Context Value Safety', () => {
    it('should handle undefined context values gracefully', () => {
      const TestComponent = () => {
        const safeValue = useSafeContextValue(undefined)
        return React.createElement('div', { 'data-testid': 'safe-value' }, safeValue || 'null')
      }

      render(React.createElement(TestComponent))
      expect(screen.getByTestId('safe-value')).toHaveTextContent('null')
    })
  })

  describe('Navigation Link Safety', () => {
    it('should handle undefined category and measure in navigation links', () => {
      const TestComponent = () => {
        const selectedCategory = undefined
        const selectedMeasure = undefined
        
        return React.createElement('div', null,
          React.createElement('a', { 
            href: `/measure?category=${selectedCategory || 'Select Category'}&measure=${selectedMeasure || 'Select Measure'}` 
          }, 'Back to Selection'),
          React.createElement('span', null, selectedCategory || 'Select Category')
        )
      }

      render(React.createElement(TestComponent))
      expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('Select Category'))
    })

    it('should handle defined category and measure in navigation links', () => {
      const TestComponent = () => {
        const selectedCategory = 'Economy'
        const selectedMeasure = 'GDP'
        
        return React.createElement('div', null,
          React.createElement('a', { 
            href: `/measure?category=${selectedCategory || 'Select Category'}&measure=${selectedMeasure || 'Select Measure'}` 
          }, 'Back to Selection'),
          React.createElement('span', null, selectedCategory || 'Select Category')
        )
      }

      render(React.createElement(TestComponent))
      expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('Economy'))
      expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('GDP'))
    })
  })

  describe('ClientOnly with Navigation', () => {
    it('should handle navigation links safely during SSR', () => {
      const TestComponent = () => {
        const selectedCategory = undefined
        const selectedMeasure = undefined
        
        return React.createElement(
          ClientOnly,
          { fallback: React.createElement('div', { 'data-testid': 'loading' }, 'Loading...') },
          React.createElement('div', null,
            React.createElement('a', { 
              href: `/measure?category=${selectedCategory || 'Select Category'}&measure=${selectedMeasure || 'Select Measure'}` 
            }, 'Back to Selection'),
            React.createElement('span', null, selectedCategory || 'Select Category')
          )
        )
      }

      render(React.createElement(TestComponent))
      
      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      
      // After hydration, should show navigation
      setTimeout(() => {
        expect(screen.getByRole('link')).toBeInTheDocument()
        expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('Select Category'))
      }, 0)
    })
  })
}) 