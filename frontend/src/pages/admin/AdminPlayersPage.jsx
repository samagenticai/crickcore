import { useCallback, useEffect, useState } from "react";
import { UserCircle, Plus, Pencil, Trash2, Eye, Camera } from "lucide-react";
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
  formatAdminDate,
} from "../../components/admin/AdminUI";

const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];
const BATTING_STYLES = ["Right-Handed", "Left-Handed"];
const BOWLING_STYLES = [
  "Right-arm Fast",
  "Right-arm Fast-medium",
  "Right-arm Medium",
  "Right-arm Off Break",
  "Left-arm Fast",
  "Left-arm Fast-medium",
  "Left-arm Medium",
  "Slow Left-arm Orthodox",
  "Left-arm Wrist Spin",
  "Leg Break",
  "Leg Break Googly",
];

const showBatting = (role) => ["Batsman", "All-Rounder", "Wicket-Keeper"].includes(role);
const showBowling = (role) => ["Bowler", "All-Rounder"].includes(role);

const emptyForm = {
  name: "",
  jerseyNumber: "",
  age: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  address: "",
  role: "Batsman",
  battingStyle: "",
  bowlingStyle: "",
  team: "",
  tournament: "",
};

export default function AdminPlayersPage() {
  const fetcher = useCallback((params) => adminAPI.getPlayers(params), []);
  const { items, pagination, loading, page: _page, setPage, search, setSearch, extra, setExtra, reload } =
    useAdminList(fetcher);

  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewRows, setViewRows] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminAPI.getTournaments({ page: 1, limit: 100 });
        setTournaments(data.data.items || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const params = { page: 1, limit: 100 };
        if (form.tournament) params.tournament = form.tournament;
        const { data } = await adminAPI.getTeams(params);
        setTeams(data.data.items || []);
      } catch {
        setTeams([]);
      }
    })();
  }, [form.tournament]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview("");
    setModal("create");
  };

  const openEdit = async (row) => {
    setBusyId(row._id);
    try {
      const { data } = await adminAPI.getPlayer(row._id);
      const p = data.data;
      setEditId(p._id);
      setForm({
        name: p.name || "",
        jerseyNumber: p.jerseyNumber ?? "",
        age: p.age ?? "",
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : "",
        phone: p.phone || "",
        email: p.email || "",
        address: p.address || "",
        role: p.role || "Batsman",
        battingStyle: p.battingStyle || "",
        bowlingStyle: p.bowlingStyle || "",
        team: p.team?._id || p.team || "",
        tournament: p.tournament?._id || p.tournament || "",
      });
      setPhotoFile(null);
      setPhotoPreview(mediaUrl(p.photo) || "");
      setModal("edit");
    } catch (err) {
      toast.error(err.message || "Failed to load player.");
    } finally {
      setBusyId(null);
    }
  };

  const openView = async (row) => {
    setBusyId(row._id);
    try {
      const { data } = await adminAPI.getPlayer(row._id);
      const p = data.data;
      setViewRows({
        title: p.name || "Player profile",
        rows: [
          { label: "Full name", value: p.name },
          { label: "Jersey", value: p.jerseyNumber != null ? `#${p.jerseyNumber}` : null },
          { label: "Role", value: p.role },
          { label: "Batting", value: p.battingStyle },
          { label: "Bowling", value: p.bowlingStyle },
          { label: "Age", value: p.age },
          {
            label: "Date of birth",
            value: p.dateOfBirth ? formatAdminDate(p.dateOfBirth) : null,
          },
          { label: "Phone", value: p.phone },
          { label: "Email", value: p.email },
          { label: "Address", value: p.address },
          { label: "Team", value: p.team?.name },
          { label: "Tournament", value: p.tournament?.tournamentName },
        ],
      });
    } catch (err) {
      toast.error(err.message || "Failed to load player.");
    } finally {
      setBusyId(null);
    }
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid image. Use JPG, PNG, or WEBP.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Player name is required.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v != null && v !== "") fd.append(k, v);
      });
      if (photoFile) fd.append("photo", photoFile);

      if (modal === "create") {
        await adminAPI.createPlayer(fd);
        toast.success("Player created successfully.");
      } else {
        await adminAPI.updatePlayer(editId, fd);
        toast.success("Player updated successfully.");
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
        <AdminPageIntro>Player roster management from live MongoDB data</AdminPageIntro>
        <AdminButton onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4" /> Add Player
        </AdminButton>
      </div>

      <AdminToolbar search={search} onSearch={setSearch} placeholder="Search players…">
        <AdminFilterSelect
          value={extra.role || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, role: e.target.value }))}
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </AdminFilterSelect>
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
          icon={UserCircle}
          title="No players available."
          description="Add a player or adjust your search filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {items.map((p) => {
              const photo = mediaUrl(p.photo);
              return (
                <article
                  key={p._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      {p.jerseyNumber != null && (
                        <span className="absolute -bottom-1 -right-1 min-w-[22px] h-5 px-1 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                          {p.jerseyNumber}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 truncate">{adminDisplay(p.name)}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{adminDisplay(p.role)}</p>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {adminDisplay(p.team?.name)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Batting</p>
                      <p className="font-semibold text-slate-800 truncate">
                        {adminDisplay(p.battingStyle)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Bowling</p>
                      <p className="font-semibold text-slate-800 truncate">
                        {adminDisplay(p.bowlingStyle)}
                      </p>
                    </div>
                  </div>
                  <AdminActionBar>
                    <AdminGhostBtn disabled={busyId === p._id} onClick={() => openView(p)}>
                      <Eye className="w-3.5 h-3.5" /> Profile
                    </AdminGhostBtn>
                    <AdminGhostBtn disabled={busyId === p._id} onClick={() => openEdit(p)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </AdminGhostBtn>
                    <AdminGhostBtn
                      danger
                      disabled={busyId === p._id}
                      onClick={() => {
                        if (window.confirm(`Delete player "${p.name}"?`)) {
                          setBusyId(p._id);
                          adminDelete(
                            () => adminAPI.deletePlayer(p._id),
                            reload,
                            "Player deleted successfully."
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
        title={modal === "create" ? "Add Player" : "Edit Player"}
        onClose={() => setModal(null)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setModal(null)} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" form="admin-player-form" loading={saving} disabled={saving}>
              {modal === "create" ? "Create player" : "Save changes"}
            </AdminButton>
          </>
        }
      >
        <form id="admin-player-form" onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-10 h-10 text-slate-400" />
              )}
              <label className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent cursor-pointer pb-1">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
              </label>
            </div>
            <p className="text-sm text-slate-500">Player photo · JPG/PNG/WEBP</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Full name" className="sm:col-span-2">
              <AdminInput value={form.name} onChange={set("name")} required />
            </AdminField>
            <AdminField label="Jersey number">
              <AdminInput type="number" value={form.jerseyNumber} onChange={set("jerseyNumber")} />
            </AdminField>
            <AdminField label="Playing role">
              <AdminSelect value={form.role} onChange={set("role")}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            {showBatting(form.role) && (
              <AdminField label="Batting style">
                <AdminSelect value={form.battingStyle} onChange={set("battingStyle")}>
                  <option value="">Select</option>
                  {BATTING_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
            )}
            {showBowling(form.role) && (
              <AdminField label="Bowling style">
                <AdminSelect value={form.bowlingStyle} onChange={set("bowlingStyle")}>
                  <option value="">Select</option>
                  {BOWLING_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
            )}
            <AdminField label="Date of birth">
              <AdminInput type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
            </AdminField>
            <AdminField label="Age">
              <AdminInput type="number" min={18} value={form.age} onChange={set("age")} />
            </AdminField>
            <AdminField label="Phone">
              <AdminInput value={form.phone} onChange={set("phone")} />
            </AdminField>
            <AdminField label="Email">
              <AdminInput type="email" value={form.email} onChange={set("email")} />
            </AdminField>
            <AdminField label="Address" className="sm:col-span-2">
              <AdminInput value={form.address} onChange={set("address")} />
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
            <AdminField label="Team assignment">
              <AdminSelect value={form.team} onChange={set("team")}>
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
        </form>
      </AdminFormModal>
    </div>
  );
}
