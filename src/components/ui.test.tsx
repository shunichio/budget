// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Sheet } from "./ui";

afterEach(cleanup);

test("Sheet:渲染标题与内容,面板为底部抽屉形态(贴底 + 顶圆角 + 安全区内边距)", () => {
  render(
    <Sheet title="餐饮" onClose={() => {}}>
      <div>面板内容</div>
    </Sheet>
  );
  expect(screen.getByText("面板内容")).toBeTruthy();
  expect(screen.getByText("餐饮")).toBeTruthy();
  const panel = screen.getByText("面板内容").closest(".sheet-panel") as HTMLElement;
  expect(panel.className).toContain("bottom-0");
  expect(panel.className).toContain("rounded-t-2xl");
  expect(panel.className).toContain("pb-[env(safe-area-inset-bottom)]");
});

test("Sheet:点击标题栏 X 或按 Escape 均触发 onClose", () => {
  const onClose = vi.fn();
  render(
    <Sheet title="餐饮" onClose={onClose}>
      <div>面板内容</div>
    </Sheet>
  );
  fireEvent.click(screen.getByRole("button", { name: "close" }));
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(2);
});

test("Sheet:点遮罩关闭,点面板内容不关闭", () => {
  const onClose = vi.fn();
  render(
    <Sheet title="餐饮" onClose={onClose}>
      <div>面板内容</div>
    </Sheet>
  );
  const panel = screen.getByText("面板内容").closest(".sheet-panel") as HTMLElement;
  fireEvent.mouseDown(panel);
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.mouseDown(panel.parentElement as HTMLElement);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("Sheet:无标题时不渲染标题栏,但关闭按钮仍可用", () => {
  const onClose = vi.fn();
  render(
    <Sheet onClose={onClose}>
      <button>动作一</button>
    </Sheet>
  );
  expect(screen.queryByText("餐饮")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "close" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
