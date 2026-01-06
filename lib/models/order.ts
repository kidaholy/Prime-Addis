import mongoose, { Schema, Document } from "mongoose"

interface IOrderItem {
  menuItemId: string
  menuId?: string
  name: string
  quantity: number
  price: number
}

interface IOrder extends Document {
  orderNumber: string
  items: IOrderItem[]
  totalAmount: number
  status: "pending" | "preparing" | "ready" | "served" | "completed" | "cancelled"
  paymentMethod: string
  customerName?: string
  waiterBatchNumber: string
  tableNumber: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    items: [
      {
        menuItemId: { type: String, required: true },
        menuId: { type: String },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "completed", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "cash" },
    customerName: { type: String },
    waiterBatchNumber: { type: String, required: true, index: true },
    tableNumber: { type: String, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema)

export default Order
