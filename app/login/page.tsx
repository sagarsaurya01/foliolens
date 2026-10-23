import { signInAction } from "@/app/actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4">
      <div className="w-full">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand text-lg font-bold text-white">FL</div>
          <h1 className="text-2xl font-bold text-ink">FolioLens</h1>
          <p className="mt-1 text-sm text-muted">Track your investments across assets — value, gains and XIRR.</p>
        </div>
        <form action={signInAction} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="field" defaultValue="sagar@demo.in" />
          </div>
          {searchParams.error === "unknown" && (
            <p className="text-sm text-loss">No account with that email. Use the demo account below.</p>
          )}
          <button className="btn w-full" type="submit">Sign in</button>
          <button className="btn-ghost w-full" type="button" disabled>Continue with Google (coming soon)</button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          Demo account: <code className="rounded bg-white px-2 py-1 text-ink shadow-sm">sagar@demo.in</code>
        </p>
      </div>
    </main>
  );
}
