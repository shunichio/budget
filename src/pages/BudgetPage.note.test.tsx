// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => {
  const budgetData = (month: string) => ({
    month,
    months: ["2026-02"],
    maxMonth: "2026-04",
    readyToAssign: 10000,
    incomeThisMonth: 800000,
    assignedTotal: 50000,
    overspentTotal: 0,
    uncategorizedCount: 0,
    ageOfMoney: 12,
    groups: [
      {
        id: "g1",
        name: "Everyday",
        virtual: false,
        categories: [
          {
            id: "cat-1",
            name: "Groceries",
            assigned: 50000,
            activity: -20000,
            available: 30000,
            goal: null,
            need: null,
            lastAssigned: 40000,
            avgSpend: 25000,
            note: "周末集中采购\n尽量买有机菜",
          },
        ],
      },
    ],
  });
  const boot = {
    settings: { currencySymbol: "¥", language: "zh", aiBaseUrl: "", aiModel: "", aiKey: "" },
    accounts: [],
    payees: [],
    groups: [],
    currentMonth: "2026-02",
  };
  const updateCategory = vi.fn().mockResolvedValue({ ok: true });
  return { budgetData, boot, updateCategory };
});

vi.mock("../api", () => ({
  api: new Proxy(
    { budget: (m: string) => Promise.resolve(h.budgetData(m)), updateCategory: h.updateCategory },
    {
      get: (target, prop) =>
        prop in target ? target[prop as keyof typeof target] : vi.fn().mockResolvedValue({}),
    }
  ),
}));

vi.mock("../store", () => {
  const t = (k: string) => k;
  const toast = vi.fn();
  const useApp = () => ({
    boot: h.boot,
    loading: false,
    lang: "zh" as const,
    t,
    toast,
    setLang: vi.fn(),
    refreshBoot: vi.fn().mockResolvedValue({}),
  });
  return { useApp };
});

import { BudgetPage } from "./BudgetPage";

async function openInspector() {
  render(<BudgetPage />);
  fireEvent.click(await screen.findByText("Groceries"));
  return screen.findByRole("dialog");
}

describe("BudgetPage Inspector 备注维护", () => {
  beforeAll(() => {
    // 桌面行为路径:BudgetPage 依赖 matchMedia 区分移动/桌面,jsdom 未实现,这里 stub 成桌面
    Element.prototype.scrollIntoView = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (q: string) => ({
        matches: true,
        media: q,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false,
      }),
    });
  });
  afterEach(cleanup);
  beforeEach(() => {
    localStorage.clear();
    h.updateCategory.mockClear();
  });

  it("备注编辑框显示分类已有的多行备注", async () => {
    await openInspector();
    const box = await screen.findByLabelText("inspector_note");
    expect((box as HTMLTextAreaElement).value).toBe("周末集中采购\n尽量买有机菜");
  });

  it("保存后调用 updateCategory 提交新备注", async () => {
    await openInspector();
    const box = await screen.findByLabelText("inspector_note");
    fireEvent.change(box, { target: { value: "改成新的备注" } });
    fireEvent.click(screen.getByText("common_save"));
    await waitFor(() => {
      expect(h.updateCategory).toHaveBeenCalledWith("cat-1", { note: "改成新的备注" });
    });
  });
});
