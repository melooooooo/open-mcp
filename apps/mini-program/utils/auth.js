const AUTH_STORAGE_KEY = "mp_auth_state"
const DEFAULT_TIMEOUT = 15000

function getAppSafe() {
  try {
    return getApp()
  } catch {
    return null
  }
}

function getApiBaseUrl() {
  const app = getAppSafe()
  return (app && app.globalData.apiBaseUrl || "").replace(/\/$/, "")
}

function getAuthState() {
  const app = getAppSafe()
  if (app && app.globalData.auth) return app.globalData.auth

  const stored = wx.getStorageSync(AUTH_STORAGE_KEY) || null
  if (app) app.globalData.auth = stored
  return stored
}

function setAuthState(auth) {
  const app = getAppSafe()
  if (app) app.globalData.auth = auth

  if (auth) {
    wx.setStorageSync(AUTH_STORAGE_KEY, auth)
  } else {
    wx.removeStorageSync(AUTH_STORAGE_KEY)
  }
}

function clearAuthState() {
  setAuthState(null)
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error("微信登录失败"))
        }
      },
      fail() {
        reject(new Error("微信登录失败"))
      }
    })
  })
}

function rawPost(path, data) {
  const base = getApiBaseUrl()
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${base}${path.startsWith("/") ? path : `/${path}`}`,
      method: "POST",
      timeout: DEFAULT_TIMEOUT,
      data,
      header: {
        "content-type": "application/json"
      },
      success(res) {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === "OK") {
          resolve(body.data)
          return
        }
        const error = new Error(body.message || `请求失败 ${res.statusCode}`)
        error.code = body.code || "REQUEST_FAILED"
        error.statusCode = res.statusCode
        error.requestId = body.requestId || ""
        reject(error)
      },
      fail() {
        reject(new Error("网络连接异常，请稍后重试"))
      }
    })
  })
}

function normalizeAuth(data) {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
    user: data.user || null
  }
}

async function loginWithWechat() {
  const code = await wxLogin()
  const data = await rawPost("/auth/wechat-login", {
    code
  })
  const auth = normalizeAuth(data)
  setAuthState(auth)
  return auth
}

async function ensureLoggedIn(options = {}) {
  if (isLoggedIn()) {
    return getAuthState()
  }

  const reason = options.reason || "继续操作"
  const confirmed = await new Promise((resolve) => {
    wx.showModal({
      title: "需要登录",
      content: `登录后可以${reason}`,
      confirmText: "去登录",
      cancelText: "暂不",
      success(res) {
        resolve(Boolean(res.confirm))
      },
      fail() {
        resolve(false)
      }
    })
  })

  if (!confirmed) return null
  try {
    return await loginWithWechat()
  } catch (error) {
    wx.showToast({ title: (error && error.message) || "登录失败", icon: "none" })
    return null
  }
}

async function bootstrapAuth() {
  const auth = getAuthState()
  if (!auth || !auth.refreshToken) return null
  return refreshAuthState()
}

async function refreshAuthState() {
  const auth = getAuthState()
  if (!auth || !auth.refreshToken) return null

  try {
    const data = await rawPost("/auth/refresh", {
      refreshToken: auth.refreshToken
    })
    const nextAuth = normalizeAuth(data)
    setAuthState(nextAuth)
    return nextAuth
  } catch (error) {
    clearAuthState()
    return null
  }
}

async function logout() {
  const auth = getAuthState()
  clearAuthState()
  if (auth && auth.refreshToken) {
    try {
      await rawPost("/auth/logout", { refreshToken: auth.refreshToken })
    } catch {
      // 本地退出优先，远端吊销失败不阻塞用户操作。
    }
  }
}

function isLoggedIn() {
  const auth = getAuthState()
  return Boolean(auth && auth.accessToken && auth.refreshToken)
}

module.exports = {
  getAuthState,
  setAuthState,
  clearAuthState,
  loginWithWechat,
  ensureLoggedIn,
  bootstrapAuth,
  refreshAuthState,
  logout,
  isLoggedIn
}
