"use client";

import DashboardLayout from '../../components/DashboardLayout';
import Link from 'next/link';

// Contract type definition
interface Contract {
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
  { clientName: 'Eleanor & Ethan Bennett', price: '$850,000', status: 'Underwriting', completion: 60 },
  { clientName: 'Shane Battier', price: '$4,500,000', status: 'Canceled', completion: 10 },
  { clientName: 'John Smith', price: '$650,000', status: 'Closed', completion: 100 },
  { clientName: 'Sarah Johnson', price: '$925,000', status: 'Signature', completion: 85 },
];

const clients: Client[] = [
  { name: 'Esthera Jackson', email: 'esthera@tryinkit.com', need: 'Residential', status: 'Pending', closeDate: '04/30/24' },
  { name: 'Mark Wilson', email: 'mark@tryinkit.com', need: 'Investment', status: 'Closed', closeDate: '02/12/24' },
  { name: 'Alice Chen', email: 'alice@tryinkit.com', need: 'Rental', status: 'Pending', closeDate: '05/15/24' },
];

export default function ContractsPage() {
  return (
    <DashboardLayout>
      {/* Header with breadcrumb and action button */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-gray-500 hover:text-gray-700">Pages</Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-900">Contracts</span>
        </div>
        <Link
          href="/generate-contract"
          className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate a Contract
        </Link>
      </div>

      {/* Contracts Section */}
      <div className="bg-white rounded-xl shadow-sm mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contracts</h2>
          <p className="text-sm text-gray-500">10 done this month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Names</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contracts.map((contract, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-900">{contract.clientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{contract.price}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      contract.status === 'Closed' ? 'bg-green-100 text-green-800' :
                      contract.status === 'Canceled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-pink-600 h-2 rounded-full"
                          style={{ width: `${contract.completion}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{contract.completion}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600">
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

      {/* Clients Section */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Need</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{client.name}</span>
                      <span className="text-sm text-gray-500">{client.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{client.need}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      client.status === 'Pending' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{client.closeDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
