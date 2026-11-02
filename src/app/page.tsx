import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Columns3,
  Flag,
  LayoutList,
  Leaf,
  Lock,
  MessageSquare,
  Sparkles,
  Star,
  Users,
  Workflow,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { BRAND } from "@/lib/brand";

const features = [
  { icon: LayoutList, title: "Lists & subtasks", text: "Break any project into tasks, subtasks and checklists that stay organised by space." },
  { icon: Columns3, title: "Kanban boards", text: "Drag cards across stages and see work flow like a stream through the woods." },
  { icon: BarChart3, title: "Live dashboards", text: "Status, priority and workload charts update the moment a task moves." },
  { icon: MessageSquare, title: "Threaded comments", text: "Keep every conversation next to the work it's about — no more lost chats." },
  { icon: Users, title: "Workspaces & roles", text: "Invite your team, assign owners and keep permissions enforced on the server." },
  { icon: Lock, title: "Secure by default", text: "Hashed passwords, signed tokens and per-workspace access checks on every request." },
];

const plans = [
  { name: "Seedling", price: "0", text: "For individuals getting rooted.", perks: ["Unlimited tasks", "2 spaces", "List & board views"] },
  { name: "Grove", price: "8", text: "For growing teams.", perks: ["Unlimited spaces", "Dashboards", "Comments & mentions", "Priority support"], featured: true },
  { name: "Forest", price: "19", text: "For organisations at scale.", perks: ["Everything in Grove", "Advanced permissions", "Automations", "SSO & audit log"] },
];

