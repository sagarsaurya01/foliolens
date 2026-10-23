import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { User } from "@/lib/data";

// MProfit-style layout: dark left sidebar with an account switcher at the top
// and nav below; cream main area.
export default function Shell({
  user,
  active,
  children,
}: {
  user: User;
  active: "dashboard" | "portfolios";
  children: React.ReactNode;
}) {
  const item = (href: string, label: string, key: string, icon: string) => (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active === key ? "bg-sidebar-hover text-white" : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
      }`}
    >
      <span aria-hidden className="w-5 text-center">{icon}</span>
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar px-3 py-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">FL</span>
          <span className="text-lg font-bold text-white">FolioLens</span>
        </div>

        {/* account switcher */}
        <div className="mb-4 rounded-lg bg-sidebar-hover px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-sidebar-text">Account</p>
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {item("/dashboard", "Dashboard", "dashboard", "◑")}
          {item("/portfolios", "Portfolios", "portfolios", "▤")}
        </nav>

        <form action={signOutAction} className="mt-auto px-1">
          <button className="text-xs text-sidebar-text hover:text-white" type="submit">Sign out</button>
        </form>
      </aside>

      {/* mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-sidebar px-4 py-3 md:hidden">
          <span className="flex items-center gap-2 text-white">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-xs font-bold">FL</span>
            <span className="font-bold">FolioLens</span>
          </span>
          <nav className="flex items-center gap-3 text-sm text-sidebar-text">
            <Link href="/dashboard" className={active === "dashboard" ? "text-white" : ""}>Dashboard</Link>
            <Link href="/portfolios" className={active === "portfolios" ? "text-white" : ""}>Portfolios</Link>
            <form action={signOutAction}><button type="submit">Exit</button></form>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
