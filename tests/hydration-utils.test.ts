import { render, screen } from '@testing-library/react'
import { useClientOnly, ClientOnly, useSafeContextValue } from '../src/lib/utils/hydrationUtils'
import React from 'react'

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
        return React.createElement('div', { 'data-testid': 'client-status' }, isClient ? 'client' : 'server')
      }

      render(React.createElement(TestComponent))
      expect(screen.getByTestId('client-status')).toHaveTextContent('server')
    })
  })

  describe('ClientOnly', () => {
    it('should show fallback during SSR', () => {
      const { useState, useEffect } = require('react')
      useState.mockReturnValue([false, jest.fn()])
      useEffect.mockImplementation((fn) => fn())

      const TestComponent = () => React.createElement(
        ClientOnly,
        { fallback: React.createElement('div', { 'data-testid': 'loading' }, 'Loading...') },
        React.createElement('div', { 'data-testid': 'content' }, 'Actual Content')
      )

      render(React.createElement(TestComponent))
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
        return React.createElement('div', { 'data-testid': 'safe-value' }, safeValue || 'null')
      }

      render(React.createElement(TestComponent))
      expect(screen.getByTestId('safe-value')).toHaveTextContent('null')
    })
  })
}) 