import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            organizations: {
              include: {
                subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        })

        if (!user) return null

        // For demo users with placeholder hash
        if (user.passwordHash.startsWith('$2b$10$demohash')) {
          if (credentials.password !== 'demo123') return null
        } else {
          const valid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!valid) return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizations[0]?.id,
          tier: user.organizations[0]?.subscriptions[0]?.tier || 'free',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.organizationId = (user as any).organizationId
        token.tier = (user as any).tier
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId
        ;(session.user as any).organizationId = token.organizationId
        ;(session.user as any).tier = token.tier
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'apihub-dev-secret-change-me',
})

export { handler as GET, handler as POST }
