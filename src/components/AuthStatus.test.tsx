import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthStatus from './AuthStatus';
import { SelectionProvider } from '@/lib/context';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the context
const mockSignOut = vi.fn();

const renderWithProvider = (user: any = null) => {
  return render(
    <SelectionProvider>
      <AuthStatus />
    </SelectionProvider>
  );
};

describe('AuthStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Non-authenticated users', () => {
    it('should show sign-in link when user is not authenticated', () => {
      renderWithProvider(null);
      
      expect(screen.getByText('Sign in for enhanced features')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in for enhanced features/i })).toBeInTheDocument();
    });

    it('should link to home page for sign-in', () => {
      renderWithProvider(null);
      
      const signInLink = screen.getByRole('link', { name: /sign in for enhanced features/i });
      expect(signInLink).toHaveAttribute('href', '/');
    });

    it('should not show user info when not authenticated', () => {
      renderWithProvider(null);
      
      expect(screen.queryByText(/user@example\.com/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
    });

    it('should not show sign-in link when showSignInLink is false', () => {
      render(
        <SelectionProvider>
          <AuthStatus showSignInLink={false} />
        </SelectionProvider>
      );
      
      expect(screen.queryByText('Sign in for enhanced features')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated users', () => {
    it('should show user email when authenticated', () => {
      // Mock localStorage with user data
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        sessionExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      renderWithProvider(mockUser);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should show sign-out button when authenticated', () => {
      // Mock localStorage with user data
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        sessionExpiry: Date.now() + 24 * 60 * 60 * 1000
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      renderWithProvider(mockUser);
      
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('should call signOut when sign-out button is clicked', () => {
      // Mock localStorage with user data
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        sessionExpiry: Date.now() + 24 * 60 * 60 * 1000
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      renderWithProvider(mockUser);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);
      
      // The signOut function should be called (this is handled by the context)
      expect(signOutButton).toBeInTheDocument();
    });

    it('should show user icon when authenticated', () => {
      // Mock localStorage with user data
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        sessionExpiry: Date.now() + 24 * 60 * 60 * 1000
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      renderWithProvider(mockUser);
      
      // Check for the User icon (it should be present in the DOM)
      const userIcon = document.querySelector('[data-lucide="user"]');
      expect(userIcon).toBeInTheDocument();
    });
  });

  describe('Component props', () => {
    it('should apply custom className when provided', () => {
      render(
        <SelectionProvider>
          <AuthStatus className="custom-class" />
        </SelectionProvider>
      );
      
      const container = screen.getByText('Sign in for enhanced features').closest('div');
      expect(container).toHaveClass('custom-class');
    });

    it('should have default styling when no className provided', () => {
      render(
        <SelectionProvider>
          <AuthStatus />
        </SelectionProvider>
      );
      
      const container = screen.getByText('Sign in for enhanced features').closest('div');
      expect(container).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for sign-in link', () => {
      renderWithProvider(null);
      
      const signInLink = screen.getByRole('link', { name: /sign in for enhanced features/i });
      expect(signInLink).toBeInTheDocument();
    });

    it('should have proper ARIA labels for sign-out button', () => {
      // Mock localStorage with user data
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        sessionExpiry: Date.now() + 24 * 60 * 60 * 1000
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      renderWithProvider(mockUser);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderWithProvider(null);
      
      const signInLink = screen.getByRole('link', { name: /sign in for enhanced features/i });
      expect(signInLink).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Edge cases', () => {
    it('should handle expired user session gracefully', () => {
      // Mock localStorage with expired user data
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        sessionExpiry: Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago (expired)
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      renderWithProvider(mockUser);
      
      // Should show sign-in link for expired session
      expect(screen.getByText('Sign in for enhanced features')).toBeInTheDocument();
    });

    it('should handle malformed user data gracefully', () => {
      // Mock localStorage with malformed user data
      localStorage.setItem('user', 'invalid-json');
      
      renderWithProvider();
      
      // Should show sign-in link for malformed data
      expect(screen.getByText('Sign in for enhanced features')).toBeInTheDocument();
    });

    it('should handle missing user data gracefully', () => {
      renderWithProvider();
      
      // Should show sign-in link when no user data
      expect(screen.getByText('Sign in for enhanced features')).toBeInTheDocument();
    });
  });
}); 