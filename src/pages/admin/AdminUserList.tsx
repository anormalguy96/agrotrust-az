import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

type MinimalUser = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  suspended: boolean;
};

async function fetchUsers(): Promise<MinimalUser[]> {
  const res = await fetch("/.netlify/functions/admin-list-users", {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load users");
  }

  return (await res.json()) as MinimalUser[];
}

async function toggleSuspendUser(userId: string): Promise<void> {
  const res = await fetch("/.netlify/functions/admin-toggle-suspend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to update user status");
  }
}

export function AdminUserList() {
  const { user } = useAuth();

  // Guard: only admin should see this UI
  if (user?.role !== "admin") {
    return (
      <div className="card">
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const suspendMutation = useMutation({
    mutationFn: toggleSuspendUser,
    onSuccess: () => {
      usersQuery.refetch();
    },
  });

  return (
    <div className="admin-users-page">
      <header className="admin-head">
        <div>
          <p className="dash-kicker">Admin</p>
          <h1 className="dash-title">User management</h1>
          <p className="muted">
            View all platform accounts, verify details, and suspend accounts
            when necessary.
          </p>
        </div>
      </header>

      <section className="card">
        {usersQuery.isLoading && <p>Loading users…</p>}

        {usersQuery.isError && (
          <p className="muted">
            {(usersQuery.error as Error)?.message ??
              "Something went wrong while loading users."}
          </p>
        )}

        {usersQuery.data && usersQuery.data.length === 0 && (
          <p className="muted">No users found.</p>
        )}

        {usersQuery.data && usersQuery.data.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Email verified</th>
                <th>Suspended</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>{u.emailVerified ? "Yes" : "No"}</td>
                  <td>{u.suspended ? "Yes" : "No"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={suspendMutation.isPending}
                      onClick={() => suspendMutation.mutate(u.id)}
                    >
                      {u.suspended ? "Unsuspend" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <style>
        {`
          .admin-users-page {
            display: flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .admin-head {
            display:flex;
            align-items:flex-start;
            justify-content:space-between;
            gap:var(--space-4);
            flex-wrap:wrap;
          }
        `}
      </style>
    </div>
  );
}