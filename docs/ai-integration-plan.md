# AI Integration Plan — DevHub

> Research completed: 2026-04-18
> Target model: `gpt-5-nano` — fastest/cheapest GPT-5 variant ($0.05/1M input, $0.40/1M output, 200K context)

---

## 1. Features Scope

| Feature | Type | Gate |
|---|---|---|
| Auto-tag suggestions | Non-streaming | Pro only |
| AI summaries | Non-streaming | Pro only |
| "Explain This Code" | Non-streaming | Pro only |
| Prompt Optimizer | Streaming | Pro only |

Streaming is only worth it for Prompt Optimizer since the output is long-form text the user watches appear. All other features are short outputs (tags array, summary paragraph, explanation paragraph) and are better served with a single non-streaming call.

---

## 2. OpenAI SDK Setup

### Installation

```bash
npm install openai
```

### Singleton client — `src/lib/openai.ts`

Mirrors the existing `src/lib/stripe.ts` lazy-init Proxy pattern to avoid build-time crashes when the env var is absent.

```typescript
import OpenAI from 'openai';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 2,      // default; retries 429, 408, >=500 with exponential backoff
      timeout: 30_000,    // 30 s — plenty for short completions
    });
  }
  return _openai;
}

export const openai = new Proxy({} as OpenAI, {
  get: (_, prop) => getOpenAI()[prop as keyof OpenAI],
});
```

### Environment variable

```env
# .env.local
OPENAI_API_KEY=sk-...
```

> **Security:** `OPENAI_API_KEY` must never be exposed to the browser. All calls are server-only (Server Actions or Route Handlers). The key is never passed to client components.

---

## 3. Server Action Patterns

All actions follow the existing codebase convention exactly:

```
'use server'
→ auth() check
→ isPro check (return error if false)
→ Zod validation
→ try { openai call } catch { return error }
→ return { success: true, data }
```

### 3.1 Auto-tag Action — `src/actions/ai.ts`

```typescript
'use server';

import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { auth } from '@/auth';
import { openai } from '@/lib/openai';

const autoTagSchema = z.object({
  itemId: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional(),
  type: z.string().min(1),
});

type AutoTagResult =
  | { success: true; data: { tags: string[] } }
  | { success: false; error: string };

export async function suggestTags(
  input: z.input<typeof autoTagSchema>,
): Promise<AutoTagResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' };
  if (!session.user.isPro) return { success: false, error: 'AI features require a Pro subscription.' };

  const parsed = autoTagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const { title, content, type } = parsed.data;

  try {
    const TagsResponse = z.object({ tags: z.array(z.string()) });

    const completion = await openai.chat.completions.parse({
      model: 'gpt-5-nano',
      temperature: 0,
      max_tokens: 60,
      response_format: zodResponseFormat(TagsResponse, 'tags_response'),
      messages: [
        {
          role: 'system',
          content:
            'You are a tagging assistant. Given a developer resource, return 3–6 relevant lowercase tags. Tags should be short (1–2 words), technical, and useful for search.',
        },
        {
          role: 'user',
          content: `Type: ${type}\nTitle: ${title}\nContent: ${content?.slice(0, 500) ?? ''}`,
        },
      ],
    });

    const tags = completion.choices[0]?.message?.parsed?.tags ?? [];

    return { success: true, data: { tags } };
  } catch {
    return { success: false, error: 'Failed to generate tags. Please try again.' };
  }
}
```

### 3.2 Summary Action

```typescript
export async function generateSummary(
  input: z.input<typeof summarySchema>,
): Promise<SummaryResult> {
  // same auth + Pro gate pattern
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    temperature: 0.3,
    max_tokens: 100,
    messages: [
      {
        role: 'system',
        content:
          'You are a developer assistant. Write a concise 1–2 sentence summary of the provided content. Be specific and technical.',
      },
      { role: 'user', content: content.slice(0, 2000) },
    ],
  });

  const summary = completion.choices[0]?.message?.content?.trim() ?? '';
  return { success: true, data: { summary } };
}
```

