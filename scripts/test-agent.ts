import fs from 'fs';
import path from 'path';
// Manual .env.local loader
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
        process.env[key] = value;
      }
    });
    console.log('Environment variables loaded from .env.local');
    // Hide keys in logs
    // console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'Set' : 'Unset');
  } else {
    console.warn('.env.local not found');
  }
}

loadEnv();

// Disable proxy for testing to isolate issues
// if (process.env.HTTPS_PROXY) {
//   console.log('Disabling HTTPS_PROXY for testing:', process.env.HTTPS_PROXY);
//   delete process.env.HTTPS_PROXY;
// }

async function main() {
  console.log('Starting main...');
  // Dynamic import to ensure env vars are loaded first
  console.log('Importing lib/ai-core...');
  const { generateTestCasesCore } = await import('../lib/ai-core');
  console.log('Imported lib/ai-core.');
  
  // Test simple generation first
  /*
  try {
    const { testDeepSeek } = await import('../lib/ai-test');
    await testDeepSeek();
  } catch (error) {
    console.error('Simple test failed:', error);
  }
  */

  const requirementPath = path.join(process.cwd(), 'demo-requirement.md');
  // ... rest of the function
  
  if (!fs.existsSync(requirementPath)) {
    console.error('demo-requirement.md not found!');
    process.exit(1);
  }

  const requirement = fs.readFileSync(requirementPath, 'utf-8');
  console.log('Read requirement from demo-requirement.md');
  console.log('Requirement length:', requirement.length);

  console.log('Generating test cases using DeepSeek...');
  const startTime = Date.now();
  
  try {
    const result = await generateTestCasesCore(requirement);
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Generation completed in ${duration}s`);

    if (result.success && result.data) {
      const outputDir = path.join(process.cwd(), 'output');
      const outputPath = path.join(outputDir, 'test-cases.json');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(result.data, null, 2));
      console.log(`Test cases saved to ${outputPath}`);
      console.log(`Generated ${result.data.testCases.length} test cases.`);
      console.log('Thought Process:', JSON.stringify(result.data.thoughtProcess, null, 2));
    } else {
      console.error('Failed to generate test cases:', result.error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main().catch(console.error);
