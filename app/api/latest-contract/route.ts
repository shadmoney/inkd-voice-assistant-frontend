import { NextResponse } from 'next/server';

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      throw new Error('Unauthorized: No user ID provided');
    }

    // Get contract_id from query params
    const searchParams = request.nextUrl.searchParams;
    const contractId = searchParams.get('contract_id');

    // Build URL with optional contract_id
    let backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/latest-contract/${userId}`;
    if (contractId) {
      backendUrl += `?contract_id=${contractId}`;
    }
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
    
    // Extract timestamp from URL if it exists
    let lastModified = '';
    if (data.url) {
      const match = data.url.match(/ResidentialSalesContract_(\d{4}-\d{2}-\d{2}-\d{6})/);
      if (match) {
        lastModified = match[1];
      }
    }
    
    return NextResponse.json({
      ...data,
      lastModified
    });
  } catch (error) {
    console.error('Error fetching latest contract:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch latest contract' },
      { status: 500 }
    );
  }
}
