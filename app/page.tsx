"use client";

import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import { usePrivy } from '@privy-io/react-auth';
import SearchBar from '../components/SearchBar';

// Format wallet address to show first 6 and last 4 characters
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function Dashboard() {
  const { user } = usePrivy();
  const displayName = user?.email?.address || formatAddress(user?.wallet?.address || '');
  
  return (
    <DashboardLayout>
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center text-sm">
          <span className="text-gray-500">Pages</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Dashboard</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm text-gray-500">New Clients</div>
            <div className="flex items-center">
              <span className="text-xl font-semibold">4</span>
              <span className="ml-2 text-sm text-red-500">-14%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Volume</div>
            <div className="flex items-center">
              <span className="text-xl font-semibold">$675,000</span>
              <span className="ml-2 text-sm text-green-500">+8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar onSearch={(query) => console.log('Searching for:', query)} />
      </div>

      {/* Generate Contract Button */}
      <div className="mb-8">
        <Link 
          href="/generate-contract"
          className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate a Contract
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-2">
            Welcome back, <span className="text-pink-600">{displayName}</span>
          </h2>
        </div>

        {/* Contract Acceptance Rate */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="mb-2">😊</div>
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-pink-100">
            <span className="text-3xl font-bold text-pink-600">95%</span>
          </div>
          <div className="mt-2 text-gray-600">Contract Acceptance Rate</div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="text-gray-900">Eleanor Bennett viewed the Virginia Residential Sales Contract</p>
              <p className="text-gray-500">23 APRIL - 7:20 PM</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-900">Preston & Isabel Rodriguez signed their contract!</p>
              <p className="text-gray-500">23 APRIL - 11:21 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Section */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Contracts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Eleanor & Ethan Bennett</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">EB</div>
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">EB</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$850,000</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-pink-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Preston & Isabel Rodriguez</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">PR</div>
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">IR</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$675,000</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-pink-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Clients</span>
                <span className="text-sm font-semibold">431</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-pink-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Volume</span>
                <span className="text-sm font-semibold">$2,504,643</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-pink-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Contracts</span>
                <span className="text-sm font-semibold">683</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-pink-600 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Closings</span>
                <span className="text-sm font-semibold">27</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-pink-600 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
