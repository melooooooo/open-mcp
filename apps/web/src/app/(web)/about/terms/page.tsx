import { Container } from "@/components/web/container";

export default function PrivacyPolicyPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-6">
        <h1 className="text-3xl font-bold mb-8">隐私政策</h1>

        <div className="prose prose-sm space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">我们收集什么</h2>
            <p>
              为便于提供服务，我们会收集基础账号信息（如邮箱）、使用日志和设备信息（如浏览器与系统）。这些数据仅用于改进站点体验，不会用于与求职无关的目的。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">我们如何使用</h2>
            <p>
              数据主要用于保障站点运行、提升内容质量、推送必要的服务通知，并回应您的反馈。我们不会用来定向广告，也不会出售给第三方。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">我们何时共享</h2>
            <p>
              仅在获得您的明确同意、符合法律要求或为保护用户与平台安全时才会共享信息。默认情况下，您的数据不会被提供给任何第三方。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">我们如何保护</h2>
            <p>
              我们采用加密存储、访问控制和定期安全检查来保护数据，并持续关注潜在风险。如发现异常，会及时排查与修复。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Cookie 与偏好</h2>
            <p>
              站点会使用 Cookie 维持登录状态、记住偏好并收集匿名统计，以便优化体验。您可通过浏览器设置限制或清除 Cookie。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">您的权利</h2>
            <p>
              您可以访问、导出或更正个人信息，并可随时申请注销账户。若需协助，请通过站内反馈或邮箱与我们联系。
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">更新与联系</h2>
            <p>
              政策若有变更，我们会在本站公布。对隐私有任何疑问或请求，可随时联系我们：support@yinhangbang.com。
            </p>
            <p className="text-muted-foreground">最后更新日期：2025 年 5 月 1 日</p>
          </section>
        </div>
      </div>
    </Container>
  )
}
