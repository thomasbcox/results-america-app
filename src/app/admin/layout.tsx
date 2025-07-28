"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Database, 
  Users, 
  Settings, 
  LogOut,
  User,
  Shield,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    console.log('🔍 Admin layout: Checking authentication...')
    console.log('🔍 Admin layout: Current URL:', window.location.href)
    console.log('🔍 Admin layout: Document cookies:', document.cookie)
    try {
      const response = await fetch("/api/auth/me");
      console.log('📡 Admin layout: /api/auth/me response status:', response.status)
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Admin layout: /api/auth/me response data:', data)
        
        if (data.success && data.data) {
          // The API response structure is: { success: true, data: { user: {...} } }
          const userData = data.data.user || data.data
          console.log('📡 Admin layout: User data:', userData)
          
          if (userData.role === 'admin') {
            console.log('✅ Admin layout: User is admin, setting user')
            setUser(userData);
          } else {
            console.log('❌ Admin layout: User is not admin, redirecting to login')
            // Redirect to login if not admin
            window.location.href = '/auth/login';
          }
        } else {
          console.log('❌ Admin layout: No user data in response, redirecting to login')
          window.location.href = '/auth/login';
        }
      } else {
        console.log('❌ Admin layout: User not authenticated, redirecting to login')
        // Redirect to login if not authenticated
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('❌ Admin layout: Failed to fetch user:', error);
      window.location.href = '/auth/login';
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: BarChart3,
      current: pathname === '/admin'
    },
    {
      name: 'Data Management',
      href: '/admin/data',
      icon: Database,
      current: pathname === '/admin/data'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      current: pathname === '/admin/users'
    },
    {
      name: 'Suggestions',
      href: '/admin/suggestions',
      icon: MessageSquare,
      current: pathname === '/admin/suggestions'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname === '/admin/settings'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin interface...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="flex items-center hover:opacity-80 transition-opacity duration-200">
                  <Shield className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">
                    Results America Admin
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden xl:ml-6 xl:flex xl:space-x-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      item.current
                        ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-1" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                {/* User info - compact version for smaller screens */}
                <div className="hidden lg:flex items-center space-x-1">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{user.name}</span>
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* User info - full version for very large screens */}
                <div className="hidden 2xl:flex items-center space-x-1">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{user.name}</span>
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{user.email}</span>
                </div>

                {/* Logout button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium rounded-r-md transition-colors duration-200 ${
                  item.current
                    ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 