export const TAG_LABELS: Record<string, string> = {
  today: "今日更新",
  hot: "热门",
  new: "最新",

  fulltime: "社招",
  intern: "实习",
  campus: "校招",

  referral: "内推",
  remote: "远程",
  urgent: "急招",

  "state-owned": "央国企",
  tech: "技术",
}

export function getTagLabel(tag: string): string {
  return TAG_LABELS[tag.toLowerCase()] || tag
}
