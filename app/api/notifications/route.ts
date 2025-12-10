import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { getNotifications, addNotification as addNotif, markAsRead } from "@/lib/notifications"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Get notifications for the user's role
    const userNotifications = getNotifications(decoded.role, decoded.id)

    return NextResponse.json(userNotifications)
  } catch (error: any) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ message: error.message || "Failed to get notifications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    jwt.verify(token, JWT_SECRET)

    const body = await request.json()
    const { type, message, targetRole, targetUser } = body

    const notification = addNotif(type || "info", message, targetRole, targetUser)

    return NextResponse.json(notification, { status: 201 })
  } catch (error: any) {
    console.error("Create notification error:", error)
    return NextResponse.json({ message: error.message || "Failed to create notification" }, { status: 500 })
  }
}

