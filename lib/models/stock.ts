import mongoose, { Schema, Document, CallbackError } from "mongoose"

// Restock history entry
export interface IRestockEntry {
    date: Date
    quantityAdded: number
    totalPurchaseCost: number // Total cost paid for this restock batch
    unitCostAtTime: number // Selling price per unit at time of restock
    notes?: string
    restockedBy?: mongoose.Types.ObjectId
}

export interface IStock extends Document {
    name: string
    category: string
    quantity: number // Current remaining quantity
    unit: string // kg, L, pcs, g, ml
    unitType: 'weight' | 'volume' | 'count' // For validation and reporting
    minLimit: number // Threshold for low stock warning
    averagePurchasePrice: number // Average purchase price per unit (calculated)
    unitCost: number // Current selling price (what we charge)
    trackQuantity: boolean
    showStatus: boolean
    status: 'active' | 'finished' | 'out_of_stock'
    restockHistory: IRestockEntry[] // Track all restocking events
    totalPurchased: number // Lifetime total purchased
    totalConsumed: number // Lifetime total consumed via sales
    totalInvestment: number // Total money invested in purchasing this item
    createdAt: Date
    updatedAt: Date
}

const RestockEntrySchema = new Schema<IRestockEntry>({
    date: { type: Date, default: Date.now },
    quantityAdded: { type: Number, required: true },
    totalPurchaseCost: { type: Number, required: true },
    unitCostAtTime: { type: Number, required: true },
    notes: { type: String },
    restockedBy: { type: Schema.Types.ObjectId, ref: "User" }
})

const StockSchema = new Schema<IStock>(
    {
        name: { type: String, required: true, trim: true },
        category: { type: String, required: true },
        quantity: { type: Number, required: true, default: 0, min: 0 },
        unit: { type: String, required: true }, // e.g., 'kg', 'g', 'L', 'ml', 'pcs'
        unitType: {
            type: String,
            required: true,
            enum: ['weight', 'volume', 'count'],
            default: 'count'
        },
        minLimit: { type: Number, required: true, default: 0, min: 0 },
        averagePurchasePrice: { type: Number, required: true, default: 0, min: 0 },
        unitCost: { type: Number, required: true, default: 0, min: 0 },
        trackQuantity: { type: Boolean, default: true },
        showStatus: { type: Boolean, default: true },
        status: {
            type: String,
            enum: ['active', 'finished', 'out_of_stock'],
            default: 'active'
        },
        restockHistory: [RestockEntrySchema],
        totalPurchased: { type: Number, default: 0, min: 0 },
        totalConsumed: { type: Number, default: 0, min: 0 },
        totalInvestment: { type: Number, default: 0, min: 0 },
    },
    {
        timestamps: true,
    }
)

// Middleware to auto-update status based on quantity
StockSchema.pre('save', async function () {
    if (this.trackQuantity) {
        // We allow orders even if quantity is 0 or less
        // Status remains 'active' to permit ordering, but can be manually set to 'out_of_stock' or 'finished'
        if (this.quantity <= 0) {
            // Only auto-mark as out_of_stock if it was active and just hit 0
            // but we want to stay active to allow negative stock unless user manually intervention.
            // For now, let's keep it 'active' if trackQuantity is on, so cashier can still sell.
            if (this.status === 'finished') {
                // keep finished
            } else {
                this.status = 'active'
            }
        }
    }
})

// Helper method to check if item is available for ordering
StockSchema.methods.isAvailableForOrder = function (requiredQuantity: number = 1): boolean {
    if (!this.trackQuantity) return true
    // Permissive stock: Allow ordering even if quantity < requiredQuantity
    // Only block if status is manually set to 'finished' or 'out_of_stock'
    return this.status === 'active'
}

// Helper method to consume stock (deduct quantity)
StockSchema.methods.consumeStock = function (quantity: number): boolean {
    if (!this.trackQuantity) return true
    // Permissive stock: Always allow consumption, even into negative
    this.quantity -= quantity
    this.totalConsumed += quantity
    return true
}

// Helper method to restock
StockSchema.methods.restock = function (quantityAdded: number, totalPurchaseCost: number, newUnitCost: number, notes?: string, restockedBy?: mongoose.Types.ObjectId) {
    // Add to restock history
    this.restockHistory.push({
        date: new Date(),
        quantityAdded,
        totalPurchaseCost,
        unitCostAtTime: newUnitCost,
        notes,
        restockedBy
    })

    // Update current values
    this.quantity += quantityAdded
    this.totalPurchased += quantityAdded
    this.totalInvestment += totalPurchaseCost

    // Calculate new average purchase price
    if (this.totalPurchased > 0) {
        this.averagePurchasePrice = this.totalInvestment / this.totalPurchased
    }

    this.unitCost = newUnitCost // Update to latest selling price

    // Status will be auto-updated by pre-save middleware
}

// In development, we might need to delete the model to refresh the schema
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Stock
}

const Stock = mongoose.models.Stock || mongoose.model<IStock>("Stock", StockSchema)

export default Stock
