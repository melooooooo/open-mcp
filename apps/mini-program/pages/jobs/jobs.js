const api = require("../../utils/api")
const router = require("../../utils/router")

Page({
  data: {
    loading: true,
    loadingMore: false,
    error: "",
    query: "",
    activeType: "全部",
    page: 1,
    pageSize: 20,
    total: 0,
    jobs: [],
    filters: ["全部", "校招", "社招", "实习"]
  },

  onLoad(options) {
    if (options.q) this.setData({ query: decodeURIComponent(options.q) })
    this.loadJobs(true)
  },

  onPullDownRefresh() {
    this.loadJobs(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.jobs.length < this.data.total && !this.data.loadingMore) {
      this.loadJobs(false)
    }
  },

  onInput(event) {
    this.setData({ query: event.detail.value })
  },

  submitSearch() {
    this.loadJobs(true)
  },

  changeFilter(event) {
    const activeType = event.currentTarget.dataset.value
    this.setData({ activeType })
    this.loadJobs(true)
  },

  async loadJobs(reset) {
    const page = reset ? 1 : this.data.page + 1
    this.setData(reset ? { loading: true, error: "", page: 1 } : { loadingMore: true, error: "" })
    try {
      const params = {
        page,
        pageSize: this.data.pageSize,
        query: this.data.query,
        session: this.data.activeType === "校招" ? "2026届" : "",
        companyType: ""
      }
      const data = await api.get("/job-listings", params)
      const mapped = (data.items || []).map((job) => ({
        ...job,
        title: job.title || "未命名职位",
        company: job.company || "未知公司",
        location: job.location || "地点未明确",
        companyType: job.companyType || "其他",
        displayTime: job.timeText || job.sourceUpdatedAt || job.createdAt || "近期",
        visibleTags: (job.tags || [job.session, job.industry]).filter(Boolean).slice(0, 3)
      }))
      this.setData({
        jobs: reset ? mapped : this.data.jobs.concat(mapped),
        total: data.total || 0,
        page,
        loading: false,
        loadingMore: false
      })
    } catch (error) {
      this.setData({ error: error.message || "加载失败", loading: false, loadingMore: false })
    }
  },

  openJob(event) {
    router.openJob(event.currentTarget.dataset.id)
  },

  switchTab(event) {
    router.switchMain(event.currentTarget.dataset.page)
  }
})
