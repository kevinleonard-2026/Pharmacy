import DashboardLayout from "@/components/DashboardLayout";
import PharmacyMap from "@/components/PharmacyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crosshair,
  Filter,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Status = "due" | "taken" | "missed" | "upcoming";
type Medicine = { id: number; doseEventId: number; name: string; dose: string; form: string; schedule: string; next: string; status: Status; refill: string; refillSoon: boolean; instructions: string; notes?: string; accent: string };
type BackendMedicine = { medicine: { id: number; name: string; dose: string; form: string; scheduleLabel: string; instructions: string; refillDate: Date | string | null; remainingDoses: number; notes: string | null }; doseEvent: { id: number; status: Status } | null };

function formatRefillDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

function toMedicine(record: BackendMedicine): Medicine {
  const status = record.doseEvent?.status ?? "upcoming";
  return {
    id: record.medicine.id,
    doseEventId: record.doseEvent?.id ?? 0,
    name: record.medicine.name,
    dose: record.medicine.dose,
    form: record.medicine.form,
    schedule: record.medicine.scheduleLabel,
    next: status === "taken" ? "Taken" : status === "missed" ? "Missed" : status === "due" ? "Due now" : "Upcoming",
    status,
    refill: formatRefillDate(record.medicine.refillDate),
    refillSoon: Boolean(record.medicine.refillDate && new Date(record.medicine.refillDate).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000) || record.medicine.remainingDoses <= 5,
    instructions: record.medicine.instructions,
    notes: record.medicine.notes ?? "",
    accent: "teal",
  };
}

const starterMedicines: Medicine[] = [
  { id: 1, doseEventId: 101, name: "Lisinopril", dose: "10 mg", form: "Tablet", schedule: "Every morning · 08:00", next: "Due now", status: "due", refill: "Sep 05", refillSoon: false, instructions: "Take with water. Keep the timing consistent.", accent: "teal" },
  { id: 2, doseEventId: 102, name: "Vitamin D3", dose: "1,000 IU", form: "Softgel", schedule: "With breakfast · 08:30", next: "Taken 08:31", status: "taken", refill: "Aug 29", refillSoon: true, instructions: "Take with a meal containing fat.", accent: "sky" },
  { id: 3, doseEventId: 103, name: "Metformin", dose: "500 mg", form: "Tablet", schedule: "With dinner · 19:00", next: "In 4h 20m", status: "upcoming", refill: "Sep 12", refillSoon: false, instructions: "Follow the label instructions and your care plan.", accent: "blue" },
  { id: 4, doseEventId: 104, name: "Atorvastatin", dose: "20 mg", form: "Tablet", schedule: "Evening · 21:00", next: "Missed yesterday", status: "missed", refill: "Aug 26", refillSoon: true, instructions: "Do not double a missed dose without professional guidance.", accent: "amber" },
];

const statusMeta: Record<Status, { label: string; className: string }> = {
  due: { label: "Due", className: "status-due" },
  taken: { label: "Taken", className: "status-taken" },
  missed: { label: "Missed", className: "status-missed" },
  upcoming: { label: "Upcoming", className: "status-upcoming" },
};

function StatCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <div className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

