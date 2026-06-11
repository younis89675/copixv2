import Dashboard from "@/components/dashboard/Dashboard";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manufacturing costing insights, profit margins, and category performance.
        </p>
      </div>
      
      <Dashboard />
    </div>
  );
}