function HeroMockup() {
  const cols = [
    { label: "To Do", color: "#94a39a", cards: [["Plan Q4 roadmap", "#dc4c3e", "A"], ["Customer interviews", "#4b8fd1", "R"]] },
    { label: "In Progress", color: "#e9b949", cards: [["New onboarding flow", "#e39b2d", "S"], ["Pricing page copy", "#4b8fd1", "M"]] },
    { label: "Complete", color: "#3b8052", cards: [["Brand refresh", "#a3ada7", "T"]] },
  ];
  return (
    <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up [animation-delay:200ms]">
      <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-tr from-fern/30 via-moss/20 to-amber-leaf/30 blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-forest-900/80 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#ff6159]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c941]" />
          <span className="ml-4 rounded-md bg-white/5 px-3 py-1 text-xs text-forest-200">app.canopy.io / Product Launch</span>
        </div>
        <div className="flex">
          <aside className="hidden w-52 shrink-0 border-r border-white/10 p-4 text-sm text-forest-200 md:block">
            {["Home", "My Tasks", "Dashboard"].map((x, i) => (
              <div key={x} className={`mb-1 rounded-lg px-3 py-2 ${i === 0 ? "bg-white/10 text-white" : ""}`}>{x}</div>
            ))}
            <div className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-forest-400">Spaces</div>
            {[["Marketing", "#9bc53d"], ["Engineering", "#2fb6a4"], ["Design", "#e9b949"]].map(([n, c]) => (
              <div key={n} className="flex items-center gap-2 px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded" style={{ background: c }} /> {n}
              </div>
            ))}
          </aside>
          <div className="grid flex-1 grid-cols-1 gap-4 bg-cream p-5 sm:grid-cols-3">
            {cols.map((col) => (
              <div key={col.label}>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-forest-800">
                  <span className="rounded px-2 py-0.5 text-white" style={{ background: col.color }}>{col.label}</span>
                  <span className="text-forest-400">{col.cards.length}</span>
                </div>
                {col.cards.map(([t, c, a]) => (
                  <div key={t} className="mb-3 rounded-xl border border-forest-100 bg-white p-3 text-left shadow-sm">
                    <div className="text-sm font-semibold text-ink">{t}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <Flag size={13} fill={c} stroke={c} />
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-600 text-[10px] font-bold text-white">{a}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -left-6 top-24 hidden animate-float rounded-2xl border border-forest-100 bg-white p-3 shadow-xl lg:block">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <CheckCircle2 className="text-forest-500" size={18} /> Task completed
        </div>
        <div className="mt-1 text-xs text-forest-500">Brand refresh · just now</div>
      </div>
      <div className="absolute -right-6 bottom-16 hidden animate-float rounded-2xl border border-forest-100 bg-white p-3 shadow-xl [animation-delay:1.5s] lg:block">
        <div className="text-xs font-semibold text-forest-500">Sprint progress</div>
        <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-forest-100">
          <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-fern to-forest-600" />
        </div>
        <div className="mt-1 text-right text-xs font-bold text-ink">72%</div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="overflow-x-hidden">
      {/* Hero */}
      <section className="bg-canopy relative pb-24 text-white">
        <div className="grid-lines absolute inset-0" />
        <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Logo light />
          <div className="hidden items-center gap-8 text-sm text-forest-100 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#views" className="hover:text-white">Views</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-forest-100 hover:text-white">Log in</Link>
            <Link href="/register" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-forest-800 shadow-lg transition hover:bg-forest-50">
              Get started
            </Link>
          </div>
        </nav>

        <div className="relative mx-auto max-w-4xl px-5 pt-16 text-center">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-forest-100 backdrop-blur">
            <Sparkles size={14} className="text-amber-leaf" /> The calm, all-in-one workspace for teams
          </span>
          <h1 className="mt-6 animate-fade-up font-display text-5xl font-semibold leading-[1.05] tracking-tight [animation-delay:80ms] sm:text-7xl">
            One place for all your work,<br />
            <span className="text-gradient">rooted &amp; growing.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-forest-100/80 [animation-delay:140ms]">
            {BRAND.name} brings tasks, boards, docs and dashboards together so your team can plan, track and ship — without the noise.
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap items-center justify-center gap-3 [animation-delay:180ms]">
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fern to-moss px-6 py-3.5 text-sm font-bold text-forest-950 shadow-xl shadow-fern/20 transition hover:brightness-105">
              Start for free <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link href="/login" className="rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
              Sign in to workspace
            </Link>
          </div>
          <p className="mt-4 text-xs text-forest-300">Free forever for personal use · No credit card</p>
        </div>
        <div className="relative px-5">
          <HeroMockup />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-forest-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-14 gap-y-4 px-5 text-lg font-semibold text-forest-300">
          {["Evergreen", "Mossworks", "Pinecrest", "Riverbend", "Oakline", "Fernhill"].map((n) => (
            <span key={n} className="flex items-center gap-2"><Leaf size={18} /> {n}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-forest-500">Features</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Everything your team needs to thrive</h2>
          <p className="mt-4 text-forest-600">Replace scattered tools with a single workspace that grows with you.</p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card group p-7 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-100 to-forest-50 text-forest-600 ring-1 ring-forest-200 transition group-hover:from-forest-600 group-hover:to-forest-500 group-hover:text-white">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-forest-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Views */}
      <section id="views" className="bg-cream py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-forest-500">Views</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">See work the way you think</h2>
            <p className="mt-4 text-forest-600">Switch between list, board and dashboard in a single click. Same tasks, different lenses.</p>
            <ul className="mt-8 space-y-4">
              {[
                [LayoutList, "List view", "Grouped by status with inline priority, assignee and dates."],
                [Columns3, "Board view", "Drag-and-drop kanban that updates instantly for the team."],
                [CalendarDays, "Due dates", "Overdue and upcoming work highlighted automatically."],
                [Workflow, "Spaces → Lists → Tasks", "A clear hierarchy that scales from one project to hundreds."],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof LayoutList;
                return (
                  <li key={t as string} className="flex gap-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-600 text-white"><I size={18} /></span>
                    <div>
                      <div className="font-bold text-ink">{t as string}</div>
                      <div className="text-sm text-forest-600">{d as string}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="flex items-center gap-1 border-b border-forest-100 px-4 pt-3">
              {["List", "Board", "Dashboard"].map((t, i) => (
                <span key={t} className={`border-b-2 px-3 pb-2.5 text-sm font-semibold ${i === 0 ? "border-forest-600 text-forest-700" : "border-transparent text-forest-400"}`}>{t}</span>
              ))}
            </div>
            <div className="p-4">
              {[
                ["Design homepage hero", "IN PROGRESS", "#e9b949", "#e39b2d", "Today"],
                ["Write API docs", "TO DO", "#94a39a", "#4b8fd1", "Nov 8"],
                ["Set up MongoDB Atlas", "COMPLETE", "#3b8052", "#a3ada7", "Nov 1"],
                ["QA mobile layouts", "REVIEW", "#2fb6a4", "#dc4c3e", "Tomorrow"],
                ["Launch announcement", "TO DO", "#94a39a", "#e39b2d", "Nov 12"],
              ].map(([t, s, sc, pc, d]) => (
                <div key={t} className="flex items-center gap-3 border-b border-forest-50 py-3 last:border-0">
                  <span className="h-3 w-3 rounded-full" style={{ background: sc }} />
                  <span className="flex-1 text-sm font-medium text-ink">{t}</span>
                  <span className="hidden rounded px-2 py-0.5 text-[10px] font-bold text-white sm:inline" style={{ background: sc }}>{s}</span>
                  <Flag size={13} fill={pc} stroke={pc} />
                  <span className="w-16 text-right text-xs text-forest-500">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-canopy py-20 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 text-center sm:grid-cols-4">
          {[["40%", "less time in meetings"], ["3×", "faster project delivery"], ["12k+", "teams growing with us"], ["99.9%", "uptime on Atlas"]].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-5xl font-semibold text-gradient">{n}</div>
              <div className="mt-2 text-sm text-forest-200">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="flex justify-center gap-1 text-amber-leaf">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={20} fill="currentColor" />)}
        </div>
        <blockquote className="mt-6 font-display text-3xl font-medium leading-snug text-ink">
          “We moved four tools into {BRAND.name} in a week. The team finally knows what everyone is working on — and it actually feels calm.”
        </blockquote>
        <div className="mt-6 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-600 font-bold text-white">NR</span>
          <div className="text-left">
            <div className="font-bold text-ink">Nadia Rahman</div>
            <div className="text-sm text-forest-500">Head of Product, Pinecrest</div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-cream py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-forest-500">Pricing</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Simple plans that grow with you</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-3xl p-8 ${p.featured ? "bg-canopy text-white shadow-2xl shadow-forest-900/30 md:-translate-y-4" : "card"}`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-8 rounded-full bg-amber-leaf px-3 py-1 text-xs font-bold text-forest-950">Most popular</span>
                )}
                <div className={`text-lg font-bold ${p.featured ? "" : "text-ink"}`}>{p.name}</div>
                <div className={`text-sm ${p.featured ? "text-forest-200" : "text-forest-500"}`}>{p.text}</div>
                <div className="mt-6 flex items-end gap-1">
                  <span className="font-display text-5xl font-semibold">${p.price}</span>
                  <span className={`mb-2 text-sm ${p.featured ? "text-forest-200" : "text-forest-500"}`}>/ user / mo</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <Check size={16} className={p.featured ? "text-fern" : "text-forest-500"} /> {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition ${p.featured ? "bg-gradient-to-r from-fern to-moss text-forest-950 hover:brightness-105" : "bg-forest-600 text-white hover:bg-forest-700"}`}
                >
                  Choose {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-24">
        <div className="bg-canopy relative mx-auto max-w-5xl overflow-hidden rounded-[32px] px-8 py-16 text-center text-white">
          <div className="grid-lines absolute inset-0" />
          <Bell className="relative mx-auto text-amber-leaf" size={32} />
          <h2 className="relative mt-4 font-display text-4xl font-semibold sm:text-5xl">Plant your first project today</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-forest-100/80">Create a free workspace in under a minute. Your team will thank you.</p>
          <Link href="/register" className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-forest-800 shadow-xl transition hover:bg-forest-50">
            Get started free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-forest-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-forest-500">© {new Date().getFullYear()} {BRAND.name}. Built with Next.js, NestJS &amp; MongoDB Atlas.</p>
        </div>
      </footer>
    </main>
  );
}
