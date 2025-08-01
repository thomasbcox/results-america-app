import { render, screen } from '@testing-library/react'
import { useClientOnly, ClientOnly, useSafeContextValue } from '../src/lib/utils/hydrationUtils'

// Mock React hooks
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
}))

describe('Hydration Utilities', () => {
  describe('useClientOnly', () => {
    it('should return false initially', () => {
      const { useState, useEffect } = require('react')
      useState.mockReturnValue([false, jest.fn()])
      useEffect.mockImplementation((fn) => fn())

      const TestComponent = () => {
        const isClient = useClientOnly()
        return <div data-testid="client-status">{isClient ? 'client' : 'server'}</div>
      }

      render(<TestComponent />)
      expect(screen.getByTestId('client-status')).toHaveTextContent('server')
    })
  })

  describe('ClientOnly', () => {
    it('should show fallback during SSR', () => {
      const { useState, useEffect } = require('react')
      useState.mockReturnValue([false, jest.fn()])
      useEffect.mockImplementation((fn) => fn())

      const TestComponent = () => (
        <ClientOnly fallback={<div data-testid="loading">Loading...</div>}>
          <div data-testid="content">Actual Content</div>
        </ClientOnly>
      )

      render(<TestComponent />)
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })
  })

  describe('useSafeContextValue', () => {
    it('should return null during SSR', () => {
      const { useState, useEffect } = require('react')
      useState.mockReturnValue([false, jest.fn()])
      useEffect.mockImplementation((fn) => fn())

      const TestComponent = () => {
        const safeValue = useSafeContextValue('test-value')
        return <div data-testid="safe-value">{safeValue || 'null'}</div>
      }

      render(<TestComponent />)
      expect(screen.getByTestId('safe-value')).toHaveTextContent('null')
    })
  })
}) 