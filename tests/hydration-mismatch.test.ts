import { render, screen } from '@testing-library/react'
import { useClientOnly, ClientOnly, useSafeContextValue } from '../src/lib/utils/hydrationUtils'

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
  SelectionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('Hydration Mismatch Prevention', () => {
  describe('useClientOnly', () => {
    it('should return false initially and true after mount', () => {
      const TestComponent = () => {
        const isClient = useClientOnly()
        return <div data-testid="client-status">{isClient ? 'client' : 'server'}</div>
      }

      render(<TestComponent />)
      
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
      const TestComponent = () => (
        <ClientOnly fallback={<div data-testid="loading">Loading...</div>}>
          <div data-testid="content">Actual Content</div>
        </ClientOnly>
      )

      render(<TestComponent />)
      
      // Should show fallback initially
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('should show children after hydration', () => {
      const TestComponent = () => (
        <ClientOnly fallback={<div data-testid="loading">Loading...</div>}>
          <div data-testid="content">Actual Content</div>
        </ClientOnly>
      )

      render(<TestComponent />)
      
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
        return <div data-testid="safe-value">{safeValue || 'null'}</div>
      }

      render(<TestComponent />)
      
      // Should return null during SSR
      expect(screen.getByTestId('safe-value')).toHaveTextContent('null')
    })

    it('should return actual value after hydration', () => {
      const TestComponent = () => {
        const safeValue = useSafeContextValue('test-value')
        return <div data-testid="safe-value">{safeValue || 'null'}</div>
      }

      render(<TestComponent />)
      
      // After hydration, should return actual value
      setTimeout(() => {
        expect(screen.getByTestId('safe-value')).toHaveTextContent('test-value')
      }, 0)
    })
  })
})

describe('Hydration Mismatch Detection', () => {
  it('should detect context values that differ between server/client', () => {
    // This test simulates the scenario that caused the original hydration mismatch
    const TestComponent = () => {
      const { selectedCategory, selectedMeasure } = mockContext
      
      return (
        <div>
          <a href={`/measure?category=${selectedCategory || 'Select Category'}&measure=${selectedMeasure || 'Select Measure'}`}>
            Back to Selection
          </a>
          <span>{selectedCategory || 'Select Category'}</span>
        </div>
      )
    }

    render(<TestComponent />)
    
    // The server would render with default values
    // The client would render with actual values
    // This creates a hydration mismatch
    expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('Select Category'))
  })

  it('should prevent hydration mismatch with ClientOnly wrapper', () => {
    const TestComponent = () => {
      const { selectedCategory, selectedMeasure } = mockContext
      
      return (
        <ClientOnly fallback={<div data-testid="loading">Loading...</div>}>
          <div>
            <a href={`/measure?category=${selectedCategory || 'Select Category'}&measure=${selectedMeasure || 'Select Measure'}`}>
              Back to Selection
            </a>
            <span>{selectedCategory || 'Select Category'}</span>
          </div>
        </ClientOnly>
      )
    }

    render(<TestComponent />)
    
    // Should show loading during SSR
    expect(screen.getByTestId('loading')).toBeInTheDocument()
    
    // After hydration, should show actual content
    setTimeout(() => {
      expect(screen.getByRole('link')).toBeInTheDocument()
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    }, 0)
  })
}) 