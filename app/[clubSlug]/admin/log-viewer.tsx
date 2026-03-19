"use client";

interface LogEntry {
  id: string;
  action: string;
  target_member_code: string | null;
  details: string | null;
  created_at: string;
  staff_code: string | null;
  staff_name: string | null;
}

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  member_created: { label: "Created member", color: "bg-blue-100 text-blue-700" },
  membership_assigned: { label: "Assigned membership", color: "bg-blue-100 text-blue-700" },
  membership_prolongated: { label: "Extended membership", color: "bg-blue-100 text-blue-700" },
  role_assigned: { label: "Assigned role", color: "bg-blue-100 text-blue-700" },
  spin_performed: { label: "Performed spin", color: "bg-purple-100 text-purple-700" },
  quest_validated: { label: "Validated quest", color: "bg-green-100 text-green-700" },
  quest_approved: { label: "Approved quest", color: "bg-green-100 text-green-700" },
  checkin: { label: "Checked in", color: "bg-green-100 text-green-700" },
  order_fulfilled: { label: "Fulfilled order", color: "bg-amber-100 text-amber-700" },
  walkin_order: { label: "Walk-in order", color: "bg-amber-100 text-amber-700" },
  offer_order_fulfilled: { label: "Fulfilled order", color: "bg-amber-100 text-amber-700" },
  offer_walkin_order: { label: "Walk-in order", color: "bg-amber-100 text-amber-700" },
};

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function LogViewer({ logs }: { logs: LogEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-gray-400 text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
      {logs.map((log) => {
        const config = ACTION_CONFIG[log.action] ?? {
          label: log.action,
          color: "bg-gray-100 text-gray-700",
        };

        return (
          <div key={log.id} className="px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
                  {config.label}
                </span>
                {log.target_member_code && (
                  <span className="text-xs font-mono font-semibold text-gray-900">
                    {log.target_member_code}
                  </span>
                )}
              </div>
              {log.details && (
                <p className="text-xs text-gray-500 mt-1 truncate">{log.details}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-1">
                {log.staff_name ?? log.staff_code ?? "System"}
              </p>
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
              {timeAgo(log.created_at)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