### 3.3 Explain This Code Action

```typescript
export async function explainCode(
  input: z.input<typeof explainSchema>,
): Promise<ExplainResult> {
  // same auth + Pro gate pattern
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    temperature: 0.3,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content:
          'You are a senior developer. Explain what the provided code does in plain English. Be concise (3–5 sentences). Mention the language if relevant.',
      },
      { role: 'user', content: code.slice(0, 3000) },
    ],
  });

  const explanation = completion.choices[0]?.message?.content?.trim() ?? '';
  return { success: true, data: { explanation } };
}
```

### 3.4 Prompt Optimizer — Streaming via Route Handler

Server Actions cannot return `ReadableStream` to the client in a way browsers can consume incrementally. For the Prompt Optimizer, use a **Route Handler** instead.

**`src/app/api/ai/optimize-prompt/route.ts`**

```typescript
import { auth } from '@/auth';
import { openai } from '@/lib/openai';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const schema = z.object({ prompt: z.string().min(1).max(5000) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  if (!session.user.isPro) return new Response('Pro required', { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new Response('Invalid input', { status: 400 });

  const stream = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    stream: true,
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      {
        role: 'system',
        content:
          'You are a prompt engineering expert. Rewrite the given AI prompt to be clearer, more specific, and more effective. Return only the improved prompt, no explanation.',
      },
      { role: 'user', content: parsed.data.prompt },
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) controller.enqueue(new TextEncoder().encode(delta));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

**Client-side consumption:**

```typescript
const res = await fetch('/api/ai/optimize-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
let result = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  result += decoder.decode(value);
  setOptimizedPrompt(result); // update state incrementally
}
```

---

## 4. Streaming vs Non-Streaming Decision

| Feature | Approach | Reason |
|---|---|---|
| Auto-tag | Non-streaming | Short output (array of 3–6 strings); instant enough |
| Summary | Non-streaming | Short output (1–2 sentences); instant enough |
| Explain Code | Non-streaming | Short output (3–5 sentences); instant enough |
| Prompt Optimizer | Streaming via Route Handler | Long output (rewritten prompt); UX benefit is high |

**Rule of thumb:** Stream when output > ~100 tokens and the user benefits from watching it appear. For everything else, non-streaming is simpler, easier to test, and avoids client-side complexity.

---

## 5. Pro User Gating

All AI actions gate on `session.user.isPro` following the exact same pattern as file/image uploads:

```typescript
if (!session.user.isPro) {
  return { success: false, error: 'AI features require a Pro subscription.' };
}
```

No new gating infrastructure needed. `isPro` is already in the JWT, synced from DB on every token refresh (see `src/auth.ts`).

**UI gating:** Wrap AI buttons in a check:

```tsx
{session.user.isPro ? (
  <AiTagButton item={item} />
) : (
  <Tooltip content="Upgrade to Pro">
    <Button variant="ghost" disabled>
      <Sparkles className="h-4 w-4" />
    </Button>
  </Tooltip>
)}
```

Or show an upgrade CTA inline inside the drawer/dialog.

---

## 6. Error Handling

### OpenAI SDK Error Types

```typescript
import OpenAI from 'openai';

