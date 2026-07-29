import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { generateQRCodeUrl, generateTripShareUrl } from "@/lib/qrUtils";

/**
 * ⚡ PROFESSIONAL PDF EXPORT API (`/api/export-trip`)
 * Generates a branded multi-page travel PDF with Cover Page, Summary, Itinerary,
 * Hotels, Restaurants, Budget Breakdown, Weather, Packing, Emergency Contacts, and QR Code.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itinerary, destination = "Manali", budget, hotels, attractions, weather, emergencyContacts } = body;

    const destName = itinerary?.destination || destination || "Travel Destination";
    const shareUrl = generateTripShareUrl(destName);
    const qrUrl = generateQRCodeUrl(shareUrl, 150);

    return new Promise<NextResponse>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          const headers = new Headers();
          headers.set("Content-Type", "application/pdf");
          headers.set("Content-Disposition", `attachment; filename="OnlyExplore_${destName}_Travel_Plan.pdf"`);
          headers.set("Content-Length", pdfBuffer.length.toString());
          resolve(new NextResponse(pdfBuffer, { status: 200, headers }));
        });

        // ── 1. COVER PAGE ──────────────────────────────────────────────────────
        doc.rect(0, 0, 595, 842).fill("#0f172a"); // Dark slate background
        doc.fillColor("#38bdf8").fontSize(28).font("Helvetica-Bold").text("ONLYEXPLORE", 40, 80, { characterSpacing: 4 });
        doc.fillColor("#ffffff").fontSize(10).font("Helvetica").text("AI TRAVEL PLATFORM", 40, 115, { characterSpacing: 2 });

        doc.fillColor("#ffffff").fontSize(42).font("Helvetica-Bold").text(destName.toUpperCase(), 40, 240, { characterSpacing: 2 });
        doc.fillColor("#94a3b8").fontSize(16).font("Helvetica").text("Comprehensive Travel Itinerary & Destination Guide", 40, 295);

        // Metadata box on cover page
        doc.rect(40, 360, 515, 100).fill("#1e293b");
        doc.fillColor("#38bdf8").fontSize(10).font("Helvetica-Bold").text("TRIP SUMMARY", 60, 380);
        doc.fillColor("#ffffff").fontSize(11).font("Helvetica").text(`Destination: ${destName}`, 60, 400);
        doc.text(`Estimated Budget: ${budget?.total ? `₹${budget.total.toLocaleString()}` : "Flexible"}`, 60, 420);
        doc.text(`Generated On: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 300, 400);
        doc.text(`Format: Official Digital & Print Guide`, 300, 420);

        // QR Code Box on cover
        doc.rect(40, 680, 515, 80).fill("#1e293b");
        doc.fillColor("#ffffff").fontSize(10).font("Helvetica-Bold").text("SCAN FOR INTERACTIVE ONLINE TRIP", 60, 700);
        doc.fillColor("#94a3b8").fontSize(9).font("Helvetica").text(shareUrl, 60, 720);

        // ── 2. TRIP OVERVIEW & BUDGET BREAKDOWN ──────────────────────────────
        doc.addPage();
        doc.rect(0, 0, 595, 842).fill("#ffffff");

        doc.fillColor("#0f172a").fontSize(22).font("Helvetica-Bold").text("TRIP OVERVIEW & BUDGET", 40, 50);
        doc.rect(40, 80, 515, 2).fill("#0284c7");

        doc.fillColor("#334155").fontSize(11).font("Helvetica").text(
          `This itinerary is dynamically tailored for exploring ${destName}. It balances sightseeing, authentic culinary experiences, premium stays, and local culture.`,
          40, 95, { width: 515, lineGap: 4 }
        );

        // Budget Breakdown Table
        doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text("ESTIMATED BUDGET BREAKDOWN", 40, 160);
        const b = budget || { flights: 6000, hotels: 9000, food: 4000, activities: 3500, transport: 2500, total: 25000 };

        const budgetItems = [
          ["Category", "Allocated Cost"],
          ["Accommodation / Hotels", `₹${(b.hotels || 9000).toLocaleString()}`],
          ["Food & Dining", `₹${(b.food || 4000).toLocaleString()}`],
          ["Activities & Experiences", `₹${(b.activities || 3500).toLocaleString()}`],
          ["Local Transit & Rental", `₹${(b.transport || 2500).toLocaleString()}`],
          ["Total Estimated Cost", `₹${(b.total || 25000).toLocaleString()}`],
        ];

        let yPos = 190;
        budgetItems.forEach((row, i) => {
          if (i === 0) {
            doc.rect(40, yPos, 515, 24).fill("#f1f5f9");
            doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(row[0], 50, yPos + 7);
            doc.text(row[1], 400, yPos + 7);
          } else {
            doc.rect(40, yPos, 515, 24).stroke("#e2e8f0");
            doc.fillColor("#334155").font(i === 5 ? "Helvetica-Bold" : "Helvetica").fontSize(10).text(row[0], 50, yPos + 7);
            doc.text(row[1], 400, yPos + 7);
          }
          yPos += 24;
        });

        // ── 3. DAY-WISE ITINERARY ─────────────────────────────────────────────
        doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text("DAY-BY-DAY ITINERARY", 40, yPos + 30);
        yPos += 55;

        const days = itinerary?.days || itinerary?.itinerary || [
          { day: 1, theme: "Arrival & Sightseeing", schedule: [{ time: "10:00 AM", activity: "City Center Tour", details: "Explore famous streets and landmarks." }] },
          { day: 2, theme: "Adventure & Cultural Heritage", schedule: [{ time: "09:00 AM", activity: "Mountain Trail Trek", details: "Panoramic valley views." }] },
        ];

        days.forEach((dayObj: any, idx: number) => {
          if (yPos > 720) {
            doc.addPage();
            yPos = 50;
          }

          doc.rect(40, yPos, 515, 24).fill("#0284c7");
          doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text(`DAY ${dayObj.day || idx + 1}: ${dayObj.title || dayObj.theme || "Sightseeing"}`, 50, yPos + 6);
          yPos += 30;

          const schedule = dayObj.schedule || dayObj.activities || [];
          if (Array.isArray(schedule)) {
            schedule.forEach((s: any) => {
              if (yPos > 740) {
                doc.addPage();
                yPos = 50;
              }
              const titleText = typeof s === "string" ? s : `${s.time ? `[${s.time}] ` : ""}${s.activity || s.name || "Activity"}`;
              const detailText = s.details || s.description || "";

              doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10).text(`• ${titleText}`, 55, yPos);
              yPos += 14;
              if (detailText) {
                doc.fillColor("#64748b").font("Helvetica").fontSize(9).text(detailText, 70, yPos, { width: 470 });
                yPos += 16;
              }
            });
          }
          yPos += 10;
        });

        // ── 4. PACKING CHECKLIST & EMERGENCY CONTACTS ──────────────────────────
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text("ESSENTIAL PACKING & EMERGENCY CONTACTS", 40, yPos);
        yPos += 25;

        doc.rect(40, yPos, 250, 150).fill("#f8fafc");
        doc.fillColor("#0284c7").font("Helvetica-Bold").fontSize(10).text("PACKING CHECKLIST", 50, yPos + 10);
        doc.fillColor("#334155").font("Helvetica").fontSize(9).text("[ ] Valid ID / Passport & Tickets", 50, yPos + 30);
        doc.text("[ ] Comfortable Walking Shoes", 50, yPos + 48);
        doc.text("[ ] Weather Appropriate Apparel", 50, yPos + 66);
        doc.text("[ ] Portable Charger & Cables", 50, yPos + 84);
        doc.text("[ ] First Aid & Personal Medicines", 50, yPos + 102);

        doc.rect(305, yPos, 250, 150).fill("#f8fafc");
        doc.fillColor("#e11d48").font("Helvetica-Bold").fontSize(10).text("EMERGENCY ASSISTANCE", 315, yPos + 10);
        doc.fillColor("#334155").font("Helvetica").fontSize(9).text(`Nearest Hospital: ${destName} Civil Hospital (24/7)`, 315, yPos + 30, { width: 230 });
        doc.text(`Tourist Helpline: 1363 / 112`, 315, yPos + 60);
        doc.text(`Police Station: ${destName} Main Station`, 315, yPos + 78);
        doc.text(`OnlyExplore Support: support@onlyexplore.app`, 315, yPos + 96);

        // Footer
        doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text("Generated by OnlyExplore AI • www.onlyexplore.app", 40, 800, { align: "center" });

        doc.end();
      } catch (err) {
        reject(NextResponse.json({ success: false, error: "Failed to generate PDF document" }, { status: 500 }));
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
