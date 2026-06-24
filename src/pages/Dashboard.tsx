import React, { useState, useEffect, useCallback, FormEvent, MouseEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit, LogOut, Calendar, Filter, X, CheckSquare, Layers, Clock, Settings, Search, User, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import styles from '../styles/Dashboard.module.css';
import CustomDropdown from '../components/CustomDropdown.js';

interface Theme {
  id: string;
  name: string;
  color: string;
  text: string;
  gradStart: string;
  gradEnd: string;
}

const THEMES: Theme[] = [
  { id: 'silver', name: 'Lavender Mist', color: '#ffffff', text: '#000000', gradStart: '#4b5563', gradEnd: '#111827' },
  { id: 'purple', name: 'Royal Amethyst', color: '#a855f7', text: '#ffffff', gradStart: '#a855f7', gradEnd: '#f43f5e' },
  { id: 'blue', name: 'Deep Ocean', color: '#3b82f6', text: '#ffffff', gradStart: '#3b82f6', gradEnd: '#1d4ed8' },
  { id: 'green', name: 'Vibrant Emerald', color: '#10b981', text: '#ffffff', gradStart: '#10b981', gradEnd: '#047857' },
  { id: 'orange', name: 'Sunset Glow', color: '#f97316', text: '#ffffff', gradStart: '#f97316', gradEnd: '#b91c1c' },
];

interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
}

const AVATAR_PRESETS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%23f43f5e"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="42" r="18" fill="white" fill-opacity="0.85"/><path d="M22,80 C22,62 34,58 50,58 C66,58 78,62 78,80" fill="white" fill-opacity="0.85"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%232563eb"/><stop offset="100%" stop-color="%2338bdf8"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="42" r="18" fill="white" fill-opacity="0.85"/><path d="M22,80 C22,62 34,58 50,58 C66,58 78,62 78,80" fill="white" fill-opacity="0.85"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23064e3b"/><stop offset="100%" stop-color="%2310b981"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="42" r="18" fill="white" fill-opacity="0.85"/><path d="M22,80 C22,62 34,58 50,58 C66,58 78,62 78,80" fill="white" fill-opacity="0.85"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f97316"/><stop offset="100%" stop-color="%23e11d48"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="42" r="18" fill="white" fill-opacity="0.85"/><path d="M22,80 C22,62 34,58 50,58 C66,58 78,62 78,80" fill="white" fill-opacity="0.85"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23111827"/><stop offset="100%" stop-color="%234b5563"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="42" r="18" fill="white" fill-opacity="0.85"/><path d="M22,80 C22,62 34,58 50,58 C66,58 78,62 78,80" fill="white" fill-opacity="0.85"/></svg>'
];

