import express, { type Request, type Response } from "express"
import { authenticate, authorize } from "../middleware/auth"
import Inventory from "../models/Inventory"

const router = express.Router()

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.find()
    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory" })
  }
})

router.post("/", authenticate, authorize("admin"), async (req: Request, res: Response) => {
  try {
    const inventory = new Inventory(req.body)
    await inventory.save()
    res.status(201).json(inventory)
  } catch (error) {
    res.status(500).json({ message: "Failed to create inventory item" })
  }
})

router.put("/:id", authenticate, authorize("admin"), async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      { quantity, lastRestocked: new Date() },
      { new: true },
    )
    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: "Failed to update inventory" })
  }
})

router.get("/low-stock", authenticate, async (req: Request, res: Response) => {
  try {
    const lowStock = await Inventory.find({ isLowStock: true })
    res.json(lowStock)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch low stock items" })
  }
})

export default router
