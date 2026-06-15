const api = require("../../utils/api")
const auth = require("../../utils/auth")

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    isLoggedIn: false,
    referral: null,
    contentLines: []
  },

  onLoad(options) {
    this.setData({ id: options.id || "", isLoggedIn: auth.isLoggedIn() })
    this.loadDetail()
  },

  onShow() {
    this.setData({ isLoggedIn: auth.isLoggedIn() })
  },

  async loadDetail() {
    try {
      const referral = await api.get(`/referrals/${this.data.id}`)
      const safeReferral = {
        ...referral,
        title: referral.title || "未命名内推",
        publishDate: referral.publishDate || "近期",
        content: referral.content || referral.companyName || "暂无详细内容"
      }
      this.setData({
        referral: safeReferral,
        contentLines: safeReferral.content.split(/\n+/).map((item) => item.trim()).filter(Boolean),
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
    if (!this.data.referral) return
    if (!auth.isLoggedIn()) {
      const authState = await auth.ensureLoggedIn({ reason: "收藏内推" })
      if (!authState) return
      this.setData({ isLoggedIn: true })
      await this.loadDetail()
      if (!this.data.referral || this.data.referral.isCollected) {
        wx.showToast({ title: "已收藏", icon: "success" })
        return
      }
    }

    const next = !this.data.referral.isCollected
    this.setData({ "referral.isCollected": next })
    try {
      const data = await api.post(`/referrals/${this.data.id}/collection`)
      this.setData({ "referral.isCollected": data.isCollected })
    } catch (error) {
      this.setData({ "referral.isCollected": !next })
      wx.showToast({ title: error.message || "操作失败", icon: "none" })
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
