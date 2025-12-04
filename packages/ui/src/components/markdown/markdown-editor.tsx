"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";
import { MarkdownReadonly } from "./markdown-readonly";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Table,
  Undo,
  Redo,
} from "lucide-react";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  saveButtonText?: string;
  cancelButtonText?: string;
  isSaving?: boolean;
  disabled?: boolean;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = "在此输入 Markdown 内容...",
  className,
  minHeight = "500px",
  saveButtonText = "保存",
  cancelButtonText = "取消",
  isSaving = false,
  disabled = false,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 插入文本到光标位置
  const insertText = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const newValue =
        value.substring(0, start) +
        before +
        textToInsert +
        after +
        value.substring(end);

      onChange(newValue);

      // 更新历史记录
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newValue);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // 设置新的光标位置
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + textToInsert.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange, history, historyIndex]
  );

  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [historyIndex, history, onChange]);

  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [historyIndex, history, onChange]);

  // 工具栏按钮配置
  const toolbarButtons: ToolbarButton[] = [
    {
      icon: <Heading1 className="h-4 w-4" />,
      label: "标题 1",
      action: () => insertText("# ", "", "标题 1"),
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      label: "标题 2",
      action: () => insertText("## ", "", "标题 2"),
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      label: "标题 3",
      action: () => insertText("### ", "", "标题 3"),
    },
    {
      icon: <Bold className="h-4 w-4" />,
      label: "粗体",
      action: () => insertText("**", "**", "粗体文本"),
    },
    {
      icon: <Italic className="h-4 w-4" />,
      label: "斜体",
      action: () => insertText("*", "*", "斜体文本"),
    },
    {
      icon: <Strikethrough className="h-4 w-4" />,
      label: "删除线",
      action: () => insertText("~~", "~~", "删除线文本"),
    },
    {
      icon: <Code className="h-4 w-4" />,
      label: "代码",
      action: () => insertText("`", "`", "代码"),
    },
    {
      icon: <Quote className="h-4 w-4" />,
      label: "引用",
      action: () => insertText("> ", "", "引用文本"),
    },
    {
      icon: <List className="h-4 w-4" />,
      label: "无序列表",
      action: () => insertText("- ", "", "列表项"),
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      label: "有序列表",
      action: () => insertText("1. ", "", "列表项"),
    },
    {
      icon: <Link className="h-4 w-4" />,
      label: "链接",
      action: () => insertText("[", "](url)", "链接文本"),
    },
    {
      icon: <Image className="h-4 w-4" />,
      label: "图片",
      action: () => insertText("![", "](url)", "图片描述"),
    },
    {
      icon: <Table className="h-4 w-4" />,
      label: "表格",
      action: () =>
        insertText(
          "\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| ",
          " | 单元格 | 单元格 |\n",
          "单元格"
        ),
    },
  ];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl/Cmd + Z: 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y: 重做
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      }
      // Ctrl/Cmd + S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
      // Tab: 插入缩进
      if (e.key === "Tab") {
        e.preventDefault();
        insertText("  ", "", "");
      }
    },
    [undo, redo, onSave, insertText]
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/50 p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={disabled || historyIndex === 0}
          title="撤销 (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={disabled || historyIndex === history.length - 1}
          title="重做 (Ctrl+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-1 h-6" />
        {toolbarButtons.map((button, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={button.action}
            disabled={disabled}
            title={button.label}
          >
            {button.icon}
          </Button>
        ))}
      </div>

      {/* 编辑器/预览区域 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">编辑</TabsTrigger>
          <TabsTrigger value="preview">预览</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              onChange(newValue);
              // 更新历史记录
              const newHistory = history.slice(0, historyIndex + 1);
              newHistory.push(newValue);
              setHistory(newHistory);
              setHistoryIndex(newHistory.length - 1);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full rounded-lg border bg-background p-4 font-mono text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "resize-y",
              disabled && "cursor-not-allowed opacity-50"
            )}
            style={{ minHeight }}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div
            className={cn(
              "w-full rounded-lg border bg-background p-4",
              "overflow-auto"
            )}
            style={{ minHeight }}
          >
            {value ? (
              <MarkdownReadonly>{value}</MarkdownReadonly>
            ) : (
              <p className="text-muted-foreground">暂无内容预览</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 操作按钮 */}
      {(onSave || onCancel) && (
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={disabled || isSaving}
            >
              {cancelButtonText}
            </Button>
          )}
          {onSave && (
            <Button
              type="button"
              onClick={onSave}
              disabled={disabled || isSaving}
            >
              {isSaving ? "保存中..." : saveButtonText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