try {
  const completion = await openai.chat.completions.create({ ... });
} catch (err) {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      return { success: false, error: 'AI is busy right now. Please try again in a moment.' };
    }
    if (err.status >= 500) {
      return { success: false, error: 'OpenAI service is temporarily unavailable.' };
    }
  }
  return { success: false, error: 'Failed to generate AI response. Please try again.' };
}
```

The SDK automatically retries `429`, `408`, and `>=500` errors with exponential backoff (2 retries by default), so the catch block handles only persistent failures.

### User-Facing Error Messages

| Error | Message |
|---|---|
| Not Pro | "AI features require a Pro subscription." |
| Rate limited (persistent) | "AI is busy right now. Please try again in a moment." |
| API down | "OpenAI service is temporarily unavailable." |
| General | "Failed to generate AI response. Please try again." |

---

## 7. Rate Limiting

The existing Upstash Redis rate limiter (`src/lib/rate-limit.ts`) can be reused for AI endpoints. Suggested limits:

| Endpoint | Limit | Window |
|---|---|---|
| `/api/ai/optimize-prompt` | 10 requests | per hour per user |
| `suggestTags` server action | 20 requests | per hour per user |
| `generateSummary` | 20 requests | per hour per user |
| `explainCode` | 15 requests | per hour per user |

Rate-limit by `userId` (not IP) since these are authenticated Pro-only endpoints.

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'ai',
});

// In action:
const { success: allowed } = await aiRatelimit.limit(session.user.id);
if (!allowed) {
  return { success: false, error: 'You have reached the AI usage limit. Try again in an hour.' };
}
```

---

## 8. Cost Optimisation

### Model Choice

Two viable options in the GPT-5 nano family:

| Model | Input | Output | Context | Notes |
| --- | --- | --- | --- | --- |
| `gpt-5-nano` | $0.05/1M | $0.40/1M | 200K | Cheaper; text-only |
| `gpt-5.4-nano` | $0.20/1M | $1.25/1M | 400K | 4× pricier; vision support, better reasoning |

**Recommendation: `gpt-5-nano`** — all four features are text-only and short-context. The 4× cost premium of `gpt-5.4-nano` is not justified here. Upgrade to `gpt-5.4-nano` only if image-based explain/tagging is added later.

### Input Truncation
Always truncate user content before sending to the API:
- Auto-tag: `content.slice(0, 500)` — tags don't need full content
- Summary: `content.slice(0, 2000)`
- Explain Code: `code.slice(0, 3000)`
- Prompt Optimizer: `prompt.slice(0, 5000)` — full prompt needed

### `max_tokens` Caps
Set tight `max_tokens` to prevent runaway costs:
- Auto-tag: `60`
- Summary: `100`
- Explain Code: `300`
- Prompt Optimizer: `500`

### `temperature: 0` for deterministic features
Use `temperature: 0` for auto-tag and summary — deterministic output, cheaper (no sampling overhead), more consistent.

### No Caching Needed Initially
For MVP, skip response caching. If a user clicks "Suggest Tags" twice on the same item, two calls are made. The cost per call is negligible at this scale. Add Redis caching only if usage metrics show repeat calls on the same content.

---

## 9. UI Patterns

### Loading States

```tsx
const [isLoading, setIsLoading] = useState(false);
const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

async function handleSuggestTags() {
  setIsLoading(true);
  const result = await suggestTags({ itemId, title, content, type });
  setIsLoading(false);
  if (result.success) {
    setSuggestedTags(result.data.tags);
  } else {
    toast.error(result.error);
  }
}
```

### Accept / Reject Tag Suggestions

Show suggested tags as chips below the existing tags input, with an "Add all" button and individual click-to-add:

```tsx
{suggestedTags.length > 0 && (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">Suggested tags:</p>
    <div className="flex flex-wrap gap-1">
      {suggestedTags.map(tag => (
        <button
          key={tag}
          type="button"
          onClick={() => addTag(tag)}
          className="text-xs px-2 py-0.5 rounded-full border border-dashed hover:bg-accent"
        >
          + {tag}
        </button>
      ))}
    </div>
  </div>
)}
```

### Summary / Explanation Reveal

Show a collapsed section with a "Generate summary" button. On success, replace the button with the generated text and an "Apply" button that saves it to the description field.

### Streaming Prompt Optimizer

Use a split-pane layout: original prompt on the left, streaming output on the right. Show a pulsing cursor at the end while streaming. Add "Accept" (replaces content) and "Discard" buttons when complete.

---

## 10. Security Checklist

