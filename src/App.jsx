import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iinlalzytsgkemfqzzo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbmxhbHp5dHNrZ2VrbWZxenpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTAwNjEsImV4cCI6MjA5NDA2NjA2MX0.Cw82YPuP8q65OJsZuGmoYsnUGpV0U-okm7Td8NaWLEw";
const DASHBOARD_ID = "main";
const LOCAL_BACKUP_KEY = "poc-readiness-dashboard-backup-v2";
const NL = String.fromCharCode(10);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const clientId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>{children}</div>;
}
function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}
function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

const defaultData = {
  workstreams: [
    { area: "Commercial / Pricing", icon: "🏷️", progress: 40, status: "At Risk", topic: "Hybrid plan、GB単価、既存Postpaid影響", current: "料金方針を検討中", next: "料金案を2〜3パターン化", owner: "Globe / KDDI" },
    { area: "Device Procurement", icon: "📱", progress: 35, status: "At Risk", topic: "中古端末輸出、Apple制約、在庫・価格", current: "制約確認中", next: "契約・輸入条件を確認", owner: "KDDI" },
    { area: "Installment / Billing", icon: "💳", progress: 30, status: "At Risk", topic: "割賦管理、請求、未払い対応", current: "担当者ヒアリング中", next: "業務フローを整理", owner: "Globe" },
    { area: "Store Operation", icon: "🏬", progress: 50, status: "On Track", topic: "対象店舗、販売導線、スタッフ運用", current: "候補店舗を検討中", next: "店舗選定基準を合意", owner: "Globe" },
    { area: "System / BSS", icon: "☁️", progress: 45, status: "On Track", topic: "Excel pseudo-BSS、MSISDN/契約ID連携", current: "PoC向け簡易運用案あり", next: "必要データ項目を確定", owner: "KDDI / Globe" },
    { area: "Legal / Compliance", icon: "⚖️", progress: 25, status: "At Risk", topic: "輸入、再販、契約制約", current: "未確認事項が多い", next: "法務・契約論点を洗い出し", owner: "Both" },
    { area: "KPI / Governance", icon: "📊", progress: 40, status: "On Track", topic: "PoC KPI、週次管理、Go/No-Go条件", current: "KPI案を検討中", next: "KPIツリーを作成", owner: "Both" }
  ],
  taskRows: [
    { task: "中古端末の調達可否確認", progress: 60, weeks: ["done", "done", "done", "", "", ""], status: "On Track", owner: "KDDI" },
    { task: "Apple制約の確認", progress: 30, weeks: ["risk", "risk", "", "", "", ""], status: "At Risk", owner: "KDDI" },
    { task: "輸入・輸出条件の確認", progress: 20, weeks: ["delay", "", "", "", "", ""], status: "At Risk", owner: "KDDI / Globe" },
    { task: "在庫・価格の試算", progress: 40, weeks: ["risk", "risk", "", "risk", "", ""], status: "At Risk", owner: "KDDI" },
    { task: "サプライヤー選定", progress: 0, weeks: ["", "", "", "", "", ""], status: "Not Started", owner: "KDDI" }
  ],
  targetDate: "2026/08/31",
  phase: "合意形成中",
  overallStatus: "At Risk",
  topIssues: ["料金設計", "端末調達 / Apple制約", "割賦運用 / 未払い対応"].join(NL),
  decisions: ["PoC対象店舗の確定", "商品 / 料金設計の確定", "役割分担の確定"].join(NL)
};

const statusOptions = ["On Track", "At Risk", "Delayed", "Not Started", "Completed"];
const phaseOptions = ["検討中", "設計中", "合意形成中", "実行準備中"];
const weekLabels = ["5月第2週", "5月第3週", "5月第4週", "6月第1週", "6月第2週", "6月第3週"];

function loadLocalBackup() {
  try {
    const saved = window.localStorage.getItem(LOCAL_BACKUP_KEY);
    return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
  } catch {
    return defaultData;
  }
}

function statusColor(status) {
  if (status === "On Track") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (status === "At Risk") return "bg-amber-100 text-amber-700 ring-amber-200";
  if (status === "Delayed") return "bg-red-100 text-red-700 ring-red-200";
  if (status === "Completed") return "bg-blue-100 text-blue-700 ring-blue-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function progressColor(value) {
  if (value === 0) return "bg-slate-300";
  if (value < 25) return "bg-red-500";
  if (value < 50) return "bg-amber-400";
  if (value < 75) return "bg-emerald-500";
  if (value < 100) return "bg-blue-500";
  return "bg-slate-900";
}

