const api = require("../../utils/api")
const router = require("../../utils/router")

const TYPE_COLORS = ["blue", "green", "orange", "cyan"]
const JOB_TYPE_PARAMS = {
  "校招": "campus",
  "实习": "intern"
}
const INDUSTRY_PARAMS = {
  "金融业": "金融业",
  "IT/互联网/游戏": "IT/互联网/游戏",
  "通信/电子/半导体": "通信/电子/半导体",
  "教育/培训/科研": "教育/培训/科研",
  "其他": "other"
}

function pickColor(company) {
  let hash = 0
  for (let i = 0; i < company.length; i++) hash = (hash * 31 + company.charCodeAt(i)) | 0
  return TYPE_COLORS[Math.abs(hash) % TYPE_COLORS.length]
}

function groupJobsByCompany(jobs) {
  const map = new Map()
  for (const job of jobs) {
    const key = job.company
    if (!map.has(key)) {
      map.set(key, {
        company: job.company,
        companyType: job.companyType,
        industry: job.industry || "",
        location: job.location,
        companyInitial: (job.company || "企").slice(0, 1),
        positions: [],
        latestTime: job.displayTime
      })
    }
    const group = map.get(key)
    group.positions.push({
      id: job.id,
      title: job.title,
      location: job.location,
      displayTime: job.displayTime,
      visibleTags: job.visibleTags,
      degreeRequirement: job.degreeRequirement || "",
      session: job.session || "",
      applicationMethod: job.applicationMethod || "",
      announcementSource: job.announcementSource || "",
      remark: job.remark || "",
      majorRequirement: job.majorRequirement || "",
      deadline: job.deadline || "",
      industry: job.industry || "",
      companyType: job.companyType || "",
      batch: job.batch || ""
    })
  }

  const groups = Array.from(map.values())
  for (const group of groups) {
    group.positionCount = group.positions.length
    group.previewPositions = group.positions
      .slice(0, 3)
      .map((p) => p.title)
      .join(" · ")
    const locations = [...new Set(group.positions.map((p) => p.location))].filter(
      (l) => l && l !== "地点未明确"
    )
    group.locationSummary = locations.slice(0, 3).join(" · ") || "多地"
    group.batches = [...new Set(group.positions.map((p) => p.batch))]
      .filter(Boolean)
      .slice(0, 2)
    group.typeColor = pickColor(group.company)
    group.firstJobId = group.positions[0] ? group.positions[0].id : ""
  }

  return groups
}

Page({
  data: {
    loading: true,
    loadingMore: false,
    error: "",
    query: "",
    activeType: "全部",
    activeIndustry: "全部",
    page: 1,
    pageSize: 20,
    total: 0,
    jobs: [],
    groups: [],
    filters: ["全部", "校招", "实习"],
    industryFilters: [
      "全部",
      "金融业",
      "IT/互联网/游戏",
      "通信/电子/半导体",
      "教育/培训/科研",
      "其他"
    ]
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
    this.setData({ activeType }, () => this.loadJobs(true))
  },

  changeIndustryFilter(event) {
    const activeIndustry = event.currentTarget.dataset.value
    this.setData({ activeIndustry }, () => this.loadJobs(true))
  },

  async loadJobs(reset) {
    const page = reset ? 1 : this.data.page + 1
    this.setData(reset ? { loading: true, error: "", page: 1 } : { loadingMore: true, error: "" })
    try {
      const params = {
        page,
        pageSize: this.data.pageSize,
        query: this.data.query,
        jobType: JOB_TYPE_PARAMS[this.data.activeType] || "",
        industry: INDUSTRY_PARAMS[this.data.activeIndustry] || "",
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
      const allJobs = reset ? mapped : this.data.jobs.concat(mapped)
      const groups = groupJobsByCompany(allJobs)
      this.setData({
        jobs: allJobs,
        groups,
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
