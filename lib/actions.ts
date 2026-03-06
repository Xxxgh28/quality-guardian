"use server";

import { TestCase, ReviewComment } from "./schemas";
import { 
  generateTestCasesCore, 
  reviewRequirementsCore, 
  refineRequirementsCore 
} from "./ai-core";

export async function generateTestCases(requirement: string) {
  "use server";
  return await generateTestCasesCore(requirement);
}

export async function reviewRequirements(
  requirement: string,
  testCases: TestCase[]
) {
  "use server";
  return await reviewRequirementsCore(requirement, testCases);
}

export async function refineRequirements(
  originalRequirement: string,
  reviewComments: ReviewComment[]
) {
  "use server";
  return await refineRequirementsCore(originalRequirement, reviewComments);
}
