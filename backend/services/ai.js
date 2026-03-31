const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate an AI summary and tags for a piece of feedback.
 * Returns { summary, tags } or falls back gracefully on error.
 */
async function processFeedback({ title, description, category, type, severity }) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your')) {
    // Graceful fallback — no API key configured
    return {
      summary: `[AI not configured] ${title} — ${description.slice(0, 120)}...`,
      tags: [category.toLowerCase(), type.toLowerCase(), severity.toLowerCase()],
    };
  }

  const prompt = `You are an assistant for Absdon 's internal feedback system.

Analyze this user feedback and return a JSON object with exactly two keys:
1. "summary" — a concise 2-3 sentence summary for internal team review
2. "tags" — an array of 3-6 lowercase keyword tags relevant to the content

Feedback details:
- Title: ${title}
- Category: ${category}
- Type: ${type}
- Severity: ${severity}
- Description: ${description}

Respond ONLY with valid JSON. No markdown, no explanation.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw);

    return {
      summary: parsed.summary || 'No summary generated.',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    };
  } catch (err) {
    console.error('[AI Service] Error:', err.message);
    // Non-blocking: return safe fallback
    return {
      summary: `${title}. ${description.slice(0, 150)}`,
      tags: [category.toLowerCase(), type.toLowerCase()],
    };
  }
}

/**
 * Auto-assign a team slug based on category.
 */
function getTeamSlugForCategory(category) {
  const map = {
    Developers: 'dev-team',
    Community: 'community-team',
    Builders: 'partnership-team',
    Suggestions: 'general-team',
    Advice: 'general-team',
  };
  return map[category] || 'general-team';
}

module.exports = { processFeedback, getTeamSlugForCategory };
