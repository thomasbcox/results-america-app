'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  Info,
  ExternalLink
} from 'lucide-react';

interface DataQualityIndicatorProps {
  dataQuality: 'mock' | 'real';
  provenance?: string | null;
  sourceUrl?: string | null;
  showBadge?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function DataQualityIndicator({
  dataQuality,
  provenance,
  sourceUrl,
  showBadge = true,
  showIcon = true,
  size = 'md',
  className = ''
}: DataQualityIndicatorProps) {
  const [showProvenance, setShowProvenance] = useState(false);

  const getQualityIcon = () => {
    if (dataQuality === 'real') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getQualityBadge = () => {
    if (dataQuality === 'real') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Real Data</Badge>;
    } else {
      return <Badge variant="secondary">Mock Data</Badge>;
    }
  };

  const getQualityText = () => {
    if (dataQuality === 'real') {
      return 'Real Data';
    } else {
      return 'Mock Data';
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && getQualityIcon()}
      
      {showBadge && getQualityBadge()}
      
      {!showBadge && (
        <span className={`${sizeClasses[size]} font-medium ${
          dataQuality === 'real' ? 'text-green-700' : 'text-yellow-700'
        }`}>
          {getQualityText()}
        </span>
      )}

      {(provenance || sourceUrl) && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProvenance(!showProvenance)}
            className="h-6 w-6 p-0"
          >
            <Info className="h-4 w-4 text-gray-500" />
          </Button>

          {showProvenance && (
            <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Data Source Information</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProvenance(false)}
                  className="h-4 w-4 p-0"
                >
                  ×
                </Button>
              </div>
              
              {provenance && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Provenance</h5>
                  <p className="text-xs text-gray-600 leading-relaxed">{provenance}</p>
                </div>
              )}
              
              {sourceUrl && (
                <div className="flex items-center space-x-2">
                  <h5 className="text-sm font-medium text-gray-700">Source</h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(sourceUrl, '_blank')}
                    className="h-6 px-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit Source
                  </Button>
                </div>
              )}
              
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {dataQuality === 'real' 
                    ? 'This data comes from official government sources and is regularly updated.'
                    : 'This is simulated data for demonstration purposes.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 