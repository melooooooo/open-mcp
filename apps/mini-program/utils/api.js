const app = getApp()
const auth = require("./auth")

const DEFAULT_TIMEOUT = 15000
const NETWORK_ERROR_MESSAGE = "网络连接异常，请稍后重试"

function buildUrl(path, data) {
  const base = app.globalData.apiBaseUrl.replace(/\/$/, "")
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`
  const query = Object.keys(data || {})
    .filter((key) => data[key] !== undefined && data[key] !== null && data[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join("&")
  return query ? `${url}?${query}` : url
}

async function getUsableAuthState(options = {}) {
  // requireSession=true 时（强意图操作）即使没有本地会话也会静默新建。
  if (options.requireSession) return auth.ensureUsableSession()

  // 冷启动时若 onLaunch 的静默登录/续期仍在进行，等它完成再带 token（不另起 wx.login），
  // 保证详情页首屏的 isCollected / isLiked 个性化状态准确。
  if (!auth.hasAuthSession()) {
    const pending = auth.getPendingSession()
    if (pending) await pending
  }

  const authState = auth.getAuthState()
  if (!authState || !authState.accessToken || !authState.refreshToken) return authState
  if (!authState.expiresAt || authState.expiresAt - Date.now() > 60000) return authState
  return auth.refreshAuthState()
}

async function request(path, options = {}) {
  const method = options.method || "GET"
  const data = options.data || {}
  const url = method === "GET" ? buildUrl(path, data) : buildUrl(path)
  const retry = options.retry !== false
  const authState = await getUsableAuthState(options)

  return new Promise((resolve, reject) => {
    const header = {
      "content-type": "application/json"
    }
    if (authState && authState.accessToken) {
      header.Authorization = `Bearer ${authState.accessToken}`
    }

    wx.request({
      url,
      method,
      timeout: options.timeout || DEFAULT_TIMEOUT,
      data: method === "GET" ? undefined : data,
      header,
      async success(res) {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === "OK") {
          resolve(body.data)
          return
        }
        if (res.statusCode === 401 && retry) {
          // 先尝试续期；无可续期会话时（如静默登录曾失败）再静默新建一个。
          const nextAuth = (await auth.refreshAuthState()) || (await auth.ensureSilentSession())
          if (nextAuth && nextAuth.accessToken) {
            try {
              const data = await request(path, { ...options, retry: false })
              resolve(data)
              return
            } catch (error) {
              reject(error)
              return
            }
          }
        }
        const error = new Error(body.message || `请求失败 ${res.statusCode}`)
        error.code = body.code || "REQUEST_FAILED"
        error.statusCode = res.statusCode
        error.requestId = body.requestId || ""
        reject(error)
      },
      fail(err) {
        const error = new Error(NETWORK_ERROR_MESSAGE)
        error.code = err.errMsg || "NETWORK_ERROR"
        reject(error)
      }
    })
  })
}

async function uploadFile(path, filePath, options = {}) {
  const authState = await getUsableAuthState()
  const url = buildUrl(path)

  return new Promise((resolve, reject) => {
    const header = {}
    if (authState && authState.accessToken) {
      header.Authorization = `Bearer ${authState.accessToken}`
    }

    wx.uploadFile({
      url,
      filePath,
      name: options.name || "file",
      timeout: options.timeout || DEFAULT_TIMEOUT,
      formData: options.formData || {},
      header,
      success(res) {
        let body = {}
        try {
          body = typeof res.data === "string" ? JSON.parse(res.data) : res.data || {}
        } catch {
          body = {}
        }

        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === "OK") {
          resolve(body.data)
          return
        }

        const error = new Error(body.message || `上传失败 ${res.statusCode}`)
        error.code = body.code || "UPLOAD_FAILED"
        error.statusCode = res.statusCode
        error.requestId = body.requestId || ""
        reject(error)
      },
      fail(err) {
        const error = new Error(NETWORK_ERROR_MESSAGE)
        error.code = err.errMsg || "NETWORK_ERROR"
        reject(error)
      }
    })
  })
}

module.exports = {
  request,
  get: (path, data, options) => request(path, { ...options, method: "GET", data }),
  post: (path, data, options) => request(path, { ...options, method: "POST", data }),
  patch: (path, data, options) => request(path, { ...options, method: "PATCH", data }),
  uploadFile
}
