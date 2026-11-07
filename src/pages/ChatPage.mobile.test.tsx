// @vitest-environment jsdom
// 移动端(<768px)聊天页:无侧栏,会话列表走底部抽屉。jsdom 无 matchMedia → 默认移动端路径。
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => ({
  chatSessions: vi.fn(),
  chatSession: vi.fn(),
  createChatSession: vi.fn(),
  deleteChatSession: vi.fn(),
  refreshBoot: vi.fn().mockResolvedValue({}),
  toast: vi.fn(),
}));

vi.mock("../api", () => ({
  api: {
    chatSessions: h.chatSessions,
    chatSession: h.chatSession,
    createChatSession: h.createChatSession,
    deleteChatSession: h.deleteChatSession,
    renameChatSession: vi.fn().mockResolvedValue({ ok: true }),
    sendChatMessage: vi.fn(),
  },
}));

vi.mock("../store", async () => {
  const { makeT } = await import("../i18n");
  return {
    useApp: () => ({
      boot: { settings: { aiKey: "sk-test", currencySymbol: "¥", language: "zh" } },
      t: makeT("zh"),
      lang: "zh",
      refreshBoot: h.refreshBoot,
      toast: h.toast,
    }),
  };
});

import { ChatPage } from "./ChatPage";

const sessions = [
  { id: "s1", title: "十一月开销分析", updatedAt: "2026-11-07T10:00:00Z" },
  { id: "s2", title: "测试会话", updatedAt: "2026-11-06T10:00:00Z" },
];

beforeEach(() => {
  h.chatSessions.mockResolvedValue({ sessions });
  h.chatSession.mockResolvedValue({ session: sessions[0], messages: [], status: null });
  h.createChatSession.mockResolvedValue({ session: { id: "s9", title: "新会话", updatedAt: "" } });
  h.deleteChatSession.mockResolvedValue({ ok: true });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ChatPage 移动端", () => {
  it("无常驻侧栏,顶栏提供会话入口", async () => {
    render(<ChatPage />);
    expect(await screen.findByText("智能助手")).toBeTruthy();
    expect(document.querySelector("aside")).toBeNull();
    expect(screen.getByRole("button", { name: "会话列表" })).toBeTruthy();
  });

  it("点会话按钮打开抽屉,选择会话即加载并关闭", async () => {
    render(<ChatPage />);
    fireEvent.click(await screen.findByRole("button", { name: "会话列表" }));
    const dlg = await screen.findByRole("dialog");
    expect(dlg.textContent).toContain("十一月开销分析");
    fireEvent.click(screen.getByText("十一月开销分析"));
    await waitFor(() => expect(h.chatSession).toHaveBeenCalledWith("s1"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("抽屉内删除会话走确认并调用 API", async () => {
    render(<ChatPage />);
    fireEvent.click(await screen.findByRole("button", { name: "会话列表" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getAllByRole("button", { name: "删除" })[0]);
    await waitFor(() => expect(h.deleteChatSession).toHaveBeenCalledWith("s1"));
  });
});
