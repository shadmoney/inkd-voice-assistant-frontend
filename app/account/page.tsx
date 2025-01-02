"use client";

import DashboardLayout from '../../components/DashboardLayout';

// Profile Section Component
const ProfileSection = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="bg-red-600 text-white font-bold w-12 h-12 rounded-lg flex items-center justify-center">
          KW
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sean Love</h3>
          <p className="text-gray-600">seanlove@kw.com</p>
        </div>
      </div>
      <button className="text-gray-400 hover:text-gray-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  </div>
);

// Billing Section Component
const BillingSection = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Billing Details</h3>
        <p className="text-gray-600">•••• •••• •••• 7812</p>
        <p className="text-sm text-gray-500">Renews June 5</p>
      </div>
      <button className="px-4 py-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
        Edit
      </button>
    </div>
  </div>
);

// Transaction History Component
const TransactionHistory = () => {
  const transactions = [
    {
      id: 1,
      title: "Closing - Krish Rastogi",
      date: "27 April 2024",
      time: "12:30 PM",
      amount: 14546,
      status: "completed"
    },
    {
      id: 2,
      title: "Closing - Ethan & Eleanor Bennett",
      date: "26 April 2024",
      time: "6:30 PM",
      amount: 12954,
      status: "completed"
    },
    {
      id: 3,
      title: "James & Jessica Smith's contract was ratified",
      date: "26 April 2024",
      time: "12:30 PM",
      status: "pending"
    },
    {
      id: 4,
      title: "Preston & Isabel Rodriguez's contract was not accepted",
      date: "26 April 2024",
      time: "10:30 AM",
      status: "pending"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Your Transactions</h3>
        <p className="text-sm text-gray-500">April 5 - May 5</p>
      </div>
      <div className="space-y-6">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{transaction.title}</p>
              <p className="text-sm text-gray-500">{transaction.date}, {transaction.time}</p>
            </div>
            <div className="text-right">
              {transaction.amount ? (
                <p className="font-medium text-green-600">+${transaction.amount.toLocaleString()}</p>
              ) : (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Earnings Overview Component
const EarningsOverview = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Earnings</h3>
    <div className="mb-6">
      <p className="text-3xl font-bold text-gray-900">${(154855).toLocaleString()}</p>
      <p className="text-sm text-gray-500 mt-1">Last transaction: Krish Rastogi (+$14,546)</p>
    </div>
    <div className="h-32 bg-gray-50 rounded-lg"></div>
  </div>
);

// Referral Tracking Component
const ReferralTracking = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">Referral Tracking</h3>
      <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
        Invite
      </button>
    </div>
    <div className="flex items-center space-x-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-semibold text-gray-900">$125</p>
        </div>
        <svg className="transform -rotate-90" width="96" height="96">
          <circle
            cx="48"
            cy="48"
            r="45"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="6"
          />
          <circle
            cx="48"
            cy="48"
            r="45"
            fill="none"
            stroke="#ec4899"
            strokeWidth="6"
            strokeDasharray="283"
            strokeDashoffset="141"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm text-gray-500">Total Payout</p>
        <p className="text-sm text-gray-500 mt-2">14 people invited</p>
      </div>
    </div>
  </div>
);

export default function AccountPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600">Manage your account settings and view transactions</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <ProfileSection />
          <BillingSection />
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <TransactionHistory />
          <EarningsOverview />
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <ReferralTracking />
        </div>
      </div>
    </DashboardLayout>
  );
}
