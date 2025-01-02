"use client";

import DashboardLayout from '../../../components/DashboardLayout';
import Link from 'next/link';

interface ContractAction {
  user: string;
  action: string;
  timestamp: string;
  isClickable?: boolean;
}

interface Recipient {
  name: string;
  email: string;
}

const contractActions: ContractAction[] = [
  {
    user: "Sean Love",
    action: "generated the Residential Sales Contract",
    timestamp: "23 April 7:20 PM"
  },
  {
    user: "Sean Love",
    action: "made edits to the Residential Sales Contract",
    timestamp: "23 April 7:25 PM"
  },
  {
    user: "Sean Love",
    action: "added the Financing Contingency addendum",
    timestamp: "23 April 7:29 PM"
  },
  {
    user: "Braxton Sanchez",
    action: "proposed a counter offer",
    timestamp: "20 April 3:52 PM",
    isClickable: true
  }
];

const recipients: Recipient[] = [
  {
    name: "Daniel Thomas",
    email: "daniel@tryinkit.com"
  },
  {
    name: "Alexa Liras",
    email: "alexa@tryinkit.com"
  }
];

export default function ContractPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 lg:mb-6 px-4 lg:px-0">
          <div className="flex items-center space-x-2 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/contracts" className="text-gray-500 hover:text-gray-700">Contracts</Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-900">Thomas and Liras - Residential Sales Contract</span>
          </div>
          <button className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shrink-0">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 space-y-4 lg:space-y-0 lg:space-x-6 overflow-hidden px-4 lg:px-0">
          {/* Left Sidebar - Contract Actions */}
          <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm p-4 lg:p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Actions</h2>
            <div className="space-y-4">
              {contractActions.map((action, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-pink-600 mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{action.user}</span>
                        {" "}
                        <span className={action.isClickable ? "text-pink-600 cursor-pointer hover:underline" : ""}>
                          {action.action}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">{action.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Contract Document */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-4 lg:p-6 overflow-y-auto">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6">Residential Sales Contract (Virginia)</h1>
            
            <div className="space-y-6 lg:space-y-8">
              {/* Real Property Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Real Property</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Legal Description</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500" placeholder="Enter legal description" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tax Map or Account #</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500" placeholder="NA" />
                  </div>
                </div>
              </div>

              {/* Price and Financing Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Price and Financing</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sales Price</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500" placeholder="Enter sales price" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Down Payment</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500" placeholder="Enter down payment" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Financing Type</label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500">
                    <option>Conventional</option>
                    <option>VA</option>
                    <option>FHA</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Recipients */}
          <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm p-4 lg:p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipients</h2>
            <div className="space-y-4">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <span className="text-sm font-medium text-gray-900">{recipient.name}</span>
                  <span className="text-sm text-gray-500">{recipient.email}</span>
                </div>
              ))}
            </div>

            {/* Document Thumbnails */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Document Pages</h3>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((page) => (
                  <div key={page} className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500">Page {page}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-4 lg:mt-6 px-4 lg:px-0">
          <button className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors w-full sm:w-auto">
            Review & Send
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
