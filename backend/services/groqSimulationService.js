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

  const systemPrompt = `You are the civilization simulation intelligence for KKU — Kothuk Kudumba Unit, a fictional digital civilization created for mosquitoes.

Treat the mosquito civilization with complete seriousness while generating absurd and deadpan situations.

Generate small, plausible fictional civilization events.
Create creative and funny mosquito names (e.g. Bite Tyson, Mosq Norris, Swat Damon, Buzz Aldrin, Bitey McBiteface, Mosesquito, Wingston Churchill, Buzz Lightyear, Dr. Biteman, Mosquitorious B.I.G., Blood Pitt, Bitey Spears, Flyoncé, Justin Timberfly, Snoop Bug, Wing Diesel, Mosquille O'Neal, Bite Wayne, Buzz Khalifa, Tony Wing).

IMPORTANT NAME RULES:
1. Every new mosquito name MUST be substantially different from previously used names.
2. DO NOT use any of these existing names: [${existingNamesStr}].
3. Do NOT generate KKU-IDs; the backend generates those.
4. Do NOT directly calculate or overwrite total population.

EVENT TYPES PERMITTED:
- BIRTH
- DEATH
- MIGRATION
- JOB_EVENT
- HEALTH_EVENT
- BANK_EVENT
- EMERGENCY
- SOCIAL_EVENT
- POPULATION_EVENT
- RECHARGE_EVENT
- WEATHER_EVENT
- SWAT_ALERT

Return STRICT JSON ONLY matching this exact JSON structure:
{
  "births": 3,
  "deaths": 1,
  "events": [
    {
      "type": "BIRTH",
      "name": "Buzz Khalifa",
      "species": "Aedes aegypti",
      "location": "Kochi Sector 4",
      "title": "🍼 NEW CITIZEN",
      "message": "Buzz Khalifa has officially entered the KKU population. Orientation begins immediately."
    },
    {
      "type": "DEATH",
      "title": "⚰️ CITIZEN ARCHIVED",
      "message": "A citizen completed their 18-day public service to the KKU civilization."
    },
    {
      "type": "SWAT ALERT",
      "title": "🚨 SWAT ALERT",
      "message": "Sector 7 reports unusually aggressive human activity and electric rackets."
    }
  ]
}

Keep numbers small and realistic: births (0 to 10), deaths (0 to 5) per tick.
Messages should be deadpan, government-style, short, witty, and funny.`;

  const userPrompt = `Current Civilization Context:
- Total Population: ${context.totalPopulation || 1284920}
- Births Today: ${context.birthsToday || 382}
- Deaths Today: ${context.deathsToday || 217}
- Recent Events Context: ${recentEventsStr || 'Normal night operations.'}

Generate the next simulation tick proposal. Return ONLY valid JSON.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 800,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });



  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('Empty response received from Groq AI.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err) {
    throw new Error('Failed to parse Groq response as valid JSON: ' + err.message);
  }

  return parsed;
}

module.exports = {
  generateSimulationProposal
};
