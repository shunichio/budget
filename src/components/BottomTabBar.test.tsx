// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { BottomTabBar } from "./BottomTabBar";

vi.mock("../store", () => ({
  useApp: () => ({ t: (k: string) => k }),
}));

afterEach(cleanup);

test("渲染 5 个导航 Tab,链接指向对应 hash 路由,且仅移动端可见", () => {
  render(<BottomTabBar route="#/budget" />);
  const links = screen.getAllByRole("link");
  expect(links.map((a) => a.getAttribute("href"))).toEqual([
    "#/budget",
    "#/transactions",
    "#/accounts",
    "#/reports",
    "#/chat",
  ]);
  const nav = links[0].closest("nav") as HTMLElement;
  expect(nav.className).toContain("md:hidden");
  expect(nav.className).toContain("pb-[env(safe-area-inset-bottom)]");
});

test("当前路由对应的 Tab 标记 aria-current=page,其余不标", () => {
  render(<BottomTabBar route="#/accounts/abc-1" />);
  expect(screen.getByRole("link", { name: "nav_accounts" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "nav_budget" }).getAttribute("aria-current")).toBeNull();
  expect(screen.getByRole("link", { name: "nav_chat" }).getAttribute("aria-current")).toBeNull();
});
