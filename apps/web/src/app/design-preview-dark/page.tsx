import { Button } from "@repo/ui/components/ui/button"
import { Footer } from "@/components/footer"
import { LogoIcon } from "@/components/web/logo-icon"
import { Search, MapPin, Newspaper, FileText, ChevronRight, Eye, Clock, User, Moon, MessageSquarePlus, Sparkles, TrendingUp, Building2, ArrowRight } from "lucide-react"
import Link from "next/link"

const DarkHeader = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="relative">
          <LogoIcon type="openmcp" className="text-blue-500 transition-transform group-hover:scale-110" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </Link>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-8">
        {["首页", "职位", "招聘", "经验", "内推", "公司", "薪酬", "帮助中心"].map((item, index) => (
          <a
            href="#"
            key={item}
            className={`text-sm font-medium transition-colors ${index === 0 ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
          >
            {item}
          </a>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30">
          <User className="w-4 h-4" /> 登录
        </button>
        <button className="p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700/50">
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </div>
  </header>
)

export default function DesignPreviewDarkPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 text-white">
      <DarkHeader />

      <main className="flex-1">
        {/* Hero Section - Dark Premium Style */}
        <div className="relative pt-32 pb-24 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]"></div>

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>

          <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              2025银行秋招进行中
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
              <span className="text-white">开启你的</span>
              <br className="md:hidden" />
              <span className="relative inline-block ml-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">银行生涯</span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full opacity-50"></div>
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl mb-14 font-normal max-w-2xl mx-auto leading-relaxed">
              汇聚银行、券商、保险职位、网站合集与面试经验
              <br className="hidden md:block" />
              应届生与社招的金融科技求职第一站
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative flex items-center w-full h-16 rounded-2xl bg-slate-900/80 border border-slate-700/50 overflow-hidden backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 group">
                <Search className="absolute left-6 w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="搜索银行、岗位或关键词..."
                  className="w-full h-full pl-14 pr-44 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-lg"
                />
                <div className="absolute right-2 top-2 bottom-2">
                  <Button className="h-full px-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-base shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-500/30">
                    搜索职位 <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Hot Tags */}
            <div className="mt-10 flex flex-wrap justify-center items-center gap-3 text-sm">
              <span className="text-slate-500">热门搜索：</span>
              {["工商银行", "建设银行", "管培生", "金融科技", "数据分析", "客户经理", "风控", "产品经理"].map((tag) => (
                <button key={tag} className="hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-lg text-xs font-medium text-slate-400">
                  {tag}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { value: "10,000+", label: "热门职位" },
                { value: "500+", label: "合作银行" },
                { value: "50,000+", label: "成功入职" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-20 space-y-24 pb-32">

          {/* 求职导航 Section */}
          <section>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20">
                  <MapPin className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">求职导航</h2>
                  <p className="text-slate-500 text-sm mt-1">汇聚全网优质招聘渠道，快速锁定热门机会</p>
                </div>
              </div>
              <Button variant="ghost" className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl border border-transparent hover:border-blue-500/20">
                浏览全部导航 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockNavigations.hot.map((item, index) => (
                <div key={index} className="group relative p-5 bg-slate-900/50 border border-slate-800/50 rounded-2xl hover:border-blue-500/30 hover:bg-slate-800/50 transition-all duration-300 cursor-pointer overflow-hidden">
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center border border-slate-700 group-hover:border-blue-500/30 group-hover:bg-slate-700/50 transition-all">
                      <span className="text-sm font-bold text-slate-400 group-hover:text-blue-400 transition-colors">{item.name.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">{item.name}</h4>
                        <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 whitespace-nowrap flex-shrink-0">{item.tag}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mb-2">{item.desc}</p>
                      <div className="flex items-center text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors">
                        <MapPin className="w-3 h-3 mr-0.5" /> {item.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 最新招聘动态 Section */}
          <section>
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-600/20 to-amber-600/20 border border-orange-500/20">
                <Newspaper className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">最新招聘动态</h2>
                <p className="text-slate-500 text-sm mt-0.5">实时更新各行招聘信息，掌握第一手资讯</p>
              </div>
            </div>

            <div className="bg-slate-900/30 rounded-2xl border border-slate-800/50 overflow-hidden backdrop-blur-sm">
              {mockNews.map((news, index) => (
                <div key={index} className="p-6 flex gap-6 hover:bg-slate-800/30 transition-all group cursor-pointer border-b border-slate-800/50 last:border-0">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800/50 flex flex-col items-center justify-center border border-slate-700/50 group-hover:border-blue-500/30 transition-colors">
                    <span className="text-2xl font-bold leading-none text-white">{news.date.day}</span>
                    <span className="text-xs font-medium uppercase mt-1 text-slate-500">{news.date.month}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {news.title}
                      </h3>
                      {news.isNew && (
                        <span className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 px-2 py-0.5 rounded text-xs font-bold border border-orange-500/30 flex-shrink-0 ml-2">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mb-3 line-clamp-2 leading-relaxed">
                      {news.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
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

          {/* 经验分享 Section */}
          <section>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">经验分享</h2>
                  <p className="text-slate-500 text-sm mt-0.5">前辈经验，助你避坑</p>
                </div>
              </div>
              <Button variant="ghost" className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl border border-transparent hover:border-emerald-500/20">
                查看更多 <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="bg-slate-900/30 rounded-2xl border border-slate-800/50 overflow-hidden backdrop-blur-sm">
              {mockExperiences.map((exp, index) => (
                <div key={index} className="p-6 flex items-center gap-6 hover:bg-slate-800/30 transition-all border-b border-slate-800/50 last:border-0 group cursor-pointer">
                  {/* Number Index */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl font-black text-slate-700 group-hover:text-blue-500/50 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate pr-4">
                      {exp.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-500/20">
                          {exp.author.slice(0, 1)}
                        </div>
                        <span className="font-medium text-slate-400">{exp.author}</span>
                      </div>
                      <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                      <span className="text-slate-600 truncate">{exp.role}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-all text-slate-600 group-hover:text-white border border-slate-700 group-hover:border-blue-500">
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
          <div className="bg-slate-800 text-white text-sm py-2 px-4 rounded-xl shadow-xl whitespace-nowrap relative border border-slate-700">
            有建议或问题？告诉我吧
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-800 border-r border-b border-slate-700 transform rotate-45"></div>
          </div>
        </div>

        {/* Button */}
        <button className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 z-50 border border-blue-400/20">
          <MessageSquarePlus className="w-6 h-6" />
        </button>
      </div>

      {/* Dark Footer */}
      <footer className="w-full border-t border-slate-800 py-12 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LogoIcon type="openmcp" className="text-blue-500 w-8 h-8" />
                <span className="font-bold text-white text-lg">银行帮</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                银行帮专注服务银行求职者，整合各大银行招聘信息、面经与薪酬情报，帮助你自信踏出职场第一步。
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-white">求职导航</h3>
              <ul className="space-y-2.5 text-sm">
                {["职位广场", "面经与攻略", "企业库", "薪酬洞察"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-slate-500 hover:text-blue-400 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-white">服务支持</h3>
              <ul className="space-y-2.5 text-sm">
                {["帮助中心", "关于我们", "隐私政策", "服务条款", "企业合作"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-slate-500 hover:text-blue-400 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-white">订阅求职情报</h3>
              <p className="text-sm text-slate-500">获取最新职位投递窗口、面试经验和校招攻略，领先一步拿到 Offer。</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="输入邮箱"
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder:text-slate-600 text-sm outline-none focus:border-blue-500/50 transition-colors"
                />
                <Button className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg">
                  订阅
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-slate-600">Copyright ©2025-2027 银行帮版权所有</p>
              <div className="text-xs text-slate-700 flex items-center gap-2">
                <Link href="#" className="hover:text-slate-500 transition-colors">
                  津ICP备2023007973号-1
                </Link>
                <span className="text-slate-800">|</span>
                <Link href="#" className="hover:text-slate-500 transition-colors">
                  津公网安备12011402001495号
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Mock Data
const mockNavigations = {
  hot: [
    { name: "中国银行招聘官网", desc: "官方直招", location: "全国", tag: "官方" },
    { name: "工商银行人才招聘", desc: "宇宙行校招", location: "全国", tag: "热门" },
    { name: "应届生求职网", desc: "专业校招平台", location: "聚合", tag: "综合" },
    { name: "牛客网", desc: "笔试面试题库", location: "社区", tag: "神器" },
    { name: "邮储银行招聘", desc: "六大行之一", location: "全国", tag: "国企" },
    { name: "中国农业银行", desc: "秋季校园招聘", location: "多地", tag: "热招" },
    { name: "智联招聘", desc: "综合招聘平台", location: "聚合", tag: "老牌" },
    { name: "前程无忧", desc: "海量职位信息", location: "聚合", tag: "全面" },
  ],
}

const mockNews = [
  {
    date: { day: "28", month: "NOV" },
    title: "中国工商银行2024年秋季校园招聘正式启动",
    description: "诚邀优秀学子加入，共创美好未来。本次招聘涵盖总行本部及全国各分行，提供多个岗位方向选择。",
    time: "2小时前",
    views: "520",
    isNew: true
  },
  {
    date: { day: "27", month: "NOV" },
    title: "中国建设银行2024年春季校园招聘简章发布",
    description: "建设银行诚挚邀请您的加入。我们将为您提供广阔的发展平台和具有竞争力的薪酬福利。",
    time: "昨天",
    views: "356",
    isNew: true
  },
  {
    date: { day: "26", month: "NOV" },
    title: "中国银行2024年管理培训生计划全面启动",
    description: "专门为培养未来银行家打造的专项人才培养计划，期待您的加入！",
    time: "3天前",
    views: "679",
    isNew: false
  },
  {
    date: { day: "25", month: "NOV" },
    title: "交通银行2024年金融科技校园招聘公告",
    description: "数字化转型关键时期，诚邀技术人才加入。提供具有竞争力的薪酬和完善的培训体系。",
    time: "4天前",
    views: "892",
    isNew: false
  },
  {
    date: { day: "24", month: "NOV" },
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
