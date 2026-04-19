import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

export async function rotateVerificationToken(
  identifier: string,
  expiresInMs: number,
): Promise<string> {
  await prisma.verificationToken.deleteMany({ where: { identifier } })

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + expiresInMs)

  await prisma.verificationToken.create({ data: { identifier, token, expires } })

  return token
}
