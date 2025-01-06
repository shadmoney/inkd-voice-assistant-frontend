import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    if (!userId) {
      throw new Error('Unauthorized: No user ID provided');
    }

    // Get contract data from request body
    const contractData = await request.json();

    // Call backend API to run tooltest
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/run-tooltest/${userId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);
      throw new Error(`Failed to run tooltest: ${errorText}`);
    }

    const data = await backendResponse.json();
    
    // If we got a URL back, set it in the frontend
    if (data.url) {
      return NextResponse.json({ 
        message: "Contract generation started",
        status: "generating",
        url: data.url,
        contractId: data.contractId // Pass through the contract ID from backend
      });
    }
    
    return NextResponse.json({ error: "Failed to start contract generation" }, { status: 500 });
  } catch (error) {
    console.error('Error running tooltest:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run tooltest' },
      { status: 500 }
    );
  }
}
