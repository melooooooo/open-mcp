import { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverApi as trpc } from "@/lib/trpc/server";
import { AppContent } from "@/components/web/app-content";
import { Container } from "@/components/web/container";

type AppPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: AppPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const app = await trpc.mcpApps.getBySlug.query({ slug });

    if (!app) {
      return {
        title: "应用未找到 | 银行帮",
      };
    }

    const title = `${app.name} - ${app.type === "client" ? "MCP 客户端" : "MCP 服务器"} | 银行帮`;
    const description = app.descriptionZh || app.description || "浏览银行帮上的开源应用。";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: app.icon ? [app.icon] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: app.icon ? [app.icon] : [],
      },
    };
  } catch (error) {
    return {
      title: "应用详情 | 银行帮",
    };
  }
}

export default async function AppPage({ params }: AppPageProps) {
  const { slug } = await params;

  try {
    const app = await trpc.mcpApps.getBySlug.query({ slug });

    if (!app) {
      notFound();
    }

    return <AppContent app={app} />;
  } catch (error: any) {
    return (
      <Container className="py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">加载应用失败</h2>
        <p className="text-muted-foreground">{error?.message || "发生未知错误"}</p>
      </Container>
    );
  }
}
