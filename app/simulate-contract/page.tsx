'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import DashboardLayout from '../../components/DashboardLayout';
import Link from 'next/link';

interface Contract {
  type: string;
  key: string;
  url: string;
}

interface SimulationResponse {
  message: string;
  contracts: Contract[];
}

export default function SimulateContract() {
  const { user, authenticated } = usePrivy();
  const [simulationResponse, setSimulationResponse] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateContract = async () => {
    if (!authenticated || !user?.email) {
      setError('Please log in first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/simulate-contract/${encodeURIComponent(user.email.toString())}`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to simulate contract');
      }

      const data: SimulationResponse = await response.json();
      setSimulationResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-6 sm:px-0">
        {/* Header with breadcrumb */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Pages</Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-900">Simulate Contract</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contract Simulation</h2>
            <p className="text-sm text-gray-500 mt-1">Generate a simulated contract to test the system</p>
          </div>
          
          <div className="p-6">
            {!authenticated ? (
              <p className="text-red-500">Please log in to simulate contracts</p>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={simulateContract}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Generate Simulated Contract
                    </>
                  )}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="ml-3 text-sm text-red-700">
                        Error: {error}
                      </p>
                    </div>
                  </div>
                )}

                {simulationResponse && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex">
                        <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="ml-3 text-sm text-green-700">
                          {simulationResponse.message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {simulationResponse.contracts.map((contract, index) => (
                        <div key={contract.key} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-900">{contract.type} Contract</h3>
                          </div>
                          <iframe
                            src={contract.url}
                            className="w-full h-[400px]"
                            title={`${contract.type} Contract Preview`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
