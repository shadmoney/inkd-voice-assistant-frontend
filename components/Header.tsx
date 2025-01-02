import React from 'react';

const Header = () => {
  return (
    <header className="flex justify-between items-center p-6 bg-white border-b border-gray-100">
      {/* Left section */}
      <div className="flex flex-col">
        <div className="text-3xl font-light mb-1 text-gray-800">ℯ</div>
        <div className="flex flex-col text-sm">
          <span className="font-medium text-gray-800">Pages</span>
          <span className="text-gray-500">Generate</span>
        </div>
      </div>

      {/* Center section */}
      <div className="flex-1 mx-8">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Enter an address"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right section */}
      <div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg 
            className="w-5 h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
