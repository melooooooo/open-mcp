const api = require("../../utils/api")

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
    exp: null,
    tags: [],
    contentLines: []
  },

  onLoad(options) {
    this.setData({ slug: decodeURIComponent(options.slug || "") })
    this.loadDetail()
  },

  async loadDetail() {
    this.setData({ loading: true, error: "" })
    try {
      const exp = await api.get(`/experiences/${encodeURIComponent(this.data.slug)}`)
      this.setData({
        exp,
        tags: (exp.tags || []).slice(0, 6),
        contentLines: stripMarkdown(exp.content || exp.summary),
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
      wx.showToast({ title: error.message || "请先登录", icon: "none" })
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

