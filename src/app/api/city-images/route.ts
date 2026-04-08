import { NextResponse } from "next/server";
import { fetchImage } from "@/lib/unsplash";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");

  if (!city) {
    return NextResponse.json({ error: "City required" }, { status: 400 });
  }

  try {
    console.log(`Fetching images for city: ${city}`);
    // 1. Fetch hero image (skyline)
    const hero = await fetchImage(`${city} skyline aerial view landscape`);
    console.log(`Hero result: ${hero ? 'Found' : 'Not Found'}`);

    // 2. Fetch place images in parallel
    const placesList = [
      `${city} famous landmark monument`,
      `${city} tourist attraction highlights`,
      `${city} historical architecture view`,
      `${city} city square downtown`,
      `${city} iconic building skyline`,
      `${city} travel photography spots`,
    ];

    const places = await Promise.all(
      placesList.map(query => fetchImage(query))
    );
    console.log(`Found ${places.filter(Boolean).length} places images`);

    // 3. Optional: Fetch activities & food
    const activitiesList = [
      `${city} adventure trekking outdoor`,
      `${city} local experience things to do`,
    ];
    
    const activities = await Promise.all(
      activitiesList.map(query => fetchImage(query))
    );

    return NextResponse.json({
      hero: hero || null,
      places: places.filter(Boolean),
      activities: activities.filter(Boolean),
    });
  } catch (error) {
    console.error("City images API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
