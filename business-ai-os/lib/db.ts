import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const DATABASE_URL =
  process.env.DATABASE_URL +
  (process.env.DATABASE_URL?.includes('?') ? '&' : '?') +
  // connect_timeout=30 : gives NeonDB time to wake from auto-suspend
  // pool_timeout=10    : releases idle connections quickly
  // connection_limit=5 : avoids hitting NeonDB free-tier connection cap
  'connect_timeout=30&pool_timeout=10&connection_limit=5'

function createClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: DATABASE_URL } },
  })

  // NeonDB auto-suspend: when the DB wakes up it terminates cached connections
  // (SqlState E57P01 = admin_shutdown). Force a reconnect on next query.
  client.$on('error' as never, async (e: { message: string }) => {
    if (
      e.message?.includes('E57P01') ||
      e.message?.includes('terminating connection') ||
      e.message?.includes('Connection refused')
    ) {
      console.warn('[db] NeonDB connection lost — reconnecting...')
      try {
        await client.$disconnect()
        await client.$connect()
      } catch {
        // Next query will trigger lazy reconnect automatically
      }
    }
  })

  return client
}

export const prisma = global.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma
