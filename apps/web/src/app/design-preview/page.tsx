import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Badge } from "@repo/ui/components/ui/badge"
import { Card } from "@repo/ui/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Footer } from "@/components/footer"
import { LogoIcon } from "@/components/web/logo-icon"
import { Search, MapPin, Building2, Flame, Newspaper, FileText, ChevronRight, Calendar, Eye, Clock, Sparkles, User, Moon, MessageSquarePlus } from "lucide-react"
import Link from "next/link"

const PreviewHeader = () => (
  <header className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <LogoIcon type="openmcp" className="text-blue-600" />
      </Link>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-8">
        {["首页", "职位", "招聘", "经验", "内推", "公司", "薪酬", "帮助中心"].map(item => (
          <a
            href="#"
            key={item}
            className="text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors"
          >
            {item}
          </a>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
          <User className="w-4 h-4" /> 登录
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200">
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </div>
  </header>
)

export default function DesignPreviewPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100">
      <PreviewHeader />

      <main className="flex-1">
        {/* Hero Section - White & Clean Style */}
        <div className="relative pt-32 pb-20 overflow-hidden">

          <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-8 shadow-sm">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              2025银行秋招进行中
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              开启你的 <span className="text-blue-700 relative inline-block">
                银行生涯
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl mb-12 font-normal max-w-2xl mx-auto leading-relaxed">
              汇聚银行、券商、保险职位、网站合集与面试经验
              <br className="hidden md:block" />
              应届生与社招的金融科技求职第一站
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto relative">
              <div className="relative flex items-center w-full h-16 rounded-full shadow-xl shadow-blue-900/5 border border-slate-200 bg-white overflow-hidden hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 group">
                <Search className="absolute left-6 w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="搜索银行、岗位或关键词..."
                  className="w-full h-full pl-14 pr-40 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 text-lg"
                />
                <div className="absolute right-2 top-2 bottom-2">
                  <Button className="h-full px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md transition-all hover:shadow-lg">
                    搜索职位 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Hot Tags */}
            <div className="mt-8 flex flex-wrap justify-center items-center gap-3 text-sm text-slate-500">
              <span className="text-slate-400">热门搜索：</span>
              {["前端开发", "产品经理", "算法工程师", "Java开发", "数据分析", "UI设计师", "运营", "测试工程师"].map((tag) => (
                <button key={tag} className="hover:text-blue-700 hover:bg-blue-50 hover:border-blue-100 transition-all bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-20 space-y-20 pb-24">

          {/* 求职导航 Section */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">求职导航</h2>
                  <p className="text-slate-500 text-sm mt-1">汇聚全网优质招聘渠道，快速锁定热门机会</p>
                </div>
              </div>
              <Button variant="ghost" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                浏览全部导航 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockNavigations.hot.map((item, index) => (
                <div key={index} className="flex items-center p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:shadow-md hover:border-blue-200 hover:bg-white transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:border-blue-100 transition-colors shadow-sm">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600">{item.name.slice(0, 2)}</span>
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate pr-2">{item.name}</h4>
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap flex-shrink-0">{item.tag}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1.5">{item.desc}</p>
                    <div className="flex items-center text-[10px] text-slate-400 group-hover:text-blue-400/80 transition-colors">
                      <MapPin className="w-3 h-3 mr-0.5" /> {item.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 最新招聘动态 Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Newspaper className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">最新招聘动态</h2>
                <p className="text-slate-500 text-sm mt-0.5">实时更新各行招聘信息，掌握第一手资讯</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
              {mockNews.map((news, index) => (
                <div key={index} className="p-6 flex gap-6 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-xl flex flex-col items-center justify-center border border-blue-100/50 text-blue-600">
                    <span className="text-2xl font-bold leading-none">{news.date.day}</span>
                    <span className="text-xs font-medium uppercase mt-1 text-blue-400">{news.date.month}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {news.title}
                      </h3>
                      {news.isNew && (
                        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs font-bold border border-orange-100 flex-shrink-0 ml-2">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mb-3 line-clamp-2 leading-relaxed">
                      {news.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {news.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {news.views} 阅读
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 经验分享 Section - List Style */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">经验分享</h2>
                  <p className="text-slate-500 text-sm mt-0.5">前辈经验，助你避坑</p>
                </div>
              </div>
              <Button variant="ghost" className="text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                查看更多 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {mockExperiences.map((exp, index) => (
                <div key={index} className="p-6 flex items-center gap-6 hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group cursor-pointer relative">
                  {/* Number Index */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl font-black text-slate-200 group-hover:text-blue-200 transition-colors italic">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors truncate pr-4">
                      {exp.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                          {exp.author.slice(0, 1)}
                        </div>
                        <span className="font-medium text-slate-700">{exp.author}</span>
                      </div>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-slate-500 truncate">{exp.role}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></span>
                      <span className="hidden sm:flex items-center gap-1 text-slate-400 text-xs">
                        <Eye className="w-3 h-3" /> {Math.floor(Math.random() * 1000) + 100}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-center">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-300">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Floating Feedback Widget */}
      <div className="fixed bottom-8 right-8 z-50 group">
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
          <div className="bg-slate-900 text-white text-sm py-2 px-4 rounded-xl shadow-xl whitespace-nowrap relative">
            有建议或问题？告诉我吧
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 transform rotate-45"></div>
          </div>
        </div>

        {/* Button - Professional Style */}
        <button className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white text-blue-600 shadow-xl shadow-slate-200 border border-slate-100 hover:scale-110 hover:shadow-2xl hover:border-blue-100 transition-all duration-300 z-50">
          <MessageSquarePlus className="w-7 h-7" />
        </button>
      </div>

      {/* Reusing existing Footer */}
      <Footer />
    </div>
  )
}

// Mock Data
const mockJobs = [
  {
    title: "银行管培生",
    salary: "15-25k",
    experience: "应届生",
    education: "本科及以上",
    tags: ["五险一金", "带薪年假", "定期体检"],
    company: "中信银行",
    industry: "银行/金融",
    location: "北京·朝阳区"
  },
  {
    title: "金融科技专员",
    salary: "28-35k",
    experience: "应届生",
    education: "硕士及以上",
    tags: ["技术大牛", "弹性工作", "餐补"],
    company: "兴业银行",
    industry: "银行/金融",
    location: "上海·浦东新区"
  },
  {
    title: "对公客户经理",
    salary: "12-20k",
    experience: "应届生",
    education: "本科",
    tags: ["绩效奖金", "交通补助", "通讯补贴"],
    company: "中国农业银行",
    industry: "银行/金融",
    location: "广州·天河区"
  },
  {
    title: "柜员/综合业务",
    salary: "8-12k",
    experience: "应届生",
    education: "大专及以上",
    tags: ["工作稳定", "福利好", "培训完善"],
    company: "招商银行",
    industry: "银行/金融",
    location: "深圳·福田区"
  }
]

const mockNavigations = {
  hot: [
    { name: "中国银行招聘官网", desc: "官方直招", location: "全国", tag: "官方" },
    { name: "工商银行人才招聘", desc: "宇宙行校招", location: "全国", tag: "热门" },
    { name: "应届生求职网", desc: "专业校招平台", location: "聚合", tag: "综合" },
    { name: "牛客网", desc: "笔试面试题库", location: "社区", tag: "求职神器" },
    { name: "邮储银行招聘", desc: "六大行之一", location: "全国", tag: "国企" },
    { name: "中国农业银行", desc: "秋季校园招聘", location: "多地", tag: "热招" },
    { name: "智联招聘", desc: "综合招聘平台", location: "聚合", tag: "老牌" },
    { name: "前程无忧", desc: "海量职位信息", location: "聚合", tag: "全面" },
  ],
  new: [
    { name: "建设银行招聘", desc: "最新春招启动", location: "全国", tag: "刚刚更新" },
    { name: "招商银行招聘", desc: "金融科技专场", location: "多地", tag: "热招中" },
    { name: "国聘网", desc: "国企招聘平台", location: "全国", tag: "官方" },
    { name: "中国公共招聘网", desc: "公共服务平台", location: "全国", tag: "权威" },
  ]
}

const mockNews = [
  {
    date: { day: "28", month: "EUR" },
    title: "中国工商银行2024年秋季校园招聘正式启动",
    description: "诚邀优秀学子加入，共创美好未来。本次招聘涵盖总行本部及全国各分行，提供多个岗位方向选择。",
    time: "2小时前",
    views: "520",
    isNew: true
  },
  {
    date: { day: "27", month: "FRI" },
    title: "中国建设银行2024年春季校园招聘简章发布",
    description: "建设银行诚挚邀请您的加入。我们将为您提供广阔的发展平台和具有竞争力的薪酬福利。",
    time: "昨天",
    views: "356",
    isNew: true
  },
  {
    date: { day: "26", month: "THU" },
    title: "中国银行2024年管理培训生计划全面启动",
    description: "专门为培养未来银行家打造的专项人才培养计划，期待您的加入！",
    time: "3天前",
    views: "679",
    isNew: false
  },
  {
    date: { day: "25", month: "WED" },
    title: "交通银行2024年金融科技校园招聘公告",
    description: "数字化转型关键时期，诚邀技术人才加入。提供具有竞争力的薪酬和完善的培训体系。",
    time: "4天前",
    views: "892",
    isNew: false
  },
  {
    date: { day: "24", month: "TUE" },
    title: "招商银行总行2024年全球校园招聘开启",
    description: "梦想靠岸，招商银行等你来。开放多个总行职能部门岗位，欢迎海内外优秀学子投递。",
    time: "5天前",
    views: "1.2k",
    isNew: false
  }
]

const mockExperiences = [
  {
    title: "找到适合自己的节奏很重要",
    author: "张同",
    role: "招商银行 | 2023届管培生"
  },
  {
    title: "勇敢尝试，不惧怕犯错",
    author: "李式",
    role: "建设银行 | 2023届运营岗"
  },
  {
    title: "面试中的这些坑千万别踩",
    author: "王特",
    role: "中国银行 | 2021届客户经理"
  },
  {
    title: "银行无领导小组讨论通关秘籍",
    author: "刘悦",
    role: "交通银行 | 2023届产品经理"
  },
  {
    title: "双非本硕如何逆袭进入国有大行",
    author: "陈明",
    role: "工商银行 | 2022届软件开发"
  }
]
