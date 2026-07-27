const api = require("../../utils/api")
const router = require("../../utils/router")

Page({
  data: {
    q: "",
    loading: false,
    searched: false,
    /* [个人主体] 原热搜: ["工商银行", "建设银行", "管培生", "金融科技", "数据分析", "客户经理"] */
    hotSearches: ["面经", "春招", "秋招", "金融科技", "管培生", "银行笔试"],
    /* [个人主体] 隐藏招聘/导航搜索数据
    jobListings: [],
    jobSites: [],
    */
    experiences: []
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
        /* [个人主体] 隐藏招聘搜索结果
        jobListings: (data.jobListings || []).map((job) => ({
          ...job,
          title: job.title || "未命名职位",
          company: job.company || "未知公司",
          location: job.location || "地点未明确"
        })),
        */
        experiences: (data.experiences || []).map((exp) => ({
          ...exp,
          title: exp.title || "未命名经验",
          authorName: exp.authorName || "匿名",
          organizationName: exp.organizationName || "经验分享"
        })),
        /* [个人主体] 隐藏求职导航搜索结果
        jobSites: (data.jobSites || []).map((site) => ({
          ...site,
          title: site.title || "未命名来源",
          description: site.description || "求职信息来源"
        })),
        */
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

  /* [个人主体] 隐藏职位详情跳转
  openJob(event) {
    router.openJob(event.currentTarget.dataset.id)
  },
  */

  openExperience(event) {
    router.openExperience(event.currentTarget.dataset.slug)
  },

  /* [个人主体] 隐藏求职导航复制
  copySite(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({ data: url })
  }
  */
})
