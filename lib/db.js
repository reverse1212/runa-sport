import { PrismaClient } from '@prisma/client'

const g = globalThis
export const db = g.__runaDb || (g.__runaDb = new PrismaClient())
