import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Readable } from 'stream';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { itinerary } = await req.json();

    if (!itinerary) {
      return NextResponse.json({ success: false, error: 'Itinerary data is required' }, { status: 400 });
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          
          const headers = new Headers();
          headers.set('Content-Type', 'application/pdf');
          headers.set('Content-Disposition', `attachment; filename="OnlyExplore_Itinerary.pdf"`);
          headers.set('Content-Length', pdfBuffer.length.toString());

          resolve(new NextResponse(pdfBuffer, { status: 200, headers }));
        });

        // Add PDF Content
        doc.fontSize(24).font('Helvetica-Bold').text('OnlyExplore Travel Itinerary', { align: 'center' });
        doc.moveDown();

        doc.fontSize(16).font('Helvetica-Bold').text(`Destination: ${itinerary.destination || 'Custom Trip'}`);
        doc.fontSize(12).font('Helvetica').text(`Duration: ${itinerary.duration || 'N/A'} days`);
        doc.text(`Budget: ₹${itinerary.budget || 'N/A'}`);
        doc.moveDown(2);

        // Days Loop
        if (itinerary.days && Array.isArray(itinerary.days)) {
          itinerary.days.forEach((day: any) => {
            doc.fontSize(14).font('Helvetica-Bold').text(`Day ${day.day}: ${day.theme || ''}`);
            doc.moveDown(0.5);

            const writeActivities = (timeOfDay: string, acts: any[]) => {
              if (acts && acts.length > 0) {
                doc.fontSize(12).font('Helvetica-Oblique').text(`${timeOfDay}:`);
                acts.forEach((a: any) => {
                  doc.font('Helvetica').text(`• ${a.name} ${a.description ? `- ${a.description}` : ''}`);
                });
                doc.moveDown(0.5);
              }
            };

            writeActivities('Morning', day.morning || []);
            writeActivities('Afternoon', day.afternoon || []);
            writeActivities('Evening', day.evening || []);

            // Fallback flat activities array if present
            if (day.activities && day.activities.length > 0) {
              day.activities.forEach((a: any) => {
                doc.font('Helvetica').text(`• ${a.name} ${a.description ? `- ${a.description}` : ''}`);
              });
              doc.moveDown(0.5);
            }

            if (day.travelTips) {
              doc.fontSize(10).font('Helvetica-Oblique').text(`Tip: ${day.travelTips}`);
              doc.moveDown();
            }
            doc.moveDown();
          });
        }

        // Checklist
        if (itinerary.packingChecklist && itinerary.packingChecklist.length > 0) {
          doc.addPage();
          doc.fontSize(16).font('Helvetica-Bold').text('Packing Checklist');
          doc.moveDown();
          itinerary.packingChecklist.forEach((item: string) => {
            doc.fontSize(12).font('Helvetica').text(`[ ] ${item}`);
          });
        }

        doc.end();
      } catch (err) {
        reject(NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 }));
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
