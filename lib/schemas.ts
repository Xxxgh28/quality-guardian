import { z } from "zod";

export const TestCaseSchema = z.object({
  id: z.string().describe("测试用例唯一标识符"),
  title: z.string().describe("测试用例标题"),
  preconditions: z.string().describe("前置条件"),
  steps: z.array(z.string()).describe("测试步骤列表"),
  expectedResult: z.string().describe("预期结果"),
  priority: z.enum(["P0", "P1", "P2"]).describe("优先级 (P0: 核心, P1: 重要, P2: 一般)"),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

export const TestPlanSchema = z.object({
  testCases: z.array(TestCaseSchema).describe("测试用例列表"),
  coverageAnalysis: z.string().describe("总体覆盖率分析，包括功能覆盖和异常场景覆盖的评估"),
  thoughtProcess: z.array(z.string()).describe("Agent 的思考过程，例如：1. 识别用户角色... 2. 识别功能点..."),
});

export type TestPlan = z.infer<typeof TestPlanSchema>;

export const RefineRequirementSchema = z.object({
  refinedRequirement: z.string().describe("优化后的需求文档"),
  changes: z.array(z.string()).describe("本次优化的主要变更点"),
});

export type RefineRequirementResult = z.infer<typeof RefineRequirementSchema>;

export const ReviewCommentSchema = z.object({
  relatedTestCaseId: z.string().optional().describe("关联的测试用例ID（如果有）"),
  issueDescription: z.string().describe("问题描述：需求中的逻辑漏洞、模糊不清或未定义的点"),
  improvementSuggestion: z.string().describe("改进建议"),
  severity: z.enum(["High", "Medium", "Low"]).describe("严重程度"),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema>;

export const ReviewResultSchema = z.object({
  comments: z.array(ReviewCommentSchema).describe("评审建议列表"),
  summary: z.string().describe("需求评审总结，包含整体质量评估"),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;
