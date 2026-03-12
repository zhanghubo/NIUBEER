import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 开发者工具落地页 - 深色模式、代码预览、功能对比、集成与文档入口
 * @returns {JSX.Element}
 */
export function DeveloperLandingPage() {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const integrations = [
    { name: 'GitHub', icon: '◇' },
    { name: 'npm', icon: '◆' },
    { name: 'VS Code', icon: '▣' },
    { name: 'CLI', icon: '⟩' },
    { name: 'REST API', icon: '{}' },
    { name: 'Webhooks', icon: '⚡' },
  ];

  const comparison = [
    { feature: 'API rate limit', free: '1K req/day', pro: '100K req/day', team: 'Unlimited' },
    { feature: 'Projects', free: '1', pro: '10', team: 'Unlimited' },
    { feature: 'Team members', free: '—', pro: '—', team: '∞' },
    { feature: 'SSO / SAML', free: '—', pro: '—', team: '✓' },
    { feature: 'Priority support', free: '—', pro: '✓', team: '✓' },
    { feature: 'Audit logs', free: '—', pro: '✓', team: '✓' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-100 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#0d0d12]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="font-semibold tracking-tight text-white">DevTools</span>
          <nav className="flex items-center gap-6 text-sm">
            <button type="button" onClick={() => scrollTo('snippet')} className="text-zinc-400 hover:text-white">
              Code
            </button>
            <button type="button" onClick={() => scrollTo('compare')} className="text-zinc-400 hover:text-white">
              Compare
            </button>
            <button type="button" onClick={() => scrollTo('integrations')} className="text-zinc-400 hover:text-white">
              Integrations
            </button>
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300"
            >
              Documentation →
            </a>
          </nav>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Get API key
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        {/* Hero */}
        <section className="mb-20 text-center">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Developer tools that ship.
          </h1>
          <p className="mx-auto max-w-xl text-zinc-400">
            One API for lint, test, and deploy. SDKs for JS, Python, Go. Docs and examples included.
          </p>
        </section>

        {/* Code snippet preview */}
        <section id="snippet" className="mb-20">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Quick start
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#16161d]">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="ml-2 text-xs text-zinc-500">index.js</span>
            </div>
            <pre className="code-block overflow-x-auto p-4">
              <code>
                <span className="syntax-keyword">const</span>{' '}
                <span className="syntax-function">client</span> ={' '}
                <span className="syntax-builtin">DevTools</span>
                <span className="syntax-operator">.</span>
                <span className="syntax-function">create</span>
                <span className="syntax-operator">(</span>
                <span className="syntax-string">{'{\n  apiKey: process.env.DEVTOOLS_API_KEY,\n}'}</span>
                <span className="syntax-operator">)</span>
                <span className="syntax-comment">;</span>
                {'\n\n'}
                <span className="syntax-keyword">await</span>{' '}
                <span className="syntax-function">client</span>
                <span className="syntax-operator">.</span>
                <span className="syntax-property">lint</span>
                <span className="syntax-operator">(</span>
                <span className="syntax-string">{'"src/**"'}</span>
                <span className="syntax-operator">)</span>
                <span className="syntax-comment">;</span>
                {'\n'}
                <span className="syntax-keyword">await</span>{' '}
                <span className="syntax-function">client</span>
                <span className="syntax-operator">.</span>
                <span className="syntax-property">deploy</span>
                <span className="syntax-operator">(</span>
                <span className="syntax-string">{'{ target: "prod" }'}</span>
                <span className="syntax-operator">)</span>
                <span className="syntax-comment">;</span>
              </code>
            </pre>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-[#16161d]">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="ml-2 text-xs text-zinc-500">curl</span>
            </div>
            <pre className="code-block overflow-x-auto p-4">
              <code>
                <span className="syntax-comment"># Run checks via REST</span>
                {'\n'}
                <span className="syntax-keyword">curl</span> -X POST https://api.devtools.example/v1/run \
                {'\n  '}
                -H <span className="syntax-string">"Authorization: Bearer $API_KEY"</span> \
                {'\n  '}
                -d <span className="syntax-string">{'{"project": "my-app"}'}</span>
              </code>
            </pre>
          </div>
        </section>

        {/* Feature comparison table */}
        <section id="compare" className="mb-20">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Compare plans
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-4 py-3 font-medium text-zinc-300">Feature</th>
                  <th className="px-4 py-3 font-medium text-zinc-300">Free</th>
                  <th className="px-4 py-3 font-medium text-white">Pro</th>
                  <th className="px-4 py-3 font-medium text-indigo-400">Team</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-zinc-800/80 ${i % 2 === 0 ? 'bg-zinc-900/30' : ''}`}
                  >
                    <td className="px-4 py-3 text-zinc-300">{row.feature}</td>
                    <td className="px-4 py-3 text-zinc-500">{row.free}</td>
                    <td className="px-4 py-3 text-zinc-300">{row.pro}</td>
                    <td className="px-4 py-3 text-zinc-300">{row.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Integration logos */}
        <section id="integrations" className="mb-20">
          <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Integrations
          </h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {integrations.map((item) => (
              <div
                key={item.name}
                className="flex h-20 w-28 flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300"
              >
                <span className="mb-1 text-2xl text-indigo-400/80">{item.icon}</span>
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA + Docs */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center md:p-12">
          <h2 className="mb-2 text-xl font-semibold text-white">Ready to integrate?</h2>
          <p className="mb-6 text-zinc-400">
            Read the docs, grab an API key, and go live in minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Documentation →
            </a>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Get API key
            </button>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-zinc-800 px-4 py-8 text-center text-xs text-zinc-500">
        DevTools · Documentation · Status · Terms
      </footer>
    </div>
  );
}
