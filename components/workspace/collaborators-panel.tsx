"use client";

import React, { useState } from "react";
import { UserPlus, Users, Trash2, Check, Mail, Crown, Eye, Pencil } from "lucide-react";

export interface ListMember {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  assignments?: number;
}

export interface CollaboratorsPanelProps {
  listId: string | null;
  members: ListMember[];
  taskId?: string | null;
  assignees?: ListMember[];
  onInvite: (input: {
    listId: string;
    email: string;
    displayName?: string;
    role?: string;
  }) => void | Promise<void>;
  onUpdateMember: (
    memberId: string,
    updates: Partial<{ role: string; status: string }>
  ) => void | Promise<void>;
  onRemoveMember: (memberId: string) => void | Promise<void>;
  onAssign?: (taskId: string, memberIds: string[]) => void | Promise<void>;
}

const ROLES: { value: string; label: string; icon: typeof Crown }[] = [
  { value: "EDITOR", label: "Can edit", icon: Pencil },
  { value: "VIEWER", label: "Can view", icon: Eye },
];

export function CollaboratorsPanel({
  listId,
  members,
  taskId,
  assignees,
  onInvite,
  onUpdateMember,
  onRemoveMember,
  onAssign,
}: CollaboratorsPanelProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  async function handleInvite() {
    if (!listId) return;
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setError(null);
    setIsInviting(true);
    try {
      await onInvite({ listId, email: value, role });
      setEmail("");
    } catch (err: any) {
      setError(err?.message || "Could not send the invitation");
    } finally {
      setIsInviting(false);
    }
  }

  const assignedIds = new Set((assignees ?? []).map((a) => a.id));

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 app-overline font-semibold text-[var(--app-muted)]">
          <Users className="h-3.5 w-3.5" />
          Collaboration
        </h3>
        <span className="rounded-full bg-[var(--app-panel-alt)] px-1.5 py-0.5 app-meta font-bold text-[var(--app-muted)]">
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="rounded-lg bg-[var(--app-panel-alt)] px-3 py-2 app-meta text-[var(--app-muted)]">
          Share this list with someone to work on it together.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-2 rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-2.5 py-1.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] text-[10px] font-semibold">
                {member.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-[var(--app-text)]">
                  {member.displayName}
                </span>
                <span className="block truncate text-[11px] text-[var(--app-muted)]">
                  {member.email}
                  {member.status === "INVITED" ? " · pending" : ""}
                </span>
              </span>

              {taskId && onAssign && (
                <button
                  type="button"
                  aria-label={
                    assignedIds.has(member.id)
                      ? `Unassign ${member.displayName}`
                      : `Assign ${member.displayName}`
                  }
                  onClick={() => {
                    const next = new Set(assignedIds);
                    if (next.has(member.id)) next.delete(member.id);
                    else next.add(member.id);
                    onAssign(taskId, [...next]);
                  }}
                  className={`shrink-0 rounded-[3px] p-1 transition-colors cursor-pointer ${ assignedIds.has(member.id) ? "bg-[var(--app-accent)] text-white" : "text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]" }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}

              <select
                value={member.role}
                aria-label={`Role for ${member.displayName}`}
                onChange={(e) => onUpdateMember(member.id, { role: e.target.value })}
                className="shrink-0 rounded-[3px] border border-[var(--app-border)] bg-[var(--app-panel)] px-1 py-0.5 text-xs text-[var(--app-muted)] outline-none focus:border-[var(--app-accent)] cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
                {member.role === "OWNER" && <option value="OWNER">Owner</option>}
              </select>

              <button
                type="button"
                aria-label={`Remove ${member.displayName}`}
                onClick={() => {
                  if (confirmRemove === member.id) {
                    onRemoveMember(member.id);
                    setConfirmRemove(null);
                  } else {
                    setConfirmRemove(member.id);
                  }
                }}
                className={`shrink-0 rounded-[3px] p-1 transition-colors cursor-pointer ${ confirmRemove === member.id ? "bg-[rgba(255,0,26,0.1)] text-[#eb5757]" : "text-[var(--app-muted)] hover:bg-[rgba(255,0,26,0.1)] hover:text-[#eb5757]" }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--app-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInvite();
              }}
              placeholder="teammate@company.com"
              aria-label="Invite by email"
              className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] py-1 pl-7 pr-2 text-xs text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)] focus:border-[var(--app-accent)]"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Invite role"
            className="rounded-[4px] border border-[var(--app-border)] bg-[var(--app-panel)] px-1.5 py-1 text-xs text-[var(--app-text)] outline-none focus:border-[var(--app-accent)] cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleInvite}
            disabled={isInviting || !listId}
            className="flex items-center gap-1 rounded-[4px] bg-[var(--app-accent)] hover:bg-[var(--app-accent)]/90 px-2.5 py-1 text-xs font-medium text-white transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <UserPlus className="h-3 w-3" />
            Invite
          </button>
        </div>
        {error && <p className="app-meta font-semibold text-rose-500">{error}</p>}
        {!listId && (
          <p className="app-meta text-[var(--app-muted)]">
            Pick a list to share it with other people.
          </p>
        )}
      </div>
    </section>
  );
}
