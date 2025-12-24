import { HomeDataWrapperNew } from "@/components/career/home-data-wrapper-new"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "银行招聘 求职指南",
  description: "汇聚银行、券商、保险职位、网站合集与面试经验，应届生与社招的金融科技求职第一站。",
}

export default function Home() {
  return <HomeDataWrapperNew />
}
