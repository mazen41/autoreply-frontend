interface UsageCount {
  [toolSlug: string]: {
    date: string;
    count: number;
  };
}

const MAX_FREE_USES_PER_DAY = 5;
const COOKIE_NAME = 'naz_tools_usage';

function getUsageCount(): UsageCount {
  if (typeof window === 'undefined') return {};
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_NAME}=`));
  
  if (!cookie) return {};
  
  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
  } catch {
    return {};
  }
}

function setUsageCount(usage: UsageCount): void {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days
  
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(usage))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function incrementUsage(toolSlug: string): boolean {
  const usage = getUsageCount();
  const today = new Date().toISOString().split('T')[0];
  
  // Reset count if it's a new day
  if (usage[toolSlug]?.date !== today) {
    usage[toolSlug] = { date: today, count: 0 };
  }
  
  // Check if limit reached
  if (usage[toolSlug]?.count >= MAX_FREE_USES_PER_DAY) {
    return false;
  }
  
  // Increment count
  usage[toolSlug] = { date: today, count: (usage[toolSlug]?.count || 0) + 1 };
  setUsageCount(usage);
  
  return true;
}

function getRemainingUses(toolSlug: string): number {
  const usage = getUsageCount();
  const today = new Date().toISOString().split('T')[0];
  
  if (usage[toolSlug]?.date !== today) {
    return MAX_FREE_USES_PER_DAY;
  }
  
  return Math.max(0, MAX_FREE_USES_PER_DAY - (usage[toolSlug]?.count || 0));
}

export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  toolSlug: string
): Promise<{ success: boolean; result?: string; limitReached?: boolean }> {
  // Check rate limit
  if (!incrementUsage(toolSlug)) {
    return { success: false, limitReached: true };
  }
  
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return { success: false };
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    
    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text());
      return { success: false };
    }
    
    const data = await response.json();
    const content = data.content[0]?.text;
    
    return { success: true, result: content || '' };
  } catch (error) {
    console.error('Claude API error:', error);
    return { success: false };
  }
}

export function getToolUsageInfo(toolSlug: string) {
  const remaining = getRemainingUses(toolSlug);
  return {
    remaining,
    max: MAX_FREE_USES_PER_DAY,
    isFree: remaining > 0,
  };
}
