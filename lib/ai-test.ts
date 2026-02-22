
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
  fetch: fetch,
});

export async function testDeepSeek() {
  console.log('Testing DeepSeek via generateText...');
  try {
    const result = await generateText({
      model: openai.chat('deepseek-chat'),
      prompt: 'Hello, are you there?',
    });
    console.log('DeepSeek response:', result.text);
    return result;
  } catch (error) {
    console.error('DeepSeek error:', error);
    throw error;
  }
}
