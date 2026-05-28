const api = require("../../utils/api")
const router = require("../../utils/router")

Page({
  data: {
    loading: true,
    error: "",
    hotSearches: ["工商银行", "建设银行", "管培生", "金融科技", "数据分析", "客户经理"],
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
        authorInitial: (item.authorName || "匿").slice(0, 1),
        visibleTags: (item.tags || []).slice(0, 4)
      }))
      const latestJobs = (data.latestJobs || []).map((item) => ({
        ...item,
        displayTime: item.timeText || item.sourceUpdatedAt || item.createdAt || "近期",
        visibleTags: (item.tags || [item.session, item.industry]).filter(Boolean).slice(0, 3)
      }))
      this.setData({
        hotSearches: data.hotSearches || this.data.hotSearches,
        jobSites: data.jobSites || [],
        experiences,
        latestJobs,
        referrals: data.referrals || [],
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
