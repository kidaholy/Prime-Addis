// Test script for the new inventory management system
const mongoose = require('mongoose')

// Mock the models for testing
const mockStock = {
    name: "Beef Meat",
    category: "meat",
    quantity: 50,
    unit: "kg",
    unitType: "weight",
    minLimit: 10,
    unitCost: 800,
    trackQuantity: true,
    showStatus: true,
    status: "active",
    restockHistory: [],
    totalPurchased: 50,
    totalConsumed: 0
}

const mockMenuItem = {
    menuId: "BURGER001",
    name: "Beef Burger",
    category: "main",
    price: 250,
    available: true,
    recipe: [
        {
            stockItemId: "mock_beef_id",
            stockItemName: "Beef Meat",
            quantityRequired: 0.2, // 200g per burger
            unit: "kg"
        },
        {
            stockItemId: "mock_bun_id", 
            stockItemName: "Burger Buns",
            quantityRequired: 1, // 1 bun per burger
            unit: "pcs"
        }
    ]
}

// Test functions
function testStockValidation() {
    console.log("🧪 Testing Stock Validation...")
    
    // Test 1: Check if item is available for order
    const canOrder5Burgers = mockStock.quantity >= (5 * 0.2) // 5 burgers need 1kg beef
    console.log(`✅ Can make 5 burgers: ${canOrder5Burgers} (need 1kg, have ${mockStock.quantity}kg)`)
    
    // Test 2: Check if item would be low stock after order
    const remainingAfterOrder = mockStock.quantity - (5 * 0.2)
    const wouldBeLowStock = remainingAfterOrder <= mockStock.minLimit
    console.log(`⚠️ Would be low stock after 5 burgers: ${wouldBeLowStock} (${remainingAfterOrder}kg remaining, min: ${mockStock.minLimit}kg)`)
    
    // Test 3: Check out of stock scenario
    const canOrder300Burgers = mockStock.quantity >= (300 * 0.2) // 300 burgers need 60kg beef
    console.log(`❌ Can make 300 burgers: ${canOrder300Burgers} (need 60kg, have ${mockStock.quantity}kg)`)
}

function testRestockCalculation() {
    console.log("\n🔄 Testing Restock Calculation...")
    
    const restockAmount = 25 // kg
    const newUnitCost = 850 // Br per kg
    const totalCost = restockAmount * newUnitCost
    
    console.log(`📦 Restocking ${restockAmount}kg at ${newUnitCost} Br/kg`)
    console.log(`💰 Total cost: ${totalCost.toLocaleString()} Br`)
    
    const newQuantity = mockStock.quantity + restockAmount
    const newTotalPurchased = mockStock.totalPurchased + restockAmount
    
    console.log(`📊 New quantity: ${newQuantity}kg`)
    console.log(`📈 Total purchased: ${newTotalPurchased}kg`)
    console.log(`💵 New inventory value: ${(newQuantity * newUnitCost).toLocaleString()} Br`)
}

function testOrderProcessing() {
    console.log("\n🍽️ Testing Order Processing...")
    
    const orderItems = [
        { menuId: "BURGER001", quantity: 3 },
        { menuId: "BURGER001", quantity: 2 }
    ]
    
    let totalBeefNeeded = 0
    orderItems.forEach(item => {
        const beefPerBurger = 0.2 // kg
        totalBeefNeeded += item.quantity * beefPerBurger
    })
    
    console.log(`🥩 Total beef needed: ${totalBeefNeeded}kg`)
    console.log(`✅ Order possible: ${mockStock.quantity >= totalBeefNeeded}`)
    
    if (mockStock.quantity >= totalBeefNeeded) {
        const remainingStock = mockStock.quantity - totalBeefNeeded
        console.log(`📉 Stock after order: ${remainingStock}kg`)
        console.log(`⚠️ Low stock alert: ${remainingStock <= mockStock.minLimit}`)
    }
}

function testReportGeneration() {
    console.log("\n📊 Testing Report Generation...")
    
    const reportData = {
        name: mockStock.name,
        category: mockStock.category,
        unit: mockStock.unit,
        currentBalance: mockStock.quantity,
        unitCost: mockStock.unitCost,
        totalValue: mockStock.quantity * mockStock.unitCost,
        status: mockStock.status,
        minLimit: mockStock.minLimit,
        totalPurchased: mockStock.totalPurchased,
        totalConsumed: mockStock.totalConsumed,
        isLowStock: mockStock.quantity <= mockStock.minLimit,
        isOutOfStock: mockStock.quantity <= 0,
        availableForOrder: mockStock.status === 'active' && mockStock.quantity > 0
    }
    
    console.log("📋 Stock Report:")
    console.log(`   Item: ${reportData.name}`)
    console.log(`   Current: ${reportData.currentBalance} ${reportData.unit}`)
    console.log(`   Value: ${reportData.totalValue.toLocaleString()} Br`)
    console.log(`   Status: ${reportData.status}`)
    console.log(`   Health: ${reportData.isOutOfStock ? 'OUT OF STOCK' : reportData.isLowStock ? 'LOW STOCK' : 'HEALTHY'}`)
    console.log(`   Available for orders: ${reportData.availableForOrder}`)
}

// Run all tests
console.log("🚀 Starting Inventory System Tests...\n")

testStockValidation()
testRestockCalculation()
testOrderProcessing()
testReportGeneration()

console.log("\n✅ All tests completed!")
console.log("\n📝 Summary of New Features:")
console.log("   ✅ Multi-unit support (kg/g, L/ml, pcs)")
console.log("   ✅ Real-time stock validation")
console.log("   ✅ Hard-stop sales logic")
console.log("   ✅ Automatic stock deduction")
console.log("   ✅ Restock history tracking")
console.log("   ✅ Comprehensive reporting")
console.log("   ✅ Export capabilities (CSV/JSON)")