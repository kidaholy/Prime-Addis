import express, { type Request, type Response } from "express"
import jwt from "jsonwebtoken"
import User from "../../lib/models/user"

const router = express.Router()

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const user = new User({ name, email, password, role: role || "cashier" })
    await user.save()

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret", {
      expiresIn: "24h",
    })

    res.json({ token, user: { id: user._id, name: user.name, role: user.role } })
  } catch (error) {
    res.status(500).json({ message: "Registration failed" })
  }
})

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret", {
      expiresIn: "24h",
    })

    res.json({ token, user: { id: user._id, name: user.name, role: user.role } })
  } catch (error) {
    res.status(500).json({ message: "Login failed" })
  }
})

export default router
