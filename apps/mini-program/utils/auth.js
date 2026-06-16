const AUTH_STORAGE_KEY = "mp_auth_state"
const DEVICE_ID_KEY = "mp_device_id"
const DEFAULT_TIMEOUT = 15000

// wx.login 的 code 只能用一次且有频率限制，用以下两个 in-flight Promise 做并发去重：
// establishPromise 守护“通过 wx.login 新建会话”，refreshPromise 守护“refreshToken 续期”。
let establishPromise = null
let refreshPromise = null

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

function getDeviceId() {
  let id = wx.getStorageSync(DEVICE_ID_KEY)
  if (!id) {
    id = `mp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    wx.setStorageSync(DEVICE_ID_KEY, id)
  }
  return id
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

function rawPost(path, data, options = {}) {
  const base = getApiBaseUrl()
  const header = {
    "content-type": "application/json"
  }
  if (options.auth) {
    const auth = getAuthState()
    if (auth && auth.accessToken) {
      header.Authorization = `Bearer ${auth.accessToken}`
    }
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${base}${path.startsWith("/") ? path : `/${path}`}`,
      method: "POST",
      timeout: DEFAULT_TIMEOUT,
      data,
      header,
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

function isFreshSession(auth) {
  return Boolean(
    auth &&
    auth.accessToken &&
    auth.refreshToken &&
    auth.expiresAt &&
    auth.expiresAt - Date.now() > 60000
  )
}

function hasAuthSession() {
  const auth = getAuthState()
  return Boolean(auth && auth.accessToken && auth.refreshToken)
}

// 返回正在进行中的“建立/续期会话”Promise（若有），供请求层冷启动时等待，避免无 token 抢跑。
function getPendingSession() {
  return establishPromise || refreshPromise || null
}

function isMiniProgramActivated() {
  const auth = getAuthState()
  return Boolean(auth && auth.user && auth.user.isMiniProgramActivated)
}

// 用户可感知的“已登录”：既有会话、且后端已标记激活。
function isLoggedIn() {
  return hasAuthSession() && isMiniProgramActivated()
}

function getCurrentUser() {
  const auth = getAuthState()
  return (auth && auth.user) || null
}

// 强意图操作（收藏/点赞）成功后，后端已写入激活标记，这里同步本地状态，使 UI 即时为已登录态。
function markActivatedLocally() {
  const auth = getAuthState()
  if (!auth) return
  const user = { ...(auth.user || {}), isMiniProgramActivated: true }
  setAuthState({ ...auth, user })
}

// 无本地会话时静默建立（wx.login + silent 登录）。失败返回 null，不抛出，不打扰用户。
function ensureSilentSession() {
  if (hasAuthSession()) return Promise.resolve(getAuthState())
  if (establishPromise) return establishPromise

  establishPromise = (async () => {
    try {
      const code = await wxLogin()
      const data = await rawPost("/auth/wechat-login", {
        code,
        loginMode: "silent",
        deviceId: getDeviceId()
      })
      const auth = normalizeAuth(data)
      setAuthState(auth)
      return auth
    } catch (error) {
      return null
    } finally {
      establishPromise = null
    }
  })()

  return establishPromise
}

async function refreshAuthState() {
  if (refreshPromise) return refreshPromise

  const auth = getAuthState()
  if (!auth || !auth.refreshToken) return null

  refreshPromise = (async () => {
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
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// 给业务请求用：返回一个可用（未过期）的会话，必要时续期或静默新建。
async function ensureUsableSession() {
  const auth = getAuthState()
  if (isFreshSession(auth)) return auth

  if (auth && auth.refreshToken) {
    const refreshed = await refreshAuthState()
    if (refreshed) return refreshed
  }

  return ensureSilentSession()
}

// 启动引导：有 refreshToken 就续期，否则静默登录；任何失败都不阻塞公开内容浏览。
async function bootstrapAuth() {
  const auth = getAuthState()
  if (auth && auth.refreshToken) return refreshAuthState()
  return ensureSilentSession()
}

// 用户主动登录 / 强意图触发：把会话提升为“已激活”。
async function activateSession() {
  const session = await ensureUsableSession()

  if (session) {
    try {
      const data = await rawPost("/auth/activate", {}, { auth: true })
      if (data && data.user) {
        const next = { ...getAuthState(), user: data.user }
        setAuthState(next)
        return next
      }
      // 响应异常视为激活失败，返回 null 让调用方提示，不误报“登录成功”。
      return null
    } catch (error) {
      return null
    }
  }

  // 启动时静默登录失败（如断网）后用户主动点击登录，这里做一次显式 interactive 登录。
  try {
    const code = await wxLogin()
    const data = await rawPost("/auth/wechat-login", {
      code,
      loginMode: "interactive",
      deviceId: getDeviceId()
    })
    const auth = normalizeAuth(data)
    setAuthState(auth)
    return auth
  } catch (error) {
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

module.exports = {
  getAuthState,
  setAuthState,
  clearAuthState,
  getCurrentUser,
  markActivatedLocally,
  hasAuthSession,
  getPendingSession,
  isMiniProgramActivated,
  isLoggedIn,
  ensureSilentSession,
  ensureUsableSession,
  activateSession,
  bootstrapAuth,
  refreshAuthState,
  logout
}
