import mongoose, { Schema } from "mongoose"

interface IMenuItem {
  name: string
  category: string
  price: number
  available: boolean
  description?: string
  image?: string
  preparationTime?: number
  ingredients?: string[]
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    available: { type: Boolean, default: true },
    description: { type: String },
    image: { type: String },
    preparationTime: { type: Number, default: 10 },
    ingredients: [{ type: String }],
  },
  { timestamps: true }
)

const MenuItem = mongoose.models.MenuItem || mongoose.model<IMenuItem>("MenuItem", menuItemSchema)

export default MenuItem
