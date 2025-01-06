import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/empty-contract`;
    console.log('Fetching empty contract from:', backendUrl);

    const backendResponse = await fetch(backendUrl);
    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Failed to fetch empty contract: ${errorText}`);
    }

    const data = await backendResponse.json();
    console.log('Backend response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching empty contract:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch empty contract' },
      { status: 500 }
    );
  }
}
