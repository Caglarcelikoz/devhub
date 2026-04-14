import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
}));

vi.mock("@/lib/usage", () => ({
  canCreateCollection: vi.fn().mockResolvedValue(true),
}));

import { auth } from "@/auth";
import { createCollection as dbCreateCollection } from "@/lib/db/collections";
import { canCreateCollection } from "@/lib/usage";
import { createCollection } from "@/actions/collections";
import type { CreatedCollection } from "@/lib/db/collections";

const mockAuth = auth as unknown as { mockResolvedValue: (v: unknown) => void };
const mockDbCreateCollection = vi.mocked(dbCreateCollection);
const mockCanCreateCollection = vi.mocked(canCreateCollection);

function makeSession(userId = "user-1", isPro = false) {
  return { user: { id: userId, email: "test@example.com", isPro } };
}

function makeCreatedCollection(
  overrides: Partial<CreatedCollection> = {},
): CreatedCollection {
  return {
    id: "col-1",
    name: "My Collection",
    description: null,
    isFavorite: false,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

describe("createCollection action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanCreateCollection.mockResolvedValue(true);
  });

  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createCollection({ name: "Test" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
    expect(mockDbCreateCollection).not.toHaveBeenCalled();
  });

  it("returns error when session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} } as never);
    const result = await createCollection({ name: "Test" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Unauthorized");
  });

  it("returns error when free user has reached 3-collection limit", async () => {
    mockAuth.mockResolvedValue(makeSession("user-1", false));
    mockCanCreateCollection.mockResolvedValue(false);
    const result = await createCollection({ name: "Fourth Collection" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("free tier limit of 3");
    expect(mockDbCreateCollection).not.toHaveBeenCalled();
  });

  it("Pro user is not blocked by collection limit", async () => {
    mockAuth.mockResolvedValue(makeSession("user-1", true));
    mockCanCreateCollection.mockResolvedValue(true);
    mockDbCreateCollection.mockResolvedValue(makeCreatedCollection());
    const result = await createCollection({ name: "Pro Collection" });
    expect(result.success).toBe(true);
  });

  it("returns error when name is empty", async () => {
    mockAuth.mockResolvedValue(makeSession());
    const result = await createCollection({ name: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Name is required");
  });

  it("creates collection successfully", async () => {
    const created = makeCreatedCollection({ name: "My Collection" });
    mockAuth.mockResolvedValue(makeSession());
    mockDbCreateCollection.mockResolvedValue(created);
    const result = await createCollection({ name: "My Collection" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("My Collection");
  });

  it("calls db createCollection with correct userId", async () => {
    mockAuth.mockResolvedValue(makeSession("user-42"));
    mockDbCreateCollection.mockResolvedValue(makeCreatedCollection());
    await createCollection({ name: "Scoped Collection" });
    expect(mockDbCreateCollection).toHaveBeenCalledWith(
      "user-42",
      expect.objectContaining({ name: "Scoped Collection" }),
    );
  });

  it("returns error on unexpected db failure", async () => {
    mockAuth.mockResolvedValue(makeSession());
    mockDbCreateCollection.mockRejectedValue(new Error("DB error"));
    const result = await createCollection({ name: "Test" });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toBe("Failed to create collection");
  });
});
