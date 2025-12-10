import mongoose, { Schema } from "mongoose"

interface IInventory {
  name: string
  quantity: number
  unit: string
  minStock: number
  maxStock: number
  category: string
  supplier: string
  cost: number
  expiryDate?: Date
  lastRestocked: Date
  isLowStock: boolean
  createdAt: Date
  updatedAt: Date
}

const inventorySchema = new Schema<IInventory>(
  {
    name: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    minStock: { type: Number, required: true },
    maxStock: { type: Number, required: true },
    category: { type: String, required: true },
    supplier: { type: String },
    cost: { type: Number },
    expiryDate: { type: Date },
    lastRestocked: { type: Date, default: Date.now },
    isLowStock: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model<IInventory>("Inventory", inventorySchema)
