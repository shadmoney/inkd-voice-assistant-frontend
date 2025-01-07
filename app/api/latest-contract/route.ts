import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    const filePath = path.join(process.cwd(), 'backend', 'output', filename);

    console.log('Attempting to serve file:', filePath);

    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${filename}"`);
    // Add cache control to prevent caching
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    console.error('Error serving contract:', error);
    return new NextResponse('Error serving file', { status: 500 });
  }
}
