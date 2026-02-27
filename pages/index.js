import React, { useState, useEffect, useRef } from 'react';
import { Globe, Shield, Brain, Zap, Activity, Server, AlertTriangle, CheckCircle } from 'lucide-react';

const DemoApp = () => {
  const [activeTab, setActiveTab] = useState('geo');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ tps: 0, latency: 0, batchSize: 100, health: 100 });
  const [isRunning, setIsRunning] = useState(false);
  const logEndRef = useRef(null);

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-15), { time, msg, type }]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Simulation Logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (activeTab === 'geo') {
        const regions = ['US-East', 'EU-West', 'AP-Northeast', 'SA-East'];
        const from = regions[Math.floor(Math.random() * regions.length)];
        const to = regions[Math.floor(Math.random() * regions.length)];
        const lat = from === to ? 1 : Math.floor(Math.random() * 200) + 80;
        
        addLog(`Consensus link established: ${from} <-> ${to} (${lat}ms)`, 'info');
        setStats(s => ({ ...s, latency: lat, tps: Math.floor(580 - lat/2) }));
      } 
      
      if (activeTab === 'byzantine') {
        const isFault = Math.random() < 0.3;
        if (isFault) {
          addLog("BYZANTINE ALERT: Validator 0 dropped proposal packet!", "error");
          setStats(s => ({ ...s, health: Math.max(70, s.health - 5) }));
        } else {
          addLog("Fault recovery protocol active. Quorum maintained.", "success");
          setStats(s => ({ ...s, health: Math.min(100, s.health + 2) }));
        }
      }

      if (activeTab === 'ml') {
        setStats(s => {
          const newLat = s.latency + (Math.random() * 20 - 10);
          const newBatch = newLat > 150 ? Math.max(10, s.batchSize - 5) : Math.min(1000, s.batchSize + 2);
          if (newBatch !== s.batchSize) {
            addLog(`ML Predictor: Adjusting batch size to ${newBatch} (Latency Trend: ${newLat.toFixed(1)}ms)`, 'warning');
          }
          return { ...s, latency: Math.max(50, newLat), batchSize: newBatch };
        });
      }

    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Sublyne Interactive SciFest Demo
          </h1>
          <p className="text-slate-400 mt-1">Achieving O(1) Communication Complexity via BLS Aggregation</p>
        </div>
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            isRunning ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
          }`}
        >
          {isRunning ? 'STOP SIMULATION' : 'START SIMULATION'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-4">
          {[
            { id: 'geo', label: 'Global Simulation', icon: Globe, desc: '4-Continent WAN latency validation' },
            { id: 'byzantine', label: 'Byzantine Resilience', icon: Shield, desc: 'Fault injection & MTTR tracking' },
            { id: 'ml', label: 'ML Batching', icon: Brain, desc: 'EWMA dynamic optimization' },
          ].map((tab) => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                activeTab === tab.id 
                ? 'bg-blue-600/10 border-blue-500 shadow-inner' 
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-1">
                <tab.icon className={activeTab === tab.id ? 'text-blue-400' : 'text-slate-500'} size={20} />
                <span className="font-bold">{tab.label}</span>
              </div>
              <p className="text-xs text-slate-400">{tab.desc}</p>
            </div>
          ))}

          {/* Real-time Stats */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Protocol Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Throughput" value={`${stats.tps} VPS`} icon={Zap} color="text-yellow-400" />
              <StatCard label="Latency" value={`${stats.latency.toFixed(0)}ms`} icon={Activity} color="text-blue-400" />
              <StatCard label="Batch Size" value={stats.batchSize} icon={Server} color="text-purple-400" />
              <StatCard label="Network Health" value={`${stats.health}%`} icon={stats.health > 80 ? CheckCircle : AlertTriangle} color={stats.health > 80 ? 'text-green-400' : 'text-red-400'} />
            </div>
            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span>Certificate Size</span>
                <span className="text-green-400 font-mono">88 Bytes (Constant)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-full opacity-50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Log Viewer / Visualizer */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-mono text-slate-400">sublyne_engine_v1.log</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Real-time Stream</span>
            </div>
            <div className="p-4 font-mono text-sm space-y-1 overflow-y-auto flex-1">
              {logs.length === 0 && <div className="text-slate-600 italic">Waiting for simulation to start...</div>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'warning' ? 'text-yellow-400' : 'text-blue-300'
                  }>
                    {log.msg}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex gap-3">
            <Zap size={18} className="shrink-0 mt-0.5" />
            <p>
              <strong>SciFest Insight:</strong> By using BLS Aggregation, we maintain an <strong>88-byte</strong> certificate size regardless of the validator count. This shifts the bottleneck from network bandwidth to local CPU power.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={14} />
      <span className="text-[10px] uppercase font-bold tracking-tight">{label}</span>
    </div>
    <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
  </div>
);

export default DemoApp;
