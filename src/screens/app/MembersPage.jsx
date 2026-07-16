"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Trash2 } from "lucide-react";
import { H1 } from "../../components/ui/Typography.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { usePermission } from "../../hooks/usePermission.js";
import { useAuth } from "../../hooks/useAuth.js";
import { adminApi } from "../../lib/adminApi.js";
import { inviteSchema } from "../../config/schemas.js";
import { PERMISSIONS, ROLE_LABELS } from "../../config/roles.js";

function InviteModal({ open, onClose, onInvited }) {
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(inviteSchema) });

  const onSubmit = async ({ email }) => {
    try {
      await adminApi.inviteUser(email);
      addToast({ message: `Invitation sent to ${email}.`, type: "success" });
      reset();
      onInvited();
      onClose();
    } catch (err) {
      addToast({ message: err.message, type: "error" });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite an admin">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-500">
          They'll get an email with a link to set their own password. Admins can create,
          edit, and publish content, and invite other admins.
        </p>
        <Input
          label="Email"
          type="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Send invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MembersPage() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const { can } = usePermission();
  const { user: me } = useAuth();
  const { addToast } = useToast();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setUsers(await adminApi.listUsers());
      setStatus("ready");
    } catch (err) {
      addToast({ message: err.message, type: "error" });
      setStatus("error");
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (user) => {
    setRemovingId(user.id);
    try {
      await adminApi.removeUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      addToast({ message: `${user.email} removed.`, type: "success" });
    } catch (err) {
      addToast({ message: err.message, type: "error" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <H1>Members</H1>
          <p className="mt-1 text-sm text-gray-500">Everyone who can sign in to this dashboard.</p>
        </div>
        {can(PERMISSIONS.USERS_INVITE) && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} className="mr-2" />
            Invite admin
          </Button>
        )}
      </div>

      {status === "loading" && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load members.{" "}
          <button onClick={load} className="font-medium underline">
            Try again
          </button>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-3">
          {users.map((user) => {
            const isMe = user.id === me?.id;
            return (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={user.name || user.email} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.name || user.email}
                      {isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge color="green">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                  {/* Blocked server-side too — this just hides the trap. */}
                  {can(PERMISSIONS.USERS_REMOVE) && !isMe && (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={removingId === user.id}
                      onClick={() => remove(user)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={load} />
    </div>
  );
}
