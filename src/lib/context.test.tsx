import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SelectionProvider, useSelection } from './context';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Test component to access context
const TestComponent = () => {
  const { 
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
    addFavorite,
    removeFavorite
  } = useSelection();

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <div data-testid="selected-states">{selectedStates.length}</div>
      <div data-testid="selected-category">{selectedCategory?.name || 'no-category'}</div>
      <div data-testid="selected-measure">{selectedMeasure?.name || 'no-measure'}</div>
      <div data-testid="favorites-count">{favorites.length}</div>
      <button onClick={() => signIn('test@example.com', 'Test User')}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
      <button onClick={() => setSelectedStates([{ id: 1, name: 'California', abbreviation: 'CA' }])}>
        Set States
      </button>
      <button onClick={() => setSelectedCategory({ id: 1, name: 'Education' })}>
        Set Category
      </button>
      <button onClick={() => setSelectedMeasure({ id: 1, name: 'Test Measure' })}>
        Set Measure
      </button>
      <button onClick={() => addFavorite({ id: 1, name: 'Test Favorite' })}>
        Add Favorite
      </button>
      <button onClick={() => removeFavorite(1)}>
        Remove Favorite
      </button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <SelectionProvider>
      <TestComponent />
    </SelectionProvider>
  );
};

describe('SelectionProvider Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Storage Strategy', () => {
    it('should use sessionStorage for non-authenticated users', async () => {
      renderWithProvider();
      
      // Set selections without authentication
      fireEvent.click(screen.getByText('Set States'));
      fireEvent.click(screen.getByText('Set Category'));
      fireEvent.click(screen.getByText('Set Measure'));
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-category')).toHaveTextContent('Education');
        expect(screen.getByTestId('selected-measure')).toHaveTextContent('Test Measure');
      });

      // Check that data is in sessionStorage, not localStorage
      const sessionData = sessionStorage.getItem('selectedStates');
      const localData = localStorage.getItem('selectedStates');
      
      expect(sessionData).toBeTruthy();
      expect(localData).toBeFalsy();
    });

    it('should use localStorage for authenticated users', async () => {
      renderWithProvider();
      
      // Sign in first
      fireEvent.click(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Set selections after authentication
      fireEvent.click(screen.getByText('Set States'));
      fireEvent.click(screen.getByText('Set Category'));
      fireEvent.click(screen.getByText('Set Measure'));
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-category')).toHaveTextContent('Education');
        expect(screen.getByTestId('selected-measure')).toHaveTextContent('Test Measure');
      });

      // Check that data is in localStorage, not sessionStorage
      const localData = localStorage.getItem('selectedStates');
      const sessionData = sessionStorage.getItem('selectedStates');
      
      expect(localData).toBeTruthy();
      expect(sessionData).toBeFalsy();
    });
  });

  describe('Data Migration', () => {
    it('should migrate data from sessionStorage to localStorage on sign-in', async () => {
      renderWithProvider();
      
      // Set selections without authentication (sessionStorage)
      fireEvent.click(screen.getByText('Set States'));
      fireEvent.click(screen.getByText('Set Category'));
      fireEvent.click(screen.getByText('Set Measure'));
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
      });

      // Verify data is in sessionStorage
      expect(sessionStorage.getItem('selectedStates')).toBeTruthy();
      expect(localStorage.getItem('selectedStates')).toBeFalsy();

      // Sign in (should migrate data)
      fireEvent.click(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Verify data migrated to localStorage and cleared from sessionStorage
      expect(localStorage.getItem('selectedStates')).toBeTruthy();
      expect(sessionStorage.getItem('selectedStates')).toBeFalsy();
      
      // Verify selections are still intact
      expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-category')).toHaveTextContent('Education');
      expect(screen.getByTestId('selected-measure')).toHaveTextContent('Test Measure');
    });

    it('should migrate data from localStorage to sessionStorage on sign-out', async () => {
      renderWithProvider();
      
      // Sign in first
      fireEvent.click(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Set selections with authentication (localStorage)
      fireEvent.click(screen.getByText('Set States'));
      fireEvent.click(screen.getByText('Set Category'));
      fireEvent.click(screen.getByText('Set Measure'));
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
      });

      // Verify data is in localStorage
      expect(localStorage.getItem('selectedStates')).toBeTruthy();
      expect(sessionStorage.getItem('selectedStates')).toBeFalsy();

      // Sign out (should migrate data)
      fireEvent.click(screen.getByText('Sign Out'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      // Verify data migrated to sessionStorage and cleared from localStorage
      expect(sessionStorage.getItem('selectedStates')).toBeTruthy();
      expect(localStorage.getItem('selectedStates')).toBeFalsy();
      
      // Verify selections are still intact
      expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-category')).toHaveTextContent('Education');
      expect(screen.getByTestId('selected-measure')).toHaveTextContent('Test Measure');
    });
  });

  describe('Authentication State', () => {
    it('should handle sign-in correctly', async () => {
      renderWithProvider();
      
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      
      fireEvent.click(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Verify user data is stored in localStorage
      const userData = localStorage.getItem('user');
      expect(userData).toBeTruthy();
      
      const user = JSON.parse(userData!);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.sessionExpiry).toBeGreaterThan(Date.now());
    });

    it('should handle sign-out correctly', async () => {
      renderWithProvider();
      
      // Sign in first
      fireEvent.click(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Sign out
      fireEvent.click(screen.getByText('Sign Out'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      // Verify user data is cleared from localStorage
      expect(localStorage.getItem('user')).toBeFalsy();
    });

    it('should load user from localStorage on initialization', async () => {
      // Pre-populate localStorage with user data
      const mockUser = {
        email: 'existing@example.com',
        name: 'Existing User',
        sessionExpiry: Date.now() + 24 * 60 * 60 * 1000
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('existing@example.com');
      });
    });

    it('should handle expired user session', async () => {
      // Pre-populate localStorage with expired user data
      const mockUser = {
        email: 'expired@example.com',
        name: 'Expired User',
        sessionExpiry: Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });

      // Verify expired user data is cleared
      expect(localStorage.getItem('user')).toBeFalsy();
    });
  });

  describe('Favorites Management', () => {
    it('should handle favorites for non-authenticated users', async () => {
      renderWithProvider();
      
      expect(screen.getByTestId('favorites-count')).toHaveTextContent('0');
      
      fireEvent.click(screen.getByText('Add Favorite'));
      
      await waitFor(() => {
        expect(screen.getByTestId('favorites-count')).toHaveTextContent('1');
      });

      // Verify favorites are stored in sessionStorage
      const sessionFavorites = sessionStorage.getItem('favorites');
      expect(sessionFavorites).toBeTruthy();
      
      const favorites = JSON.parse(sessionFavorites!);
      expect(favorites).toHaveLength(1);
      expect(favorites[0].name).toBe('Test Favorite');
    });

    it('should handle favorites for authenticated users', async () => {
      renderWithProvider();
      
      // Sign in first
      fireEvent.click(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      fireEvent.click(screen.getByText('Add Favorite'));
      
      await waitFor(() => {
        expect(screen.getByTestId('favorites-count')).toHaveTextContent('1');
      });

      // Verify favorites are stored in localStorage
      const localFavorites = localStorage.getItem('favorites');
      expect(localFavorites).toBeTruthy();
      
      const favorites = JSON.parse(localFavorites!);
      expect(favorites).toHaveLength(1);
      expect(favorites[0].name).toBe('Test Favorite');
    });

    it('should remove favorites correctly', async () => {
      renderWithProvider();
      
      // Add a favorite
      fireEvent.click(screen.getByText('Add Favorite'));
      
      await waitFor(() => {
        expect(screen.getByTestId('favorites-count')).toHaveTextContent('1');
      });

      // Remove the favorite
      fireEvent.click(screen.getByText('Remove Favorite'));
      
      await waitFor(() => {
        expect(screen.getByTestId('favorites-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Data Persistence', () => {
    it('should persist selections across page reloads for non-authenticated users', async () => {
      renderWithProvider();
      
      // Set selections
      fireEvent.click(screen.getByText('Set States'));
      fireEvent.click(screen.getByText('Set Category'));
      fireEvent.click(screen.getByText('Set Measure'));
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-category')).toHaveTextContent('Education');
        expect(screen.getByTestId('selected-measure')).toHaveTextContent('Test Measure');
      });

      // Simulate page reload by re-rendering
      const { unmount } = renderWithProvider();
      unmount();
      
      renderWithProvider();
      
      // Verify selections are still there
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-category')).toHaveTextContent('Education');
        expect(screen.getByTestId('selected-measure')).toHaveTextContent('Test Measure');
      });
    });

    it('should persist selections across page reloads for authenticated users', async () => {
      renderWithProvider();
      
      // Sign in first
      fireEvent.click(screen.getByText('Sign In'));
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Set selections
      fireEvent.click(screen.getByText('Set States'));
      fireEvent.click(screen.getByText('Set Category'));
      fireEvent.click(screen.getByText('Set Measure'));
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-category')).toHaveTextContent('Education');
        expect(screen.getByTestId('selected-measure')).toHaveTextContent('Test Measure');
      });

      // Simulate page reload by re-rendering
      const { unmount } = renderWithProvider();
      unmount();
      
      renderWithProvider();
      
      // Verify selections are still there
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('selected-states')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-category')).toHaveTextContent('Education');
        expect(screen.getByTestId('selected-measure')).toHaveTextContent('Test Measure');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed localStorage data gracefully', async () => {
      // Set malformed data in localStorage
      localStorage.setItem('user', 'invalid-json');
      localStorage.setItem('selectedStates', 'invalid-json');
      
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        expect(screen.getByTestId('selected-states')).toHaveTextContent('0');
      });
    });

    it('should handle malformed sessionStorage data gracefully', async () => {
      // Set malformed data in sessionStorage
      sessionStorage.setItem('selectedStates', 'invalid-json');
      
      renderWithProvider();
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('0');
      });
    });

    it('should handle storage quota exceeded gracefully', async () => {
      // Mock storage quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      renderWithProvider();
      
      // Should not crash
      fireEvent.click(screen.getByText('Set States'));
      
      await waitFor(() => {
        expect(screen.getByTestId('selected-states')).toHaveTextContent('0');
      });
      
      // Restore original function
      localStorage.setItem = originalSetItem;
    });
  });
}); 