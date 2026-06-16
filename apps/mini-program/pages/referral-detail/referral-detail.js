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

    const session = await auth.ensureSilentSession()
    if (!session) {
      wx.showToast({ title: "网络异常，请稍后重试", icon: "none" })
      return
    }

    const next = !this.data.referral.isCollected
    this.setData({ "referral.isCollected": next })
    try {
      const data = await api.post(`/referrals/${this.data.id}/collection`, {}, { requireSession: true })
      auth.markActivatedLocally()
      this.setData({ "referral.isCollected": data.isCollected, isLoggedIn: auth.isLoggedIn() })
      wx.showToast({ title: data.isCollected ? "已收藏" : "已取消", icon: "success" })
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
