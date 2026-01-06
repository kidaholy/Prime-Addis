import mongoose, { Schema, Document } from "mongoose"

interface IWaiter extends Document {
    waiterId: string // The Batch ID/Number (e.g. B-01)
    name: string
    active: boolean
    tables: string[] // Array of assigned Table Numbers
    createdAt: Date
    updatedAt: Date
}

const waiterSchema = new Schema<IWaiter>(
    {
        waiterId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        active: { type: Boolean, default: true },
        tables: [{ type: String }],
    },
    { timestamps: true }
)

const Waiter = mongoose.models.Waiter || mongoose.model<IWaiter>("Waiter", waiterSchema)

export default Waiter
