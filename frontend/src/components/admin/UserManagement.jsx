import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import api from "../../api/axiosInstance";
import ContentWrapper from "../layout/ContentWrapper";
import PageContainer from "../layout/PageContainer";
import SectionBlock from "../layout/SectionBlock";
import { TableSkeleton } from "../ui/PremiumSkeleton";
import { notify } from "../../utils/notifications";
import "../../styles/admin/UserManagement.css";

const ROLE_OPTIONS = ["ADMIN", "SME", "USER"];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/");
      setUsers(response.data.map((u) => ({
        id: u.id,
        full_name: u.full_name || "",
        email: u.email,
        role: u.role || "USER",
        is_active: u.is_active,
        status: u.is_active ? "active" : "inactive",
        created_at: u.created_at,
        last_login: u.last_login,
      })));
    } catch (error) {
      notify.apiError(error, "Users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    document.body.classList.add("challenge-modal-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("challenge-modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  const filteredUsers = useMemo(() => {
    const searchTerm = globalFilter.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesSearch = !searchTerm
        || (u.full_name || "").toLowerCase().includes(searchTerm)
        || (u.email || "").toLowerCase().includes(searchTerm);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, globalFilter]);

  const handleToggleStatus = useCallback(async (userId, current) => {
    try {
      await api.patch(`/users/${userId}/`, { is_active: !current });
      notify.success(`User ${current ? "deactivated" : "activated"} successfully.`);
      loadUsers();
    } catch (error) {
      notify.apiError(error, "User status could not be updated.");
    }
  }, [loadUsers]);

  const columns = useMemo(() => [
    { accessorKey: "full_name", header: "Full Name", cell: (info) => info.getValue() || "-" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Role", cell: (info) => <span className={`role-badge ${info.getValue()}`}>{info.getValue()}</span> },
    { accessorKey: "status", header: "Status", cell: (info) => <span className={`status-badge ${info.getValue()}`}>{info.getValue()}</span> },
    { accessorKey: "created_at", header: "Created", cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : "-" },
    { accessorKey: "last_login", header: "Last Login", cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleString() : "-" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="action-buttons">
          <button className="action-btn-text edit" onClick={() => { setEditingUser(row.original); setIsModalOpen(true); }}>Edit</button>
          <button
            className={`action-btn-text status ${row.original.is_active ? "active" : "inactive"}`}
            onClick={() => handleToggleStatus(row.original.id, row.original.is_active)}
          >
            {row.original.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      ),
    },
  ], [handleToggleStatus]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getRowId: (row) => String(row.id),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleSaveUser = useCallback(async (event) => {
    event.preventDefault();
    try {
      await api.patch(`/users/${editingUser.id}/`, {
        role: editingUser.role,
      });
      notify.success("User updated successfully.");
      setIsModalOpen(false);
      loadUsers();
    } catch (error) {
      notify.apiError(error, "User changes could not be saved.");
    }
  }, [editingUser, loadUsers]);

  if (loading) {
    return (
      <PageContainer className="user-management-page" maxWidth="var(--cq-content-max-width-wide)">
        <ContentWrapper>
          <TableSkeleton rows={8} cols={7} />
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="user-management-page" maxWidth="var(--cq-content-max-width-wide)">
      <ContentWrapper>
        <SectionBlock>
          <div className="user-management-header">
            <div>
              <p className="section-eyebrow">Admin Console</p>
              <h1>User Management</h1>
            </div>
          </div>

          <div className="user-management-filters">
            <label className="user-management-search">
              <Search size={16} aria-hidden />
              <input value={globalFilter ?? ""} onChange={(event) => setGlobalFilter(event.target.value)} placeholder="Search by full name or email..." />
            </label>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="All">All Roles</option>
              {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          <div className="table-container user-management-table-container">
            <table className="data-table user-management-data-table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="user-management-row">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
                {!table.getRowModel().rows.length && (
                  <tr>
                    <td colSpan={columns.length} className="user-management-empty">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionBlock>

        {isModalOpen && editingUser && typeof document !== "undefined" && createPortal(
          <div className="modal-overlay user-management-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <form className="modal-content user-management-modal" onSubmit={handleSaveUser} onClick={(event) => event.stopPropagation()}>
              <div className="user-management-modal-head">
                <div>
                  <h2>Edit User</h2>
                  <p className="user-management-modal-lede">{editingUser.email}</p>
                </div>
              </div>
              <div className="user-management-modal-body">
                <div className="user-management-field">
                  <label htmlFor="edit-full-name">Full Name</label>
                  <input id="edit-full-name" value={editingUser.full_name || ""} readOnly />
                </div>
                <div className="user-management-field">
                  <label htmlFor="edit-role">Role</label>
                  <select id="edit-role" value={editingUser.role} onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value })}>
                    {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
              </div>
              <div className="user-management-modal-actions">
                <button type="button" className="user-management-modal-btn secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="user-management-modal-btn primary">Save</button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      </ContentWrapper>
    </PageContainer>
  );
};

export default UserManagement;
