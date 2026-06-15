const api = require("../../utils/api")
const router = require("../../utils/router")

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
        visibleTags: (item.tags || []).filter(Boolean).slice(0, 4)
      }))
      const latestJobs = (data.latestJobs || []).map((item) => ({
        ...item,
        title: item.title || "未命名职位",
        company: item.company || "未知公司",
        location: item.location || "地点未明确",
        companyType: item.companyType || "其他",
        displayTime: item.timeText || item.sourceUpdatedAt || item.createdAt || "近期",
        visibleTags: (item.tags || [item.session, item.industry]).filter(Boolean).slice(0, 3)
      }))
      const referrals = (data.referrals || []).map((item) => ({
        ...item,
        title: item.title || "未命名内推",
        publishDate: item.publishDate || "近期"
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
