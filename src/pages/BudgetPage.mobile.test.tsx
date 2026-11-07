// @vitest-environment jsdom
// 移动端(<768px)预算页:单月列表式布局。jsdom 的 matchMedia 恒为 false,即移动端路径。
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

const h = vi.hoisted(() => {
  const budgetData = (month: string) => ({
    month,
    months: ["2026-02"],
    maxMonth: "2026-04",
    readyToAssign: 3468600,
    incomeThisMonth: 1323800,
    assignedTotal: 230000,
    overspentTotal: 0,
    uncategorizedCount: 0,
    ageOfMoney: 12,
    groups: [
      {
        id: "g1",
        name: "日常开销",
        virtual: false,
        isIncome: false,
        categories: [
          {
            id: "cat-1",
            name: "食品杂货",
            assigned: 140000,
            activity: -135681,
            available: 14313,
            goal: null,
            need: { need: 50000, target: 50000, type: "monthly" },
            lastAssigned: 40000,
            avgSpend: 25000,
          },
          {
            id: "cat-2",
            name: "餐饮外出",
            assigned: 90000,
            activity: -50840,
            available: 183892,
            goal: null,
            need: null,
            lastAssigned: 90000,
            avgSpend: 60000,
          },
        ],
      },
      {
        id: "g2",
        name: "收入",
        virtual: false,
        isIncome: true,
        categories: [
          {
            id: "cat-i1",
            name: "工资薪酬",
            assigned: 0,
            activity: 1323800,
            available: 0,
            goal: null,
            need: null,
            lastAssigned: 0,
            avgSpend: 0,
            isIncome: true,
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
        starting_balance: 10000,
        starting_balance_date: null,
        sort_order: 0,
        created_at: "",
        balance: 10000,
      },
    ],
    payees: [],
    groups: [
      { id: "g1", name: "日常开销" },
      { id: "g2", name: "收入" },
    ],
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
  const t = (k: string) => k;
  const toast = vi.fn();
  const setLang = vi.fn();
  const refreshBoot = vi.fn().mockResolvedValue({});
  const useApp = () => ({
    boot: h.boot,
    loading: false,
    lang: "zh" as const,
    t,
    toast,
    setLang,
    refreshBoot,
  });
  return { useApp };
});

import { BudgetPage } from "./BudgetPage";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
});

describe("BudgetPage 移动端单月列表", () => {
  it("渲染单月列表:分类行含 已分配/活动/可用,不渲染桌面三月网格列头", async () => {
    render(<BudgetPage />);
    expect(await screen.findByText("食品杂货")).toBeTruthy();
    expect(screen.getByText("¥1,400.00")).toBeTruthy(); // 已分配
    expect(screen.getByText("-¥1,356.81")).toBeTruthy(); // 活动
    expect(screen.getByText("¥143.13")).toBeTruthy(); // 可用(带状态色)
    // 收入分类显示活动、不显示可用
    expect(screen.getByText("工资薪酬")).toBeTruthy();
    expect(screen.getByText("¥13,238.00")).toBeTruthy();
    // 桌面列头与 MonthHead 不存在(budget_availableCol 仅桌面列头使用)
    expect(screen.queryByText("budget_availableCol")).toBeNull();
  });

  it("点击分类行打开底部抽屉(而非桌面右侧抽屉),含快速分配;Escape 关闭", async () => {
    render(<BudgetPage />);
    fireEvent.click(await screen.findByText("食品杂货"));
    const dlg = await screen.findByRole("dialog");
    expect(dlg.className).toContain("sheet-panel");
    expect(dlg.className).not.toContain("inset-y-0");
    expect(dlg.textContent).toContain("inspector_available");
    expect(dlg.textContent).toContain("inspector_needTarget"); // need 快速分配按钮
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("组头 … 菜单在移动端为动作列表抽屉(重命名/添加分类/删除)", async () => {
    render(<BudgetPage />);
    fireEvent.click(await screen.findByText("食品杂货"));
    fireEvent.keyDown(window, { key: "Escape" });
    const menus = screen.getAllByRole("button", { name: "group_menu" });
    fireEvent.click(menus[0]);
    const dlg = await screen.findByRole("dialog");
    expect(dlg.textContent).toContain("budget_rename");
    expect(dlg.textContent).toContain("budget_addCategory");
    expect(dlg.textContent).toContain("budget_delete");
  });
});
