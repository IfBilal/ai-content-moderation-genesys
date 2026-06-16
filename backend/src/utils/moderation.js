import fs from 'fs/promises';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORY_DESCRIPTIONS = {
  'Graphic Violence': 'Depictions of physical harm, gore, or serious injury to humans or animals.',
  'Hate Symbols': 'Imagery associated with extremist ideologies or designated terrorist organizations.',
  'Self-Harm': 'Visual content depicting or glorifying acts of self-inflicted injury.',
  'Extremist Propaganda': 'Content that promotes, recruits for, or glorifies violent extremist movements.',
  'Weapons & Contraband': 'Imagery depicting illegal weapons, drug manufacturing, or trafficking-related content.',
  'Harassment & Humiliation': 'Imagery intended to degrade, threaten, or publicly humiliate an identifiable individual.',
};

// Calls Groq vision API and returns per-category moderation results
export const analyzeImage = async (imagePath, imageMimetype, enabledPolicies) => {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${imageMimetype};base64,${base64Image}`;

    const categoryList = enabledPolicies
      .map((p) => `- ${p.category}: ${CATEGORY_DESCRIPTIONS[p.category]}`)
      .join('\n');

    const prompt = `You are a content moderation AI. Carefully analyze the provided image and evaluate it against each of the following moderation categories.

For each category respond with:
- detected: true if the content is present, false otherwise
- confidence: integer from 0 to 100 representing how confident you are
- reasoning: one or two sentences explaining your assessment

Categories to evaluate:
${categoryList}

Respond ONLY with valid JSON in exactly this format, no extra text:
{
  "results": [
    {
      "category": "<exact category name>",
      "detected": true or false,
      "confidence": <0-100>,
      "reasoning": "<explanation>"
    }
  ]
}`;

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response from Groq API');

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.results)) {
      throw new Error('Groq API returned unexpected response structure');
    }

    return parsed.results;
  } catch (err) {
    // Wrap with context so caller gets a clear message without leaking internals
    throw new Error(`Image analysis failed: ${err.message}`);
  }
};

// Determines the overall verdict outcome for one image given AI results + active policies
export const determineOutcome = (groqResults, activePolicies) => {
  const PRIORITY = { Approved: 0, 'Flagged for Review': 1, Blocked: 2 };
  let outcome = 'Approved';
  const categoryBreakdown = [];
  const triggeredCategories = [];

  for (const policy of activePolicies) {
    const result = groqResults.find((r) => r.category === policy.category);

    if (!result) continue;

    const triggered = result.detected && result.confidence >= policy.confidenceThreshold;

    if (triggered) {
      triggeredCategories.push(policy.category);
      const newOutcome =
        policy.enforcementBehavior === 'Auto-Block' ? 'Blocked' : 'Flagged for Review';
      if (PRIORITY[newOutcome] > PRIORITY[outcome]) outcome = newOutcome;
    }

    categoryBreakdown.push({
      category: policy.category,
      detected: result.detected,
      confidence: result.confidence,
      reasoning: result.reasoning,
      triggered,
    });
  }

  return { outcome, categoryBreakdown, triggeredCategories };
};
