import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    // Get contract status from backend
    const backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/contract-status/${userId}`;
    console.log('Fetching contract status from:', backendUrl);

    const backendResponse = await fetch(backendUrl);
    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Failed to fetch contract status: ${errorText}`);
    }

    const data = await backendResponse.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching contract status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch contract status' },
      { status: 500 }
    );
  }
}
