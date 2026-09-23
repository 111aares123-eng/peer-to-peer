import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, Users, DollarSign, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, FileText, Lock
} from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function AdminDashboard({ onReseed, isReseeding }) {
  const [metrics, setMetrics] = useState(null);
  const [moderationQueue, setModerationQueue] = useState({ reports: [], suspendedUsers: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [m, q] = await Promise.all([
        api.getAdminMetrics(),
        api.getModerationQueue()
      ]);
      setMetrics(m);
      setModerationQueue(q);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveReport = async (reportId, action) => {
    try {
      await api.resolveReport(reportId, action);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to resolve report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Campus Safety & Escrow Admin Console</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Campus Admin Oversight
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Monitor escrow balances, 12% take-rate commissions, and review the automated 3-strike safety suspension queue.
          </p>
        </div>

        <button
          onClick={onReseed}
          disabled={isReseeding}
          className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700 flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isReseeding ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Reseed Cold-Start (15 Tutors)</span>
        </button>
      </div>

      {/* Escrow & Platform Revenue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Platform Revenue */}
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-300">
            <span>12% Commission Revenue Earned</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {formatCurrency(metrics?.escrow?.total_platform_revenue_earned || 0)}
          </div>
          <div className="text-[10px] text-gray-400">
            From {formatCurrency(metrics?.escrow?.total_volume_released || 0)} released session volume
          </div>
        </div>

        {/* Metric 2: Currently Held in Escrow */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span>Active Escrow Funds Held</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300">
            {formatCurrency(metrics?.escrow?.total_held_escrow || 0)}
          </div>
          <div className="text-[10px] text-gray-400">
            Protected under 15-minute satisfaction guarantee
          </div>
        </div>

        {/* Metric 3: Active Verified Tutors */}
        <div className="glass-panel p-4 rounded-2xl border border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Verified Senior Tutors</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.tutorCount || 0}
          </div>
          <div className="text-[10px] text-gray-400">
            SSO + Transcript verified with A/A+ threshold
          </div>
        </div>

        {/* Metric 4: Auto-Suspended Accounts */}
        <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-300">
            <span>Auto-Suspended Accounts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {metrics?.suspendedUsers || 0}
          </div>
          <div className="text-[10px] text-gray-400">
            Triggered automatically upon 3 distinct reports
          </div>
        </div>
      </div>

      {/* Moderation Queue & Suspensions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 3-Strike Auto-Suspension Table */}
        <div className="glass-panel p-5 rounded-3xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>3-Strike Auto-Suspension Audit</span>
            </h3>
            <span className="text-[10px] text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
              Account Lock Active
            </span>
          </div>

          {moderationQueue.suspendedUsers.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">
              No suspended accounts. Marketplace safety threshold is clear.
            </p>
          ) : (
            <div className="space-y-2.5">
              {moderationQueue.suspendedUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-2xl bg-gray-900 border border-rose-500/30 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{u.name}</span>
                      <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        {u.report_count} Reports
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400">{u.email} • {u.role}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveReport(u.id, 'RESTORE_ACCOUNT')}
                      className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px]"
                    >
                      Lift Suspension
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: One-Tap Flagging Reports Stream */}
        <div className="glass-panel p-5 rounded-3xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>One-Tap Flag Reports Queue</span>
            </h3>
            <span className="text-[10px] text-gray-400">
              {moderationQueue.reports.length} Reports Logged
            </span>
          </div>

          {moderationQueue.reports.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">
              No incoming reports.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {moderationQueue.reports.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-2xl bg-gray-900 border border-gray-800 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        {r.category}
                      </span>
                      <div className="text-[11px] text-gray-300 mt-1">
                        Reported User: <strong className="text-white">{r.reported_name}</strong> by {r.reporter_name}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {formatDate(r.created_at)}
                    </span>
                  </div>

                  <p className="text-gray-400 text-[11px] bg-gray-950 p-2 rounded-xl border border-gray-800/80">
                    "{r.description}"
                  </p>

                  {r.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-800">
                      <button
                        onClick={() => handleResolveReport(r.id, 'DISMISS')}
                        className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-[10px]"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, 'RESOLVE_CONFIRM_BAN')}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold"
                      >
                        Confirm Suspension
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
