import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ENABLE_EMAIL_VERIFICATION } from '@/lib/flags'
import authConfig from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, `user` is present — persist fields into the token
      if (user) {
        token.name = user.name
        token.picture = user.image
      }
      // On subsequent requests, re-hydrate from DB so name/image stay fresh
      if (!user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { name: true, image: true },
        })
        if (dbUser) {
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }
      return token
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      if (token.name) {
        session.user.name = token.name
      }
      if (token.picture) {
        session.user.image = token.picture as string
      }
      return session
    },
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user?.password) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        if (ENABLE_EMAIL_VERIFICATION && !user.emailVerified) return null

        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
})
