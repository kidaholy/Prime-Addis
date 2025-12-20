import jwt from "jsonwebtoken"

export interface TokenPayload {
    id: string
    email?: string
    role: string
    [key: string]: any
}

function getSecret() {
    return process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
}

export function signToken(payload: TokenPayload): string {
    return jwt.sign(payload, getSecret(), {
        expiresIn: "7d",
    })
}

export function verifyToken(token: string): TokenPayload {
    return jwt.verify(token, getSecret()) as TokenPayload
}
