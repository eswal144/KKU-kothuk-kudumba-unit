const dotenv = require('dotenv');
dotenv.config();

/**
 * Service to generate civilization simulation proposals using Groq AI.
 */
async function generateSimulationProposal(context = {}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GROQ_API_KEY is not configured in backend environment.');
  }

  const existingNamesStr = (context.existingNames || []).slice(-30).join(', ');
  const recentEventsStr = (context.recentEvents || []).map(e => e.message).join(' | ');

  const systemPrompt = `You are the civilization simulation AI for KKU — Kothuk Kudumba Unit, a digital civilization of mosquitoes.

At every simulation tick (interval), dynamically invent completely ORIGINAL, FRESH, and HILARIOUS mosquito civilization notifications and names. DO NOT repeat fixed strings or hardcoded examples.

SIMULATION RULES:
1. BIRTH EVENTS:
   - Generate a funny newborn notification.
   - ALWAYS include cute mosquito newborn buzzing sounds like "zzz zzzzz! Bzzzz!" followed by funny first words, nectar demands, or flight school chaos.
   - Invent a unique, witty mosquito name for each newborn (e.g. punny names mixing mosquito/flying terms with human pop culture or historical figures).

2. DEATH / ARCHIVE EVENTS:
   - Generate a deadpan, humorous message about mosquito hazards (e.g., electronic swatter traps, sticky tape, unexpected ceiling fans, heavy raindrops, wind gusts, citronella candles, rolled-up newspapers).

3. CIVILIZATION ALERTS / SOCIAL EVENTS:
   - Generate absurd mosquito society news: SWAT alerts, nectar exchange rates, wing repair clinic updates, blood drive announcements, or sector weather (humidity/rain).

4. CREATIVITY INSTRUCTION:
   - Every response MUST contain 100% unique names and original messages. Do NOT reuse previous names: [${existingNamesStr}].
   - Do NOT generate KKU-IDs (the backend assigns them).
   - Do NOT modify total population directly.

Output strictly a single valid JSON object formatted as:
{
  "births": number (0-15),
  "deaths": number (0-10),
  "events": [
    {
      "type": "BIRTH",
      "name": "Original Name Here",
      "species": "Aedes aegypti",
      "location": "Sector Name",
      "title": "🍼 NEW CITIZEN",
      "message": "Dynamic original birth message with zzz zzzzz! Bzzzz!"
    },
    {
      "type": "DEATH",
      "title": "⚰️ CITIZEN ARCHIVED",
      "message": "Dynamic hilarious mosquito hazard death message"
    },
    {
      "type": "SWAT_ALERT",
      "title": "🚨 SWAT ALERT",
      "message": "Dynamic warning or community update"
    }
  ]
}`;


  const userPrompt = `Current Civilization Context:
- Total Population: ${context.totalPopulation || 1284920}
- Births Today: ${context.birthsToday || 382}
- Deaths Today: ${context.deathsToday || 217}
- Recent Events Context: ${recentEventsStr || 'Normal night operations.'}

Please return the next simulation tick proposal as valid JSON.`;

  // Models to try in order of preference (using fast & high limit models first)
  const candidateModels = ['openai/gpt-oss-20b', 'groq/compound-mini', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 450,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });


      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Model ${model} responded with ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;

      if (!rawContent) {
        throw new Error(`Empty content from Groq model ${model}`);
      }

      // Robust JSON extraction & strip thinking tokens
      let cleanJson = rawContent.trim();
      if (cleanJson.includes('</think>')) {
        cleanJson = cleanJson.split('</think>')[1].trim();
      }
      if (cleanJson.includes('```json')) {
        cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
      } else if (cleanJson.includes('```')) {
        cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
      }

      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1).trim();
      }

      const parsed = JSON.parse(cleanJson);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }

    } catch (err) {
      lastError = err;
      console.warn(`[Groq Model Try]: ${model} failed (${err.message}). Trying next candidate...`);
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError ? lastError.message : 'Unknown error'}`);
}

module.exports = {
  generateSimulationProposal
};
