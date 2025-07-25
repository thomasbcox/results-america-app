'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelection } from '@/lib/context';

export default function MagicLinkVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useSelection();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyMagicLink = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Invalid magic link');
        setStatus('error');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${token}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          // Sign in the user
          signIn(data.data.user.email, data.data.user.name);
          
          setStatus('success');
          
          // Redirect based on user role
          setTimeout(() => {
            if (data.data.user.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/results');
            }
          }, 2000);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Verification failed');
          setStatus('error');
        }
      } catch (error) {
        console.error('Magic link verification error:', error);
        setError('Verification failed. Please try again.');
        setStatus('error');
      }
    };

    verifyMagicLink();
  }, [searchParams, signIn, router]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Magic Link
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your magic link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verification Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              You have been successfully authenticated. Redirecting...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
} 