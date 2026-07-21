import { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, Eye, Camera } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "../../api/admin";
import { useAdminList, adminDelete } from "../../hooks/useAdminList";
import { mediaUrl } from "../../utils/media";
import {
  AdminToolbar,
  AdminFilterSelect,
  AdminPagination,
  AdminEmptyState,
  AdminSkeletonGrid,
  AdminPageIntro,
  AdminFormModal,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminButton,
  AdminActionBar,
  AdminGhostBtn,
  AdminDetailsModal,
  adminDisplay,
} from "../../components/admin/AdminUI";

const emptyForm = {
  name: "",
  shortName: "",
  captain: "",
  viceCaptain: "",
  coach: "",
  manager: "",
  teamOwner: "",
  contactNumber: "",
  email: "",
  city: "",
  homeGround: "",
  teamColor: "#0f172a",
  tournament: "",
  createdBy: "",
  squad: [],
};

export default function AdminTeamsPage() {
  const fetcher = useCallback((params) => adminAPI.getTeams(params), []);
  const { items, pagination, loading, page: _page, setPage, search, setSearch, extra, setExtra, reload } =
    useAdminList(fetcher);

  const [tournaments, setTournaments] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [playersPool, setPlayersPool] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null); // create | edit
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewRows, setViewRows] = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [tRes, oRes] = await Promise.all([
          adminAPI.getTournaments({ page: 1, limit: 100 }),
          adminAPI.getUsers({ page: 1, limit: 100, role: "organizer" }),
        ]);
        setTournaments(tRes.data.data.items || []);
        setOrganizers(oRes.data.data.items || []);
      } catch {
        /* optional metadata */
      }
    })();
  }, []);

  useEffect(() => {
    if (!form.tournament) {
      setPlayersPool([]);
      return;
    }
    (async () => {
      try {
        const { data } = await adminAPI.getPlayers({
          page: 1,
          limit: 100,
          tournament: form.tournament,
        });
        setPlayersPool(data.data.items || []);
      } catch {
        setPlayersPool([]);
      }
    })();
  }, [form.tournament]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview("");
    setModal("create");
  };

  const openEdit = async (row) => {
    setBusyId(row._id);
    try {
      const { data } = await adminAPI.getTeam(row._id);
      const t = data.data;
      setEditId(t._id);
      setForm({
        name: t.name || "",
        shortName: t.shortName || "",
        captain: t.captain || "",
        viceCaptain: t.viceCaptain || "",
        coach: t.coach || "",
        manager: t.manager || "",
        teamOwner: t.teamOwner || "",
        contactNumber: t.contactNumber || "",
        email: t.email || "",
        city: t.city || "",
        homeGround: t.homeGround || "",
        teamColor: t.teamColor || "#0f172a",
        tournament: t.tournament?._id || t.tournament || "",
        createdBy: t.createdBy?._id || t.createdBy || "",
        squad: (t.squad || []).map((p) => p._id || p),
      });
      setLogoFile(null);
      setLogoPreview(mediaUrl(t.logo) || "");
      setModal("edit");
    } catch (err) {
      toast.error(err.message || "Failed to load team.");
    } finally {
      setBusyId(null);
    }
  };

  const openView = async (row) => {
    setBusyId(row._id);
    try {
      const { data } = await adminAPI.getTeam(row._id);
      const t = data.data;
      setViewRows({
        title: t.name || "Team",
        rows: [
          { label: "Name", value: t.name },
          { label: "Short name", value: t.shortName },
          { label: "Captain", value: t.captain },
          { label: "Vice captain", value: t.viceCaptain },
          { label: "Coach", value: t.coach },
          { label: "Manager", value: t.manager },
          { label: "Owner", value: t.teamOwner },
          { label: "Contact", value: t.contactNumber },
          { label: "Email", value: t.email },
          { label: "City", value: t.city },
          { label: "Home ground", value: t.homeGround },
          { label: "Tournament", value: t.tournament?.tournamentName },
          { label: "Organizer", value: t.createdBy?.fullName },
          {
            label: "Squad",
            value: t.squad?.length
              ? t.squad.map((p) => p.name).join(", ")
              : null,
          },
        ],
      });
    } catch (err) {
      toast.error(err.message || "Failed to load team.");
    } finally {
      setBusyId(null);
    }
  };

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid image. Use JPG, PNG, or WEBP.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Team name is required.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "squad") {
          fd.append("squad", JSON.stringify(v || []));
        } else if (v != null && v !== "") {
          fd.append(k, v);
        }
      });
      if (logoFile) fd.append("logo", logoFile);

      if (modal === "create") {
        await adminAPI.createTeam(fd);
        toast.success("Team created successfully.");
      } else {
        await adminAPI.updateTeam(editId, fd);
        toast.success("Team updated successfully.");
      }
      setModal(null);
      await reload();
    } catch (err) {
      toast.error(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <AdminPageIntro>Premium team management with live database records</AdminPageIntro>
        <AdminButton onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4" /> Add Team
        </AdminButton>
      </div>

      <AdminToolbar search={search} onSearch={setSearch} placeholder="Search teams…">
        <AdminFilterSelect
          value={extra.tournament || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, tournament: e.target.value }))}
        >
          <option value="all">All tournaments</option>
          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.tournamentName}
            </option>
          ))}
        </AdminFilterSelect>
      </AdminToolbar>

      {loading ? (
        <AdminSkeletonGrid count={6} />
      ) : !items.length ? (
        <AdminEmptyState
          icon={Building2}
          title="No teams available."
          description="Create a team or adjust your filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {items.map((team) => {
              const logo = mediaUrl(team.logo);
              return (
                <article
                  key={team._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-14 h-14 rounded-xl border overflow-hidden flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${team.teamColor || "#0f172a"}18`,
                        borderColor: `${team.teamColor || "#e2e8f0"}55`,
                      }}
                    >
                      {logo ? (
                        <img src={logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 truncate">{adminDisplay(team.name)}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {adminDisplay(team.shortName)}
                        {team.city ? ` · ${team.city}` : ""}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {adminDisplay(team.tournament?.tournamentName)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Captain</p>
                      <p className="font-semibold text-slate-800 truncate">
                        {adminDisplay(team.captain)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Squad</p>
                      <p className="font-semibold text-slate-800">{team.playersCount ?? 0}</p>
                    </div>
                  </div>
                  <AdminActionBar>
                    <AdminGhostBtn disabled={busyId === team._id} onClick={() => openView(team)}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </AdminGhostBtn>
                    <AdminGhostBtn disabled={busyId === team._id} onClick={() => openEdit(team)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </AdminGhostBtn>
                    <AdminGhostBtn
                      danger
                      disabled={busyId === team._id}
                      onClick={() => {
                        if (window.confirm(`Delete team "${team.name}" and its players?`)) {
                          setBusyId(team._id);
                          adminDelete(
                            () => adminAPI.deleteTeam(team._id),
                            reload,
                            "Team deleted successfully."
                          ).finally(() => setBusyId(null));
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </AdminGhostBtn>
                  </AdminActionBar>
                </article>
              );
            })}
          </div>
          <AdminPagination pagination={pagination} onPageChange={setPage} loading={loading} />
        </>
      )}

      <AdminDetailsModal
        open={!!viewRows}
        title={viewRows?.title}
        rows={viewRows?.rows || []}
        onClose={() => setViewRows(null)}
      />

      <AdminFormModal
        open={!!modal}
        wide
        title={modal === "create" ? "Add Team" : "Edit Team"}
        onClose={() => setModal(null)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" form="admin-team-form" loading={saving} disabled={saving}>
              {modal === "create" ? "Create team" : "Save changes"}
            </AdminButton>
          </>
        }
      >
        <form id="admin-team-form" onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-400" />
              )}
              <label className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent cursor-pointer pb-1">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onLogo} />
              </label>
            </div>
            <p className="text-sm text-slate-500">Team logo · JPG/PNG/WEBP · max 5MB</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Team name" className="sm:col-span-2">
              <AdminInput value={form.name} onChange={set("name")} required />
            </AdminField>
            <AdminField label="Short name">
              <AdminInput value={form.shortName} onChange={set("shortName")} maxLength={10} />
            </AdminField>
            <AdminField label="Team color">
              <AdminInput type="color" value={form.teamColor} onChange={set("teamColor")} />
            </AdminField>
            <AdminField label="Captain">
              <AdminInput value={form.captain} onChange={set("captain")} />
            </AdminField>
            <AdminField label="Vice captain">
              <AdminInput value={form.viceCaptain} onChange={set("viceCaptain")} />
            </AdminField>
            <AdminField label="Coach">
              <AdminInput value={form.coach} onChange={set("coach")} />
            </AdminField>
            <AdminField label="Manager">
              <AdminInput value={form.manager} onChange={set("manager")} />
            </AdminField>
            <AdminField label="Team owner">
              <AdminInput value={form.teamOwner} onChange={set("teamOwner")} />
            </AdminField>
            <AdminField label="Contact number">
              <AdminInput value={form.contactNumber} onChange={set("contactNumber")} />
            </AdminField>
            <AdminField label="Email">
              <AdminInput type="email" value={form.email} onChange={set("email")} />
            </AdminField>
            <AdminField label="City">
              <AdminInput value={form.city} onChange={set("city")} />
            </AdminField>
            <AdminField label="Home ground">
              <AdminInput value={form.homeGround} onChange={set("homeGround")} />
            </AdminField>
            <AdminField label="Tournament">
              <AdminSelect value={form.tournament} onChange={set("tournament")}>
                <option value="">Select tournament</option>
                {tournaments.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tournamentName}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Organizer account">
              <AdminSelect value={form.createdBy} onChange={set("createdBy")}>
                <option value="">Auto from tournament</option>
                {organizers.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.fullName} ({o.email})
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>

          <AdminField label="Squad" hint="Select players from the chosen tournament">
            <select
              multiple
              value={form.squad.map(String)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  squad: Array.from(e.target.selectedOptions).map((o) => o.value),
                }))
              }
              className="w-full min-h-[120px] px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              {playersPool.length === 0 ? (
                <option disabled value="">
                  {form.tournament ? "No players in this tournament" : "Select a tournament first"}
                </option>
              ) : (
                playersPool.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                    {p.jerseyNumber != null ? ` (#${p.jerseyNumber})` : ""}
                  </option>
                ))
              )}
            </select>
          </AdminField>
        </form>
      </AdminFormModal>
    </div>
  );
}
