"use client"

import React from 'react'

interface JobContentProps {
  content: string | null
}

export function JobContent({ content }: JobContentProps) {
  if (!content || typeof content !== 'string') {
    return <div className="text-muted-foreground">暂无详细内容</div>
  }

  // Pre-processing to insert newlines for better formatting
  const formatted = content
    // 1. Ensure section headers are on their own lines with spacing
    .replace(/([^\n])(职位描述|任职要求|岗位职责|工作内容|任职资格|联系方式|工作地点|薪资待遇|截止日期|加分项|岗位要求|福利待遇|招聘岗位|招聘要求)[:：]?/g, '$1\n\n$2')

    // 2. Handle cases where list item immediately follows text (e.g. "...。1、")
    .replace(/([^\n])(\d+[、\.．])/g, '$1\n$2')

    // 3. Handle bullet points
    .replace(/([^\n])([•·\-])/g, '$1\n$2')

    // 4. Handle Chinese numbered lists (一、)
    .replace(/([^\n])([一二三四五六七八九十][、\.．])/g, '$1\n\n$2')

    // 5. Fix specific case where header is immediately followed by list item (e.g. "职位描述1、")
    .replace(/(职位描述|任职要求|岗位职责|工作内容|任职资格|联系方式|工作地点|薪资待遇|截止日期|加分项|岗位要求|福利待遇|招聘岗位|招聘要求)[:：]?\n?(\d+[、\.．])/g, '$1\n$2')

  const rawLines = formatted.split('\n').map((line) => line.trim())
  const lines: string[] = []
  for (const line of rawLines) {
    if (!line) {
      if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("")
      continue
    }
    lines.push(line)
  }

  return (
    <div className="space-y-3 text-sm sm:text-base leading-relaxed text-foreground/90 font-normal break-words">
      {lines.map((line, index) => {
        if (!line) {
          return <div key={index} className="h-2" />
        }

        // Render Section Headers
        if (/^(职位描述|任职要求|岗位职责|工作内容|任职资格|联系方式|工作地点|薪资待遇|截止日期|加分项|岗位要求|福利待遇|招聘岗位|招聘要求)/.test(line)) {
          return (
            <h4
              key={index}
              className="mt-6 mb-2 text-base sm:text-lg font-semibold text-foreground border-l-4 border-blue-500/70 pl-3"
            >
              {line.replace(/[:：]$/, '')}
            </h4>
          )
        }

        // Render Top-level Chinese Numbers (一、)
        if (/^([一二三四五六七八九十][、\.．])/.test(line)) {
          return <h5 key={index} className="mt-4 mb-1 font-semibold text-foreground">{line}</h5>
        }

        // Render List Items
        if (/^(\d+[、\.．]|\(\d+\)|（\d+）|[•·\-])/.test(line)) {
          const marker = line.match(/^(\d+[、\.．]|\(\d+\)|（\d+）|[•·\-])/)?.[0] ?? "•"
          const body = line.replace(/^(\d+[、\.．]|\(\d+\)|（\d+）|[•·\-])/, "").trim()
          return (
            <div key={index} className="grid grid-cols-[22px,1fr] gap-x-2">
              <span className="text-muted-foreground font-medium">{marker}</span>
              <span className="min-w-0 break-words">{linkify(body)}</span>
            </div>
          )
        }

        // Regular Paragraphs
        return (
          <p key={index} className="whitespace-pre-wrap break-words">
            {linkify(line)}
          </p>
        )
      })}
    </div>
  )
}

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g

  // Split by URL first
  const parts = text.split(urlRegex)

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-words font-medium"
        >
          {part}
        </a>
      )
    }

    // Then split by Email
    const subParts = part.split(emailRegex)
    return subParts.map((subPart, j) => {
      if (subPart.match(emailRegex)) {
        return (
          <a
            key={`${i}-${j}`}
            href={`mailto:${subPart}`}
            className="text-blue-600 hover:underline font-medium"
          >
            {subPart}
          </a>
        )
      }
      return subPart
    })
  })
}