- [x] `OPENAI_API_KEY` only in server environment — never in `NEXT_PUBLIC_*`
- [x] All AI calls via Server Actions or Route Handlers (never from client `fetch` to OpenAI directly)
- [x] Auth check before every AI call
- [x] Pro gate before every AI call
- [x] Input truncated before sending — limits prompt injection blast radius
- [x] Response content treated as untrusted text — never `dangerouslySetInnerHTML` without sanitization
- [x] Rate limiting per `userId` to prevent abuse
- [x] `max_tokens` caps to prevent cost runaway

### Input Sanitisation Note
User content passed to OpenAI is **prompt injection risk** but not XSS risk (it never executes). The main threat is a user crafting content that hijacks the system prompt. Mitigations already in place:
1. System prompt is always first
2. User content is clearly delimited (`Content: ...`)
3. `temperature: 0` on structured-output calls reduces model drift
4. Output is parsed/validated before use (tag array, not raw string)

---

## 11. Implementation Order

1. `src/lib/openai.ts` — singleton client
2. `src/actions/ai.ts` — `suggestTags`, `generateSummary`, `explainCode`
3. `src/app/api/ai/optimize-prompt/route.ts` — streaming route handler
4. Wire `suggestTags` into ItemDrawer edit mode (tag field, snippet/command/prompt types only)
5. Wire `generateSummary` into ItemDrawer view mode (description section)
6. Wire `explainCode` into ItemDrawer view mode (snippet/command types only)
7. Wire prompt optimizer into ItemDrawer view mode (prompt type only)
8. Unit tests for all three server actions (mock `openai` with `vi.mock('@/lib/openai')`)

---

## 12. Cost Estimates

### Assumptions per active Pro user per month

These are based on realistic but light usage — not power users, not every item tagged.

| Feature | Calls/user/mo | Avg input tokens | Avg output tokens | Cost/call | Cost/user/mo |
| --- | --- | --- | --- | --- | --- |
| Auto-tag | 20 | ~250 in + system (~350 total) | ~40 | $0.0000338 | $0.00068 |
| Summary | 10 | ~500 in + system (~600 total) | ~80 | $0.0000622 | $0.00062 |
| Explain Code | 10 | ~800 in + system (~900 total) | ~250 | $0.000145 | $0.00145 |
| Prompt Optimizer | 5 | ~300 in + system (~400 total) | ~400 | $0.000180 | $0.00090 |
| **Total** | **45 calls** | | | | **~$0.0037/user/mo** |

> Pricing used: `gpt-5-nano` at $0.05/1M input tokens, $0.40/1M output tokens.
> Formula: `(input_tokens × 0.05 + output_tokens × 0.40) / 1,000,000`

---

### Monthly cost by user scale

| Active Pro users | AI cost/mo | + 20% buffer | Recommended prepaid credits |
| --- | --- | --- | --- |
| 10 | ~$0.04 | ~$0.05 | **$5** (covers ~100× headroom) |
| 50 | ~$0.19 | ~$0.23 | **$5** (covers ~25× headroom) |
| 100 | ~$0.37 | ~$0.45 | **$10** |
| 1,000 | ~$3.70 | ~$4.44 | **$10–$20/mo** |

> "Active Pro users" means users who actually use AI features that month, not your total Pro subscriber count. Expect 30–50% of Pro users to be active in any given month.

---

### Practical guidance

**Getting started:** Buy **$5 in OpenAI credits** — that covers you until ~1,000 active Pro users/month at current usage assumptions. You will not need to think about this again until you hit meaningful scale.

**When to revisit:** Set a billing alert in the OpenAI dashboard at $5 and $20. When you hit the $5 alert, you're approaching ~1,000 active users — a good problem to have.

**Worst-case (power user, all features, daily):** ~200 calls/month → ~$0.025/user/mo. Even at 1,000 power users that's ~$25/mo — still well within a $50 credit top-up.

**The model choice pays off here:** The same workload on `gpt-5.4-nano` would cost ~4× more (~$15/mo at 1,000 users). On the old `gpt-4o-mini` it was comparable to `gpt-5.4-nano`. `gpt-5-nano` is the clear winner for this use case.
