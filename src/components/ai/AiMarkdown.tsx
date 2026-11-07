"use client";

import { Fragment, type ReactNode } from "react";

/** Lightweight Markdown for chat: code, bold, italic, links, lists, tables, inline math. */
export function AiMarkdown({ content }: { content: string }) {
  const blocks = splitBlocks(content);
  return (
    <div className="ai-md space-y-3 text-[15px] leading-relaxed break-words text-[var(--ai-text)]">
      {blocks.map((b, i) => (
        <Fragment key={i}>{renderBlock(b)}</Fragment>
      ))}
    </div>
  );
}

type Block =
  | { type: "code"; lang: string; code: string }
  | { type: "table"; rows: string[][] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; text: string };

function splitBlocks(src: string): Block[] {
  const out: Block[] = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push({ type: "code", lang, code: code.join("\n") });
      continue;
    }

    if (/^\|/.test(line) && i + 1 < lines.length && /^\|?\s*-/.test(lines[i + 1])) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        if (!/^\|?\s*-/.test(lines[i])) {
          rows.push(
            lines[i]
              .replace(/^\|/, "")
              .replace(/\|$/, "")
              .split("|")
              .map((c) => c.trim()),
          );
        }
        i += 1;
      }
      if (rows.length) out.push({ type: "table", rows });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      out.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      out.push({ type: "ol", items });
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^\|/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    out.push({ type: "p", text: para.join("\n") });
  }
  return out;
}

function renderBlock(b: Block): ReactNode {
  if (b.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-muted)] p-3 text-[13px] leading-snug text-[var(--ai-heading)]">
        {b.lang ? (
          <div className="mb-2 text-[10px] uppercase tracking-wide text-[var(--ai-muted)]">
            {b.lang}
          </div>
        ) : null}
        <code className="font-mono whitespace-pre">{b.code}</code>
      </pre>
    );
  }
  if (b.type === "table") {
    return (
      <div className="overflow-x-auto rounded-xl border border-[var(--ai-border)]">
        <table className="min-w-full text-left text-sm">
          <tbody>
            {b.rows.map((row, ri) => (
              <tr
                key={ri}
                className={
                  ri === 0
                    ? "bg-[var(--ai-bg-muted)] font-semibold text-[var(--ai-heading)]"
                    : "border-t border-[var(--ai-border)]"
                }
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 align-top">
                    {inline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (b.type === "ul") {
    return (
      <ul className="list-disc space-y-1 pl-5 text-inherit">
        {b.items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>
    );
  }
  if (b.type === "ol") {
    return (
      <ol className="list-decimal space-y-1 pl-5 text-inherit">
        {b.items.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ol>
    );
  }
  return <p className="whitespace-pre-wrap">{inline(b.text)}</p>;
}

function inline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re =
    /(`[^`]+`)|(\$\$[\s\S]+?\$\$)|(\$[^$\n]+\$)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-[var(--ai-bg-muted)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--ai-heading)]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("$$") || (token.startsWith("$") && token.endsWith("$"))) {
      parts.push(
        <span
          key={key++}
          className="inline-block rounded bg-[var(--ai-bg-subtle)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--ai-heading)]"
        >
          {token}
        </span>,
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-[var(--ai-heading)]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[")) {
      const lm = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) {
        parts.push(
          <a
            key={key++}
            href={lm[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="ai-link underline underline-offset-2"
          >
            {lm[1]}
          </a>,
        );
      } else {
        parts.push(token);
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
