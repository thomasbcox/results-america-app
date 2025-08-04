import Image from 'next/image'
import { useState } from 'react'

interface StateFlagProps {
  stateCode: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  showFallback?: boolean
}

const sizeClasses = {
  small: 'w-6 h-4',
  medium: 'w-8 h-5',
  large: 'w-12 h-8'
}

const fallbackColors = {
  'AL': 'bg-red-600', 'AK': 'bg-blue-600', 'AZ': 'bg-red-600',
  'AR': 'bg-red-600', 'CA': 'bg-red-600', 'CO': 'bg-red-600',
  'CT': 'bg-blue-600', 'DE': 'bg-blue-600', 'FL': 'bg-red-600',
  'GA': 'bg-red-600', 'HI': 'bg-blue-600', 'ID': 'bg-red-600',
  'IL': 'bg-blue-600', 'IN': 'bg-blue-600', 'IA': 'bg-blue-600',
  'KS': 'bg-blue-600', 'KY': 'bg-blue-600', 'LA': 'bg-red-600',
  'ME': 'bg-blue-600', 'MD': 'bg-red-600', 'MA': 'bg-blue-600',
  'MI': 'bg-blue-600', 'MN': 'bg-blue-600', 'MS': 'bg-red-600',
  'MO': 'bg-red-600', 'MT': 'bg-blue-600', 'NE': 'bg-blue-600',
  'NV': 'bg-blue-600', 'NH': 'bg-blue-600', 'NJ': 'bg-blue-600',
  'NM': 'bg-red-600', 'NY': 'bg-blue-600', 'NC': 'bg-red-600',
  'ND': 'bg-blue-600', 'OH': 'bg-blue-600', 'OK': 'bg-red-600',
  'OR': 'bg-blue-600', 'PA': 'bg-blue-600', 'RI': 'bg-blue-600',
  'SC': 'bg-red-600', 'SD': 'bg-blue-600', 'TN': 'bg-red-600',
  'TX': 'bg-red-600', 'UT': 'bg-red-600', 'VT': 'bg-blue-600',
  'VA': 'bg-red-600', 'WA': 'bg-blue-600', 'WV': 'bg-blue-600',
  'WI': 'bg-blue-600', 'WY': 'bg-blue-600'
}

export default function StateFlag({ 
  stateCode, 
  size = 'medium', 
  className = '',
  showFallback = true 
}: StateFlagProps) {
  const [imageError, setImageError] = useState(false)
  const normalizedStateCode = stateCode.toLowerCase()
  
  // Don't render if no fallback and image failed
  if (imageError && !showFallback) {
    return null
  }

  // Fallback colored rectangle if image fails or doesn't exist
  if (imageError || !normalizedStateCode) {
    const fallbackColor = (fallbackColors as Record<string, string>)[stateCode.toUpperCase()] || 'bg-gray-400'
    return (
      <div 
        className={`
          ${sizeClasses[size]} 
          ${fallbackColor} 
          rounded-sm 
          flex items-center justify-center 
          text-white text-xs font-bold
          ${className}
        `}
        title={`Flag of ${stateCode.toUpperCase()}`}
      >
        {stateCode.toUpperCase()}
      </div>
    )
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <Image
        src={`/flags/us/${normalizedStateCode}.svg`}
        alt={`Flag of ${stateCode.toUpperCase()}`}
        width={size === 'small' ? 24 : size === 'medium' ? 32 : 48}
        height={size === 'small' ? 16 : size === 'medium' ? 20 : 32}
        className="w-full h-full object-cover rounded-sm"
        onError={() => setImageError(true)}
        priority={false} // Lazy load flags
      />
    </div>
  )
} 