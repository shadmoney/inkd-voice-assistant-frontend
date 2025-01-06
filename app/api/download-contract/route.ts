import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';

// Helper function to get user ID from session
async function getUserId(): Promise<string> {
  const session: Session | null = await getServerSession();
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }
  return session.user.email;
}

// Generate presigned download URL for a contract
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Contract key is required' },
        { status: 400 }
      );
    }

    // Verify the key belongs to the user
    if (!key.startsWith(`${userId}/`)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Call backend API to get presigned download URL
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/download-contract`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          key,
        }),
      }
    );

    if (!backendResponse.ok) {
      throw new Error('Failed to generate download URL');
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error generating download URL:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
