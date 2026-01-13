
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGODB_URI = process.env.MONGODB_URI;

const expenseSchema = new Schema({
  date: Date,
  items: Array,
  otherExpenses: Number,
  description: String
}, { strict: false });

const DailyExpense = mongoose.models.DailyExpense || mongoose.model("DailyExpense", expenseSchema);

async function checkExpenses() {
  try {
    if (!MONGODB_URI) {
        console.error("No MONGODB_URI found");
        process.exit(1);
    }
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    const expenses = await DailyExpense.find({}).sort({ date: -1 }).lean();
    console.log(`Total Expenses Found: ${expenses.length}`);

    expenses.forEach(e => {
       console.log(`- Date: ${e.date ? e.date.toISOString() : 'No Date'} | ID: ${e._id} | Items: ${e.items ? e.items.length : 0} | Other: ${e.otherExpenses}`);
    });

    // Also check "Today" range logic roughly
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    console.log(`Current Month Range (API logic): ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkExpenses();
