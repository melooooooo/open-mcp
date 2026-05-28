const api = require("../../utils/api")
const router = require("../../utils/router")

Page({
  data: {
    loading: true,
    loadingMore: false,
    page: 1,
    pageSize: 30,
    total: 0,
    referrals: [],
    error: ""
  },

  onLoad() {
    this.loadReferrals(true)
  },

  onPullDownRefresh() {
    this.loadReferrals(true).finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.referrals.length < this.data.total && !this.data.loadingMore) {
      this.loadReferrals(false)
    }
  },

  async loadReferrals(reset) {
    const page = reset ? 1 : this.data.page + 1
    this.setData(reset ? { loading: true, error: "" } : { loadingMore: true, error: "" })
    try {
      const data = await api.get("/referrals", { page, pageSize: this.data.pageSize })
      this.setData({
        referrals: reset ? data.items || [] : this.data.referrals.concat(data.items || []),
        total: data.total || 0,
        page,
        loading: false,
        loadingMore: false
      })
    } catch (error) {
      this.setData({ error: error.message || "加载失败", loading: false, loadingMore: false })
    }
  },

  openReferral(event) {
    router.openReferral(event.currentTarget.dataset.id)
  },

  switchTab(event) {
    router.switchMain(event.currentTarget.dataset.page)
  }
})

