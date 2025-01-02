import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

interface HeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMobileMenuOpen }) => {
  const { user, logout } = usePrivy();
  const pathname = usePathname();
  const pathSegments = pathname?.split('/').filter(Boolean) || [];

  // Format wallet address to show first 6 and last 4 characters
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get display name based on auth type
  const getDisplayName = () => {
    if (!user) return '';
    
    // For email users
    if (user.email?.address) {
      return user.email.address;
    }
    
    // For wallet users
    if (user.wallet?.address) {
      return formatAddress(user.wallet.address);
    }
    
    return 'Authenticated User';
  };

  return (
    <header className="flex justify-between items-center p-4 sm:p-6 bg-white border-b border-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-2 mr-2 text-gray-600 hover:text-gray-900"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Left section - Breadcrumb */}
      <div className="hidden sm:flex items-center text-sm">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Pages
        </Link>
        {pathSegments.map((segment, index) => (
          <React.Fragment key={segment}>
            <span className="mx-2 text-gray-400">/</span>
            <span className={`capitalize ${
              index === pathSegments.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}>
              {segment}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right section - User controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {user && (
          <>
            <span className="hidden sm:inline text-sm text-gray-700">
              {getDisplayName()}
            </span>
            <button
              onClick={logout}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
