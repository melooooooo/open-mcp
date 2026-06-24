const api = require("../../utils/api")
const auth = require("../../utils/auth")

const HEADER_WORDS =
  "职位描述|任职要求|岗位职责|工作内容|任职资格|联系方式|工作地点|薪资待遇|截止日期|加分项|岗位要求|福利待遇|招聘岗位|招聘要求"

const HEADER_RE = new RegExp("^(" + HEADER_WORDS + ")")
const CN_NUM_RE = /^([一二三四五六七八九十][、.．])/
const LIST_RE = /^(\d+[、.．]|\(\d+\)|（\d+）|[•·\-])/
const URL_FULL_RE = /^https?:\/\/[^\s]+$/
const EMAIL_FULL_RE = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+$/

// 把一行文本拆成可渲染片段：普通文字 / 链接 / 邮箱（链接邮箱在小程序里点击可复制）
function buildSegments(text) {
  const segments = []
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g

  text.split(urlRegex).forEach((part) => {
    if (!part) return
    if (URL_FULL_RE.test(part)) {
      segments.push({ kind: "link", text: part })
      return
    }
    part.split(emailRegex).forEach((sub) => {
      if (!sub) return
      if (EMAIL_FULL_RE.test(sub)) {
        segments.push({ kind: "email", text: sub })
      } else {
        segments.push({ kind: "text", text: sub })
      }
    })
  })

  if (segments.length === 0) segments.push({ kind: "text", text })
  return segments
}

// 移植自 Web 端 components/referral/job-content.tsx 的智能分段逻辑
function formatReferralContent(raw) {
  if (!raw || typeof raw !== "string") return []

  const formatted = raw
    .replace(new RegExp("([^\\n])(" + HEADER_WORDS + ")[:：]?", "g"), "$1\n\n$2")
    .replace(/([^\n])(\d+[、.．])/g, "$1\n$2")
    .replace(/([^\n])([•·\-])/g, "$1\n$2")
    .replace(/([^\n])([一二三四五六七八九十][、.．])/g, "$1\n\n$2")
    .replace(new RegExp("(" + HEADER_WORDS + ")[:：]?\\n?(\\d+[、.．])", "g"), "$1\n$2")

  const lines = formatted
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const blocks = []
  lines.forEach((line) => {
    if (HEADER_RE.test(line)) {
      blocks.push({ type: "header", text: line.replace(/[:：]$/, "") })
    } else if (CN_NUM_RE.test(line)) {
      blocks.push({ type: "subheader", text: line })
    } else if (LIST_RE.test(line)) {
      const marker = (line.match(LIST_RE) || ["•"])[0]
      const body = line.replace(LIST_RE, "").trim()
      blocks.push({ type: "list", marker, segments: buildSegments(body) })
    } else {
      blocks.push({ type: "paragraph", segments: buildSegments(line) })
    }
  })

  blocks.forEach((block, i) => {
    block.id = "b" + i
    if (block.segments) {
      block.segments.forEach((seg, j) => {
        seg.id = "b" + i + "s" + j
      })
    }
  })

  return blocks
}

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    isLoggedIn: false,
    referral: null,
    contentBlocks: []
  },

  onLoad(options) {
    this.setData({ id: options.id || "", isLoggedIn: auth.isLoggedIn() })
    this.loadDetail()
  },

  onShow() {
    this.setData({ isLoggedIn: auth.isLoggedIn() })
  },

  async loadDetail() {
    try {
      const referral = await api.get(`/referrals/${this.data.id}`)
      const safeReferral = {
        ...referral,
        title: referral.title || "未命名内推",
        publishDate: referral.publishDate || "近期",
        content: referral.content || referral.companyName || "暂无详细内容"
      }
      this.setData({
        referral: safeReferral,
        contentBlocks: formatReferralContent(safeReferral.content),
        loading: false
      })
    } catch (error) {
      this.setData({ error: error.message || "加载失败", loading: false })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  async toggleCollect() {
    if (!this.data.referral) return

    const session = await auth.ensureSilentSession()
    if (!session) {
      wx.showToast({ title: "网络异常，请稍后重试", icon: "none" })
      return
    }

    const next = !this.data.referral.isCollected
    this.setData({ "referral.isCollected": next })
    try {
      const data = await api.post(`/referrals/${this.data.id}/collection`, {}, { requireSession: true })
      auth.markActivatedLocally()
      this.setData({ "referral.isCollected": data.isCollected, isLoggedIn: auth.isLoggedIn() })
      wx.showToast({ title: data.isCollected ? "已收藏" : "已取消", icon: "success" })
    } catch (error) {
      this.setData({ "referral.isCollected": !next })
      wx.showToast({ title: error.message || "操作失败", icon: "none" })
    }
  },

  copyLink() {
    const link = this.data.referral && this.data.referral.link
    if (!link) {
      wx.showToast({ title: "暂无外链", icon: "none" })
      return
    }
    wx.setClipboardData({ data: link })
  },

  copySegment(e) {
    const text = e.currentTarget.dataset.text
    if (!text) return
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: "已复制", icon: "none" })
    })
  }
})
