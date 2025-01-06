import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/latest-contract`;
    console.log('Fetching from backend URL:', backendUrl);

    // Call backend API to get latest contract
    const backendResponse = await fetch(backendUrl);
    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Failed to fetch latest contract: ${errorText}`);
    }

    const data = await backendResponse.json();
    console.log('Backend response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching latest contract:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch latest contract' },
      { status: 500 }
    );
  }
}
