function switchMain(page) {
  wx.redirectTo({ url: `/pages/${page}/${page}` })
}

function openJob(id) {
  wx.navigateTo({ url: `/pages/job-detail/job-detail?id=${id}` })
}

function openExperience(slug) {
  wx.navigateTo({ url: `/pages/experience-detail/experience-detail?slug=${encodeURIComponent(slug)}` })
}

function openReferral(id) {
  wx.navigateTo({ url: `/pages/referral-detail/referral-detail?id=${id}` })
}

module.exports = {
  switchMain,
  openJob,
  openExperience,
  openReferral
}

