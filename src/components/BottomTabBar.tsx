import { Landmark, ListChecks, Sparkles, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useApp } from "../store";
import type { TKey } from "../i18n";

const TABS: { href: string; icon: LucideIcon; key: TKey }[] = [
  { href: "#/budget", icon: Wallet, key: "nav_budget" },
  { href: "#/transactions", icon: ListChecks, key: "nav_transactions" },
  { href: "#/accounts", icon: Landmark, key: "nav_accounts" },
  { href: "#/reports", icon: TrendingUp, key: "nav_reports" },
  { href: "#/chat", icon: Sparkles, key: "nav_chat" },
];

/** 移动端底部 Tab 导航(md 断点以上由常驻侧边栏接管)。 */
export function BottomTabBar({ route }: { route: string }) {
  const { t } = useApp();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {TABS.map(({ href, icon: Icon, key }) => {
        const active = route.startsWith(href);
        return (
          <a
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              active ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon size={19} strokeWidth={active ? 2.4 : 2} />
            {t(key)}
          </a>
        );
      })}
    </nav>
  );
}
