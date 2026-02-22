
import https from 'https';

async function main() {
  console.log('Testing connection to api.deepseek.com...');
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'You are a QA engineer. Please generate a test case for login.' }]
              })
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Manually load env vars since we are running this directly
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
  console.log('Loaded env vars');
}

main().catch(console.error);
