import { NextRequest, NextResponse } from 'next/server';

// Generate contract and get upload URL
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      throw new Error('Unauthorized: No user ID provided');
    }

    const body = await request.json();
    console.log('Generating contract for user:', userId);
    
    // Call backend API to generate contract
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/run-tooltest/${userId}`;
    console.log('Calling backend URL:', backendUrl);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
