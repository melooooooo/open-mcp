const api = require("../../utils/api")
const router = require("../../utils/router")

const CATEGORIES = [
  { label: "全部", value: "all" },
  { label: "银行", value: "bank", industry: "bank" },
  { label: "券商", value: "securities", industry: "securities" },
  { label: "基金", value: "fund", industry: "fund" },
  { label: "其他金融机构", value: "other-financial", industryGroup: "other-financial" }
]

const INDUSTRY_LABELS = {
  bank: "银行",
  securities: "券商",
  fund: "基金",
  insurance: "保险",
  technology: "金融科技",
  operator: "运营商",
  other: "其他金融机构"
}

const ARTICLE_TYPE_LABELS = {
  guide: "攻略",
  interview: "面试",
  review: "点评"
}

function buildVisibleTags(item) {
  const tags = (Array.isArray(item.tags) ? item.tags : [])
    .filter(Boolean)
    .map((tag) => INDUSTRY_LABELS[tag] || tag)
  const fallbacks = [INDUSTRY_LABELS[item.industry], ARTICLE_TYPE_LABELS[item.articleType]].filter(Boolean)
  return Array.from(new Set(tags.concat(fallbacks))).slice(0, 4)
}

Page({
  data: {
    loading: true,
    loadingMore: false,
    error: "",
    activeCategory: "all",
    page: 1,
    pageSize: 12,
    total: 0,
    categories: CATEGORIES,
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
      const category = CATEGORIES.find((item) => item.value === this.data.activeCategory) || CATEGORIES[0]
      const data = await api.get("/experiences", {
        page,
        pageSize: this.data.pageSize,
        industry: category.industry || "",
        industryGroup: category.industryGroup || ""
      })
      const list = (data.items || []).map((item) => ({
        ...item,
        title: item.title || "未命名经验",
        authorName: item.authorName || "匿名",
        authorInitial: (item.authorName || "匿").slice(0, 1),
        visibleTags: buildVisibleTags(item)
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
