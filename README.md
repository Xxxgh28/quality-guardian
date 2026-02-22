# QualityGuardian AI 🛡️

**一个基于 AI 大模型的智能化测试需求分析与用例生成平台**

QualityGuardian 是专为 QA 工程师和测试开发人员设计的效能工具。它利用 DeepSeek 大模型（LLM）的推理能力，实现了从需求文档分析、测试用例自动生成到需求漏洞审查的全流程自动化，旨在通过“测试左移”理念提升软件交付质量。

## 🌟 核心亮点

*   **📄 智能需求分析**：支持 Markdown/TXT 格式的需求文档上传与解析，通过 AI 深度理解业务逻辑。
*   **🧪 自动化测试用例生成**：基于 Chain of Thought (CoT) 技术，自动生成覆盖全面的测试用例（包含前置条件、步骤、预期结果、优先级 P0/P1/P2）。
*   **🧠 思维链透明化**：可视化展示 AI 的思考过程（识别角色 -> 拆解功能 -> 分析异常），增强结果的可解释性与可信度。
*   **🔍 需求反向评审 (Review)**：模拟资深产品经理视角，自动挖掘需求文档中的逻辑漏洞、模糊描述及未定义的边缘场景。
*   **✨ 闭环优化 (Refine)**：根据评审意见，一键重写并优化原始需求文档，形成高质量的 PRD。
*   **📊 报告导出**：支持将分析结果、测试用例及评审意见导出为 Markdown 报告，便于团队协作。

## 🛠️ 技术栈

*   **框架**: [Next.js 16](https://nextjs.org/) (App Router) - 高性能服务端渲染与 API 路由
*   **语言**: TypeScript - 强类型约束，提升代码健壮性
*   **UI 组件库**: [Shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/) - 现代化的响应式设计
*   **AI 集成**: OpenAI SDK (DeepSeek-V3 API) - 高性价比的推理模型接入
*   **数据校验**: Zod - 运行时 Schema 校验，确保 AI 输出的结构化数据（JSON）稳定可靠
*   **部署**: Vercel Serverless Functions - 自动化 CI/CD 流程

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Xxxgh28/quality-guardian.git
cd quality-guardian
```

### 2. 安装依赖

```bash
npm install
# 或 yarn install / pnpm install
```

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件，并添加以下内容：

```env
# 使用 DeepSeek API Key (必须配置)
DEEPSEEK_API_KEY=sk-your-api-key-here
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可使用。

## 📦 部署与维护指南

本项目已适配 Vercel 零配置部署。

### 部署步骤
1.  将代码推送到 GitHub。
2.  在 [Vercel Dashboard](https://vercel.com/dashboard) 导入项目。
3.  **关键步骤**：在 Vercel 项目设置 (Settings -> Environment Variables) 中添加环境变量 `DEEPSEEK_API_KEY`。
4.  点击 **Deploy** 即可获得生产环境链接。

### 维护注意事项
*   **国内访问优化**：Vercel 默认域名（`*.vercel.app`）在中国大陆可能无法访问。建议购买一个自定义域名并绑定到 Vercel 项目，以获得最佳访问体验。
*   **API 配额监控**：请定期检查 DeepSeek 控制台的 Token 使用量，避免因欠费导致服务不可用。
*   **冷启动**：Vercel Serverless 函数会有短暂的冷启动时间，首次访问可能稍慢，属正常现象。
*   **模型更新**：如需更换模型，只需修改 `lib/ai-core.ts` 中的 `MODEL_NAME` 常量。

## 📄 许可证

MIT License
