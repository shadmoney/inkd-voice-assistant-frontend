import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';

// Helper function to get user ID from session
async function getUserId(): Promise<string> {
  const session: Session | null = await getServerSession();
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }
  return session.user.email; // Using email as user ID for now
}

// Generate contract and get upload URL
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    
    // Call backend API to generate contract
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/run-tooltest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        user_id: userId, // Pass user_id to backend
      }),
    });

    if (!backendResponse.ok) {
      throw new Error('Failed to generate contract');
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error generating contract:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}

// List user's contracts
export async function GET() {
  try {
    const userId = await getUserId();

    // Call backend API to list contracts
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/list-contracts/${userId}`
    );

    if (!backendResponse.ok) {
      throw new Error('Failed to fetch contracts');
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error listing contracts:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to list contracts' },
      { status: 500 }
    );
  }
}
