const app = getApp()

function buildUrl(path, data) {
  const base = app.globalData.apiBaseUrl.replace(/\/$/, "")
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`
  const query = Object.keys(data || {})
    .filter((key) => data[key] !== undefined && data[key] !== null && data[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join("&")
  return query ? `${url}?${query}` : url
}

function request(path, options = {}) {
  const method = options.method || "GET"
  const data = options.data || {}
  const url = method === "GET" ? buildUrl(path, data) : buildUrl(path)

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data: method === "GET" ? undefined : data,
      header: {
        "content-type": "application/json"
      },
      success(res) {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === "OK") {
          resolve(body.data)
          return
        }
        reject(new Error(body.message || `请求失败 ${res.statusCode}`))
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

module.exports = {
  request,
  get: (path, data) => request(path, { data }),
  post: (path, data) => request(path, { method: "POST", data }),
  patch: (path, data) => request(path, { method: "PATCH", data })
}

