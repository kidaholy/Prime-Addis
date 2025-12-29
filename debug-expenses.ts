
import mongoose from "mongoose";
import DailyExpense from "./lib/models/daily-expense";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/prime-addis";

async function checkExpenses() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB");

        const expenses = await DailyExpense.find({});
        console.log(`Found ${expenses.length} expense records.`);

        expenses.forEach(exp => {
            console.log(`ID: ${exp._id}`);
            console.log(`Date: ${exp.date} (Type: ${typeof exp.date})`);
            console.log(`OxCost: ${exp.oxCost}`);
            console.log(`Other: ${exp.otherExpenses}`);
            console.log("---");
        });

        // Test the query logic from route.ts
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        console.log(`Querying Today: ${today.toISOString()} to ${end.toISOString()}`);

        const query = {
            date: { $gte: today, $lte: end }
        };
        const todays = await DailyExpense.find(query);
        console.log(`Found ${todays.length} expenses for today.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkExpenses();
