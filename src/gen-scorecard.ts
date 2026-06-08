// src/gen-scorecard.ts — pure HTML generation for the mito scorecard.
// No I/O. Takes ScorecardMetrics, returns a self-contained HTML string.
import type { ScorecardMetrics } from "./scorecard";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtRate(rate: number | null, decimals = 1): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(decimals)}%`;
}

function fmtHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return "<1h";
  return `${hours}h`;
}

function fmtCount(n: number): string {
  return String(n);
}

interface Card {
  label: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}

function renderCard(card: Card): string {
  const cls = card.highlight ? "card card--highlight" : "card";
  const sub = card.subtitle ? `<div class="card-sub">${esc(card.subtitle)}</div>` : "";
  return `
    <div class="${cls}">
      <div class="card-label">${esc(card.label)}</div>
      <div class="card-value">${esc(card.value)}</div>
      ${sub}
    </div>`.trim();
}

export function buildScorecardHtml(metrics: ScorecardMetrics): string {
  const generated = new Date().toUTCString();

  const cards: Card[] = [
    {
      label: "Merge Rate",
      value: fmtRate(metrics.mergeRate),
      subtitle: `${metrics.totalPrsMerged} merged / ${metrics.totalPrsOpened} total PRs`,
      highlight: metrics.mergeRate !== null && metrics.mergeRate >= 0.8,
    },
    {
      label: "Avg Time to Merge",
      value: fmtHours(metrics.avgTimeToMergeHours),
      subtitle: "hours from propose → merge",
    },
    {
      label: "CI First-Pass Rate",
      value: fmtRate(metrics.ciFirstPassRate),
      subtitle: "cycles where tests passed",
      highlight: metrics.ciFirstPassRate !== null && metrics.ciFirstPassRate >= 0.8,
    },
    {
      label: "Revert Rate",
      value: fmtRate(metrics.revertRate),
      subtitle: "revert events / total events",
    },
    {
      label: "PRs Opened",
      value: fmtCount(metrics.totalPrsOpened),
      subtitle: "all time",
    },
    {
      label: "PRs Merged",
      value: fmtCount(metrics.totalPrsMerged),
      subtitle: "successfully shipped",
    },
    {
      label: "PRs Closed",
      value: fmtCount(metrics.totalPrsClosed),
      subtitle: "not merged",
    },
    {
      label: "Build Sessions",
      value: fmtCount(metrics.buildSessions),
      subtitle: "autonomous runs",
    },
  ];

  const cardsHtml = cards.map(renderCard).join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mito — scorecard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0b0d10;
      color: #e2e8f0;
      font-family: 'Courier New', Courier, monospace;
      min-height: 100vh;
      padding: 40px 20px;
    }

    .container {
      max-width: 860px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 36px;
    }

    header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: 0.04em;
    }

    header h1 span {
      color: #6366f1;
    }

    .subtitle {
      margin-top: 6px;
      font-size: 0.8rem;
      color: #64748b;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }

    .card {
      background: #151820;
      border: 1px solid #1e2535;
      border-radius: 8px;
      padding: 20px 18px;
      transition: border-color 0.15s;
    }

    .card:hover {
      border-color: #334155;
    }

    .card--highlight {
      border-color: #4338ca;
      background: #0f1229;
    }

    .card-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 10px;
    }

    .card-value {
      font-size: 2rem;
      font-weight: 700;
      color: #f1f5f9;
      line-height: 1;
      margin-bottom: 8px;
    }

    .card--highlight .card-value {
      color: #818cf8;
    }

    .card-sub {
      font-size: 0.72rem;
      color: #475569;
      line-height: 1.4;
    }

    footer {
      margin-top: 40px;
      font-size: 0.72rem;
      color: #334155;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>mito — <span>scorecard</span></h1>
      <div class="subtitle">autonomous shipping metrics</div>
    </header>
    <div class="grid">
    ${cardsHtml}
    </div>
    <footer>generated ${esc(generated)}</footer>
  </div>
</body>
</html>
`;
}
