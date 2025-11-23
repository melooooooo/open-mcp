
import { SearchBar } from "@/components/search-bar"
import { Container } from "@/components/web/container"
import { CountBadge } from "@/components/web/count-badge"
import { LogoIcon } from "@/components/web/logo-icon"
import { Section } from "@/components/web/section"

export function HeroSection() {
  return (
    <div className="relative relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-bg.png"
          alt="Banking Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </div>

      <Section className="relative z-10 bg-transparent">
        <Container>
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <CountBadge />
            <div className="flex items-center gap-2 mb-4">
              <LogoIcon type="openmcp" size="xl" />
              <span className="text-3xl font-bold">银行帮</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tighter sm:text-2xl xl:text-3xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                银行帮 - 您的银行求职助手
              </h1>
              <p className="max-w-4xl text-muted-foreground md:text-xl mx-auto">
                一站式银行招聘信息聚合平台，提供最新银行校招、社招资讯与备考攻略
              </p>
            </div>
          </div>

          {/* 突出显示的搜索框 */}
          <div className="max-w-3xl mx-auto mb-10">
            <SearchBar className="shadow-lg" />
          </div>
        </Container>
      </Section>
    </div>
  )
}

