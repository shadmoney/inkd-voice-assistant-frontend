import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Call backend API to get contract form
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/contract-form`);

    if (!backendResponse.ok) {
      throw new Error('Failed to fetch contract form');
    }

    // Forward the response from the backend
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}
