"use client";

import DashboardLayout from '../../components/DashboardLayout';
import Link from 'next/link';
import SearchBar from '../../components/SearchBar';

// Contract type definition
interface Contract {
  id: number;
  clientName: string;
  price: string;
  status: 'Underwriting' | 'Canceled' | 'Closed' | 'Signature';
  completion: number;
}

// Client type definition
interface Client {
  name: string;
  email: string;
  need: 'Residential' | 'Investment' | 'Rental';
  status: 'Pending' | 'Closed';
  closeDate: string;
}

// Sample data
const contracts: Contract[] = [
  { id: 1, clientName: 'Eleanor & Ethan Bennett', price: '$850,000', status: 'Underwriting', completion: 60 },
  { id: 2, clientName: 'Shane Battier', price: '$4,500,000', status: 'Canceled', completion: 10 },
  { id: 3, clientName: 'John Smith', price: '$650,000', status: 'Closed', completion: 100 },
  { id: 4, clientName: 'Sarah Johnson', price: '$925,000', status: 'Signature', completion: 85 },
];

const clients: Client[] = [
  { name: 'Esthera Jackson', email: 'esthera@tryinkit.com', need: 'Residential', status: 'Pending', closeDate: '04/30/24' },
  { name: 'Mark Wilson', email: 'mark@tryinkit.com', need: 'Investment', status: 'Closed', closeDate: '02/12/24' },
  { name: 'Alice Chen', email: 'alice@tryinkit.com', need: 'Rental', status: 'Pending', closeDate: '05/15/24' },
];

export default function ContractsPage() {
  return (
    <DashboardLayout>
      <div className="px-6 sm:px-0">
        {/* Header with breadcrumb and action button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Pages</Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-900">Contracts</span>
          </div>
          <Link
            href="/generate-contract"
            className="inline-flex items-center px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors w-full sm:w-auto justify-center touch-manipulation"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate a Contract
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={(query) => console.log('Searching for:', query)} />
        </div>
      </div>

      {/* Contracts Section */}
      <div className="bg-white rounded-xl shadow-sm mb-6 max-w-[100vw]">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contracts</h2>
          <p className="text-sm text-gray-500">10 done this month</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 -mx-6">
          <div className="inline-block min-w-full align-middle px-6">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-auto sm:w-1/4">Client Names</th>
                  <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contracts.map((contract, index) => (
                  <tr key={index} className="group hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <Link href={`/contracts/${contract.id}`} className="block w-full touch-manipulation">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-900 truncate">{contract.clientName}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                      <Link href={`/contracts/${contract.id}`} className="block w-full touch-manipulation">
                        <span className="text-sm text-gray-900">{contract.price}</span>
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <Link href={`/contracts/${contract.id}`} className="block w-full touch-manipulation">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          contract.status === 'Closed' ? 'bg-green-100 text-green-800' :
                          contract.status === 'Canceled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {contract.status}
                        </span>
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                      <Link href={`/contracts/${contract.id}`} className="block w-full touch-manipulation">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-pink-600 h-2 rounded-full"
                              style={{ width: `${contract.completion}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 whitespace-nowrap">{contract.completion}%</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button className="p-2 -m-2 text-gray-400 hover:text-gray-600 touch-manipulation">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clients Section */}
      <div className="bg-white rounded-xl shadow-sm max-w-[100vw]">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 -mx-6">
          <div className="inline-block min-w-full align-middle px-6">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-auto sm:w-1/4">Name & Email</th>
                  <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Need</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 truncate">{client.name}</span>
                        <span className="text-sm text-gray-500 truncate">{client.email}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                      <span className="text-sm text-gray-900">{client.need}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        client.status === 'Pending' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                      <span className="text-sm text-gray-900">{client.closeDate}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button className="p-2 -m-2 text-blue-600 hover:text-blue-800 touch-manipulation">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
