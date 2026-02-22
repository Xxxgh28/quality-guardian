
import fs from 'fs';
import path from 'path';
import { reviewRequirementsCore, refineRequirementsCore } from '../lib/ai-core';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
  console.log('Environment variables loaded from .env.local');
}

async function main() {
  console.log('Starting verification of Review and Refine features...');

  // 1. Read Original Requirement
  const requirementPath = path.join(process.cwd(), 'demo-requirement.md');
  if (!fs.existsSync(requirementPath)) {
    console.error('demo-requirement.md not found. Please run verify-agent.ts first.');
    return;
  }
  const requirement = fs.readFileSync(requirementPath, 'utf-8');
  console.log('Read original requirement.');

  // 2. Read Generated Test Cases
  const testCasesPath = path.join(process.cwd(), 'output', 'test-cases.json');
  if (!fs.existsSync(testCasesPath)) {
    console.error('output/test-cases.json not found. Please run verify-agent.ts first.');
    return;
  }
  const testCasesData = JSON.parse(fs.readFileSync(testCasesPath, 'utf-8'));
  const testCases = testCasesData.testCases;
  console.log(`Read ${testCases.length} test cases.`);

  // 3. Test Review Requirements
  console.log('\n--- Testing reviewRequirementsCore ---');
  const reviewResult = await reviewRequirementsCore(requirement, testCases);
  
  if (!reviewResult.success || !reviewResult.data) {
    console.error('Review failed:', reviewResult.error || 'Unknown error');
    return;
  }

  console.log('Review successful!');
  console.log('Summary:', reviewResult.data.summary);
  console.log(`Comments count: ${reviewResult.data.comments.length}`);

  const reviewOutputPath = path.join(process.cwd(), 'output', 'review-result.json');
  fs.writeFileSync(reviewOutputPath, JSON.stringify(reviewResult.data, null, 2));
  console.log(`Saved review result to ${reviewOutputPath}`);

  // 4. Test Refine Requirements
  console.log('\n--- Testing refineRequirementsCore ---');
  // Use the comments from the review result
  const refineResult = await refineRequirementsCore(requirement, reviewResult.data.comments);

  if (!refineResult.success || !refineResult.data) {
    console.error('Refine failed:', refineResult.error || 'Unknown error');
    return;
  }

  console.log('Refine successful!');
  console.log('Changes:', refineResult.data.changes);
  
  const refineOutputPath = path.join(process.cwd(), 'output', 'refined-requirement.json');
  fs.writeFileSync(refineOutputPath, JSON.stringify(refineResult.data, null, 2));
  console.log(`Saved refined requirement to ${refineOutputPath}`);

  console.log('\nVerification complete!');
}

main().catch(console.error);
