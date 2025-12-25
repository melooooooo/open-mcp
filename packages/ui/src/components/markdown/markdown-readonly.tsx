'use client'

import React from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import CopyBtn from "@repo/ui/components/ui/copy-button";
import { cn } from "@repo/ui/lib/utils"

function PreWithCopyBtn({ className, ...props }: React.ComponentProps<"pre">) {
  const ref = React.useRef<HTMLPreElement>(null);
  return (
    <span className="group relative">
      <CopyBtn
        className="absolute right-1 top-1 m-1 hidden text-white group-hover:block"
        getStringToCopy={() => {
          return ref.current?.textContent ?? "";
        }}
      />
      <pre
        ref={ref}
        className={cn(
          "overflow-x-auto whitespace-pre-wrap break-words",
          className
        )}
        {...props}
      />
    </span>
  );
}

interface MarkdownReadonlyProps {
  children: string;
  className?: string;
  enableProse?: boolean;
  headingAnchors?: string[];
}

const cleanHeadingText = (text = "") => text.replace(/\s+/g, " ").trim()

const slugifyHeading = (raw: string) => {
  const name = cleanHeadingText(raw)
  return name
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5]/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "")
}

const extractNodeText = (node: React.ReactNode): string => {
  if (node === null || node === undefined) return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractNodeText).join("")
  if (React.isValidElement(node)) return extractNodeText((node.props as any).children)
  return ""
}

