import mongoose, { Schema } from "mongoose"

interface IMenuItem {
  name: string
  description: string
  category: string
  price: number
  image: string
  isAvailable: boolean
  preparationTime: number
  ingredients: string[]
  createdAt: Date
  updatedAt: Date
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 15 },
    ingredients: [{ type: String }],
  },
  { timestamps: true },
)

export default mongoose.model<IMenuItem>("MenuItem", menuItemSchema)
