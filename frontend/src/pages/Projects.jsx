import { useEffect, useMemo, useState } from 'react';
import { FolderKanban, Plus, Trash2, Users, Loader2, CalendarDays, ArrowRight } from 'lucide-react';
import API from '../api/axios';
import Modal from '../components/Modal';

const emptyForm = { name: '', description: '', startDate: '', dueDate: '' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [memberToAdd, setMemberToAdd] = useState('');
  const [form, setForm] = useState(emptyForm);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [projectsRes, usersRes] = await Promise.all([
        API.get('/projects'),
        user.role === 'ADMIN' ? API.get('/users') : Promise.resolve({ data: [] }),
      ]);
      setProjects(projectsRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not fetch workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const availableUsers = useMemo(() => {
    if (!selectedProject) return allUsers;
    const ids = (selectedProject.members || []).map((m) => m.user.id);
    return allUsers.filter((u) => !ids.includes(u.id));
  }, [allUsers, selectedProject]);

  const createProject = async (e) => {
    e.preventDefault();
    await API.post('/projects', form);
    setShowCreate(false);
    setForm(emptyForm);
    loadData();
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Remove this workspace and all its data?')) return;
    await API.delete(`/projects/${id}`);
    loadData();
  };

  const addMember = async () => {
    if (!selectedProject || !memberToAdd) return;
    await API.post(`/projects/${selectedProject.id}/members`, { userId: Number(memberToAdd) });
    setMemberToAdd('');
    setShowManage(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-secondary">
        <Loader2 className="mr-2 animate-spin" size={18} /> Fetching workspaces...
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-red-500 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-primary flex items-center gap-2">
            <FolderKanban size={22} className="text-violet-500" />
            Workspaces
          </h1>
          <p className="text-sm text-secondary mt-1">Organize and manage your team&apos;s projects</p>
        </div>
        {user.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
            <Plus size={16} /> New workspace
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {projects.length === 0 ? (
        <div className="rounded-2xl card border-dashed p-12 text-center">
          <FolderKanban size={36} className="mx-auto text-muted mb-3" />
          <p className="text-secondary font-medium">No workspaces created yet</p>
          <p className="text-muted text-sm mt-1">Get started by creating your first workspace above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const members = project.members || [];
            return (
              <div key={project.id} className="rounded-2xl card p-5 flex flex-col justify-between hover:shadow-lg transition-shadow group">
                {/* Top section */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-surface)] px-2.5 py-1 text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">
                      {project.status}
                    </span>
                    {user.role === 'ADMIN' && (
                      <button onClick={() => deleteProject(project.id)} className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-primary">{project.name}</h2>
                  <p className="text-sm text-secondary mt-1 line-clamp-2">
                    {project.description || 'No description provided'}
                  </p>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 mt-4 text-xs text-muted">
                  <CalendarDays size={13} />
                  <span>{new Date(project.startDate).toLocaleDateString()}</span>
                  <ArrowRight size={11} />
                  <span>{new Date(project.dueDate).toLocaleDateString()}</span>
                </div>

                {/* Members + Action */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-theme">
                  <div className="flex -space-x-2">
                    {members.slice(0, 4).map((m) => (
                      <div key={m.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[var(--bg)]">
                        {m.user.name[0].toUpperCase()}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-[var(--surface-overlay)] flex items-center justify-center text-[10px] font-bold text-muted ring-2 ring-[var(--bg)]">
                        +{members.length - 4}
                      </div>
                    )}
                    {members.length === 0 && <span className="text-xs text-muted">No members</span>}
                  </div>
                  <button
                    onClick={() => { setSelectedProject(project); setShowManage(true); }}
                    className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    <Users size={13} /> Team ({members.length})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <Modal title="New workspace" onClose={() => setShowCreate(false)}>
          <form onSubmit={createProject} className="space-y-4">
            <FormInput label="Workspace name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Marketing Q3" />
            <FormTextarea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="What is this workspace about?" />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="Start" type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
              <FormInput label="Deadline" type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
            </div>
            <button className="w-full rounded-xl btn-primary py-3 text-sm">Create workspace</button>
          </form>
        </Modal>
      )}

      {/* ── Manage Members Modal ── */}
      {showManage && selectedProject && (
        <Modal title={`Team — ${selectedProject.name}`} onClose={() => setShowManage(false)}>
          <div className="space-y-5">
            {user.role === 'ADMIN' && (
              <div className="rounded-xl bg-[var(--surface-overlay)] p-4">
                <label className="block text-xs font-semibold text-secondary mb-2 uppercase tracking-wider">Add a team member</label>
                <select value={memberToAdd} onChange={(e) => setMemberToAdd(e.target.value)} className="w-full rounded-xl input-field px-4 py-2.5 text-sm">
                  <option value="">Choose a person</option>
                  {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                </select>
                <button onClick={addMember} className="mt-3 w-full rounded-xl btn-primary py-2.5 text-sm">Add to team</button>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Current team</p>
              <div className="space-y-2">
                {(selectedProject.members || []).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl card px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                      {m.user.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{m.user.name}</p>
                      <p className="text-xs text-muted truncate">{m.user.email}</p>
                    </div>
                  </div>
                ))}
                {(selectedProject.members || []).length === 0 && (
                  <p className="text-sm text-muted text-center py-4">No team members yet</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl input-field px-4 py-2.5 text-sm" />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wider">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} className="w-full rounded-xl input-field px-4 py-2.5 text-sm" />
    </div>
  );
}