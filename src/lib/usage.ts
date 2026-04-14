import { prisma } from '@/lib/prisma';

export const FREE_TIER_LIMITS = {
  MAX_ITEMS: 50,
  MAX_COLLECTIONS: 3,
} as const;

interface UsageResult {
  itemCount: number;
  collectionCount: number;
  canCreateItem: boolean;
  canCreateCollection: boolean;
}

export async function getUserUsage(userId: string, isPro: boolean): Promise<UsageResult> {
  const [itemCount, collectionCount] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
  ]);

  return {
    itemCount,
    collectionCount,
    canCreateItem: isPro || itemCount < FREE_TIER_LIMITS.MAX_ITEMS,
    canCreateCollection: isPro || collectionCount < FREE_TIER_LIMITS.MAX_COLLECTIONS,
  };
}

export async function canCreateItem(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.item.count({ where: { userId } });
  return count < FREE_TIER_LIMITS.MAX_ITEMS;
}

export async function canCreateCollection(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) return true;
  const count = await prisma.collection.count({ where: { userId } });
  return count < FREE_TIER_LIMITS.MAX_COLLECTIONS;
}
