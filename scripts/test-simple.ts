import { ProxyAgent, setGlobalDispatcher } from 'undici';
import fs from 'fs';
import path from 'path';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Manual env loading
const envPath = path.join(process.cwd(), '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envLines = envContent.split(/\r?\n/);
  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    const match = trimmedLine.match(/^([\w_]+)=(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value.trim();
    }
  }
} catch (e) {
  console.error(e);
}

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
console.log(`Proxy: ${proxyUrl}`);

if (proxyUrl) {
  const dispatcher = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(dispatcher);
  console.log('Dispatcher set');
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
  console.log('Testing manual POST...');
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Say hello!" }]
      })
    });
    console.log(`Manual POST Status: ${res.status}`);
    const json = await res.json();
    console.log('Manual POST Response:', JSON.stringify(json).substring(0, 100));
  } catch (e) {
    console.error('Manual POST Error:', e);
  }
}

run();