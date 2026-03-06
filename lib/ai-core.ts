import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import {
  TestPlanSchema,
  ReviewResultSchema,
  RefineRequirementSchema,
  TestCase,
  ReviewComment,
} from "./schemas";

// 使用 DeepSeek 配置
const openai = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
  fetch: fetch,
});

// 使用 deepseek-chat 模型
const MODEL_NAME = 'deepseek-chat';

// Helper to call DeepSeek directly via fetch to avoid SDK issues
async function callDeepSeek(messages: any[]) {
  console.log('Calling DeepSeek API directly via fetch with timeout...');
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing API Key");

  // console.log('Messages:', JSON.stringify(messages, null, 2));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error Body:', errorText);
      throw new Error(`DeepSeek API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('DeepSeek API response received.');
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared on error
    console.error('Fetch error calling DeepSeek:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request timed out after 120s');
      throw new Error('DeepSeek API request timed out after 120s');
    }
    throw error;
  }
}

export async function generateTestCasesCore(requirement: string) {
  try {
    console.log('generateTestCasesCore started');
    
    const systemPrompt = `你是一位资深 QA 工程师。
请根据用户输入的需求，设计覆盖全面的测试用例，包括正常路径和异常路径。
请展示你的“思维链”过程：
1. 识别用户角色
2. 拆解功能点
3. 分析异常场景

请务必只返回合法的 JSON 格式数据，不要包含 Markdown 代码块标记（如 \`\`\`json）。
JSON 结构应符合以下 Schema：
${JSON.stringify({
  thoughtProcess: [
    "1. 识别用户角色...",
    "2. 拆解功能点...",
    "3. 分析异常..."
  ],
  testCases: [
    {
      id: "TC-001",
      title: "测试用例标题",
      preconditions: "前置条件",
      steps: ["步骤 1", "步骤 2"],
      expectedResult: "预期结果",
      priority: "P0/P1/P2"
    }
  ],
  coverageAnalysis: "覆盖率分析文本"
}, null, 2)}`;

    // Use direct fetch call
    const text = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Requirement:\n${requirement}` }
    ]);
    
    console.log('DeepSeek response length:', text.length);

    const cleanJson = text.replace(/```json\n?|```/g, '').trim();
    console.log('Cleaned JSON start:', cleanJson.substring(0, 100));
    
    let object;
    try {
      object = JSON.parse(cleanJson);
    } catch (e) {
      console.error('JSON parse error:', e);
      return { success: false, error: "JSON Parsing Failed" };
    }
    
    // 验证数据结构
    const validated = TestPlanSchema.parse(object);

    return { success: true, data: validated };
  } catch (error: any) {
    console.error("Error generating test cases:", error);
    // 返回更详细的错误信息以便排查
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    return { success: false, error: `生成测试用例失败: ${errorMessage}` };
  }
}

export async function reviewRequirementsCore(
  requirement: string,
  testCases: TestCase[]
) {
  try {
    const systemPrompt = `你是一个资深的产品经理和架构师。
这是一个“反向验证”过程。
请根据原始需求文本和基于该需求生成的测试用例，反推需求文档中是否存在逻辑漏洞、模糊不清或未定义的边缘情况。
请务必只返回合法的 JSON 格式数据，不要包含 Markdown 代码块标记（如 \`\`\`json）。
JSON 结构应符合以下 Schema：
${JSON.stringify({
  comments: [
    {
      relatedTestCaseId: "TC-001",
      issueDescription: "问题描述",
      improvementSuggestion: "改进建议",
      severity: "High/Medium/Low"
    }
  ],
  summary: "总体总结"
}, null, 2)}`;

    // Use direct fetch call
    const text = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `原始需求：\n${requirement}\n\n生成的测试用例：\n${JSON.stringify(testCases, null, 2)}` }
    ]);

    const cleanJson = text.replace(/```json\n?|```/g, '').trim();
    const object = JSON.parse(cleanJson);
    
    // 验证数据结构
    const validated = ReviewResultSchema.parse(object);

    return { success: true, data: validated };
  } catch (error) {
    console.error("Error reviewing requirements:", error);
    return { success: false, error: "需求评审失败，请稍后重试。" };
  }
}

export async function refineRequirementsCore(
  originalRequirement: string,
  reviewComments: ReviewComment[]
) {
  try {
    const systemPrompt = `你是一个资深的产品经理。
请根据原始需求和评审发现的问题，重写一份更加完善的需求文档。
请务必只返回合法的 JSON 格式数据，不要包含 Markdown 代码块标记。
JSON 结构应符合以下 Schema：
${JSON.stringify({
  refinedRequirement: "重写后的完整需求文本...",
  changes: ["修复了...问题", "补充了...细节"]
}, null, 2)}`;

    // Use direct fetch call
    const text = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `原始需求：\n${originalRequirement}\n\n评审意见：\n${JSON.stringify(reviewComments, null, 2)}` }
    ]);

    const cleanJson = text.replace(/```json\n?|```/g, '').trim();
    const object = JSON.parse(cleanJson);
    
    const validated = RefineRequirementSchema.parse(object);

    return { success: true, data: validated };
  } catch (error) {
    console.error("Error refining requirements:", error);
    return { success: false, error: "需求优化失败，请稍后重试。" };
  }
}
