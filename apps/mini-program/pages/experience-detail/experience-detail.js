const api = require("../../utils/api")
const auth = require("../../utils/auth")

function stripMarkdown(value) {
  return (value || "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[`*_>#-]/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

Page({
  data: {
    slug: "",
    loading: true,
    error: "",
    isLoggedIn: false,
    exp: null,
    tags: [],
    contentLines: []
  },

  onLoad(options) {
    this.setData({ slug: decodeURIComponent(options.slug || ""), isLoggedIn: auth.isLoggedIn() })
    this.loadDetail()
  },

  onShow() {
    this.setData({ isLoggedIn: auth.isLoggedIn() })
  },

  async loadDetail() {
    this.setData({ loading: true, error: "" })
    try {
      const exp = await api.get(`/experiences/${encodeURIComponent(this.data.slug)}`)
      const safeExp = {
        ...exp,
        title: exp.title || "未命名经验",
        authorName: exp.authorName || "匿名",
        summary: exp.summary || "暂无摘要"
      }
      this.setData({
        exp: safeExp,
        tags: (safeExp.tags || []).slice(0, 6),
        contentLines: stripMarkdown(safeExp.content || safeExp.summary),
        loading: false
      })
    } catch (error) {
      this.setData({ error: error.message || "加载失败", loading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  async toggleLike() {
    if (!this.data.exp) return
    if (!auth.isLoggedIn()) {
      const authState = await auth.ensureLoggedIn({ reason: "点赞经验" })
      if (!authState) return
      this.setData({ isLoggedIn: true })
      await this.loadDetail()
      if (!this.data.exp || this.data.exp.isLiked) {
        wx.showToast({ title: "已点赞", icon: "success" })
        return
      }
    }

    const next = !this.data.exp.isLiked
    this.setData({
      "exp.isLiked": next,
      "exp.likeCount": Math.max((this.data.exp.likeCount || 0) + (next ? 1 : -1), 0)
    })
    try {
      const data = await api.post(`/experiences/${encodeURIComponent(this.data.slug)}/like`)
      this.setData({ "exp.isLiked": data.isLiked })
    } catch (error) {
      this.setData({
        "exp.isLiked": !next,
        "exp.likeCount": Math.max((this.data.exp.likeCount || 0) + (next ? -1 : 1), 0)
      })
      wx.showToast({ title: error.message || "操作失败", icon: "none" })
    }
  },

  onShareAppMessage() {
    const exp = this.data.exp || {}
    return {
      title: exp.title || "银行帮经验分享",
      path: `/pages/experience-detail/experience-detail?slug=${encodeURIComponent(this.data.slug)}`
    }
  }
})
