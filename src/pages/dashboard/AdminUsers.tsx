import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/app/config/routes";
import { NavLink, useNavigate } from "react-router-dom";

type AdminUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  phone: string | null;
  email_verified: boolean;
  is_suspended: boolean;
  created_at: string;
};

export function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      navigate(ROUTES.DASHBOARD.OVERVIEW);
      return;
    }

    setLoading(true);
    setError(null);

    fetch("/.netlify/functions/admin-users", {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setItems(data.users ?? []))
      .catch((err) => setError(err.message || "Failed to load users."))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  function toggleSuspend(target: AdminUser) {
    const next = !target.is_suspended;

    fetch("/.netlify/functions/admin-user-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId: target.id, suspend: next }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        setItems((prev) =>
          prev.map((u) =>
            u.id === target.id ? { ...u, is_suspended: next } : u
          )
        );
      })
      .catch((err) => {
        alert(err.message || "Failed to update user status.");
      });
  }

  return (
    <div className="admin-users-page">
      <header className="admin-users-head">
        <div>
          <p className="dash-kicker">Administration</p>
          <h1 className="dash-title">User management</h1>
          <p className="muted">
            View all platform members and suspend accounts when necessary.
          </p>
        </div>
        <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
          Back to overview
        </NavLink>
      </header>

      <div className="card">
        {loading && <p>Loading users…</p>}
        {error && <p className="muted">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="muted">No users found.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Verified</th>
                <th>Suspended</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    {u.first_name} {u.last_name}
                  </td>
                  <td>{u.role}</td>
                  <td>{u.phone ?? "—"}</td>
                  <td>{u.email_verified ? "Yes" : "No"}</td>
                  <td>{u.is_suspended ? "Yes" : "No"}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => toggleSuspend(u)}
                    >
                      {u.is_suspended ? "Unsuspend" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .admin-users-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }
        .admin-users-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}