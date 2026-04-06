import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import type { NextAuthConfig } from 'next-auth'

export default {
  providers: [
    GitHub,
    Credentials({
      // Edge-safe placeholder — real validation is in auth.ts
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig
