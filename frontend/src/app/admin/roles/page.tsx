"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  listManagedUsers, updateUserRole, createUserWithRole, downloadUsersCsv,
  getInstitutes, ManagedUser, Institute,
} from "@/lib/api";

const ROLES = [
  ["student", "Student"], ["researcher", "Researcher"], ["lecturer", "Lecturer"],
  ["supervisor", "Supervisor"], ["reviewer", "Reviewer"], ["editor", "Editor"],
  ["alumni", "Alumni"], ["admin", "Institutional administrator"],
];

export default function RolesAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newRole, setNewRole] = useState("reviewer");
  const [newInstitute, setNewInstitute] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user?.is_role_manager) router.push("/dashboard");
  }, [authLoading, user, router]);

  useEffect(() => {
    getInstitutes().then((d) => setInstitutes(Array.isArray(d) ? d : d.results)).catch(() => {});
  }, []);

  function loadUsers() {
    listManagedUsers(q)
      .then((d) => setUsers(Array.isArray(d) ? d : d.results))
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load users."));
  }

  useEffect(() => { if (user?.is_role_manager) loadUsers(); }, [user]);

  async function handleRoleChange(id: string, role: string) {
    setError(""); setNotice("");
    try {
      await updateUserRole(id, role);
      setNotice("Role updated.");
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update role.");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setNotice(""); setCreating(true);
    try {
      await createUserWithRole({
        email: newEmail, username: newUsername, password: newPassword,
        first_name: newFirstName, last_name: newLastName,
        role: newRole, institute: newInstitute || null,
      });
      setNotice("Account created.");
      setNewEmail(""); setNewUsername(""); setNewPassword("");
      setNewFirstName(""); setNewLastName(""); setNewInstitute("");
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create account.");
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || !user?.is_role_manager) {
    return <p className="text-sm text-ink-secondary">Loading…</p>;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Manage user roles</h1>
        <button onClick={() => downloadUsersCsv()} className="btn-secondary">Export CSV</button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-green-700">{notice}</p>}

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Create a new account</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="field-input" />
          <input required placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="field-input" />
          <input required placeholder="First name" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} className="field-input" />
          <input required placeholder="Last name" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className="field-input" />
          <input required type="password" minLength={10} placeholder="Password (min 10 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="field-input" />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="field-input">
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={newInstitute} onChange={(e) => setNewInstitute(e.target.value)} className="field-input">
            <option value="">No institute</option>
            {institutes.map((i) => <option key={i.id} value={i.id}>{i.acronym}</option>)}
          </select>
          <button type="submit" disabled={creating} className="btn-primary sm:col-span-2">
            {creating ? "Creating…" : "Create account"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex gap-2">
          <input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} className="field-input flex-1" />
          <button onClick={loadUsers} className="btn-secondary">Search</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-muted">
              <th className="py-2">Name</th><th>Email</th><th>Institute</th><th>Last login</th><th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[color:var(--border)]">
                <td className="py-2">{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.institute?.acronym || "—"}</td>
                <td>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}</td>
                <td>
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="field-input">
                    {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}