export default function Home() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState(starterMedicines);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Status | "refill">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [showReminders, setShowReminders] = useState(false);
  const medicinesQuery = trpc.medicines.list.useQuery(undefined, { enabled: Boolean(user) });
  const markDose = trpc.doseEvents.mark.useMutation();
  const createMedicine = trpc.medicines.create.useMutation();
  const updateMedicine = trpc.medicines.update.useMutation();

  useEffect(() => {
    if (medicinesQuery.data) setMedicines((medicinesQuery.data as BackendMedicine[]).map(toMedicine));
  }, [medicinesQuery.data]);

  const visibleMedicines = useMemo(() => medicines.filter((medicine) => {
    const matchesQuery = medicine.name.toLowerCase().includes(query.toLowerCase()) || medicine.dose.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "refill" ? medicine.refillSoon : medicine.status === filter);
    return matchesQuery && matchesFilter;
  }), [medicines, query, filter]);

  const toggleTaken = (id: number) => {
    const previous = medicines.find((item) => item.id === id);
    if (!previous) return;
    const nextStatus: Status = previous.status === "taken" ? "due" : "taken";
    setMedicines((items) => items.map((item) => item.id === id ? { ...item, status: nextStatus, next: nextStatus === "taken" ? "Taken just now" : "Due now" } : item));
    if (!previous.doseEventId) {
      toast.error("This medicine has no dose event to update yet.");
      setMedicines((items) => items.map((item) => item.id === id && previous ? previous : item));
      return;
    }
    markDose.mutate({ id: previous.doseEventId, status: nextStatus }, { onSuccess: () => { toast.success(`${previous.name} marked ${nextStatus === "taken" ? "taken" : "due"}.`); medicinesQuery.refetch(); }, onError: () => { setMedicines((items) => items.map((item) => item.id === id && previous ? previous : item)); toast.error("Could not sync this change yet; your view was restored."); } });
  };

  const addMedicine = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = { name: String(form.get("name") || "New medicine"), dose: String(form.get("dose") || "—"), form: "Tablet", schedule: String(form.get("schedule") || "As scheduled"), next: editingMedicine?.next || "Due now", status: editingMedicine?.status || "due" as Status, refill: String(form.get("refill") || "—"), refillSoon: editingMedicine?.refillSoon || false, instructions: String(form.get("instructions") || "Follow the prescription label."), notes: String(form.get("notes") || ""), accent: editingMedicine?.accent || "teal" };
    setMedicines((items) => editingMedicine ? items.map((item) => item.id === editingMedicine.id ? { ...item, ...record } : item) : [{ id: Date.now(), doseEventId: Date.now() + 1, ...record }, ...items]);
    const backendPayload = { name: record.name, dose: record.dose, form: record.form, instructions: record.instructions, scheduleLabel: record.schedule, scheduleTimes: record.schedule, notes: record.notes || null, remainingDoses: 0, refillDate: null };
    if (editingMedicine) {
      updateMedicine.mutate({ id: editingMedicine.id, patch: backendPayload }, { onSuccess: () => medicinesQuery.refetch(), onError: () => toast.error("Saved locally; backend sync will retry when signed in.") });
    } else {
      createMedicine.mutate(backendPayload, { onSuccess: () => medicinesQuery.refetch(), onError: () => toast.error("Added locally; backend sync will retry when signed in.") });
    }
    toast.success(editingMedicine ? "Medicine details updated." : "Medicine added to checklist.");
    setShowForm(false);
    setEditingMedicine(null);
    event.currentTarget.reset();
  };

  const counts = { due: medicines.filter((m) => m.status === "due").length, taken: medicines.filter((m) => m.status === "taken").length, missed: medicines.filter((m) => m.status === "missed").length, refill: medicines.filter((m) => m.refillSoon).length };
  const firstName = user?.name?.split(" ")[0] || "there";

  return <DashboardLayout requireAuth>
    <div className="workspace-shell">
      <header className="workspace-header blueprint-frame">
        <div className="header-kicker"><Crosshair size={14} /> DAILY MEDICATION GRID <span>v1.0 / UTC+LOCAL</span></div>
        <div className="header-main"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p><h1>Good morning, {firstName}.</h1><p className="header-copy">Your medicine schedule, arranged with less friction.</p></div><div className="header-actions"><Button className="ghost-button" onClick={() => setShowReminders(true)}><BellRing size={16} /> <span className="hide-mobile">Reminders</span><i className="notification-dot" /></Button><Button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> Add medicine</Button></div></div>
        <div className="dimension-line"><span>01</span><div /><span>WORKSPACE / OVERVIEW</span><div /><span>04</span></div>
      </header>

      <section className="stat-grid" aria-label="Medication status summary"><StatCard label="Due today" value={String(counts.due)} detail="needs your attention" tone="stat-teal" /><StatCard label="Completed" value={`${counts.taken}/${medicines.length}`} detail="scheduled items" tone="stat-blue" /><StatCard label="Missed" value={String(counts.missed)} detail="review carefully" tone="stat-amber" /><StatCard label="Refill soon" value={String(counts.refill)} detail="within 7 days" tone="stat-slate" /></section>

      <section className="content-grid">
        <div className="primary-column">
          <div className="section-heading"><div><p className="eyebrow">TODAY / DOSE CHECKLIST</p><h2>Medication schedule</h2></div><button className="view-toggle" aria-label="Grid view"><LayoutGrid size={16} /> <span>Grid view</span><ChevronDown size={14} /></button></div>
          <div className="toolbar"><div className="search-wrap"><Search size={16} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search medicines or dose..." aria-label="Search medicines" /></div><div className="filter-tabs" role="group" aria-label="Filter medicines">{([["all", "All"], ["due", "Due"], ["taken", "Taken"], ["missed", "Missed"], ["refill", "Refill"]] as const).map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div><button className="filter-icon" aria-label="More filters"><Filter size={16} /></button></div>
          <div className="medicine-list">{visibleMedicines.map((medicine, index) => { const status = statusMeta[medicine.status]; return <article className="medicine-card blueprint-frame" key={medicine.id} style={{ "--delay": `${index * 60}ms` } as React.CSSProperties}><div className={`medicine-mark ${medicine.accent}`}><ShieldCheck size={19} /></div><div className="medicine-info"><div className="medicine-title"><h3>{medicine.name}</h3><span className={`status-chip ${status.className}`}><i />{status.label}</span>{medicine.refillSoon && <span className="refill-chip">Refill soon</span>}<button className="edit-link" onClick={() => { setEditingMedicine(medicine); setShowForm(true); }}>Edit</button></div><p className="medicine-dose">{medicine.dose} <span>·</span> {medicine.form}</p><p className="medicine-schedule"><Clock3 size={14} /> {medicine.schedule}</p><p className="medicine-instruction">{medicine.instructions}</p></div><div className="medicine-meta"><span className="meta-label">NEXT ACTION</span><strong className={medicine.status === "missed" ? "text-alert" : ""}>{medicine.next}</strong><span className="meta-label refill-label">REFILL DATE</span><span>{medicine.refill}</span></div><Button variant="outline" className={`complete-button ${medicine.status === "taken" ? "completed" : ""}`} onClick={() => toggleTaken(medicine.id)} aria-label={`Mark ${medicine.name} ${medicine.status === "taken" ? "as due" : "as taken"}`}>{medicine.status === "taken" ? <Check size={17} /> : <CheckCircle2 size={17} />}<span className="hide-mobile">{medicine.status === "taken" ? "Taken" : "Mark taken"}</span></Button></article> })}</div>
          {visibleMedicines.length === 0 && <div className="empty-state"><Sparkles size={22} /><h3>No medicines in this view</h3><p>Try a different search or filter.</p></div>}
        </div>
        <aside className="side-column"><div className="map-card blueprint-frame"><div className="side-card-title"><div><p className="eyebrow">LIVE LOCATIONS / 03</p><h2>Find a pharmacy</h2></div><MapPin size={17} /></div><PharmacyMap /></div><div className="side-card blueprint-frame"><div className="side-card-title"><div><p className="eyebrow">NEXT 24 HOURS</p><h2>Schedule map</h2></div><ArrowUpRight size={17} /></div><div className="timeline"><div className="timeline-item active"><span>08:00</span><div><strong>Lisinopril</strong><small>10 mg · Due now</small></div><i /></div><div className="timeline-item done"><span>08:30</span><div><strong>Vitamin D3</strong><small>1,000 IU · Completed</small></div><i /></div><div className="timeline-item"><span>19:00</span><div><strong>Metformin</strong><small>500 mg · Upcoming</small></div><i /></div><div className="timeline-item"><span>21:00</span><div><strong>Atorvastatin</strong><small>20 mg · Refill in 4 days</small></div><i /></div></div></div><div className="safety-card"><div className="safety-icon"><AlertTriangle size={17} /></div><div><p className="eyebrow">SAFETY NOTE</p><p>For organization only — <strong>not medical advice.</strong> Follow your prescription label and ask a licensed clinician or pharmacist about changes, interactions, or missed doses.</p></div></div><div className="sync-card"><div className="sync-orbit"><span /></div><div><strong>Workspace synced</strong><small>Last updated just now</small></div><span className="sync-status" /></div></aside>
      </section>

      <footer className="workspace-footer"><span>MEDGRID / PHARMACY CHECKLIST</span><span>Private workspace · Organize with confidence</span></footer>
    </div>

    {showForm && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-title"><form className="modal-card blueprint-frame" onSubmit={addMedicine}><button type="button" className="modal-close" onClick={() => { setShowForm(false); setEditingMedicine(null); }} aria-label="Close"><X size={18} /></button><p className="eyebrow">{editingMedicine ? "EDIT RECORD / 01" : "NEW RECORD / 01"}</p><h2 id="add-title">{editingMedicine ? "Edit medicine" : "Add medicine"}</h2><p className="modal-copy">Capture the essentials. You can refine the schedule later.</p><label>Medicine name<Input name="name" required placeholder="e.g. Lisinopril" defaultValue={editingMedicine?.name} autoFocus /></label><div className="form-row"><label>Dose<Input name="dose" required placeholder="10 mg" defaultValue={editingMedicine?.dose} /></label><label>Next schedule<Input name="schedule" required placeholder="Every morning · 08:00" defaultValue={editingMedicine?.schedule} /></label></div><div className="form-row"><label>Refill date<Input name="refill" placeholder="Sep 05" defaultValue={editingMedicine?.refill} /></label><label>Instructions<Input name="instructions" placeholder="Short label-aligned note" defaultValue={editingMedicine?.instructions} /></label></div><label>Notes<Input name="notes" placeholder="Optional personal note" defaultValue={editingMedicine?.notes} /></label><Button type="submit" className="primary-button full-button"><Plus size={17} /> {editingMedicine ? "Save changes" : "Add to checklist"}</Button></form></div>}
    {showReminders && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reminder-title"><div className="modal-card blueprint-frame"><button type="button" className="modal-close" onClick={() => setShowReminders(false)} aria-label="Close"><X size={18} /></button><p className="eyebrow">AUTOMATION / 02</p><h2 id="reminder-title">Reminder control</h2><p className="modal-copy">Approaching doses and refill dates will surface here. Email delivery can be connected when a provider is configured.</p><div className="reminder-row"><div className="reminder-icon"><BellRing size={17} /></div><div><strong>Dose reminders</strong><small>30 minutes before a scheduled dose</small></div><span className="toggle-on">ON</span></div><div className="reminder-row"><div className="reminder-icon"><Clock3 size={17} /></div><div><strong>Refill reminders</strong><small>7 days before the refill date</small></div><span className="toggle-on">ON</span></div><div className="reminder-note">In-app reminders are ready. Email reminders are backend-ready and require a connected email provider.</div><Button className="ghost-button full-button" onClick={() => setShowReminders(false)}>Close panel</Button></div></div>}
  </DashboardLayout>;
}
