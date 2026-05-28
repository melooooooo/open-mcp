const api = require("../../utils/api")
const router = require("../../utils/router")

Page({
  data: {
    loading: true,
    loadingMore: false,
    error: "",
    activeCategory: "全部",
    page: 1,
    pageSize: 12,
    total: 0,
    categories: ["全部", "银行", "券商", "保险", "金融科技", "面试", "笔试"],
    experiences: []
  },

  onLoad() {
    this.loadExperiences(true)
  },

  onPullDownRefresh() {
    this.loadExperiences(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.experiences.length < this.data.total && !this.data.loadingMore) {
      this.loadExperiences(false)
    }
  },

  changeCategory(event) {
    this.setData({ activeCategory: event.currentTarget.dataset.value })
    this.loadExperiences(true)
  },

  async loadExperiences(reset) {
    const page = reset ? 1 : this.data.page + 1
    this.setData(reset ? { loading: true, error: "", page: 1 } : { loadingMore: true, error: "" })
    try {
      const tag = this.data.activeCategory === "全部" ? "" : this.data.activeCategory
      const data = await api.get("/experiences", { page, pageSize: this.data.pageSize, tag })
      const list = (data.items || []).map((item) => ({
        ...item,
        authorInitial: (item.authorName || "匿").slice(0, 1),
        visibleTags: (item.tags || []).slice(0, 4)
      }))
      this.setData({
        experiences: reset ? list : this.data.experiences.concat(list),
        total: data.total || 0,
        page,
        loading: false,
        loadingMore: false
      })
    } catch (error) {
      this.setData({ error: error.message || "加载失败", loading: false, loadingMore: false })
    }
  },

  openExperience(event) {
    router.openExperience(event.currentTarget.dataset.slug)
  },

  switchTab(event) {
    router.switchMain(event.currentTarget.dataset.page)
  }
})