export default function Dashboard() {
  const { user, token, logout, updateUser } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form/Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Profile States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileRoleTitle, setProfileRoleTitle] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Theme Selection State & Options
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('workspace-theme') || 'silver';
  });

  useEffect(() => {
    const selectedTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
    const root = document.documentElement;
    root.style.setProperty('--theme-color', selectedTheme.color);
    root.style.setProperty('--theme-text', selectedTheme.text);
    root.style.setProperty('--theme-gradient-start', selectedTheme.gradStart);
    root.style.setProperty('--theme-gradient-end', selectedTheme.gradEnd);
    localStorage.setItem('workspace-theme', currentTheme);
  }, [currentTheme]);

  // Settings Hover Menu & Export States
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportError, setExportError] = useState('');

  // Delete Confirmation States
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const handleExportData = () => {
    if (!exportStartDate || !exportEndDate) {
      setExportError('Please select both start and end dates.');
      return;
    }
    const start = new Date(exportStartDate);
    const end = new Date(exportEndDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      setExportError('Start date cannot be after end date.');
      return;
    }

    setExportError('');

    const filteredTasks = tasks.filter((task) => {
      if (!task.created_at) return false;
      const createdDate = new Date(task.created_at);
      return createdDate >= start && createdDate <= end;
    });

    if (filteredTasks.length === 0) {
      setExportError('No tasks found within this date range.');
      return;
    }

    // Generate CSV content
    const headers = ['Task ID', 'Title', 'Description', 'Status', 'Priority', 'Due Date', 'Created At'];
    const rows = filteredTasks.map((t) => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.due_date || 'N/A',
      t.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `task_data_${exportStartDate}_to_${exportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openProfileModal = () => {
    setProfileName(user?.name || '');
    setProfileBio(user?.bio || '');
    setProfileRoleTitle(user?.role_title || 'Workspace Owner');
    setProfilePic(user?.profile_pic || '');
    setProfileError('');
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setProfileError('Name is required');
      return;
    }

    setProfileError('');
    setProfileSubmitting(true);

    try {
      const response = await axios.put(
        '/api/auth/profile',
        {
          name: profileName,
          bio: profileBio,
          role_title: profileRoleTitle,
          profile_pic: profilePic,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      updateUser(response.data);
      closeProfileModal();
    } catch (err: any) {
      console.error('Profile update error:', err);
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileError('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (err: any) {
      console.error('Fetch tasks error:', err);
      setError(err.response?.data?.error || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskStatus('todo');
    setTaskPriority('medium');
    setTaskDueDate('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    
    let formattedDate = '';
    if (task.due_date) {
      if (typeof task.due_date === 'string') {
        formattedDate = task.due_date.split('T')[0];
      } else {
        const dateObj = new Date(task.due_date);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getUTCFullYear();
          const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getUTCDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      }
    }
    setTaskDueDate(formattedDate);
    
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setFormError('Title is required');
      return;
    }

    setFormError('');
    setSubmitting(true);

    try {
      if (editingTask) {
        // Update
        const response = await axios.put(
          `/api/tasks/${editingTask.id}`,
          {
            title: taskTitle,
            description: taskDescription,
            status: taskStatus,
            priority: taskPriority,
            due_date: taskDueDate || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? response.data : t))
        );
      } else {
        // Create
        const response = await axios.post(
          '/api/tasks',
          {
            title: taskTitle,
            description: taskDescription,
            status: taskStatus,
            priority: taskPriority,
            due_date: taskDueDate || null,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTasks((prev) => [response.data, ...prev]);
      }
      closeModal();
    } catch (err: any) {
      console.error('Form submit error:', err);
      setFormError(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToDelete(id);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await axios.delete(`/api/tasks/${taskToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete));
      setTaskToDelete(null);
    } catch (err: any) {
      console.error('Delete task error:', err);
      setDeleteError(err.response?.data?.error || 'Failed to delete task.');
    }
  };

  const handleStatusChange = async (task: Task, newStatus: 'todo' | 'in-progress' | 'done', e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await axios.put(
        `/api/tasks/${task.id}`,
        { ...task, status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? response.data : t))
      );
    } catch (err: any) {
      console.error('Status change error:', err);
      alert(err.response?.data?.error || 'Failed to update task status.');
    }
  };

  // Filter tasks based on selected status, priority, and search
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Calculate task statistics
  const totalTasksCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDueDate = (dateString: string) => {
    let date: Date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      const parts = dateString.split('-');
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get current weekday and date format for design aesthetic
  const getTodayDateString = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.dashboard}>
      {/* Bento Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logoInner}></div>
        </div>
        <nav className={styles.navItems}>
          <div 
            onClick={() => setStatusFilter('all')} 
            className={`${styles.navIcon} ${statusFilter === 'all' ? styles.navIconActive : ''}`}
            title="All Tasks"
          >
            <Layers size={22} />
          </div>
          <div 
            onClick={() => setStatusFilter('todo')} 
            className={`${styles.navIcon} ${statusFilter === 'todo' ? styles.navIconActive : ''}`}
            title="To Do"
          >
            <Clock size={22} />
          </div>
          <div 
            onClick={() => setStatusFilter('in-progress')} 
            className={`${styles.navIcon} ${statusFilter === 'in-progress' ? styles.navIconActive : ''}`}
            title="In Progress"
          >
            <CheckSquare size={22} />
          </div>
          <div 
            className={styles.settingsNavWrapper}
            onMouseEnter={() => setIsSettingsMenuOpen(true)}
            onMouseLeave={() => setIsSettingsMenuOpen(false)}
          >
            <div className={`${styles.navIcon} ${isSettingsMenuOpen ? styles.navIconActive : ''}`} title="Settings">
              <Settings size={22} />
            </div>

            {isSettingsMenuOpen && (
              <div className={styles.settingsDropdown}>
                {/* Task Analytics Header */}
                <h3 className={styles.dropdownSectionTitle}>Task Analytics</h3>
                
                <div className={styles.dropdownAnalyticsContainer}>
                  <div className={styles.dropdownStatRow}>
                    <span>Total Tasks:</span>
                    <strong style={{ color: 'var(--theme-color, #ffffff)' }}>{totalTasksCount}</strong>
                  </div>
                  <div className={styles.dropdownStatRow}>
                    <span>Completed:</span>
                    <span style={{ color: '#27c93f', fontWeight: 600 }}>{completedCount} ({completionPercentage}%)</span>
                  </div>
                  <div className={styles.dropdownStatRow}>
                    <span>In Progress:</span>
                    <span style={{ color: '#3b82f6', fontWeight: 600 }}>{inProgressCount}</span>
                  </div>
                  <div className={styles.dropdownStatRow}>
                    <span>To Do:</span>
                    <span style={{ color: '#a0a0a0', fontWeight: 600 }}>{pendingCount}</span>
                  </div>
                  
                  {/* Small visual bar indicator */}
                  <div className={styles.dropdownProgressBar}>
                    <div 
                      className={styles.dropdownProgressBarInner} 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <hr className={styles.dropdownDivider} />

                {/* Export Task Data Header */}
                <h3 className={styles.dropdownSectionTitle}>Export Task Data</h3>
                <div className={styles.exportForm}>
                  <div className={styles.dropdownField}>
                    <label className={styles.dropdownFieldLabel}>From Date</label>
                    <input 
                      type="date" 
                      className={styles.dropdownDateInput}
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                    />
                  </div>
                  <div className={styles.dropdownField}>
                    <label className={styles.dropdownFieldLabel}>To Date</label>
                    <input 
                      type="date" 
                      className={styles.dropdownDateInput}
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                    />
                  </div>

                  {exportError && (
                    <div className={styles.dropdownExportError}>
                      {exportError}
                    </div>
                  )}

                  <button 
                    type="button" 
                    className={styles.exportSubmitBtn}
                    onClick={handleExportData}
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
        <button onClick={logout} className={styles.logoutBtnSidebar} title="Logout">
          <LogOut size={22} />
        </button>
      </aside>

      {/* Main Grid Content Area */}
      <div className={styles.mainArea}>
        {/* Header Grid Section */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Dashboard</h1>
            <p className={styles.headerSubtitle}>{getTodayDateString()}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <CustomDropdown
              options={THEMES.map(theme => ({
                value: theme.id,
                label: theme.name,
                colorDot: theme.color,
              }))}
              value={currentTheme}
              onChange={(val) => setCurrentTheme(val)}
              labelPrefix="Theme:"
              style={{ width: '180px' }}
            />
            <div className={styles.profileSection} onClick={openProfileModal} style={{ cursor: 'pointer' }} title="Edit Profile">
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>{user?.name || 'Task Manager User'}</p>
                <p className={styles.profileRole}>{user?.role_title || 'Workspace Owner'}</p>
              </div>
              {user?.profile_pic ? (
                <img src={user.profile_pic} className={styles.avatarImage} alt="Profile" />
              ) : (
                <div className={styles.avatar}>
                  {(user?.name || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <div className={styles.bentoGrid}>
          {/* Welcome Bento Card (Span 8) */}
          <section className={`${styles.bentoCard} ${styles.welcomeCard}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 className={styles.welcomeText}>
                Welcome back,<br />
                <span className={styles.welcomeHighlight}>You have {pendingCount + inProgressCount} pending tasks.</span>
              </h2>
              <button onClick={openCreateModal} className={styles.createBtn}>
                <Plus size={16} />
                NEW TASK
              </button>
            </div>
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{pendingCount}</span>
                <span className={styles.statLabel}>To Do</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{inProgressCount}</span>
                <span className={styles.statLabel}>In Progress</span>
              </div>
              <div className={styles.statItem}>
                <span className={`${styles.statValue} ${styles.statCompleted}`}>{completedCount}</span>
                <span className={styles.statLabel}>Completed</span>
              </div>
            </div>
          </section>

          {/* Project Pulse Bento Card (Span 4) */}
          <section className={`${styles.bentoCard} ${styles.pulseCard}`}>
            <div>
              <h3 className={styles.pulseTitle}>Workspace Pulse</h3>
              <div className={styles.pulseProgressWrapper}>
                <div className={styles.progressBarOuter}>
                  <div className={styles.progressBarInner} style={{ width: `${completionPercentage}%` }}></div>
                </div>
              </div>
              <div className={styles.pulseInfo}>
                <span>{completionPercentage}% Efficiency</span>
                <span>{totalTasksCount} Total Tasks</span>
              </div>
            </div>
            <div className={styles.teamAvatars}>
              <div className={styles.teamAvatar} style={{ backgroundColor: '#2563eb' }}>U</div>
              <div className={styles.teamAvatar} style={{ backgroundColor: '#10b981' }}>M</div>
              <div className={styles.teamAvatar} style={{ backgroundColor: '#f59e0b' }}>A</div>
              <div className={`${styles.teamAvatar} ${styles.teamAvatarPlus}`}>+3</div>
            </div>
          </section>

          {/* Tasks List Bento Card (Span 12) */}
          <section className={`${styles.bentoCard} ${styles.tasksListCard}`}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.taskTabRow}>
                <button 
                  onClick={() => setStatusFilter('all')} 
                  className={`${styles.tabButton} ${statusFilter === 'all' ? styles.tabButtonActive : ''}`}
                >
                  All Tasks
                </button>
                <button 
                  onClick={() => setStatusFilter('todo')} 
                  className={`${styles.tabButton} ${statusFilter === 'todo' ? styles.tabButtonActive : ''}`}
                >
                  To Do
                </button>
                <button 
                  onClick={() => setStatusFilter('in-progress')} 
                  className={`${styles.tabButton} ${statusFilter === 'in-progress' ? styles.tabButtonActive : ''}`}
                >
                  In Progress
                </button>
                <button 
                  onClick={() => setStatusFilter('done')} 
                  className={`${styles.tabButton} ${statusFilter === 'done' ? styles.tabButtonActive : ''}`}
                >
                  Completed
                </button>
              </div>

              <div className={styles.filterControls}>
                {/* Search input to look professional */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.625rem', color: '#666666' }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.75rem 0.4rem 1.75rem',
                      borderRadius: '6px',
                      width: '130px',
                      outline: 'none',
                    }}
                  />
                </div>

                <CustomDropdown
                  options={[
                    { value: 'all', label: 'All Priorities' },
                    { value: 'low', label: 'Low', colorDot: '#10b981' },
                    { value: 'medium', label: 'Medium', colorDot: '#f59e0b' },
                    { value: 'high', label: 'High', colorDot: '#ef4444' },
                  ]}
                  value={priorityFilter}
                  onChange={(val) => setPriorityFilter(val)}
                  style={{ width: '150px' }}
                />
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {/* Scrollable Tasks list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#666666', fontSize: '0.875rem' }}>
                Synchronizing workspace tasks...
              </div>
            ) : (
              <div className={styles.tasksContainer}>
                {filteredTasks.length === 0 ? (
                  <div className={styles.noTasks}>
                    <h3 className={styles.noTasksTitle}>No tasks found</h3>
                    <p className={styles.noTasksDesc}>
                      {statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery !== ''
                        ? "Try adjusting your filters or search terms."
                        : "You haven't added any tasks to this workspace yet."}
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={(e) => openEditModal(task)}
                      className={`${styles.taskItem} ${task.status === 'done' ? styles.taskItemDone : ''} ${
                        task.priority === 'high' ? styles.priorityHigh :
                        task.priority === 'medium' ? styles.priorityMedium :
                        styles.priorityLow
                      }`}
                    >
                      <div className={styles.taskMain}>
                        <h4 className={`${styles.taskTitle} ${task.status === 'done' ? styles.taskTitleDone : ''}`}>
                          {task.title}
                        </h4>
                        <p className={styles.taskDesc}>
                          {task.description || "No additional description."}
                        </p>
                      </div>

                      <div className={styles.taskMeta}>
                        <span className={`${styles.statusChip} ${
                          task.status === 'todo' ? styles.statusChipTodo :
                          task.status === 'in-progress' ? styles.statusChipInProgress :
                          styles.statusChipDone
                        }`}>
                          {task.status === 'todo' ? 'To Do' :
                           task.status === 'in-progress' ? 'In Progress' : 'Done'}
                        </span>

                        <span className={styles.taskTime}>
                          <Calendar size={12} />
                          {formatDate(task.created_at)}
                        </span>

                        {task.due_date && (
                          <span className={`${styles.taskTime} ${styles.dueDate}`}>
                            <Clock size={12} />
                            Due: {formatDueDate(task.due_date)}
                          </span>
                        )}

                        <div className={styles.actionRow}>
                          <div onClick={(e) => e.stopPropagation()}>
                            <CustomDropdown
                              options={[
                                { value: 'todo', label: 'To Do', colorDot: '#a0a0a0' },
                                { value: 'in-progress', label: 'In Progress', colorDot: '#3b82f6' },
                                { value: 'done', label: 'Done', colorDot: '#27c93f' },
                              ]}
                              value={task.status}
                              onChange={(val) => handleStatusChange(task, val as any)}
                              style={{ width: '130px' }}
                            />
                          </div>

                          <button 
                            onClick={(e) => openEditModal(task, e)} 
                            className={styles.actionBtn} 
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>

                          <button 
                            onClick={(e) => handleDelete(task.id, e)} 
                            className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={closeModal} className={styles.actionBtn} style={{ color: '#a0a0a0' }}>
                <X size={20} />
              </button>
            </div>

            {formError && <div className={styles.error}>{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  className={styles.input}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  placeholder="Task title"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  className={styles.textarea}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task description..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="due_date">Due Date (Optional)</label>
                <input
                  type="date"
                  id="due_date"
                  className={styles.input}
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>Status</label>
                  <CustomDropdown
                    options={[
                      { value: 'todo', label: 'To Do', colorDot: '#a0a0a0' },
                      { value: 'in-progress', label: 'In Progress', colorDot: '#3b82f6' },
                      { value: 'done', label: 'Done', colorDot: '#27c93f' },
                    ]}
                    value={taskStatus}
                    onChange={(val) => setTaskStatus(val as any)}
                    style={{ width: '100%', height: '38px' }}
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>Priority</label>
                  <CustomDropdown
                    options={[
                      { value: 'low', label: 'Low', colorDot: '#10b981' },
                      { value: 'medium', label: 'Medium', colorDot: '#f59e0b' },
                      { value: 'high', label: 'High', colorDot: '#ef4444' },
                    ]}
                    value={taskPriority}
                    onChange={(val) => setTaskPriority(val as any)}
                    style={{ width: '100%', height: '38px' }}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={styles.cancelButton} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className={styles.overlay} onClick={closeProfileModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.modalTitle}>Edit Profile Details</h2>
              <button onClick={closeProfileModal} className={styles.actionBtn} style={{ color: '#a0a0a0' }}>
                <X size={20} />
              </button>
            </div>

            {profileError && <div className={styles.error}>{profileError}</div>}

            <form onSubmit={handleProfileSubmit}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  {profilePic ? (
                    <img src={profilePic} className={styles.avatarLargeImage} alt="Preview" />
                  ) : (
                    <div className={styles.avatarLargePlaceholder}>
                      {(profileName || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <label 
                    htmlFor="profile_pic_upload" 
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      right: '-4px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      borderRadius: '50%',
                      padding: '5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      border: '2px solid #161616'
                    }}
                    title="Upload Custom Image"
                  >
                    <Upload size={12} />
                    <input 
                      type="file" 
                      id="profile_pic_upload" 
                      accept="image/*" 
                      onChange={handleProfilePicChange} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p className={styles.label} style={{ marginBottom: '0.25rem' }}>Avatar Preset Select</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {AVATAR_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setProfilePic(preset)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: profilePic === preset ? '2px solid #ffffff' : '2px solid transparent',
                          padding: 0,
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          transition: 'transform 0.1s ease',
                        }}
                        className={styles.presetOption}
                      >
                        <img src={preset} alt={`preset-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfilePic('')}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: '#ff4d4d',
                          border: '1px solid rgba(255,77,77,0.2)',
                          cursor: 'pointer'
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="profile_name">Full Name</label>
                <input
                  type="text"
                  id="profile_name"
                  className={styles.input}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  placeholder="Your Name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="profile_role">Role / Position</label>
                <input
                  type="text"
                  id="profile_role"
                  className={styles.input}
                  value={profileRoleTitle}
                  onChange={(e) => setProfileRoleTitle(e.target.value)}
                  placeholder="e.g. Workspace Owner, Lead Designer"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="profile_bio">Bio / Workspace Status</label>
                <textarea
                  id="profile_bio"
                  className={styles.textarea}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Tell your team about yourself or write a daily motivation phrase..."
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={closeProfileModal} className={styles.cancelButton} disabled={profileSubmitting}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton} disabled={profileSubmitting}>
                  {profileSubmitting ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {taskToDelete !== null && (
        <div className={styles.overlay} onClick={() => setTaskToDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2 className={styles.modalTitle} style={{ marginBottom: '1rem' }}>Delete Task?</h2>
            
            {deleteError && <div className={styles.error} style={{ marginBottom: '1rem' }}>{deleteError}</div>}
            
            <p style={{ fontSize: '0.875rem', color: '#b0b0b0', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            
            <div className={styles.modalActions}>
              <button 
                type="button" 
                onClick={() => setTaskToDelete(null)} 
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmDelete} 
                className={styles.saveButton}
                style={{ backgroundColor: '#ff4d4d', color: '#ffffff' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
