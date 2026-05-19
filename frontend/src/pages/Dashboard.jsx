import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FolderKanban, Loader2, Clock3, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import API from '../api/axios';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
        } else {
          setError('Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Done', value: stats.completedTasks || 0 },
      { name: 'In Progress', value: stats.pendingTasks || 0 },
      { name: 'Overdue', value: stats.overdueTasks || 0 },
    ];
  }, [stats]);

  const totalTasks = chartData.reduce((s, i) => s + i.value, 0) || 1;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-secondary">
        <Loader2 className="mr-2 animate-spin" size={18} />
        Loading your data...
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-500 dark:text-red-400">{error}</div>;
  }

  const tooltipStyle = {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    fontSize: '13px',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Greeting ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-primary">
            Hey, {user.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-secondary text-sm mt-1">Here&apos;s what&apos;s happening across your workspaces today.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <TrendingUp size={14} />
          Real-time sync
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Workspaces" count={stats?.totalProjects || 0} icon={<FolderKanban size={18} />} color="text-violet-500" bg="bg-violet-500/10 dark:bg-violet-500/15" />
        <MetricCard label="Completed" count={stats?.completedTasks || 0} icon={<CheckCircle2 size={18} />} color="text-emerald-500" bg="bg-emerald-500/10 dark:bg-emerald-500/15" />
        <MetricCard label="Active" count={stats?.pendingTasks || 0} icon={<Clock3 size={18} />} color="text-amber-500" bg="bg-amber-500/10 dark:bg-amber-500/15" />
        <MetricCard label="Overdue" count={stats?.overdueTasks || 0} icon={<AlertTriangle size={18} />} color="text-rose-500" bg="bg-rose-500/10 dark:bg-rose-500/15" />
      </div>

      {/* ── Chart + Progress side by side on desktop, stacked on mobile ── */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Chart — takes 2 cols */}
        <div className="lg:col-span-2 rounded-2xl card p-5">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Distribution</h2>
          <p className="text-xs text-muted mt-1 mb-4">Breakdown by current status</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-2">
            {chartData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-secondary">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* Progress — takes 3 cols */}
        <div className="lg:col-span-3 rounded-2xl card p-5">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Activity breakdown</h2>
          <p className="text-xs text-muted mt-1 mb-6">How your assignments are distributed right now</p>

          <div className="space-y-5">
            {chartData.map((item, i) => {
              const pct = Math.round((item.value / totalTasks) * 100);
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-primary">{item.name}</span>
                    <span className="text-xs font-bold text-secondary">{item.value} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--surface-overlay)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: COLORS[i] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-theme">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Total assignments</span>
              <span className="font-bold text-primary">{totalTasks}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, count, icon, color, bg }) {
  return (
    <div className="rounded-2xl card p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black text-primary">{count}</p>
          <p className="text-xs font-medium text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}