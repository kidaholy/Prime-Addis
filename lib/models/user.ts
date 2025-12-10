import mongoose, { Schema } from "mongoose"

interface IUser {
  name: string
  email: string
  password: string
  role: "admin" | "cashier" | "chef"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "cashier", "chef"], default: "cashier" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema)

export default User
