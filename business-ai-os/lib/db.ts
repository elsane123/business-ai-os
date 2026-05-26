import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      // connect_timeout=15 : évite les erreurs E57P01 (Neon kills idle connections)
      // pool_timeout=10 : libère les connexions inutilisées rapidement
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connect_timeout=15&pool_timeout=10',
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
