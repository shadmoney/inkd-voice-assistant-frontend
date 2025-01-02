"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200">
      <div className="px-6 py-8">
        <Image
          src="/inkd-logo.svg"
          alt="Inkd Logo"
          width={120}
          height={40}
          priority
        />
      </div>
      <nav className="px-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/"
              className={`flex items-center px-4 py-2 text-sm rounded-lg ${
                pathname === '/' ? 'text-pink-600 bg-pink-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              href="/contracts"
              className={`flex items-center px-4 py-2 text-sm rounded-lg ${
                pathname === '/contracts' ? 'text-pink-600 bg-pink-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Contracts
            </Link>
          </li>
          <li>
            <Link 
              href="/generate-contract"
              className={`flex items-center px-4 py-2 text-sm rounded-lg ${
                pathname === '/generate-contract' ? 'text-pink-600 bg-pink-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Generate Contract
            </Link>
          </li>
          <li>
            <Link 
              href="/account"
              className={`flex items-center px-4 py-2 text-sm rounded-lg ${
                pathname === '/account' ? 'text-pink-600 bg-pink-50' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Account
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
