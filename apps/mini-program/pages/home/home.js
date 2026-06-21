const api = require("../../utils/api")
const router = require("../../utils/router")

const TYPE_COLORS = ["blue", "green", "orange", "cyan"]
const EXPERIENCE_TYPE_LABELS = {
  interview: "面经",
  guide: "攻略",
  review: "点评"
}

function pickColor(company) {
  let hash = 0
  for (let i = 0; i < company.length; i++) hash = (hash * 31 + company.charCodeAt(i)) | 0
  return TYPE_COLORS[Math.abs(hash) % TYPE_COLORS.length]
}

function summarizeLocation(location) {
  const locations = String(location || "")
    .split(/\s*[、/,，]\s*/)
    .filter(Boolean)
  return locations.slice(0, 3).join(" · ") || "多地"
}

function uniqueTags(values, limit = 3) {
  return [...new Set(values.filter(Boolean))].slice(0, limit)
}

Page({
  data: {
    loading: true,
    error: "",
    jobSites: [],
    experiences: [],
    latestJobs: [],
    referrals: []
  },

  onLoad() {
    this.loadHome()
  },

  onPullDownRefresh() {
    this.loadHome().finally(() => wx.stopPullDownRefresh())
  },

  async loadHome() {
    this.setData({ loading: true, error: "" })
    try {
      const data = await api.get("/home")
      const experiences = (data.experiences || []).map((item) => ({
        ...item,
        title: item.title || "未命名经验",
        authorName: item.authorName || "匿名",
        authorInitial: (item.authorName || "匿").slice(0, 1),
        typeLabel: EXPERIENCE_TYPE_LABELS[item.articleType] || "经验",
        typeColor: pickColor(item.organizationName || item.title || "经验"),
        visibleTags: uniqueTags([...(item.tags || []), item.industry], 3)
      }))
      const latestJobs = (data.latestJobs || []).map((item) => ({
        ...item,
        title: item.title || "未命名职位",
        company: item.company || "未知公司",
        location: item.location || "地点未明确",
        companyType: item.companyType || "其他",
        industry: item.industry || "",
        sessionTag: item.session || item.batch || "",
        locationSummary: summarizeLocation(item.location),
        typeColor: pickColor(item.company || "未知公司"),
        displayTime: item.timeText || item.sourceUpdatedAt || item.createdAt || "近期"
      }))
      const referrals = (data.referrals || []).slice(0, 4).map((item) => ({
        ...item,
        title: item.title || "未命名内推",
        publishDate: item.publishDate || "近期",
        typeColor: pickColor(item.companyName || item.title || "内推"),
        visibleTags: uniqueTags([item.companyName, item.source], 2)
      }))
      this.setData({
        jobSites: data.jobSites || [],
        experiences,
        latestJobs,
        referrals,
        loading: false
      })
    } catch (error) {
      this.setData({ error: error.message || "加载失败", loading: false })
    }
  },

  goSearch(event) {
    const q = event.currentTarget.dataset.q || ""
    wx.navigateTo({ url: `/pages/search/search?q=${encodeURIComponent(q)}` })
  },

  switchTab(event) {
    router.switchMain(event.currentTarget.dataset.page)
  },

  openJob(event) {
    router.openJob(event.currentTarget.dataset.id)
  },

  openExperience(event) {
    router.openExperience(event.currentTarget.dataset.slug)
  },

  openReferral(event) {
    router.openReferral(event.currentTarget.dataset.id)
  },

  copyUrl(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({ data: url })
  }
})
