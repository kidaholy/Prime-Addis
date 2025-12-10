import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("🧪 Test endpoint hit!")
    const body = await request.json()
    console.log("📝 Test body received:", body)
    
    return NextResponse.json({
      message: "Test endpoint working",
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("❌ Test endpoint error:", error)
    return NextResponse.json({ 
      message: "Test endpoint error", 
      error: error.message 
    }, { status: 500 })
  }
}