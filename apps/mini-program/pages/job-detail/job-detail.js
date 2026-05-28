const api = require("../../utils/api")

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    job: null,
    tags: [],
    detailLines: []
  },

  onLoad(options) {
    this.setData({ id: options.id || "" })
    this.loadDetail()
  },

  async loadDetail() {
    if (!this.data.id) {
      this.setData({ loading: false, error: "缺少职位 ID" })
      return
    }
    this.setData({ loading: true, error: "" })
    try {
      const job = await api.get(`/job-listings/${this.data.id}`)
      const detailText = [job.remark, job.majorRequirement, job.announcementSource].filter(Boolean).join("\n")
      job.companyInitial = (job.company || "企").slice(0, 1)
      this.setData({
        job,
        tags: (job.tags || []).filter(Boolean).slice(0, 5),
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
    const next = !this.data.job.isCollected
    this.setData({ "job.isCollected": next })
    try {
      const data = await api.post(`/job-listings/${this.data.id}/collection`)
      this.setData({ "job.isCollected": data.isCollected })
      wx.showToast({ title: data.isCollected ? "已收藏" : "已取消", icon: "success" })
    } catch (error) {
      this.setData({ "job.isCollected": !next })
      wx.showToast({ title: error.message || "请先登录", icon: "none" })
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