export function MarkdownReadonly({
  children: markdown,
  className,
  enableProse = true,
  headingAnchors,
}: MarkdownReadonlyProps) {
  const headingState = React.useRef<{ anchors: string[]; index: number; used: Record<string, number> }>({
    anchors: [],
    index: 0,
    used: {},
  })

  React.useEffect(() => {
    headingState.current = {
      anchors: headingAnchors?.filter(Boolean) ?? [],
      index: 0,
      used: {},
    }
  }, [headingAnchors, markdown])

  const getHeadingId = React.useCallback(
    (depth: number, children: React.ReactNode) => {
      if (depth <= 1) return undefined
      const state = headingState.current
      if (state.index < state.anchors.length) {
        const anchor = state.anchors[state.index]
        state.index += 1
        return anchor
      }
      const text = cleanHeadingText(extractNodeText(children))
      if (!text) return undefined
      const base = slugifyHeading(text) || `section-${state.index + 1}`
      const count = state.used[base] || 0
      state.used[base] = count + 1
      return count === 0 ? base : `${base}-${count + 1}`
    },
    []
  )

  const markdownContent = (
    <Markdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
      components={{
        div({ className: divClassName, ...props }: any) {
          const { align, style, ...restProps } = props;
          return (
            <div
              className={cn(divClassName)}
              style={{
                textAlign: align,
                ...(style as React.CSSProperties)
              }}
              {...restProps}
            />
          );
        },
        pre({ ...props }) {
          return <PreWithCopyBtn {...props} />;
        },
        code({ className: codeClassName, children, ...props }) {
          const match = /language-(\w+)/.exec(codeClassName ?? "");
          const language = match ? match[1] : "bash";

          // 检查是否是多行代码（代码块）还是单行代码（内联）
          const codeContent = String(children);
          const isCodeBlock = codeContent.includes('\n') || codeContent.length > 50;

          if (isCodeBlock) {
            return (
              // @ts-expect-error -- Refs are not compatible for some reason
              <SyntaxHighlighter
                PreTag="span"
                language={language}
                {...props}
                style={dracula}
                className="rounded-md border bg-muted/50 overflow-x-auto block"
                customStyle={{
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  display: 'block'
                }}
              >
                {codeContent.replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          } else {
            return (
              <code className={cn("rounded-md bg-muted/50 px-1.5 py-0.5 break-words", codeClassName)} {...props}>
                {children}
              </code>
            );
          }
        },
        a({ className: aClassName, ...props }) {
          return <a className={cn("text-primary underline-offset-4 hover:underline", aClassName)} {...props} />;
        },
        h1({ className: h1ClassName, children, ...props }) {
          const id = getHeadingId(1, children)
          return (
            <h1 id={id} className={cn("mt-2 scroll-m-20 text-4xl font-bold", h1ClassName)} {...props}>
              {children}
            </h1>
          )
        },
        h2({ className: h2ClassName, children, ...props }) {
          const id = getHeadingId(2, children)
          return (
            <h2
              id={id}
              className={cn("mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold first:mt-0", h2ClassName)}
              {...props}
            >
              {children}
            </h2>
          )
        },
        h3({ className: h3ClassName, children, ...props }) {
          const id = getHeadingId(3, children)
          return (
            <h3 id={id} className={cn("mt-8 scroll-m-20 text-2xl font-semibold", h3ClassName)} {...props}>
              {children}
            </h3>
          )
        },
        h4({ className: h4ClassName, children, ...props }) {
          const id = getHeadingId(4, children)
          return (
            <h4 id={id} className={cn("mt-6 scroll-m-20 text-xl font-semibold", h4ClassName)} {...props}>
              {children}
            </h4>
          )
        },
        h5({ className: h5ClassName, children, ...props }) {
          const id = getHeadingId(5, children)
          return (
            <h5 id={id} className={cn("mt-4 scroll-m-20 text-lg font-semibold", h5ClassName)} {...props}>
              {children}
            </h5>
          )
        },
        h6({ className: h6ClassName, children, ...props }) {
          const id = getHeadingId(6, children)
          return (
            <h6 id={id} className={cn("mt-3 scroll-m-20 text-base font-semibold", h6ClassName)} {...props}>
              {children}
            </h6>
          )
        },
        ul({ className: ulClassName, ...props }) {
          return <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", ulClassName)} {...props} />;
        },
        ol({ className: olClassName, ...props }) {
          return <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", olClassName)} {...props} />;
        },
        p({ className: pClassName, ...props }: any) {
          const { align, style, ...restProps } = props;
          return (
            <p
              className={cn("leading-7 [&:not(:first-child)]:mt-6", pClassName)}
              style={{
                textAlign: align,
                ...(style as React.CSSProperties)
              }}
              {...restProps}
            />
          );
        },
        blockquote({ className: blockquoteClassName, ...props }) {
          return <blockquote className={cn("mt-6 border-l-2 border-primary pl-6 italic", blockquoteClassName)} {...props} />;
        },
        table({ className: tableClassName, ...props }) {
          return <table className={cn("w-full border-collapse border-spacing-0", tableClassName)} {...props} />;
        },
        thead({ className: theadClassName, ...props }) {
          return <thead className={cn("border-b", theadClassName)} {...props} />;
        },
        th({ className: thClassName, ...props }: any) {
          const { align, ...restProps } = props;
          return (
            <th
              className={cn("border px-4 py-2 text-left font-bold", thClassName)}
              style={{ textAlign: align }}
              {...restProps}
            />
          );
        },
        td({ className: tdClassName, ...props }: any) {
          const { align, ...restProps } = props;
          return (
            <td
              className={cn("border px-4 py-2", tdClassName)}
              style={{ textAlign: align }}
              {...restProps}
            />
          );
        },
        img({ className: imgClassName, ...props }) {
          return <img className={cn("max-w-full h-auto rounded-md", imgClassName)} {...props} />;
        },
        span({ className: spanClassName, ...props }: any) {
          const { style, ...restProps } = props;
          return <span className={cn(spanClassName)} style={style as React.CSSProperties} {...restProps} />;
        },
        strong({ className: strongClassName, ...props }) {
          return <strong className={cn("font-bold", strongClassName)} {...props} />;
        },
        em({ className: emClassName, ...props }) {
          return <em className={cn("italic", emClassName)} {...props} />;
        },
        br({ ...props }) {
          return <br {...props} />;
        },
        hr({ className: hrClassName, ...props }) {
          return <hr className={cn("my-8 border-t", hrClassName)} {...props} />;
        },
      }}
    >
      {markdown}
    </Markdown>
  );

  if (enableProse) {
    return (
      <div className={cn("prose prose-neutral dark:prose-invert max-w-none", className)}>
        {markdownContent}
      </div>
    );
  }

  return (
    <div className={className}>
      {markdownContent}
    </div>
  );
}
