import type { ReactNode } from "react";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions, linkItems } from "@/app/layout.config";
import { getLinks } from "fumadocs-ui/layouts/shared";
import { Header } from "@/components/header";
import { SocialIcons } from "@/components/social-icons";
import BigFooter from "@/components/big-footer";
import SimpleFooter from "@/components/simple-footer";

export default function Layout({ children }: { children: ReactNode }) {
  const footerNavigation = {
    solutions: [
      { name: "Marketing", href: "/marketing" },
      { name: "Analytics", href: "/analytics" },
      { name: "Automation", href: "/automation" },
      { name: "Commerce", href: "/commerce" },
    ],
    support: [
      { name: "Documentation", href: "/docs" },
      { name: "Guides", href: "/guides" },
      { name: "API Status", href: "/api-status" },
    ],
    company: [
      { name: "关于我们", href: "/about" },
      { name: "AI文章", href: "/blog" },
      { name: "AI教程", href: "/docs" },
      { name: "联系我们", href: "/contact" },
    ],
    legal: [
      { name: "服务条款", href: "https://www.julianshuke.top/about/service" },
      { name: "隐私政策", href: "https://www.julianshuke.top/about/terms" }
    ],
    social: [
      {
        name: "X",
        href: "https://x.com/metacode0602",
        icon: SocialIcons.x,
      },
      {
        name: "GitHub",
        href: "https://github.com/metacode0602",
        icon: SocialIcons.github,
      },
    ],
  };

  return (
    <HomeLayout
      {...baseOptions}
      nav={{
        component: (
          <Header
            finalLinks={getLinks(linkItems, baseOptions.githubUrl)}
            {...baseOptions}
          />
        ),
      }}
      className="pt-0 home-layout"
    >
      <div className="home-children flex flex-1 flex-col divide-y divide-dashed divide-border/70 border-border/70 border-dashed sm:border-b dark:divide-border dark:border-border">
        {children}
      </div>
      <BigFooter
        solutions={footerNavigation.solutions}
        support={footerNavigation.support}
        company={footerNavigation.company}
        legal={footerNavigation.legal}
        // social={footerNavigation.social}
        companyName="OpenMCP"
        companyDescription="OpenMCP 是一个一站式 AI 全聚合平台，专注于 MCP 生态的构建和发展，推动AI技术创新和应用落地。"
      />
    </HomeLayout>
  );
}
