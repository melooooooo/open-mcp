const api = require("../../utils/api")
const auth = require("../../utils/auth")
const router = require("../../utils/router")

function formatActionTime(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function mapCollection(entry) {
  const item = entry.item || {}
  const type = entry.type === "referral" ? "referral" : "job"
  return {
    ...entry,
    type,
    key: `${type}-${item.id || "unknown"}`,
    actionTime: formatActionTime(entry.collectedAt),
    item: {
      ...item,
      title: item.title || (type === "referral" ? "未命名内推" : "未命名职位"),
      company: item.company || item.companyName || "未知公司",
      location: item.location || "地点未明确",
      visibleTags: (item.tags || [item.session, item.companyType, item.jobType]).filter(Boolean).slice(0, 3)
    }
  }
}

function mapLike(entry) {
  const item = entry.item || {}
  return {
    ...entry,
    key: `like-${item.id || item.slug || "unknown"}`,
    actionTime: formatActionTime(entry.likedAt),
    item: {
      ...item,
      title: item.title || "未命名经验",
      authorName: item.authorName || "匿名",
      visibleTags: (item.tags || []).filter(Boolean).slice(0, 3)
    }
  }
}

Page({
  data: {
    activeTab: "collections",
    loading: true,
    error: "",
    collections: [],
    likes: []
  },

  onLoad(options) {
    this.setData({ activeTab: options.tab === "likes" ? "likes" : "collections" })
    this.loadContent()
  },

  onShow() {
    if (this.hasLoaded) this.loadContent({ silent: true })
  },

  onPullDownRefresh() {
    this.loadContent({ silent: true }).finally(() => wx.stopPullDownRefresh())
  },

  async loadContent(options = {}) {
    if (!auth.isLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" })
      setTimeout(() => router.switchMain("profile"), 500)
      return
    }

    if (!options.silent) this.setData({ loading: true, error: "" })
    try {
      const data = await api.get("/me")
      this.setData({
        collections: (data.collections || []).map(mapCollection),
        likes: (data.likes || []).map(mapLike),
        loading: false,
        error: ""
      })
      this.hasLoaded = true
    } catch (error) {
      this.setData({
        loading: false,
        error: error.message || "加载失败，请稍后重试"
      })
    }
  },

  changeTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  openCollection(event) {
    const { id, type } = event.currentTarget.dataset
    if (type === "referral") {
      router.openReferral(id)
      return
    }
    router.openJob(id)
  },

  openLike(event) {
    router.openExperience(event.currentTarget.dataset.slug)
  },

  retry() {
    this.loadContent()
  },

  goBrowse() {
    router.switchMain(this.data.activeTab === "likes" ? "experiences" : "jobs")
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    router.switchMain("profile")
  }
})
