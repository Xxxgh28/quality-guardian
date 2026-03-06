"use server";

import { TestCase, ReviewComment } from "./schemas";
import { 
  generateTestCasesCore, 
  reviewRequirementsCore, 
  refineRequirementsCore 
} from "./ai-core";

// 设置最大执行时间为 60 秒 (Vercel Hobby 计划的默认限制，Pro 计划可设为 300)
// 这可以防止 Server Action 在等待 AI 响应时过早超时
export const maxDuration = 60;

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
