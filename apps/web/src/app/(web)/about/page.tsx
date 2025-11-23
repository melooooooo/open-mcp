import { Container } from "@/components/web/container"

export default function AboutPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-6">
        <h1 className="text-3xl font-bold mb-8">关于 OpenMCP</h1>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">我们的愿景</h2>
            <p className="text-muted-foreground">
              OpenMCP 致力于打造一个开放、共享、创新的 AI 生态系统。我们希望通过 MCP 协议，让不同的 AI 模型能够无缝对接，为开发者和用户提供更好的人工智能应用体验。
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">平台简介</h2>
            <p className="text-muted-foreground mb-4">
              作为一站式 AI 全聚合平台，OpenMCP 专注于:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li>提供丰富的 MCP 客户端和服务器选择</li>
              <li>支持多样化的 AI 模型接入</li>
              <li>简化 AI 应用开发流程</li>
              <li>构建活跃的开发者社区</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">我们的使命</h2>
            <p className="text-muted-foreground">
              通过技术创新和开放协作，推动 AI 技术的民主化，让每个开发者都能轻松构建智能化应用，为用户创造更大的价值。
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">加入我们</h2>
            <p className="text-muted-foreground">
              无论您是开发者、创业者还是 AI 爱好者，我们都欢迎您加入 OpenMCP 社区。您可以：
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4 mt-4">
              <li>分享您的 AI 应用</li>
              <li>参与技术讨论</li>
              <li>贡献代码</li>
              <li>提供宝贵建议</li>
            </ul>
          </div>
        </section>

        {/* <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            OpenMCP 是天津聚链科技有限公司旗下项目，我们承诺持续投入资源，推动平台的长期发展。
          </p>
        </div> */}
      </div>
    </Container>
  )
}