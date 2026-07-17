import { NextRequest, NextResponse } from 'next/server';
import { DestinationService } from '@/services/destination.service';

/**
 * ⚡ DESTINATION GUIDE API (Server Proxy Wrapper)
 * Safely runs the Google Places and Gemini synthesis on the server,
 * preventing Webpack client-side compilation issues in RSC/NextAuth environments.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination') || searchParams.get('location');

  if (!destination) {
    return NextResponse.json({ success: false, error: 'destination param required' }, { status: 400 });
  }

  try {
    // Force HMR reload
    const guideData = await DestinationService.generateDestinationGuide(destination);
    
    return NextResponse.json({
      success: true,
      data: guideData
    });
  } catch (error: any) {
    console.error('❌ Destination Guide API Error:', error);
    
    // Return structured failure response to safeguard UI stability
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate destination guide'
    }, { status: 500 });
  }
}
