const api = require("../../utils/api")
const auth = require("../../utils/auth")

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    isLoggedIn: false,
    job: null,
    tags: [],
    detailLines: []
  },

  onLoad(options) {
    this.setData({ id: options.id || "", isLoggedIn: auth.isLoggedIn() })
    this.loadDetail()
  },

  onShow() {
    this.setData({ isLoggedIn: auth.isLoggedIn() })
  },

  async loadDetail() {
    if (!this.data.id) {
      this.setData({ loading: false, error: "缺少职位 ID" })
      return
    }
    this.setData({ loading: true, error: "" })
    try {
      const job = await api.get(`/job-listings/${this.data.id}`)
      const safeJob = {
        ...job,
        title: job.title || "未命名职位",
        company: job.company || "未知公司",
        location: job.location || "地点未明确",
        companyType: job.companyType || "其他",
        industry: job.industry || "行业未明确",
        applicationMethod: job.applicationMethod || job.announcementSource || ""
      }
      const detailText = [safeJob.remark, safeJob.majorRequirement, safeJob.announcementSource].filter(Boolean).join("\n")
      safeJob.companyInitial = (safeJob.company || "企").slice(0, 1)
      this.setData({
        job: safeJob,
        tags: (safeJob.tags || []).filter(Boolean).slice(0, 5),
        detailLines: detailText ? detailText.split(/\n+/).filter(Boolean) : [],
        loading: false
      })
    } catch (error) {
      this.setData({ error: error.message || "加载失败", loading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  async toggleCollect() {
    if (!this.data.job) return

    const session = await auth.ensureSilentSession()
    if (!session) {
      wx.showToast({ title: "网络异常，请稍后重试", icon: "none" })
      return
    }

    const next = !this.data.job.isCollected
    this.setData({ "job.isCollected": next })
    try {
      const data = await api.post(`/job-listings/${this.data.id}/collection`, {}, { requireSession: true })
      auth.markActivatedLocally()
      this.setData({ "job.isCollected": data.isCollected, isLoggedIn: auth.isLoggedIn() })
      wx.showToast({ title: data.isCollected ? "已收藏" : "已取消", icon: "success" })
    } catch (error) {
      this.setData({ "job.isCollected": !next })
      wx.showToast({ title: error.message || "操作失败", icon: "none" })
    }
  },

  copyApply() {
    const text = this.data.job && this.data.job.applicationMethod
    if (!text) {
      wx.showToast({ title: "暂无申请方式", icon: "none" })
      return
    }
    wx.setClipboardData({ data: text })
  },

  onShareAppMessage() {
    const job = this.data.job || {}
    return {
      title: job.title || "银行帮职位",
      path: `/pages/job-detail/job-detail?id=${this.data.id}`
    }
  }
})
