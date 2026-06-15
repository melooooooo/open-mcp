const api = require("../../utils/api")
const auth = require("../../utils/auth")
const router = require("../../utils/router")

const visitorUser = {
  name: "同学",
  address: "游客模式",
  image: "",
  roleLabel: "公测版",
  initial: "同"
}

function getInitial(user) {
  return ((user && user.name) || "同").slice(0, 1)
}

function createProfileForm(user) {
  return {
    name: (user && user.name) || "",
    image: (user && user.image) || "",
    avatarLocalPath: "",
    gender: (user && user.gender) || "",
    address: (user && user.address) || "",
    contactPhone: (user && user.contactPhone) || ""
  }
}

Page({
  data: {
    loading: false,
    savingProfile: false,
    isLoggedIn: false,
    isProfileIncomplete: false,
    showProfileEditor: false,
    user: visitorUser,
    profileForm: createProfileForm(visitorUser),
    stats: { collections: 0, likes: 0, history: 0 }
  },

  onLoad() {
    this.loadMe()
  },

  onShow() {
    if (auth.isLoggedIn()) {
      this.loadMe()
    } else {
      this.setData({
        loading: false,
        isLoggedIn: false,
        isProfileIncomplete: false,
        showProfileEditor: false,
        user: visitorUser,
        profileForm: createProfileForm(visitorUser),
        savingProfile: false
      })
    }
  },

  onPullDownRefresh() {
    this.loadMe().finally(() => wx.stopPullDownRefresh())
  },

  async loadMe() {
    if (!auth.isLoggedIn()) {
      this.setData({
        loading: false,
        isLoggedIn: false,
        isProfileIncomplete: false,
        showProfileEditor: false,
        user: visitorUser,
        profileForm: createProfileForm(visitorUser),
        savingProfile: false,
        stats: { collections: 0, likes: 0, history: 0 }
      })
      return
    }

    this.setData({ loading: true, isLoggedIn: true })
    try {
      const data = await api.get("/me")
      const storedUser = (auth.getAuthState() || {}).user || {}
      const user = data.user || storedUser || visitorUser
      user.initial = getInitial(user)
      const isProfileIncomplete = Boolean(user.id && !user.profileCompletedAt)
      this.setData({
        user,
        stats: data.stats || this.data.stats,
        isLoggedIn: true,
        isProfileIncomplete,
        showProfileEditor: isProfileIncomplete || this.data.showProfileEditor,
        profileForm: createProfileForm(user),
        loading: false
      })
    } catch (error) {
      if (!auth.isLoggedIn()) {
        this.setData({
          loading: false,
          isLoggedIn: false,
          isProfileIncomplete: false,
          showProfileEditor: false,
          user: visitorUser,
          profileForm: createProfileForm(visitorUser),
          stats: { collections: 0, likes: 0, history: 0 }
        })
        return
      }
      this.setData({ loading: false })
      wx.showToast({ title: error.message || "加载用户失败", icon: "none" })
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

  async handleWechatLogin() {
    this.setData({ loading: true })
    try {
      await auth.loginWithWechat()
      await this.loadMe()
      wx.showToast({ title: "登录成功", icon: "success" })
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({ title: error.message || "登录失败", icon: "none" })
    }
  },

  showProfileEditor() {
    this.setData({ showProfileEditor: true })
  },

  handleChooseAvatar(event) {
    const avatarUrl = event.detail && event.detail.avatarUrl
    if (!avatarUrl) return
    this.setData({
      "profileForm.image": avatarUrl,
      "profileForm.avatarLocalPath": avatarUrl
    })
  },

  handleNameInput(event) {
    this.setData({ "profileForm.name": event.detail.value })
  },

  handleGenderInput(event) {
    this.setData({ "profileForm.gender": event.detail.value })
  },

  handleAddressInput(event) {
    this.setData({ "profileForm.address": event.detail.value })
  },

  handleContactPhoneInput(event) {
    this.setData({ "profileForm.contactPhone": event.detail.value })
  },

  syncAuthUser(user) {
    if (!user) return
    const state = auth.getAuthState()
    if (state) {
      auth.setAuthState({
        ...state,
        user
      })
    }
  },

  async uploadAvatarIfNeeded() {
    const form = this.data.profileForm
    if (!form.avatarLocalPath) return form.image
    const data = await api.uploadFile("/assets/avatar", form.avatarLocalPath)
    return data.url || form.image
  },

  async saveProfile() {
    if (!auth.isLoggedIn()) return
    const form = this.data.profileForm
    const name = (form.name || "").trim()
    if (!name) {
      wx.showToast({ title: "请输入昵称", icon: "none" })
      return
    }

    this.setData({ savingProfile: true })
    try {
      const image = await this.uploadAvatarIfNeeded()
      const data = await api.patch("/me", {
        name,
        image,
        gender: form.gender,
        address: form.address,
        contactPhone: form.contactPhone,
        completeProfile: true
      })
      const user = data.user || { ...this.data.user, name, image }
      user.initial = getInitial(user)
      this.syncAuthUser(user)
      this.setData({
        user,
        profileForm: createProfileForm(user),
        isProfileIncomplete: false,
        showProfileEditor: false,
        savingProfile: false
      })
      wx.showToast({ title: "资料已保存", icon: "success" })
    } catch (error) {
      if (!auth.isLoggedIn()) {
        this.setData({
          user: visitorUser,
          profileForm: createProfileForm(visitorUser),
          isLoggedIn: false,
          isProfileIncomplete: false,
          showProfileEditor: false,
          savingProfile: false,
          stats: { collections: 0, likes: 0, history: 0 }
        })
        return
      }
      this.setData({ savingProfile: false })
      wx.showToast({ title: error.message || "保存失败", icon: "none" })
    }
  },

  async skipProfile() {
    if (!auth.isLoggedIn()) return
    this.setData({ savingProfile: true })
    try {
      const data = await api.patch("/me", { completeProfile: true })
      const user = data.user || this.data.user
      user.initial = getInitial(user)
      this.syncAuthUser(user)
      this.setData({
        user,
        profileForm: createProfileForm(user),
        isProfileIncomplete: false,
        showProfileEditor: false,
        savingProfile: false
      })
    } catch (error) {
      if (!auth.isLoggedIn()) {
        this.setData({
          user: visitorUser,
          profileForm: createProfileForm(visitorUser),
          isLoggedIn: false,
          isProfileIncomplete: false,
          showProfileEditor: false,
          savingProfile: false,
          stats: { collections: 0, likes: 0, history: 0 }
        })
        return
      }
      this.setData({ savingProfile: false })
      wx.showToast({ title: error.message || "操作失败", icon: "none" })
    }
  },

  async handleLogout() {
    await auth.logout()
    this.loadMe()
    wx.showToast({ title: "已退出", icon: "success" })
  },

  showAbout() {
    wx.showModal({
      title: "关于银行帮",
      content: "银行帮开放求职信息、经验分享、内推浏览、收藏点赞和反馈能力。登录后可同步个人收藏与点赞。",
      showCancel: false
    })
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
