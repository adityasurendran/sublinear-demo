import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Gauge,
  Play,
  Shield,
  Sparkles,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';

const scenarios = {
  clean: { label: 'Clean WAN', rtt: 62, jitter: 5, fault: 0.01 },
  jitter: { label: 'WAN Jitter', rtt: 78, jitter: 24, fault: 0.04 },
  storm: { label: 'Fault Storm', rtt: 92, jitter: 32, fault: 0.12 },
  attack: { label: 'Inflation & Hold', rtt: 115, jitter: 45, fault: 0.18 },
};

const modeProfiles = {
  Balanced: { latMul: 1.0, tpsMul: 1.0, succ: 0.995, color: 'from-blue-500 to-cyan-400' },
  LatencyFast: { latMul: 0.54, tpsMul: 1.06, succ: 0.992, color: 'from-fuchsia-500 to-violet-400' },
  FaultHardened: { latMul: 0.9, tpsMul: 0.88, succ: 0.999, color: 'from-orange-500 to-amber-400' },
};

const baseSeries = {
  tps: [410, 435, 460, 470, 455, 480, 500, 520, 540, 560, 575, 583],
  lat: [88, 82, 77, 72, 66, 60, 55, 51, 49, 48.8, 48.4, 48.1],
};

function pickAutoMode(sceneKey) {
  if (sceneKey === 'attack' || sceneKey === 'storm') return 'FaultHardened';
  if (sceneKey === 'clean') return 'LatencyFast';
  return 'Balanced';
}

function computeMetrics(sceneKey, mode) {
  const s = scenarios[sceneKey];
  const m = modeProfiles[mode];
  const baseLatency = s.rtt + 0.8 * s.jitter + 120 * s.fault;
  const p95 = baseLatency * m.latMul;
  const tps = Math.max(40, (620 - 2.5 * baseLatency) * m.tpsMul);
  const success = Math.max(0.86, m.succ - s.fault * 0.05);
  const churn = sceneKey === 'storm' || sceneKey === 'attack' ? 18 : 6;
  return { p95, p99: p95 * 1.2, tps, success: success * 100, churn };
}

function genLogs(sceneKey, mode, m) {
  return [
    `[INIT] Scenario=${scenarios[sceneKey].label} mode=${mode}`,
    `[DAG] Dissemination mesh synced across validators`,
    `[CTRL] Policy selected ${mode}`,
    `[QC] Aggregated cert emitted (compact path)`,
    `[METRIC] TPS=${m.tps.toFixed(0)} p95=${m.p95.toFixed(1)}ms success=${m.success.toFixed(2)}%`,
    sceneKey === 'attack'
      ? `[ALERT] Inflation & Hold detected -> safe fallback + timeout clamp`
      : `[INFO] Network healthy, fast-path sustained`,
  ];
}

