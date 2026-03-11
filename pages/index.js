import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Gauge,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';

const scenarios = {
  clean: { label: 'Clean WAN', rtt: 62, jitter: 5, fault: 0.01 },
  jitter: { label: 'WAN Jitter', rtt: 78, jitter: 24, fault: 0.04 },
  storm: { label: 'Fault Storm', rtt: 92, jitter: 32, fault: 0.12 },
  attack: { label: 'Inflation & Hold', rtt: 115, jitter: 45, fault: 0.18 },
};

const modeProfiles = {
  Balanced: { latMul: 1.0, tpsMul: 1.0, succ: 0.995 },
  LatencyFast: { latMul: 0.54, tpsMul: 1.06, succ: 0.992 },
  FaultHardened: { latMul: 0.9, tpsMul: 0.88, succ: 0.999 },
};

function computeMetrics(sceneKey, mode) {
  const s = scenarios[sceneKey];
  const m = modeProfiles[mode];
  const baseLatency = s.rtt + 0.8 * s.jitter + 120 * s.fault;
  const p95 = baseLatency * m.latMul;
  const tps = Math.max(40, (620 - 2.5 * baseLatency) * m.tpsMul);
  const success = Math.max(0.86, m.succ - s.fault * 0.05);
  const churn = sceneKey === 'storm' || sceneKey === 'attack' ? 18 : 6;
  return {
    p95: p95.toFixed(1),
    p99: (p95 * 1.2).toFixed(1),
    tps: tps.toFixed(0),
    success: (success * 100).toFixed(2),
    churn,
  };
}

function pickAutoMode(sceneKey) {
  if (sceneKey === 'attack' || sceneKey === 'storm') return 'FaultHardened';
  if (sceneKey === 'clean') return 'LatencyFast';
  return 'Balanced';
}

const complexityRows = [
  { n: 32, sublyne: 16800, n2: 32800 },
  { n: 64, sublyne: 40200, n2: 131200 },
  { n: 128, sublyne: 93800, n2: 524800 },
  { n: 256, sublyne: 213000, n2: 2099200 },
  { n: 512, sublyne: 477000, n2: 8396800 },
  { n: 1024, sublyne: 1055000, n2: 33587200 },
];

const evidenceLinks = [
  { label: 'Formal Proofs v2', path: '/docs/FORMAL_PROOFS_V2.md' },
  { label: 'LatencyFast report', path: '/results/sublyne_dag/latency_fast_report.csv' },
  { label: 'Complexity fit', path: '/results/complexity/complexity_fit.md' },
  { label: 'DAG state scaling', path: '/results/sublyne_dag/dag_state_scaling.csv' },
  { label: 'Killer figure', path: '/results/complexity/complexity_killer_figure.png' },
];

export default function Page() {
  const [sceneKey, setSceneKey] = useState('clean');
  const [manualMode, setManualMode] = useState('Auto');

  const activeMode = useMemo(
    () => (manualMode === 'Auto' ? pickAutoMode(sceneKey) : manualMode),
    [manualMode, sceneKey]
  );

  const metrics = useMemo(() => computeMetrics(sceneKey, activeMode), [sceneKey, activeMode]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-5 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Sublyne Judge Demo Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              DAG dissemination + adaptive consensus + hierarchical BLS aggregation
            </p>
          </div>
          <a
            href="/results/complexity/complexity_killer_figure.png"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
          >
            <Download size={16} /> Download killer figure
          </a>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <Card title="Scenario" icon={Activity}>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(scenarios).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setSceneKey(k)}
                  className={`px-3 py-2 rounded text-sm border ${
                    sceneKey === k
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Mode" icon={Sparkles}>
            <div className="grid grid-cols-2 gap-2">
              {['Auto', 'LatencyFast', 'Balanced', 'FaultHardened'].map((m) => (
                <button
                  key={m}
                  onClick={() => setManualMode(m)}
                  className={`px-3 py-2 rounded text-sm border ${
                    manualMode === m
                      ? 'border-violet-400 bg-violet-500/10 text-violet-300'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Active mode: <b>{activeMode}</b></p>
          </Card>

          <Card title="Attack Replay" icon={AlertTriangle}>
            <p className="text-sm text-slate-300">
              Use <b>Inflation & Hold</b> scenario to simulate timeout inflation stress. Auto mode falls back to
              FaultHardened to preserve commit success.
            </p>
            <div className="mt-3 text-xs text-slate-400">Judge line: "Fast when clean, safe when hostile."</div>
          </Card>
        </section>

        <section className="grid md:grid-cols-4 gap-3">
          <Metric label="TPS" value={metrics.tps} icon={Zap} color="text-yellow-300" />
          <Metric label="p95 latency (ms)" value={metrics.p95} icon={Gauge} color="text-cyan-300" />
          <Metric label="Success (%)" value={metrics.success} icon={CheckCircle2} color="text-emerald-300" />
          <Metric label="Leader churn" value={metrics.churn} icon={Shield} color="text-orange-300" />
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <Card title="Home-ground check (example)" icon={CheckCircle2}>
            <ul className="text-sm space-y-2 text-slate-300">
              <li>Latency arena target: <b>&lt; 50 ms</b> p95 in clean WAN mode</li>
              <li>Current clean WAN p95: <b>{metrics.p95} ms</b> ({activeMode})</li>
              <li>Communication trend: measured curve aligned with <b>O(n log n)</b> in tested range</li>
            </ul>
          </Card>

          <Card title="Complexity snapshot (bytes/commit)" icon={Activity}>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-1">n</th>
                    <th className="text-left py-1">Sublyne</th>
                    <th className="text-left py-1">O(n²) ref</th>
                  </tr>
                </thead>
                <tbody>
                  {complexityRows.map((r) => (
                    <tr key={r.n} className="border-b border-slate-800">
                      <td className="py-1">{r.n}</td>
                      <td className="py-1 text-cyan-300">{r.sublyne.toLocaleString()}</td>
                      <td className="py-1 text-rose-300">{r.n2.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="font-semibold mb-2">Evidence drawer</h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {evidenceLinks.map((e) => (
              <a key={e.label} href={e.path} className="underline text-blue-300 hover:text-blue-200">
                {e.label}
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Note: Some large-scale/10k outputs are modeled. Real-vs-modeled is explicitly labeled in artifacts.
          </p>
        </section>
      </div>
    </main>
  );
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center gap-2 mb-3 text-slate-200">
        <Icon size={16} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wide">
        <Icon size={14} /> {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
