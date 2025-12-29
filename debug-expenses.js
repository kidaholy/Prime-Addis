
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/prime-addis";

const DailyExpenseSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
            unique: true,
            set: (d) => {
                const date = new Date(d);
                date.setUTCHours(0, 0, 0, 0);
                return date;
            }
        },
        oxCost: { type: Number, default: 0 },
        oxQuantity: { type: Number, default: 0 },
        otherExpenses: { type: Number, default: 0 },
        items: [
            {
                name: { type: String, required: true },
                amount: { type: Number, required: true },
                quantity: { type: Number, default: 0 },
                unit: { type: String, default: 'pcs' }
            }
        ],
        description: { type: String },
    },
    {
        timestamps: true,
    }
);

// Index for date range queries
DailyExpenseSchema.index({ date: 1 });

const DailyExpense = mongoose.models.DailyExpense || mongoose.model("DailyExpense", DailyExpenseSchema);


async function checkExpenses() {
    try {
        console.log("Connecting to:", MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const expenses = await DailyExpense.find({});
        console.log(`Found ${expenses.length} expense records.`);

        expenses.forEach(exp => {
            console.log(`ID: ${exp._id}`);
            console.log(`Date: ${exp.date.toISOString()} (Local: ${exp.date.toLocaleString()})`);
            console.log(`OxCost: ${exp.oxCost}`);
            console.log(`Other: ${exp.otherExpenses}`);
            console.log("---");
        });

        // Test the query logic from route.ts mimics
        const today = new Date(); // Local time
        today.setHours(0,0,0,0); // Local Midnight
        
        const end = new Date();
        end.setHours(23,59,59,999); // Local End of Day

        console.log(`Querying Today (Local): ${today.toString()} to ${end.toString()}`);
        console.log(`Querying Today (UTC): ${today.toISOString()} to ${end.toISOString()}`);

        const query = {
             date: { $gte: today, $lte: end }
        };
        const todays = await DailyExpense.find(query);
        console.log(`Found ${todays.length} expenses for today.`);
        
        if(todays.length > 0) {
            console.log("Today's expenses:", todays);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkExpenses();
