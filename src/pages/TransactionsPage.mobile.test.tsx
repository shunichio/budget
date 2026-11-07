// @vitest-environment jsdom
// 移动端(<768px)交易页:卡片列表 + 底部抽屉编辑。jsdom 无 matchMedia → 默认移动端路径。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => ({
  transactions: vi.fn(),
  setTxCategory: vi.fn(),
  updateTx: vi.fn(),
  deleteTx: vi.fn(),
  setTxStatus: vi.fn(),
  refreshBoot: vi.fn().mockResolvedValue({}),
  toast: vi.fn(),
}));

vi.mock("../api", () => ({
  api: {
    transactions: h.transactions,
    setTxCategory: h.setTxCategory,
    updateTx: h.updateTx,
    deleteTx: h.deleteTx,
    setTxStatus: h.setTxStatus,
  },
}));

vi.mock("../store", async () => {
  const { makeT } = await import("../i18n");
  return {
    useApp: () => ({
      boot: {
        accounts: [
          { id: "acc-1", name: "现金", type: "cash", on_budget: 1, closed: 0 },
          { id: "acc-2", name: "储蓄卡", type: "checking", on_budget: 1, closed: 0 },
        ],
        payees: [],
        groups: [
          {
            id: "g1",
            name: "日常",
            categories: [
              { id: "cat-food", group_id: "g1", name: "餐饮" },
              { id: "cat-traffic", group_id: "g1", name: "交通" },
            ],
          },
        ],
      },
      t: makeT("zh"),
      lang: "zh",
      refreshBoot: h.refreshBoot,
      toast: h.toast,
    }),
  };
});

import { TransactionsPage } from "./TransactionsPage";
import type { Tx } from "../types";

function tx(partial: Partial<Tx>): Tx {
  return {
    id: "tx",
    accountId: "acc-1",
    date: "2026-11-07",
    payeeName: null,
    isStart: false,
    transferAccountId: null,
    otherAccountName: null,
    otherAccountType: null,
    categoryId: null,
    categoryName: null,
    memo: null,
    amount: 0,
    cleared: 0,
    reconciled: 0,
    ...partial,
  };
}

const txs = [
  tx({ id: "t1", payeeName: "超市", categoryId: "cat-food", categoryName: "餐饮", amount: -3500, memo: "买菜" }),
  tx({ id: "t2", payeeName: "工资", amount: 500000, date: "2026-11-06" }),
];

beforeEach(() => {
  h.transactions.mockResolvedValue({ transactions: txs, total: 2 });
  h.updateTx.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

describe("TransactionsPage 移动端", () => {
  it("渲染卡片列表,不渲染十列网格;卡片含 收支/金额/分类/备注", async () => {
    render(<TransactionsPage />);
    expect(await screen.findByText("超市")).toBeTruthy();
    expect(screen.getByTestId("tx-card-list")).toBeTruthy();
    expect(screen.queryByTestId("tx-desktop-table")).toBeNull();
    expect(screen.getByText("¥35.00")).toBeTruthy(); // 流出
    expect(screen.getByText("¥5,000.00")).toBeTruthy(); // 流入
    expect(screen.getByText("餐饮")).toBeTruthy();
    expect(screen.getByText("买菜")).toBeTruthy();
    expect(screen.getByText("11月7日")).toBeTruthy();
  });

  it("点编辑打开底部抽屉(非行内网格),字段带原值;保存调用 updateTx", async () => {
    render(<TransactionsPage />);
    const editBtns = await screen.findAllByTitle("编辑");
    fireEvent.click(editBtns[0]); // 第一张卡:超市
    const dlg = await screen.findByRole("dialog");
    expect(dlg.className).toContain("sheet-panel");
    const payee = screen.getByDisplayValue("超市") as HTMLInputElement;
    expect(payee).toBeTruthy();
    expect(screen.getByDisplayValue("35")).toBeTruthy(); // 流出 35
    fireEvent.change(payee, { target: { value: "菜市场" } });
    fireEvent.click(screen.getByText("保存"));
    await waitFor(() => expect(h.updateTx).toHaveBeenCalled());
    expect(h.updateTx.mock.calls[0][1]).toMatchObject({ payeeName: "菜市场", amount: -3500 });
  });

  it("抽屉内选择转账账户后,收款方禁用", async () => {
    render(<TransactionsPage />);
    const editBtns = await screen.findAllByTitle("编辑");
    fireEvent.click(editBtns[0]);
    await screen.findByRole("dialog");
    const payee = screen.getByDisplayValue("超市") as HTMLInputElement;
    const transfer = screen.getByLabelText("账户间转账") as HTMLSelectElement;
    expect(transfer.value).toBe("");
    fireEvent.change(transfer, { target: { value: "acc-2" } });
    expect(payee.disabled).toBe(true);
  });
});
