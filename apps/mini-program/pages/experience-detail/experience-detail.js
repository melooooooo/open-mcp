const api = require("../../utils/api")
const auth = require("../../utils/auth")

function formatDate(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

Page({
  data: {
    slug: "",
    loading: true,
    error: "",
    isLoggedIn: false,
    exp: null,
    tags: [],
    relatedLinks: [],
    coverFailed: false
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
        summary: exp.summary || "",
        contentHtml: exp.contentHtml || "",
        publishDate: formatDate(exp.publishTime)
      }
      this.setData({
        exp: safeExp,
        tags: (safeExp.tags || []).slice(0, 6),
        relatedLinks: Array.isArray(exp.relatedLinks) ? exp.relatedLinks : [],
        coverFailed: false,
        loading: false
      })
    } catch (error) {
      this.setData({ error: error.message || "加载失败", loading: false })
    }
  },

  retryLoad() {
    this.loadDetail()
  },

  handleCoverError() {
    this.setData({ coverFailed: true })
  },

  copyRelatedLink(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: "链接已复制", icon: "success" })
      },
      fail() {
        wx.showToast({ title: "复制失败，请稍后重试", icon: "none" })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  },

  async toggleLike() {
    if (!this.data.exp) return

    const session = await auth.ensureSilentSession()
    if (!session) {
      wx.showToast({ title: "网络异常，请稍后重试", icon: "none" })
      return
    }

    const next = !this.data.exp.isLiked
    this.setData({
      "exp.isLiked": next,
      "exp.likeCount": Math.max((this.data.exp.likeCount || 0) + (next ? 1 : -1), 0)
    })
    try {
      const data = await api.post(`/experiences/${encodeURIComponent(this.data.slug)}/like`, {}, { requireSession: true })
      auth.markActivatedLocally()
      this.setData({ "exp.isLiked": data.isLiked, isLoggedIn: auth.isLoggedIn() })
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
