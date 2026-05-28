const api = require("../../utils/api")

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    referral: null,
    contentLines: []
  },

  onLoad(options) {
    this.setData({ id: options.id || "" })
    this.loadDetail()
  },

  async loadDetail() {
    try {
      const referral = await api.get(`/referrals/${this.data.id}`)
      this.setData({
        referral,
        contentLines: (referral.content || "暂无详细内容").split(/\n+/).map((item) => item.trim()).filter(Boolean),
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
    const next = !this.data.referral.isCollected
    this.setData({ "referral.isCollected": next })
    try {
      const data = await api.post(`/referrals/${this.data.id}/collection`)
      this.setData({ "referral.isCollected": data.isCollected })
    } catch (error) {
      this.setData({ "referral.isCollected": !next })
      wx.showToast({ title: error.message || "请先登录", icon: "none" })
    }
  },

  copyLink() {
    const link = this.data.referral && this.data.referral.link
    if (!link) {
      wx.showToast({ title: "暂无外链", icon: "none" })
      return
    }
    wx.setClipboardData({ data: link })
  }
})

