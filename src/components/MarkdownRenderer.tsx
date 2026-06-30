"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  textSize?: "sm" | "xs" | "base";
  variant?: "user" | "assistant" | "error";
}

export default function MarkdownRenderer({
  content,
  className = "",
  textSize = "sm",
  variant = "assistant",
}: MarkdownRendererProps) {
  const isUser = variant === "user";
  const isError = variant === "error";

  const codeBg = isUser
    ? "bg-blue-700/40"
    : isError
      ? "bg-red-100"
      : "bg-gray-100";
  const codeText = isUser ? "text-blue-100" : "text-gray-900";
  const inlineCodeBg = isUser ? "bg-blue-700/30" : "bg-gray-200";
  const inlineCodeText = isUser ? "text-blue-100" : "text-pink-600";

  const components: Partial<Components> = {
    code({ className: cn, children, ...props }) {
      const isBlock = /language-/.test(cn ?? "");
      const lang = cn?.replace("language-", "") ?? "";

      if (isBlock) {
        return (
          <div className="relative group my-3">
            {lang && (
              <span
                className={`absolute top-0 right-0 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-bl-lg rounded-tr-lg ${
                  isUser ? "bg-blue-700/60 text-blue-200" : "bg-gray-200 text-gray-500"
                }`}
              >
                {lang}
              </span>
            )}
            <pre
              className={`overflow-x-auto rounded-lg p-4 text-xs leading-relaxed ${codeBg} ${codeText} border ${
                isUser ? "border-blue-600/30" : "border-gray-200"
              }`}
            >
              <code className={`${codeText} text-xs font-mono`} {...props}>
                {String(children).replace(/\n$/, "")}
              </code>
            </pre>
          </div>
        );
      }

      return (
        <code
          className={`px-1.5 py-0.5 rounded text-xs font-mono ${inlineCodeBg} ${inlineCodeText}`}
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children, ...props }) => (
      <h1 className={`text-lg font-bold mt-4 mb-2 ${isUser ? "text-white" : "text-gray-900"}`} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className={`text-base font-bold mt-3 mb-1.5 ${isUser ? "text-white" : "text-gray-800"}`} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className={`text-sm font-semibold mt-2 mb-1 ${isUser ? "text-white" : "text-gray-800"}`} {...props}>
        {children}
      </h3>
    ),
    ul: ({ children, ...props }) => (
      <ul className={`list-disc pl-5 my-2 space-y-1 ${isUser ? "text-blue-100" : "text-gray-700"}`} {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className={`list-decimal pl-5 my-2 space-y-1 ${isUser ? "text-blue-100" : "text-gray-700"}`} {...props}>
        {children}
      </ol>
    ),
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline underline-offset-2 ${
          isUser
            ? "text-blue-200 hover:text-white"
            : "text-blue-600 hover:text-blue-800"
        }`}
        {...props}
      >
        {children}
      </a>
    ),
    p: ({ children, ...props }) => (
      <p className={`my-1.5 ${isUser ? "text-white" : "text-gray-800"}`} {...props}>
        {children}
      </p>
    ),
    strong: ({ children, ...props }) => (
      <strong className={`font-bold ${isUser ? "text-white" : "text-gray-900"}`} {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className={`italic ${isUser ? "text-blue-100" : "text-gray-600"}`} {...props}>
        {children}
      </em>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-3">
        <table
          className={`w-full text-xs border-collapse ${
            isUser ? "border-blue-500/30" : "border-gray-200"
          }`}
          {...props}
        >
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        className={`px-3 py-2 border text-left font-semibold ${
          isUser
            ? "border-blue-500/30 bg-blue-700/30 text-white"
            : "border-gray-200 bg-gray-100 text-gray-700"
        }`}
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        className={`px-3 py-2 border ${
          isUser
            ? "border-blue-500/30 text-blue-100"
            : "border-gray-200 text-gray-700"
        }`}
        {...props}
      >
        {children}
      </td>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote
        className={`pl-4 my-3 border-l-4 italic ${
          isUser
            ? "border-blue-400 text-blue-100"
            : "border-gray-300 text-gray-500"
        }`}
        {...props}
      >
        {children}
      </blockquote>
    ),
    hr: (props) => (
      <hr
        className={`my-4 border-0 h-px ${
          isUser ? "bg-blue-500/30" : "bg-gray-200"
        }`}
        {...props}
      />
    ),
  };

  const sizeClass =
    textSize === "xs"
      ? "text-xs"
      : textSize === "base"
        ? "text-base"
        : "text-sm";

  return (
    <div className={`${sizeClass} leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}