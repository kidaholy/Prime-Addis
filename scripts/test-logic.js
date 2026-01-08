
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Mock models or import them
// For speed, let's just mock the connection and see if the logic has flaws
// Actually, it's better to run it with real data if possible.

// But wait, I can just check for common JS errors.

async function test() {
    console.log("Starting test...");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    const endDate = new Date();

    // Mock data structure based on what API fetches
    const orders = [];
    const stockItems = [
        { _id: "1", name: "Meat", quantity: 80, averagePurchasePrice: 1500, unitCost: 2000, unit: "kg" }
    ];
    const menuItems = [];
    const menuMap = new Map();
    const purchaseStats = {};
    const itemConsumption = {};

    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    try {
        const stockAnalysis = stockItems.map(stock => {
            const fullName = stock.name.toLowerCase();
            const rootName = fullName.split(' (finished')[0].trim();
            const purchaseData = purchaseStats[rootName] || purchaseStats[fullName] || { quantity: 0, totalCost: 0, transactions: [] };
            const purchased = purchaseData.quantity;

            const currentStock = stock.quantity || 0;
            const consumed = 0; // simplified
            const openingStock = Math.max(0, currentStock - purchased + consumed);

            const currentUnitCost = stock.unitCost || 0;
            const totalHandled = openingStock + purchased;
            const weightedAvgCost = totalHandled > 0
                ? ((openingStock * (stock.averagePurchasePrice || 0)) + purchaseData.totalCost) / totalHandled
                : (stock.averagePurchasePrice || 0);

            return {
                openingValue: openingStock * currentUnitCost,
                purchaseValue: purchaseData.totalCost,
                consumedValue: consumed * currentUnitCost,
                closingValue: currentStock * currentUnitCost,
                usageVelocity: periodDays > 0 ? consumed / periodDays : 0,
            };
        });

        console.log("Success! No logic errors found in mock run.");
        console.log("Sample Result:", stockAnalysis[0]);
    } catch (e) {
        console.error("FAILED with error:", e);
    }
}

test();
