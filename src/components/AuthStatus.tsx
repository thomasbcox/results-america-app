"use client"
import { useSelection } from "@/lib/context"
import { User, ArrowRight } from "lucide-react"
import Link from "next/link"

interface AuthStatusProps {
  showSignInLink?: boolean
  className?: string
}

export default function AuthStatus({ showSignInLink = true, className = "" }: AuthStatusProps) {
  const { user, signOut } = useSelection()

  const handleSignOut = () => {
    signOut()
  }

  if (user) {
    return (
      <div className={`flex items-center gap-2 text-sm text-black ${className}`}>
        <User className="w-4 h-4" />
        <span>{user.email}</span>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
        >
          Sign out
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    )
  }

  if (showSignInLink) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <Link 
          href="/"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 underline"
        >
          Sign in for enhanced features
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    )
  }

  return null
} 