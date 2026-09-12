const dotenv = require('dotenv');
dotenv.config();
const key = process.env.GROQ_API_KEY;

async function test() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      max_tokens: 250,
      messages: [{ role: 'user', content: 'Say hello mosquito in JSON format {"message":"..."}' }]
    })
  });
  const data = await res.json();
  console.log(data);
}

test().catch(console.error);
