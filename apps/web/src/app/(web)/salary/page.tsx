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
      description: "基于近一年校招与社招样本的平均月薪",
    },
    {
      label: "统计公司数",
      value: `${mockSalaryData.length}`,
      description: "覆盖头部互联网企业热门岗位",
    },
    {
      label: "最高平均薪资",
      value: `${highestAverage}k`,
      description: "多地 offer 数据实时更新",
    },
  ]

  return (
    <main className="bg-background pb-16">
      <section className="border-b bg-muted/20">
        <Container className="py-12 sm:py-16 space-y-4">
          <Badge variant="secondary" className="w-fit">Compensation Transparency</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">薪酬洞察</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            汇总近一年校招与社招 Offer 数据，提供公司、岗位、城市维度的薪酬对比，帮助你在谈薪与 offer 选择阶段争取更优条件。
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
              <CardTitle>热门企业薪酬区间</CardTitle>
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
              <p>录入城市与税前薪资，即可查看五险一金、个税后的到手情况，并支持生成谈薪备忘单。</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Offer 对比清单（开发中）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>支持多份 offer 的薪资、福利、发展空间等维度横向对比，让你的选择更有底气。</p>
            </CardContent>
          </Card>
        </Container>
      </section>
    </main>
  )
}
