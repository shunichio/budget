// @vitest-environment jsdom
// 移动端(<768px)账户明细:卡片列表 + 底部抽屉记账。jsdom 无 matchMedia → 默认移动端路径。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => ({
  accountRegister: vi.fn(),
  createTx: vi.fn(),
  updateTx: vi.fn(),
  deleteTx: vi.fn(),
  setTxStatus: vi.fn(),
  refreshBoot: vi.fn().mockResolvedValue({}),
  toast: vi.fn(),
}));

vi.mock("../api", () => ({
  api: {
    accountRegister: h.accountRegister,
    createTx: h.createTx,
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
        settings: { currencySymbol: "¥", language: "zh" },
        accounts: [
          { id: "acc-1", name: "现金", type: "cash", on_budget: 1, closed: 0, starting_balance: 10000 },
          { id: "acc-2", name: "储蓄卡", type: "checking", on_budget: 1, closed: 0, starting_balance: 0 },
        ],
        payees: [],
        groups: [
          {
            id: "g1",
            name: "日常",
            categories: [
              { id: "cat-food", group_id: "g1", name: "餐饮" },
              { id: "cat-other", group_id: "g1", name: "其他收入" },
            ],
          },
        ],
        currentMonth: "2026-11",
      },
      t: makeT("zh"),
      lang: "zh",
      refreshBoot: h.refreshBoot,
      toast: h.toast,
    }),
  };
});

import { AccountDetailPage } from "./AccountDetailPage";
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

const reg = {
  account: { name: "现金", type: "cash", balance: 123400 },
  transactions: [
    tx({ id: "t1", payeeName: "超市", categoryId: "cat-food", categoryName: "餐饮", amount: -3500, memo: "买菜", balance: 88900, cleared: 1 }),
    tx({ id: "t2", payeeName: "工资", amount: 500000, balance: 123400, date: "2026-11-06" }),
  ],
};

beforeEach(() => {
  h.accountRegister.mockResolvedValue(reg);
  h.createTx.mockResolvedValue({ ok: true });
  h.updateTx.mockResolvedValue({ ok: true });
});
afterEach(cleanup);

describe("AccountDetailPage 移动端", () => {
  it("渲染卡片列表(含余额),不渲染桌面表格与常驻表单", async () => {
    render(<AccountDetailPage id="acc-1" />);
    expect(await screen.findByText("超市")).toBeTruthy();
    expect(screen.getByTestId("tx-card-list")).toBeTruthy();
    expect(screen.queryByTestId("tx-desktop-table")).toBeNull();
    expect(screen.getByText("¥35.00")).toBeTruthy();
    expect(screen.getByText("¥889.00")).toBeTruthy(); // 余额列保留在卡片上
    // 常驻表单被"新增交易"按钮替代
    expect(screen.queryByText("连续记账")).toBeNull();
    expect(screen.getByRole("button", { name: /新增交易/ })).toBeTruthy();
  });

  it("点「新增交易」打开抽屉,填写并保存调用 createTx", async () => {
    render(<AccountDetailPage id="acc-1" />);
    fireEvent.click(await screen.findByRole("button", { name: /新增交易/ }));
    const dlg = await screen.findByRole("dialog");
    expect(dlg.className).toContain("sheet-panel");
    fireEvent.change(screen.getByLabelText("收款方 / 商家"), { target: { value: "菜市场" } });
    fireEvent.change(screen.getByLabelText("流出"), { target: { value: "12.5" } });
    fireEvent.click(screen.getByText("保存"));
    await waitFor(() => expect(h.createTx).toHaveBeenCalled());
    expect(h.createTx.mock.calls[0][0]).toMatchObject({ accountId: "acc-1", payeeName: "菜市场", amount: -1250 });
  });

  it("点编辑打开抽屉带原值,保存调用 updateTx", async () => {
    render(<AccountDetailPage id="acc-1" />);
    const editBtns = await screen.findAllByTitle("编辑");
    fireEvent.click(editBtns[0]); // 超市
    await screen.findByRole("dialog");
    expect(screen.getByDisplayValue("超市")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("流出"), { target: { value: "40" } });
    fireEvent.click(screen.getByText("保存"));
    await waitFor(() => expect(h.updateTx).toHaveBeenCalled());
    expect(h.updateTx.mock.calls[0][0]).toBe("t1");
    expect(h.updateTx.mock.calls[0][1]).toMatchObject({ amount: -4000 });
  });
});
