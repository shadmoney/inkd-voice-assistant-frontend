'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { login, ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-gray-900 to-black items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-90"></div>
        <div className="relative z-10 text-center">
          <div className="mb-8">
            <Image src="/inkd-logo.svg" alt="Inkd Logo" width={200} height={100} className="mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Secure. Simple. Seamless Login.
          </h2>
          <p className="text-gray-300 max-w-md mx-auto">
            Experience privacy-focused authentication powered by cutting-edge technology.
          </p>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-[90%] sm:max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-6 sm:mb-8 text-center">
            <Image src="/inkd-logo.svg" alt="Inkd Logo" width={120} height={60} className="mx-auto" />
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Log in to your Inkd account</p>
          </div>

          <button
            onClick={login}
            className="w-full flex justify-center py-3 sm:py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-base sm:text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 touch-manipulation"
          >
            Login
          </button>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="text-[11px] sm:text-xs text-center text-gray-500">
              <div className="mt-2">
                Secure authentication powered by{' '}
                <span className="text-gray-700">Privy.io</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
