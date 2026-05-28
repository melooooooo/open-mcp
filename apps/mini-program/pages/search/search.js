const api = require("../../utils/api")
const router = require("../../utils/router")

Page({
  data: {
    q: "",
    loading: false,
    searched: false,
    hotSearches: ["工商银行", "建设银行", "管培生", "金融科技", "数据分析", "客户经理"],
    jobListings: [],
    experiences: [],
    jobSites: []
  },

  onLoad(options) {
    const q = options.q ? decodeURIComponent(options.q) : ""
    this.setData({ q })
    if (q) this.search()
  },

  onInput(event) {
    this.setData({ q: event.detail.value })
  },

  useHot(event) {
    this.setData({ q: event.currentTarget.dataset.q })
    this.search()
  },

  async search() {
    const q = this.data.q.trim()
    if (!q) return
    this.setData({ loading: true, searched: true })
    try {
      const data = await api.get("/search", { q })
      this.setData({
        jobListings: data.jobListings || [],
        experiences: data.experiences || [],
        jobSites: data.jobSites || [],
        loading: false
      })
    } catch (error) {
      wx.showToast({ title: error.message || "搜索失败", icon: "none" })
      this.setData({ loading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  openJob(event) {
    router.openJob(event.currentTarget.dataset.id)
  },

  openExperience(event) {
    router.openExperience(event.currentTarget.dataset.slug)
  },

  copySite(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({ data: url })
  }
})

