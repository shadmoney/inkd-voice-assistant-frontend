'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_API_KEY!}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: '/Logo-01.svg',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
