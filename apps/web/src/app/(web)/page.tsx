import { HomeDataWrapperNew } from "@/components/career/home-data-wrapper-new"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "银行帮 - 银行招聘求职第一站 | 校招社招面试经验",
  description: "发现最新的银行、券商、保险招聘信息。获取专业的面试攻略与内推资源，助力您的金融求职之旅。",
}

export default function Home() {
  return <HomeDataWrapperNew />
}