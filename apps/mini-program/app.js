const auth = require("./utils/auth")

App({
  globalData: {
    apiBaseUrl: "https://api.yinhangbang.com/api/mp",
    auth: null
  },

  onLaunch() {
    auth.bootstrapAuth().catch(() => {})
  }
})
