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

  const lines = formatted.split('\n').map(line => line.trim()).filter(Boolean)

  return (
    <div className="space-y-2 text-base leading-relaxed text-foreground/90 font-normal">
      {lines.map((line, index) => {
        // Render Section Headers
        if (/^(职位描述|任职要求|岗位职责|工作内容|任职资格|联系方式|工作地点|薪资待遇|截止日期|加分项|岗位要求|福利待遇|招聘岗位|招聘要求)/.test(line)) {
          return (
            <h3 key={index} className="font-bold text-lg mt-8 mb-3 text-blue-700 border-l-4 border-blue-500 pl-3">
              {line.replace(/[:：]$/, '')}
            </h3>
          )
        }

        // Render Top-level Chinese Numbers (一、)
        if (/^([一二三四五六七八九十][、\.．])/.test(line)) {
          return <h4 key={index} className="font-semibold text-md mt-6 mb-2">{line}</h4>
        }

        // Render List Items
        if (/^(\d+[、\.．]|\(\d+\)|（\d+）|[•·\-])/.test(line)) {
          return (
            <div key={index} className="pl-4 relative">
              <span className="absolute left-0 opacity-70">
                {line.match(/^(\d+[、\.．]|\(\d+\)|（\d+）|[•·\-])/)?.[0]}
              </span>
              <span className="pl-6 block">
                {linkify(line.replace(/^(\d+[、\.．]|\(\d+\)|（\d+）|[•·\-])/, ''))}
              </span>
            </div>
          )
        }

        // Regular Paragraphs
        return <p key={index} className="mb-2">{linkify(line)}</p>
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
          className="text-blue-600 hover:underline break-all font-medium"
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
