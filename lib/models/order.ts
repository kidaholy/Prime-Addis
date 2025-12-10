import mongoose, { Schema } from "mongoose"

interface IOrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
}

interface IOrder {
  orderNumber: string
  items: IOrderItem[]
  totalAmount: number
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  paymentMethod: string
  customerName?: string
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
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    paymentMethod: { type: String, default: "cash" },
    customerName: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema)

export default Order
