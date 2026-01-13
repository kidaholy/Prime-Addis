
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MONGODB_URI = process.env.MONGODB_URI;

const stockSchema = new Schema({
  name: { type: String, required: true },
  // other fields loose
}, { strict: false });

const Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema);

async function checkDuplicates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    const stocks = await Stock.find({}).lean();
    console.log(`Total Stock Items: ${stocks.length}`);

    const idMap = {};
    const nameMap = {};

    stocks.forEach(s => {
       const id = s._id.toString();
       if (idMap[id]) idMap[id]++;
       else idMap[id] = 1;

       const name = s.name;
       if (nameMap[name]) nameMap[name]++;
       else nameMap[name] = 1;
    });

    console.log("--- ID Duplicates ---");
    let dupIds = 0;
    for (const [id, count] of Object.entries(idMap)) {
        if (count > 1) {
            console.log(`ID ${id}: ${count} times`);
            dupIds++;
        }
    }
    if (dupIds === 0) console.log("No duplicate IDs found.");

    console.log("--- Name Duplicates ---");
    let dupNames = 0;
    for (const [name, count] of Object.entries(nameMap)) {
        if (count > 1) {
            console.log(`Name "${name}": ${count} times`);
            dupNames++;
        }
    }
    if (dupNames === 0) console.log("No duplicate Names found.");

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkDuplicates();
