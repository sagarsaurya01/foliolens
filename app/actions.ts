"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setCurrentUser, clearCurrentUser, currentUserId } from "@/lib/session";
import { getUsers, createPortfolio, addTxn, getPortfolio } from "@/lib/data";
import { toPaise } from "@/lib/finance";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const user = getUsers().find((u) => u.email.toLowerCase() === email);
  if (!user) redirect("/login?error=unknown");
  setCurrentUser(user.id);
  redirect("/dashboard");
}

export async function signOutAction() {
  clearCurrentUser();
  redirect("/login");
}

export async function createPortfolioAction(formData: FormData) {
  const me = currentUserId();
  if (!me) redirect("/login");
  const name = String(formData.get("name") || "").trim();
  const broker = String(formData.get("broker") || "").trim() || null;
  const kind = (String(formData.get("kind") || "investment") === "trading" ? "trading" : "investment") as
    | "investment"
    | "trading";
  if (!name) redirect("/portfolios?error=name");
  const p = createPortfolio(me, name, broker, kind);
  revalidatePath("/portfolios");
  redirect(`/portfolios/${p.id}`);
}

export async function addTxnAction(formData: FormData) {
  const me = currentUserId();
  if (!me) redirect("/login");
  const portfolioId = String(formData.get("portfolioId"));
  const p = getPortfolio(portfolioId);
  if (!p || p.userId !== me) redirect("/portfolios");
  const securityId = String(formData.get("securityId"));
  const type = String(formData.get("type")) === "sell" ? "sell" : "buy";
  const tradeDate = String(formData.get("tradeDate") || new Date().toISOString().slice(0, 10));
  const quantity = Number(formData.get("quantity") || 0);
  const price = Number(formData.get("price") || 0);
  const charges = Number(formData.get("charges") || 0);
  if (!securityId || quantity <= 0 || price <= 0) redirect(`/portfolios/${portfolioId}?error=input`);
  addTxn({
    portfolioId,
    securityId,
    type,
    tradeDate,
    quantity,
    pricePaise: toPaise(price),
    chargesPaise: toPaise(charges),
  });
  revalidatePath(`/portfolios/${portfolioId}`);
  revalidatePath("/dashboard");
  redirect(`/portfolios/${portfolioId}`);
}
