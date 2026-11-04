// @vitest-environment jsdom
// 大额金额超出固定列宽时：单元格用省略号截断，title 保留完整金额供悬停查看。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const h = vi.hoisted(() => {
  const budgetData = (month: string) => ({
    month,
    months: ["2026-02"],
    maxMonth: "2026-04",
    readyToAssign: 0,
    incomeThisMonth: 0,
    assignedTotal: 123456789000,
    overspentTotal: 0,
    uncategorizedCount: 0,
    ageOfMoney: 0,
    groups: [
      {
        id: "g-big",
        name: "大额分组",
        virtual: false,
        isIncome: false,
        categories: [
          {
            id: "cat-big",
            name: "大额分类",
            assigned: 123456789000,
            activity: -123456789000,
            available: 98765432100,
            goal: null,
            need: null,
            lastAssigned: 0,
            avgSpend: 0,
          },
        ],
      },
    ],
  });
  const boot = {
    settings: { currencySymbol: "¥", language: "zh", aiBaseUrl: "", aiModel: "", aiKey: "" },
    accounts: [
      {
        id: "acc-1",
        name: "现金钱包",
        type: "cash",
        on_budget: 1,
        closed: 0,
        starting_balance: 0,
        starting_balance_date: null,
        sort_order: 0,
        created_at: "",
        balance: 0,
      },
    ],
    payees: [],
    groups: [],
    currentMonth: "2026-02",
  };
  return { budgetData, boot };
});

vi.mock("../api", () => ({
  api: new Proxy(
    { budget: (m: string) => Promise.resolve(h.budgetData(m)) },
    {
      get: (target, prop) =>
        prop in target ? target[prop as keyof typeof target] : vi.fn().mockResolvedValue({}),
    }
  ),
}));

vi.mock("../store", () => {
  const useApp = () => ({
    boot: h.boot,
    loading: false,
    lang: "zh" as const,
    t: (k: string) => k,
    toast: vi.fn(),
    setLang: vi.fn(),
    refreshBoot: vi.fn().mockResolvedValue({}),
  });
  return { useApp };
});

import { BudgetPage } from "./BudgetPage";

function expectTruncatedWithTitle(full: string) {
  const els = screen.getAllByTitle(full);
  // 分组汇总行 + 分类行各出现一次
  expect(els.length).toBeGreaterThanOrEqual(2);
  for (const el of els) expect(el.className).toContain("truncate");
}

describe("BudgetPage 大额金额省略展示", () => {
  beforeEach(() => {
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  it("分配/活动/可用超长时截断，并通过 title 提供完整金额", async () => {
    render(<BudgetPage />);
    await screen.findByText("大额分类");

    expectTruncatedWithTitle("¥1,234,567,890.00");
    expectTruncatedWithTitle("-¥1,234,567,890.00");
    expectTruncatedWithTitle("¥987,654,321.00");
  });
});
