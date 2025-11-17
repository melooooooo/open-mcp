import { Container } from "@/components/web/container"
import { mockSalaryData } from "@/data/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"

export default function SalaryPage() {
  const averageSalary = Math.round(
    mockSalaryData.reduce((total, item) => total + item.average, 0) / mockSalaryData.length
  )
  const highestAverage = Math.max(...mockSalaryData.map((item) => item.average))

  const salaryHighlights = [
    {
      label: "样本平均薪资",
      value: `${averageSalary}k`,
      description: "统计国有大行、股份行、头部券商近一年校招/社招样本",
    },
    {
      label: "统计机构数",
      value: `${mockSalaryData.length}`,
      description: "覆盖银行、证券、资管、信托等热门金融机构",
    },
    {
      label: "最高平均薪资",
      value: `${highestAverage}k`,
      description: "包含投行前台/自营/资管条线，多地 offer 实时更新",
    },
  ]

  return (
    <main className="bg-background pb-16">
      <section className="border-b bg-muted/20">
        <Container className="py-12 sm:py-16 space-y-4">
          <Badge variant="secondary" className="w-fit">Financial Industry Insight</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">银行 / 证券薪酬洞察</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            集中展示银行、证券、资管、信托等金融机构近一年 Offer 数据，涵盖岗位/城市/条线维度，帮助你在投递与谈薪中更快找到市场锚点。
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container className="grid gap-6 md:grid-cols-3">
          {salaryHighlights.map((item) => (
            <Card key={item.label}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2 text-primary">{item.value}</div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </Container>
      </section>

      <section className="py-6">
        <Container>
          <Card>
            <CardHeader>
              <CardTitle>头部银行 & 券商薪酬区间</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">公司</th>
                    <th className="pb-3 font-medium">平均月薪</th>
                    <th className="pb-3 font-medium">最低</th>
                    <th className="pb-3 font-medium">最高</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockSalaryData.map((item) => (
                    <tr key={item.company} className="hover:bg-muted/40">
                      <td className="py-3 font-medium">{item.company}</td>
                      <td className="py-3">{item.average}k</td>
                      <td className="py-3 text-muted-foreground">{item.min}k</td>
                      <td className="py-3 text-muted-foreground">{item.max}k</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="py-12">
        <Container className="grid gap-6 md:grid-cols-2">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>税后收入计算器（开发中）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>录入城市、税前薪资与条线类别，即可折算五险一金、年终奖、住房补贴后的到手收入，并生成金融行业谈薪备忘单。</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Offer 对比清单（开发中）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>支持投研、风控、交易、科技等多条线 Offer 在薪酬、福利、晋升通道维度横向对比，让你的选择更有底气。</p>
            </CardContent>
          </Card>
        </Container>
      </section>
    </main>
  )
}