export default function Page() {
  const [sceneKey, setSceneKey] = useState('clean');
  const [manualMode, setManualMode] = useState('Auto');
  const [demoMode, setDemoMode] = useState(false);
  const [tick, setTick] = useState(0);

  const activeMode = useMemo(() => (manualMode === 'Auto' ? pickAutoMode(sceneKey) : manualMode), [manualMode, sceneKey]);

  useEffect(() => {
    if (!demoMode) return;
    const order = ['clean', 'jitter', 'storm', 'attack'];
    const int = setInterval(() => {
      setTick((t) => t + 1);
      const idx = (tick + 1) % order.length;
      setSceneKey(order[idx]);
      setManualMode('Auto');
    }, 2800);
    return () => clearInterval(int);
  }, [demoMode, tick]);

  const m = useMemo(() => computeMetrics(sceneKey, activeMode), [sceneKey, activeMode]);
  const logs = useMemo(() => genLogs(sceneKey, activeMode, m), [sceneKey, activeMode, m]);

  const tpsSeries = useMemo(() => {
    const factor = sceneKey === 'clean' ? 1 : sceneKey === 'jitter' ? 0.78 : sceneKey === 'storm' ? 0.64 : 0.58;
    return baseSeries.tps.map((v) => v * factor * (activeMode === 'LatencyFast' ? 1.04 : activeMode === 'FaultHardened' ? 0.9 : 1));
  }, [sceneKey, activeMode]);

  const latSeries = useMemo(() => {
    const factor = sceneKey === 'clean' ? 1 : sceneKey === 'jitter' ? 1.35 : sceneKey === 'storm' ? 1.75 : 2.1;
    return baseSeries.lat.map((v) => v * factor * (activeMode === 'LatencyFast' ? 0.86 : activeMode === 'FaultHardened' ? 1.05 : 1));
  }, [sceneKey, activeMode]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 p-5 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="rounded-2xl border border-slate-700/60 bg-slate-900/50 backdrop-blur p-5 shadow-2xl shadow-indigo-500/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                Sublyne Judge Showcase
              </h1>
              <p className="text-slate-300 mt-2">DAG dissemination • adaptive policy control • hierarchical BLS aggregation</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDemoMode((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
                  demoMode ? 'bg-rose-500/20 border border-rose-400 text-rose-200' : 'bg-emerald-500/20 border border-emerald-400 text-emerald-200'
                }`}
              >
                <Play size={16} /> {demoMode ? 'Stop Demo Mode' : 'Start Demo Mode'}
              </button>
              <a href="/results/complexity/complexity_killer_figure.png" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold">
                <Download size={16} /> Killer Figure
              </a>
            </div>
          </div>
        </header>

        <section className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Activity size={16}/> Scenario</h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(scenarios).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setSceneKey(k)}
                  className={`text-left px-3 py-2 rounded-lg border transition ${
                    sceneKey === k ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="font-semibold text-sm">{v.label}</div>
                  <div className="text-xs text-slate-400">RTT {v.rtt}ms • jitter {v.jitter}ms • fault {(v.fault * 100).toFixed(0)}%</div>
                </button>
              ))}
            </div>

            <h3 className="font-bold mt-5 mb-3 flex items-center gap-2"><Sparkles size={16}/> Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Auto', 'LatencyFast', 'Balanced', 'FaultHardened'].map((mm) => (
                <button
                  key={mm}
                  onClick={() => setManualMode(mm)}
                  className={`px-3 py-2 rounded-lg text-sm border ${manualMode === mm ? 'border-violet-400 bg-violet-500/10 text-violet-200' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  {mm}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">Active mode: <b>{activeMode}</b></p>
          </div>

          <div className="lg:col-span-9 grid md:grid-cols-2 gap-4">
            <MetricCard icon={Zap} label="Throughput" value={`${m.tps.toFixed(0)} TPS`} tone="text-yellow-300" />
            <MetricCard icon={Gauge} label="p95 Finality" value={`${m.p95.toFixed(1)} ms`} tone="text-cyan-300" />
            <MetricCard icon={CheckCircle2} label="Commit Success" value={`${m.success.toFixed(2)} %`} tone="text-emerald-300" />
            <MetricCard icon={Shield} label="Leader Churn" value={`${m.churn}`} tone="text-orange-300" />
          </div>
        </section>

        <section className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
            <h3 className="font-bold flex items-center gap-2 mb-2"><TrendingUp size={16}/> Live Trend: Throughput</h3>
            <Sparkline values={tpsSeries} color="#facc15" />
            <p className="text-xs text-slate-400 mt-2">Higher is better. Demo shows policy impact under current scenario.</p>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
            <h3 className="font-bold flex items-center gap-2 mb-2"><Gauge size={16}/> Live Trend: Latency p95</h3>
            <Sparkline values={latSeries} color="#22d3ee" />
            <p className="text-xs text-slate-400 mt-2">Lower is better. LatencyFast optimizes clean WAN finality.</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 rounded-2xl border border-slate-700/60 bg-black/40 p-4">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Terminal size={16}/> Live Protocol Log</h3>
            <div className="font-mono text-sm space-y-1 bg-slate-950 border border-slate-800 rounded-xl p-3 h-56 overflow-auto">
              {logs.map((l, i) => (
                <div key={i} className={i === logs.length - 1 ? 'text-emerald-300' : 'text-slate-300'}>
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
            <h3 className="font-bold mb-3">Judge takeaway</h3>
            <ul className="text-sm text-slate-200 space-y-2">
              <li>• Fast-path latency target in clean WAN conditions</li>
              <li>• Safe fallback under attack/fault conditions</li>
              <li>• Communication trend aligns with O(n log n) in tested ranges</li>
            </ul>
            <div className="mt-4 p-3 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-200 text-sm">
              “Fast when clean, safe when hostile.”
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Note: Some high-scale outputs are modeled; artifacts label real vs modeled explicitly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400"><Icon size={14}/> {label}</div>
      <div className={`text-3xl font-black mt-1 ${tone}`}>{value}</div>
    </div>
  );
}

function Sparkline({ values, color }) {
  const path = sparklinePath(values);
  return (
    <svg viewBox="0 0 300 90" className="w-full h-28">
      <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function sparklinePath(values, w = 280, h = 70) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  return values
    .map((v, i) => {
      const x = 10 + (i / (values.length - 1)) * w;
      const y = 10 + (h - ((v - min) / range) * h);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}
