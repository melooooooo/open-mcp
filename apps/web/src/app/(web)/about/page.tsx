import { Container } from "@/components/web/container"

export default function AboutPage() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-6">
        <h1 className="text-3xl font-bold mb-8">关于银行帮</h1>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">我们做什么</h2>
            <p className="text-muted-foreground">
              银行帮是一个免费、纯公益的求职信息整合与经验分享站点，聚焦银行、金融科技等相关岗位，旨在帮助大家消除信息差，快速了解招聘渠道、岗位信息与真实面经。
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">内容来源</h2>
            <p className="text-muted-foreground">
              站内内容主要由个人整理、公开渠道汇总与用户分享组成。我们会持续核对来源与有效性，但不代表任何机构官方立场。
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">如何反馈</h2>
            <p className="text-muted-foreground">
              如果您发现信息与实际不符，或希望补充/纠正内容，欢迎通过邮箱联系我们：support@yinghangbang.com。
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-blue-700">分享与共建</h2>
            <p className="text-muted-foreground">
              如果您有求职经验、岗位信息或备考资料愿意分享，也请发送到 support@yinghangbang.com，我们会注明来源并与更多求职者分享。
            </p>
          </div>
        </section>
      </div>
    </Container>
  )
}
