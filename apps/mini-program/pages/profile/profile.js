const api = require("../../utils/api")
const router = require("../../utils/router")

Page({
  data: {
    loading: true,
    user: null,
    stats: { collections: 0, likes: 0, history: 0 },
    collections: [],
    likes: []
  },

  onLoad() {
    this.loadMe()
  },

  onPullDownRefresh() {
    this.loadMe().finally(() => wx.stopPullDownRefresh())
  },

  async loadMe() {
    this.setData({ loading: true })
    try {
      const data = await api.get("/me")
      const fallbackUser = {
        name: "同学_A1B2",
        address: "北京",
        image: "",
        roleLabel: "应届生",
        initial: "同"
      }
      const user = data.user || fallbackUser
      user.initial = (user.name || "同").slice(0, 1)
      this.setData({
        user,
        stats: data.stats || this.data.stats,
        collections: data.collections || [],
        likes: data.likes || [],
        loading: false
      })
    } catch (error) {
      this.setData({ loading: false })
    }
  },

  switchTab(event) {
    router.switchMain(event.currentTarget.dataset.page)
  },

  goJobs() {
    router.switchMain("jobs")
  },

  goExperiences() {
    router.switchMain("experiences")
  },

  showResumeTodo() {
    wx.showToast({ title: "简历功能建设中", icon: "none" })
  },

  showFeedback() {
    wx.showModal({
      title: "意见反馈",
      editable: true,
      placeholderText: "请描述你的问题或建议",
      success: async (res) => {
        if (!res.confirm || !res.content) return
        try {
          await api.post("/feedbacks", {
            type: "improvement",
            title: "小程序反馈",
            description: res.content
          })
          wx.showToast({ title: "已提交", icon: "success" })
        } catch (error) {
          wx.showToast({ title: error.message || "提交失败", icon: "none" })
        }
      }
    })
  }
})