function StatusDot({ status }) {
  const cls = status === "On Track" ? "bg-emerald-500" : status === "At Risk" ? "bg-amber-400" : status === "Delayed" ? "bg-red-500" : status === "Completed" ? "bg-blue-600" : "bg-slate-400";
  return <span className={`inline-block h-3 w-3 rounded-full ${cls}`} />;
}

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return <div className="flex items-center gap-3"><span className="w-10 text-sm font-semibold text-slate-800">{safeValue}%</span><div className="h-3 w-32 overflow-hidden rounded-full bg-slate-200 shadow-inner"><div className={`h-full rounded-full ${progressColor(safeValue)}`} style={{ width: `${safeValue}%` }} /></div></div>;
}

function TextInput({ value, onChange, className = "" }) {
  return <input className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 ${className}`} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
}
function NumberInput({ value, onChange }) {
  return <input type="number" min="0" max="100" className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" value={value} onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value))))} />;
}
function SelectInput({ value, onChange, options }) {
  return <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}

export default function App() {
  const [data, setData] = useState(loadLocalBackup);
  const [editMode, setEditMode] = useState(true);
  const [syncStatus, setSyncStatus] = useState("接続準備中");
  const [lastUpdated, setLastUpdated] = useState("");
  const [remoteReady, setRemoteReady] = useState(false);
  const skipNextSave = useRef(false);
  const saveTimer = useRef(null);

  const workstreams = data.workstreams || [];
  const taskRows = data.taskRows || [];
  const overall = useMemo(() => workstreams.length ? Math.round(workstreams.reduce((sum, w) => sum + Number(w.progress || 0), 0) / workstreams.length) : 0, [workstreams]);

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteData() {
      setSyncStatus("Supabase接続中...");
      const { data: row, error } = await supabase.from("dashboard_data").select("data, updated_at").eq("id", DASHBOARD_ID).maybeSingle();
      if (!isMounted) return;

      if (error) {
        setSyncStatus("DB未設定または接続エラー");
        setRemoteReady(false);
        console.error(error);
        return;
      }

      if (row?.data) {
        skipNextSave.current = true;
        setData({ ...defaultData, ...row.data });
        setLastUpdated(row.updated_at ? new Date(row.updated_at).toLocaleString() : "");
        setSyncStatus("リアルタイム同期中");
        setRemoteReady(true);
        return;
      }

      const { error: insertError } = await supabase.from("dashboard_data").insert({ id: DASHBOARD_ID, data: defaultData, updated_by: clientId });
      if (insertError) {
        setSyncStatus("初期データ作成エラー");
        setRemoteReady(false);
        console.error(insertError);
        return;
      }
      setSyncStatus("リアルタイム同期中");
      setRemoteReady(true);
    }

    loadRemoteData();

    const channel = supabase
      .channel("dashboard-data-main")
      .on("postgres_changes", { event: "*", schema: "public", table: "dashboard_data", filter: `id=eq.${DASHBOARD_ID}` }, (payload) => {
        const newRow = payload.new;
        if (!newRow || newRow.updated_by === clientId) return;
        skipNextSave.current = true;
        setData({ ...defaultData, ...newRow.data });
        setLastUpdated(newRow.updated_at ? new Date(newRow.updated_at).toLocaleString() : "");
        setSyncStatus("他メンバーの更新を反映");
        window.setTimeout(() => setSyncStatus("リアルタイム同期中"), 1500);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setSyncStatus("リアルタイム同期中");
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(data)); } catch {}
    if (!remoteReady) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSyncStatus("保存中...");
    saveTimer.current = window.setTimeout(async () => {
      const { error } = await supabase.from("dashboard_data").upsert({ id: DASHBOARD_ID, data, updated_by: clientId, updated_at: new Date().toISOString() });
      if (error) {
        setSyncStatus("保存エラー");
        console.error(error);
        return;
      }
      setLastUpdated(new Date().toLocaleString());
      setSyncStatus("保存・同期済み");
      window.setTimeout(() => setSyncStatus("リアルタイム同期中"), 1200);
    }, 600);
  }, [data, remoteReady]);

  const updateData = (key, value) => setData((d) => ({ ...d, [key]: value }));
  const updateWorkstream = (index, key, value) => setData((d) => ({ ...d, workstreams: d.workstreams.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const updateTask = (index, key, value) => setData((d) => ({ ...d, taskRows: d.taskRows.map((row, i) => i === index ? { ...row, [key]: value } : row) }));
  const updateWeek = (rowIndex, weekIndex, value) => setData((d) => ({ ...d, taskRows: d.taskRows.map((row, i) => { if (i !== rowIndex) return row; const weeks = [...row.weeks]; weeks[weekIndex] = value; return { ...row, weeks }; }) }));
  const addWorkstream = () => setData((d) => ({ ...d, workstreams: [...d.workstreams, { area: "New Workstream", icon: "🔹", progress: 0, status: "Not Started", topic: "", current: "", next: "", owner: "" }] }));
  const addTask = () => setData((d) => ({ ...d, taskRows: [...d.taskRows, { task: "New Task", progress: 0, weeks: ["", "", "", "", "", ""], status: "Not Started", owner: "" }] }));
  const deleteWorkstream = (index) => setData((d) => ({ ...d, workstreams: d.workstreams.filter((_, i) => i !== index) }));
  const deleteTask = (index) => setData((d) => ({ ...d, taskRows: d.taskRows.filter((_, i) => i !== index) }));
  const resetData = () => { if (window.confirm("入力内容を初期状態に戻しますか？全員に反映されます。")) setData(defaultData); };
  const exportJson = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "poc-readiness-dashboard-data.json"; a.click(); URL.revokeObjectURL(url); };
  const importJson = (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { setData({ ...defaultData, ...JSON.parse(String(reader.result)) }); } catch { alert("JSONファイルの読み込みに失敗しました。形式を確認してください。"); } }; reader.readAsText(file); };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-3xl font-bold tracking-tight text-slate-950">PoC Readiness Dashboard</h1><p className="mt-1 text-sm text-slate-500">PoCに向けた検討・準備状況を、PJ全体・領域別・タスク別に可視化</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${remoteReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{syncStatus}</span><button onClick={exportJson} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow hover:bg-slate-100">Export JSON</button><label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow hover:bg-slate-100">Import JSON<input type="file" accept="application/json" className="hidden" onChange={importJson} /></label><button onClick={resetData} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-red-600 shadow hover:bg-red-50">Reset</button><button onClick={() => setEditMode(!editMode)} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-800">{editMode ? "閲覧モードに切替" : "編集モードに切替"}</button></div>
        </header>

        <Card className="border-emerald-200 bg-emerald-50"><CardContent className="p-4 text-sm text-emerald-900"><b>共有仕様：</b>Supabaseに保存し、同じURLを開いているメンバーにリアルタイム反映します。最終更新：{lastUpdated || "未取得"}</CardContent></Card>

        {editMode && <Card className="border-blue-100 bg-blue-50"><CardContent className="p-5"><div className="mb-4 text-lg font-bold text-blue-950">入力フォーム</div><div className="grid grid-cols-12 gap-4"><div className="col-span-3"><label className="text-xs font-bold text-slate-500">PoC開始目標</label><TextInput value={data.targetDate} onChange={(v) => updateData("targetDate", v)} /></div><div className="col-span-3"><label className="text-xs font-bold text-slate-500">現在フェーズ</label><SelectInput value={data.phase} onChange={(v) => updateData("phase", v)} options={phaseOptions} /></div><div className="col-span-3"><label className="text-xs font-bold text-slate-500">PJ全体ステータス</label><SelectInput value={data.overallStatus} onChange={(v) => updateData("overallStatus", v)} options={statusOptions} /></div><div className="col-span-3 text-sm text-slate-600">PJ全体進捗率は、領域別進捗率の平均で自動計算されます。</div><div className="col-span-6"><label className="text-xs font-bold text-slate-500">主要な未決論点（改行区切り）</label><textarea className="h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" value={data.topIssues || ""} onChange={(e) => updateData("topIssues", e.target.value)} /></div><div className="col-span-6"><label className="text-xs font-bold text-slate-500">次の意思決定事項（改行区切り）</label><textarea className="h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400" value={data.decisions || ""} onChange={(e) => updateData("decisions", e.target.value)} /></div></div></CardContent></Card>}

        <section className="grid grid-cols-12 gap-4">
          <Card className="col-span-3 overflow-hidden border-0 bg-gradient-to-br from-slate-950 to-blue-900 text-white shadow-lg"><CardContent className="p-6"><div className="text-lg font-semibold">PJ全体 進捗率</div><div className="mt-6 flex items-center justify-center"><div className="relative grid h-36 w-36 place-items-center rounded-full bg-white/15" style={{ background: `conic-gradient(#7cc46b ${overall * 3.6}deg, rgba(255,255,255,.18) 0deg)` }}><div className="grid h-28 w-28 place-items-center rounded-full bg-white text-slate-950 shadow-inner"><span className="text-4xl font-bold">{overall}%</span></div></div></div><div className="mt-5 flex items-center justify-center gap-2 text-sm"><span>ステータス：</span><StatusDot status={data.overallStatus} /><span className="font-semibold text-amber-300">{data.overallStatus}</span></div></CardContent></Card>
          <Card className="col-span-2"><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">PoC開始目標</div><div className="mt-6 flex items-center gap-3 text-2xl font-bold"><span className="text-2xl">📅</span>{data.targetDate}</div><div className="mt-4 text-sm text-slate-500">日付は上部フォームから変更</div></CardContent></Card>
          <Card className="col-span-3"><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">現在フェーズ</div><div className="mt-8 flex items-center justify-between">{phaseOptions.map((x) => <div key={x} className="flex flex-col items-center gap-2 text-xs"><div className={`h-5 w-5 rounded-full ${x === data.phase ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-300"}`} /><span className={x === data.phase ? "font-bold text-blue-700" : "text-slate-500"}>{x}</span></div>)}</div><div className="relative -mt-10 ml-8 mr-8 h-px bg-slate-200" /></CardContent></Card>
          <Card className="col-span-2"><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">主要な未決論点</div><ul className="mt-4 space-y-2 text-sm text-slate-700">{String(data.topIssues || "").split(NL).filter(Boolean).map((x, i) => <li key={i}>・{x}</li>)}</ul></CardContent></Card>
          <Card className="col-span-2"><CardContent className="p-6"><div className="text-sm font-semibold text-slate-500">次の意思決定事項</div><ul className="mt-4 space-y-2 text-sm text-slate-700">{String(data.decisions || "").split(NL).filter(Boolean).map((x, i) => <li key={i}>・{x}</li>)}</ul></CardContent></Card>
        </section>

        {editMode && <Card><CardContent className="p-5"><div className="mb-3 flex items-center justify-between"><div className="text-lg font-bold text-blue-950">領域別データ入力</div><button onClick={addWorkstream} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">＋ 領域追加</button></div><div className="space-y-3">{workstreams.map((w, i) => <div key={i} className="grid grid-cols-12 gap-2 rounded-xl border bg-white p-3"><TextInput value={w.icon} onChange={(v) => updateWorkstream(i, "icon", v)} className="col-span-1" /><div className="col-span-2"><TextInput value={w.area} onChange={(v) => updateWorkstream(i, "area", v)} /></div><div className="col-span-1"><NumberInput value={w.progress} onChange={(v) => updateWorkstream(i, "progress", v)} /></div><div className="col-span-2"><SelectInput value={w.status} onChange={(v) => updateWorkstream(i, "status", v)} options={statusOptions} /></div><div className="col-span-2"><TextInput value={w.topic} onChange={(v) => updateWorkstream(i, "topic", v)} /></div><div className="col-span-1"><TextInput value={w.current} onChange={(v) => updateWorkstream(i, "current", v)} /></div><div className="col-span-1"><TextInput value={w.next} onChange={(v) => updateWorkstream(i, "next", v)} /></div><div className="col-span-1"><TextInput value={w.owner} onChange={(v) => updateWorkstream(i, "owner", v)} /></div><button onClick={() => deleteWorkstream(i)} className="rounded-lg bg-red-50 px-2 py-2 text-xs font-bold text-red-600">削除</button></div>)}</div></CardContent></Card>}

        <section className="grid grid-cols-12 gap-4"><Card className="col-span-10"><CardContent className="p-0"><div className="border-b px-5 py-4 text-lg font-bold text-blue-950">領域別 進捗サマリー</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-100 text-slate-700"><tr>{["領域", "進捗率", "ステータス", "主な検討事項", "現在の状況", "次アクション", "Owner"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead><tbody>{workstreams.map((w, i) => <tr key={i} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 font-semibold"><div className="flex items-center gap-2"><span className="text-lg">{w.icon}</span>{w.area}</div></td><td className="px-4 py-3"><ProgressBar value={w.progress} /></td><td className="px-4 py-3"><Badge className={`${statusColor(w.status)} ring-1`}><StatusDot status={w.status} /> <span className="ml-1">{w.status}</span></Badge></td><td className="px-4 py-3 text-slate-700">{w.topic}</td><td className="px-4 py-3 text-slate-700">{w.current}</td><td className="px-4 py-3 text-slate-700">{w.next}</td><td className="px-4 py-3 text-slate-700">{w.owner}</td></tr>)}</tbody></table></div></CardContent></Card><aside className="col-span-2 space-y-4"><Card><CardContent className="p-5"><div className="font-bold text-blue-950">進捗率の見方</div><div className="mt-4 space-y-2 text-xs">{[["0%", "未着手", "bg-slate-400"], ["0〜24%", "論点洗い出し済み", "bg-red-500"], ["25〜49%", "初期案作成済み", "bg-amber-400"], ["50〜74%", "関係者レビュー中", "bg-emerald-500"], ["75〜99%", "合意・実行準備中", "bg-blue-500"], ["100%", "完了", "bg-slate-900"]].map(([pct, label, color]) => <div key={pct} className="flex items-center gap-2"><span className={`w-16 rounded px-2 py-1 text-center font-bold text-white ${color}`}>{pct}</span><span>{label}</span></div>)}</div></CardContent></Card><Card><CardContent className="p-5"><div className="font-bold text-blue-950">ステータスの見方</div><div className="mt-4 space-y-3 text-xs">{statusOptions.map((s) => <div key={s} className="flex gap-2"><StatusDot status={s} /><span><b>{s}</b></span></div>)}</div></CardContent></Card></aside></section>

        {editMode && <Card><CardContent className="p-5"><div className="mb-3 flex items-center justify-between"><div className="text-lg font-bold text-blue-950">タスク別データ入力</div><button onClick={addTask} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">＋ タスク追加</button></div><div className="space-y-3">{taskRows.map((r, i) => <div key={i} className="grid grid-cols-12 gap-2 rounded-xl border bg-white p-3"><div className="col-span-3"><TextInput value={r.task} onChange={(v) => updateTask(i, "task", v)} /></div><div className="col-span-1"><NumberInput value={r.progress} onChange={(v) => updateTask(i, "progress", v)} /></div><div className="col-span-2"><SelectInput value={r.status} onChange={(v) => updateTask(i, "status", v)} options={statusOptions} /></div><div className="col-span-2"><TextInput value={r.owner} onChange={(v) => updateTask(i, "owner", v)} /></div><div className="col-span-3 grid grid-cols-6 gap-1">{r.weeks.map((w, wi) => <select key={wi} className="rounded border px-1 py-2 text-xs" value={w} onChange={(e) => updateWeek(i, wi, e.target.value)}><option value="">-</option><option value="done">緑</option><option value="risk">黄</option><option value="delay">赤</option></select>)}</div><button onClick={() => deleteTask(i)} className="rounded-lg bg-red-50 px-2 py-2 text-xs font-bold text-red-600">削除</button></div>)}</div></CardContent></Card>}

        <Card><CardContent className="p-0"><div className="border-b px-5 py-4 text-lg font-bold text-blue-950">領域別 詳細（論点・タスク別進捗）</div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-100 text-slate-700"><tr><th className="px-4 py-3 text-left">論点 / タスク</th><th className="px-4 py-3 text-left">進捗率</th>{weekLabels.map((w) => <th key={w} className="px-3 py-3 text-left">{w}</th>)}<th className="px-4 py-3 text-left">ステータス</th><th className="px-4 py-3 text-left">Owner</th></tr></thead><tbody>{taskRows.map((r, i) => <tr key={i} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{r.task}</td><td className="px-4 py-3"><ProgressBar value={r.progress} /></td>{r.weeks.map((v, wi) => <td key={wi} className="px-3 py-3"><div className={`h-7 rounded ${v === "done" ? "bg-emerald-200" : v === "risk" ? "bg-amber-200" : v === "delay" ? "bg-red-200" : "bg-slate-100"}`} /></td>)}<td className="px-4 py-3"><div className="flex items-center gap-2"><StatusDot status={r.status} />{r.status}</div></td><td className="px-4 py-3">{r.owner}</td></tr>)}</tbody></table></div></CardContent></Card>
        <footer className="flex items-center gap-2 text-xs text-slate-500"><span>⚠️</span> 進捗率は「PoC開始に向けた準備の完了度」を示します。0%=未着手、100%=合意・実行準備完了。</footer>
      </div>
    </div>
  );
}
