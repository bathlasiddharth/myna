/* =========================================================
   Myna Settings — app.js

   Architecture:
   - window.config  : raw config object from GET /api/config
   - switchTab()    : tab navigation
   - populateForms(): fills all forms from window.config
   - getTabData()   : reads a tab's form inputs → partial config object
   - saveTab()      : PUT /api/config/{name} with getTabData result
   - showToast()    : bottom-right toast, auto-dismiss after 2s
   ========================================================= */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────

window.config = null;
let activeTab = 'overview';
// Track which tabs have already had help listeners attached to avoid duplicates
const helpListenersAttached = new Set();

// ── Theme ───────────────────────────────────────────────────────────────────
// Theme is applied before render via inline script in <head>. This section
// owns the toggle function and the OS-level media query listener.

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';

  // Briefly add a transition class so color changes animate smoothly
  html.classList.add('theme-transitioning');
  requestAnimationFrame(function () {
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('myna-theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('myna-theme', 'dark');
    }
    setTimeout(function () { html.classList.remove('theme-transitioning'); }, 200);
  });
}

// Listen for OS-level theme changes (only applies when no stored override)
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem('myna-theme')) {
      if (e.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  });
}

// ── Tab switching ──────────────────────────────────────────────────────────

function switchTab(tabName) {
  // Update nav active state
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Show/hide panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  const target = document.getElementById('tab-' + tabName);
  if (target) {
    target.classList.remove('hidden');
  }

  activeTab = tabName;

  // Render dynamic tabs on first visit (config may have loaded while on another tab)
  if (tabName === 'projects' && window.config) {
    const list = document.getElementById('projects-list');
    if (list && list.children.length === 0) populateProjects();
  }
  if (tabName === 'people' && window.config) {
    const list = document.getElementById('people-list');
    if (list && list.children.length === 0) populatePeople();
  }
  if (tabName === 'files' && !filesTabLoaded) {
    filesTabLoaded = true;
    loadImports();
  }

  // Update help panel
  renderHelpPanel(tabName);
  // Attach help listeners after any dynamic rendering (use setTimeout to let DOM settle)
  setTimeout(() => attachHelpListeners(tabName), 0);
}

// ── Config loading ─────────────────────────────────────────────────────────

async function loadConfig() {
  setStatus('connecting');

  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    window.config = await res.json();
    setStatus('connected');
    populateForms();
    renderOverview();
  } catch (err) {
    setStatus('disconnected');
    console.error('Failed to load config:', err);
  }
}

function setStatus(state) {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const btn  = document.getElementById('retry-btn');

  if (state === 'connecting') {
    dot.className  = 'w-2 h-2 rounded-full bg-slate-300';
    text.className = 'text-slate-400';
    text.textContent = 'Connecting...';
    btn.classList.add('hidden');
  } else if (state === 'connected') {
    dot.className  = 'w-2 h-2 rounded-full bg-emerald-400';
    text.className = 'text-slate-500';
    text.textContent = 'Connected';
    btn.classList.add('hidden');
  } else {
    dot.className  = 'w-2 h-2 rounded-full bg-red-400';
    text.className = 'text-red-500';
    text.textContent = 'Not connected';
    btn.classList.remove('hidden');
  }
}

// ── Form population ────────────────────────────────────────────────────────

function populateForms() {
  if (!window.config) return;
  populateIdentity();
  populateIntegrations();
  populateCommunication();
  populateFeatures();
  populateProjects();
  populatePeople();
  // Attach help listeners for all static tabs now that DOM is ready
  ['identity', 'communication', 'integrations', 'features'].forEach(tab => attachHelpListeners(tab));
  // Re-render help panel in case the active tab has no listeners yet
  renderHelpPanel(activeTab);
  attachHelpListeners(activeTab);
}

function populateIdentity() {
  const ws = window.config.workspace || {};
  const user = ws.user || {};
  const vault = ws.vault || {};
  const wh = ws.work_hours || {};
  const journal = ws.journal || {};

  setValue('user-name',        user.name       || '');
  setValue('user-email',       user.email      || '');

  // Role — check if the stored value is a known option, else treat as custom
  const roleVal = user.role || '';
  const roleSelect = document.getElementById('user-role');
  const knownRoles = Array.from(roleSelect.options).map(o => o.value);
  if (roleVal && knownRoles.includes(roleVal)) {
    roleSelect.value = roleVal;
  } else if (roleVal) {
    roleSelect.value = '_custom';
    const roleCustom = document.getElementById('user-role-custom');
    roleCustom.value = roleVal;
    roleCustom.classList.remove('hidden');
  }

  // Work hours — parse HH:MM 24-hour into hour/minute/AM-PM dropdowns
  setTimePicker('work-start', wh.start || '09:00');
  setTimePicker('work-end',   wh.end   || '17:00');
  // Map stored days to months for the dropdown (default: 1 month)
  const cycleMonths = ws.feedback_cycle_days != null ? Math.round(ws.feedback_cycle_days / 30) : 1;
  const clampedMonths = Math.min(3, Math.max(1, cycleMonths));
  setValue('feedback-cycle', String(clampedMonths));
  setValue('journal-archive',  journal.archive_after_days != null ? journal.archive_after_days : '');

  // Timezone — check if it's in the known list, else use "other".
  // If no timezone is saved, auto-detect from the browser and pre-populate.
  const tz = ws.timezone || '';
  const tzSelect = document.getElementById('user-timezone');
  const knownOptions = Array.from(tzSelect.options).map(o => o.value);
  if (tz && knownOptions.includes(tz)) {
    tzSelect.value = tz;
  } else if (tz) {
    tzSelect.value = '_other';
    const custom = document.getElementById('user-timezone-custom');
    custom.value = tz;
    custom.classList.remove('hidden');
  } else {
    // No saved value — auto-detect system timezone and pre-populate if possible
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        if (knownOptions.includes(detected)) {
          tzSelect.value = detected;
        } else {
          tzSelect.value = '_other';
          const custom = document.getElementById('user-timezone-custom');
          custom.value = detected;
          custom.classList.remove('hidden');
        }
      }
    } catch (e) {
      // Intl API not available — leave the field empty
    }
  }

}

function populateIntegrations() {
  const mcp = (window.config.workspace || {}).mcp_servers || {};
  setValue('mcp-email',    mcp.email    || '');
  setValue('mcp-calendar', mcp.calendar || '');
  setValue('mcp-slack',    mcp.slack    || '');
}

function populateCommunication() {
  const cs    = window.config['communication-style'] || {};
  const ws    = window.config.workspace || {};
  const tier  = cs.presets_per_tier || {};
  const ep    = cs.email_preferences || {};
  const mp    = cs.messaging_preferences || {};
  const email = ws.email || {};

  setCommStyleValue('comm-default-preset', cs.default_preset || '');
  setCommStyleValue('comm-upward',         tier.upward       || '');
  setCommStyleValue('comm-peer',           tier.peer         || '');
  setCommStyleValue('comm-direct',         tier.direct       || '');
  setCommStyleValue('comm-cross-team',     tier['cross-team'] || '');

  setValue('comm-sign-off',           cs.sign_off       || '');
  setValue('comm-email-length',       ep.max_length     || '');
  setValue('comm-email-greeting',     ep.greeting_style || '');
  setValue('comm-msg-formality',      mp.formality      || '');
  setValue('comm-msg-emoji',          mp.emoji_usage    || '');
  setValue('comm-email-filing',       email.processed_folder || 'per-project');
}

/**
 * Populate a communication style select + its companion custom input.
 * If the stored value matches a known option it sets it directly.
 * If it doesn't match (legacy or freeform value), it selects "_custom"
 * and puts the raw value into the companion text input.
 */
function setCommStyleValue(selectId, value) {
  const sel    = document.getElementById(selectId);
  const custom = document.getElementById(selectId + '-custom');
  if (!sel) return;

  const knownValues = ['', 'direct-and-concise', 'warm-and-collaborative',
    'formal-and-polished', 'casual-and-friendly', '_custom'];

  if (!value) {
    sel.value = '';
    if (custom) { custom.classList.add('hidden'); custom.value = ''; }
    return;
  }

  if (knownValues.includes(value)) {
    sel.value = value;
    if (custom) { custom.classList.add('hidden'); custom.value = ''; }
  } else {
    // Unknown/legacy/custom value — show custom input
    sel.value = '_custom';
    if (custom) {
      custom.value = value;
      custom.classList.remove('hidden');
    }
  }
}

function populateFeatures() {
  const features = (window.config.workspace || {}).features || {};
  const featureKeys = [
    'email_processing', 'messaging_processing', 'email_triage',
    'meeting_prep', 'process_meeting',
    'time_blocks', 'calendar_reminders',
    'people_management', 'team_health', 'attention_gap_detection',
    'feedback_gap_detection', 'milestones',
    'self_tracking', 'contribution_detection',
    'weekly_summary', 'monthly_updates',
    'park_resume'
  ];
  featureKeys.forEach(key => {
    const el = document.getElementById('feat-' + key);
    if (el) el.checked = features[key] !== false; // default true if missing
  });
}

// ── Overview rendering ─────────────────────────────────────────────────────

function renderOverview() {
  if (!window.config) return;

  renderIdentityCard();
  renderIntegrationsCard();
  renderCommunicationCard();
  renderFeaturesCard();
  renderProjectsCard();
  renderPeopleCard();
}

function renderIdentityCard() {
  const user = (window.config.workspace || {}).user || {};
  const body = document.getElementById('overview-identity-body');
  const badge = document.getElementById('badge-identity');

  const isConfigured = !!(user.name && user.email);
  setBadge(badge, isConfigured ? 'configured' : 'empty', isConfigured ? 'Set up' : 'Not set');

  if (user.name || user.email || user.role) {
    body.innerHTML = [
      user.name  ? kv('Name',  user.name) : '',
      user.email ? kv('Email', user.email) : '',
      user.role  ? kv('Role',  formatRole(user.role)) : '',
    ].filter(Boolean).join('');
  } else {
    body.innerHTML = '<span class="text-slate-400 text-sm">Not configured</span>';
  }
}

function renderIntegrationsCard() {
  const mcp = (window.config.workspace || {}).mcp_servers || {};
  const body = document.getElementById('overview-integrations-body');
  const badge = document.getElementById('badge-integrations');

  const configured = Object.entries(mcp).filter(([, v]) => v);
  const isConfigured = configured.length > 0;
  setBadge(badge, isConfigured ? (configured.length === 3 ? 'configured' : 'partial') : 'empty',
    isConfigured ? `${configured.length}/3 connected` : 'None');

  if (configured.length > 0) {
    body.innerHTML = configured.map(([k, v]) => kv(formatMcpKey(k), v)).join('');
  } else {
    body.innerHTML = '<span class="text-slate-400 text-sm">No MCP servers configured</span>';
  }
}

function renderCommunicationCard() {
  const cs   = window.config['communication-style'] || {};
  const body  = document.getElementById('overview-communication-body');
  const badge = document.getElementById('badge-communication');

  const isConfigured = !!cs.default_preset;
  setBadge(badge, isConfigured ? 'configured' : 'empty', isConfigured ? 'Configured' : 'Not set');

  if (cs.default_preset) {
    body.innerHTML = kv('Default', capitalize(cs.default_preset));
  } else {
    body.innerHTML = '<span class="text-slate-400 text-sm">Not configured</span>';
  }
}

function renderFeaturesCard() {
  const features = (window.config.workspace || {}).features || {};
  const body  = document.getElementById('overview-features-body');
  const badge = document.getElementById('badge-features');

  const total   = Object.keys(features).length;
  const enabled = Object.values(features).filter(Boolean).length;
  const isConfigured = total > 0;

  setBadge(badge, isConfigured ? 'configured' : 'empty', isConfigured ? `${enabled}/${total} on` : 'Not set');

  body.innerHTML = isConfigured
    ? kv('Enabled', `${enabled} of ${total} features`)
    : '<span class="text-slate-400 text-sm">Not configured</span>';
}

function renderProjectsCard() {
  const cfg = window.config.projects;
  const projects = Array.isArray(cfg) ? cfg : (Array.isArray(cfg && cfg.projects) ? cfg.projects : []);
  const body  = document.getElementById('overview-projects-body');
  const badge = document.getElementById('badge-projects');

  const count = projects.length;
  const isConfigured = count > 0;

  setBadge(badge, isConfigured ? 'configured' : 'empty', isConfigured ? `${count} projects` : 'None');
  body.innerHTML = isConfigured
    ? kv('Active', `${count} project${count !== 1 ? 's' : ''}`)
    : '<span class="text-slate-400 text-sm">No projects configured</span>';
}

function renderPeopleCard() {
  const cfg = window.config.people;
  const people = Array.isArray(cfg) ? cfg : (Array.isArray(cfg && cfg.people) ? cfg.people : []);
  const body  = document.getElementById('overview-people-body');
  const badge = document.getElementById('badge-people');

  const count = people.length;
  const isConfigured = count > 0;

  setBadge(badge, isConfigured ? 'configured' : 'empty', isConfigured ? `${count} people` : 'None');
  body.innerHTML = isConfigured
    ? kv('Tracked', `${count} person${count !== 1 ? 's' : ''}`)
    : '<span class="text-slate-400 text-sm">No people configured</span>';
}

// ── Tab data readers ───────────────────────────────────────────────────────

function getTabData(tabName) {
  if (tabName === 'identity')      return getIdentityData();
  if (tabName === 'integrations')  return getIntegrationsData();
  if (tabName === 'communication') return getCommunicationData();
  if (tabName === 'features')      return getFeaturesData();
  if (tabName === 'projects')      return { projects: collectProjectsData() };
  if (tabName === 'people')        return { people: collectPeopleData() };
  return null;
}

function getIdentityData() {
  // Start from existing config to preserve unrelated workspace fields
  const existing = deepClone(window.config && window.config.workspace || {});

  const tzSelect = document.getElementById('user-timezone');
  let tz = tzSelect.value;
  if (tz === '_other') {
    tz = document.getElementById('user-timezone-custom').value.trim();
  }

  const roleSelect = document.getElementById('user-role');
  let roleValue = roleSelect.value;
  if (roleValue === '_custom') {
    roleValue = document.getElementById('user-role-custom').value.trim();
  }

  return {
    ...existing,
    user: {
      ...(existing.user || {}),
      name:  document.getElementById('user-name').value.trim(),
      email: document.getElementById('user-email').value.trim(),
      role:  roleValue,
    },
    timezone: tz,
    work_hours: {
      start: getTimePicker('work-start'),
      end:   getTimePicker('work-end'),
    },
    feedback_cycle_days: (parseInt(document.getElementById('feedback-cycle').value, 10) || 1) * 30,
    journal: {
      ...(existing.journal || {}),
      archive_after_days: parseInt(document.getElementById('journal-archive').value, 10) || (existing.journal || {}).archive_after_days,
    },
    email: existing.email || {},
  };
}

function getIntegrationsData() {
  const existing = deepClone(window.config && window.config.workspace || {});
  return {
    ...existing,
    mcp_servers: {
      email:    document.getElementById('mcp-email').value.trim(),
      calendar: document.getElementById('mcp-calendar').value.trim(),
      slack:    document.getElementById('mcp-slack').value.trim(),
    },
  };
}

function getCommunicationData() {
  return {
    default_preset: getCommStyleValue('comm-default-preset'),
    presets_per_tier: {
      upward:       getCommStyleValue('comm-upward')      || null,
      peer:         getCommStyleValue('comm-peer')        || null,
      direct:       getCommStyleValue('comm-direct')      || null,
      'cross-team': getCommStyleValue('comm-cross-team')  || null,
    },
    sign_off:                   document.getElementById('comm-sign-off').value.trim(),
    email_preferences: {
      max_length:     document.getElementById('comm-email-length').value,
      greeting_style: document.getElementById('comm-email-greeting').value,
    },
    messaging_preferences: {
      formality:   document.getElementById('comm-msg-formality').value,
      emoji_usage: document.getElementById('comm-msg-emoji').value,
    },
  };
}

/**
 * Return the workspace patch needed when saving the Communication tab.
 * Email filing (processed_folder) lives in workspace.yaml under email:,
 * not in communication-style.yaml.
 */
function getCommunicationWorkspacePatch() {
  const existing = deepClone(window.config && window.config.workspace || {});
  const filingEl = document.getElementById('comm-email-filing');
  return {
    ...existing,
    email: {
      ...(existing.email || {}),
      processed_folder: filingEl ? filingEl.value : (existing.email || {}).processed_folder,
    },
  };
}

/**
 * Read a communication style select: if "_custom" is chosen, return the
 * companion text input's value instead.
 */
function getCommStyleValue(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return '';
  if (sel.value === '_custom') {
    const custom = document.getElementById(selectId + '-custom');
    return custom ? custom.value.trim() : '';
  }
  return sel.value;
}

function getFeaturesData() {
  const existing = deepClone(window.config && window.config.workspace || {});
  const featureKeys = [
    'email_processing', 'messaging_processing', 'email_triage',
    'meeting_prep', 'process_meeting',
    'time_blocks', 'calendar_reminders',
    'people_management', 'team_health', 'attention_gap_detection',
    'feedback_gap_detection', 'milestones',
    'self_tracking', 'contribution_detection',
    'weekly_summary', 'monthly_updates',
    'park_resume'
  ];
  const features = {};
  featureKeys.forEach(key => {
    const el = document.getElementById('feat-' + key);
    if (el) features[key] = el.checked;
  });
  return { ...existing, features };
}

// ── Save handler ───────────────────────────────────────────────────────────

const CONFIG_NAME_MAP = {
  identity:      'workspace',
  integrations:  'workspace',
  features:      'workspace',
  communication: 'communication-style',
  projects:      'projects',
  people:        'people',
};

async function saveTab(tabName) {
  const configName = CONFIG_NAME_MAP[tabName];
  if (!configName) return;

  const data = getTabData(tabName);
  if (!data) return;

  try {
    const res = await fetch('/api/config/' + configName, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => 'Server error');
      throw new Error(msg || 'HTTP ' + res.status);
    }

    // Update local cache — preserve nested structure for projects/people
    if (configName === 'workspace') {
      window.config.workspace = data;
    } else if (configName === 'projects') {
      const existing = window.config.projects;
      window.config.projects = (existing && typeof existing === 'object' && !Array.isArray(existing))
        ? { ...existing, projects: data.projects }
        : data.projects;
      projectsData = (data.projects || []).map(p => ({ ...p }));
    } else if (configName === 'people') {
      const existing = window.config.people;
      window.config.people = (existing && typeof existing === 'object' && !Array.isArray(existing))
        ? { ...existing, people: data.people }
        : data.people;
      peopleData = (data.people || []).map(p => ({ ...p }));
    } else {
      window.config[configName] = data;
    }

    // Communication tab also saves email filing (processed_folder) to workspace config
    if (tabName === 'communication') {
      const wsPatch = getCommunicationWorkspacePatch();
      const wsRes = await fetch('/api/config/workspace', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(wsPatch),
      });
      if (wsRes.ok) {
        window.config.workspace = wsPatch;
      }
      // Workspace save failure is non-fatal — the style data already saved
    }

    renderOverview();
    showToast('Saved', 'success');
  } catch (err) {
    console.error('Save failed:', err);
    showToast('Save failed: ' + err.message, 'error');
  }
}

// ── Communication style change handler ────────────────────────────────────

/**
 * Show or hide the free-text custom input for a communication style select.
 * fieldKey is 'default', 'upward', 'peer', 'direct', or 'cross-team'.
 */
function handleCommStyleChange(fieldKey) {
  const selectId = fieldKey === 'default' ? 'comm-default-preset' : 'comm-' + fieldKey;
  const customId = selectId + '-custom';
  const sel    = document.getElementById(selectId);
  const custom = document.getElementById(customId);
  if (!sel || !custom) return;
  if (sel.value === '_custom') {
    custom.classList.remove('hidden');
    custom.focus();
    // Don't save yet — wait for blur on the custom text input
  } else {
    custom.classList.add('hidden');
    custom.value = '';
    saveTab('communication');
  }
}

// ── Timezone change handler ────────────────────────────────────────────────

function handleTimezoneChange() {
  const sel    = document.getElementById('user-timezone');
  const custom = document.getElementById('user-timezone-custom');
  if (sel.value === '_other') {
    custom.classList.remove('hidden');
    custom.focus();
    // Don't save yet — wait for blur on the custom text input
  } else {
    custom.classList.add('hidden');
    custom.value = '';
    saveTab('identity');
  }
}

// ── Role change handler ────────────────────────────────────────────────────

function handleRoleChange() {
  const sel    = document.getElementById('user-role');
  const custom = document.getElementById('user-role-custom');
  if (sel.value === '_custom') {
    custom.classList.remove('hidden');
    custom.focus();
    // Don't save yet — wait for blur on the custom text input
  } else {
    custom.classList.add('hidden');
    custom.value = '';
    saveTab('identity');
  }
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(message, type) {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSvg = type === 'success'
    ? `<svg class="toast-icon w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`
    : `<svg class="toast-icon w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 220);
  }, 2000);
}

// ── Utility helpers ────────────────────────────────────────────────────────

function setValue(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === 'SELECT') {
    // Try setting directly — falls back to empty string if option doesn't exist
    el.value = val;
    if (el.value !== val && val !== '') {
      // val not in options — leave as empty
      el.value = '';
    }
  } else {
    el.value = val;
  }
}

function kv(label, value) {
  return `<div class="flex items-baseline gap-1.5 leading-snug">
    <span class="card-label flex-shrink-0">${escHtml(label)}</span>
    <span class="card-value truncate">${escHtml(String(value))}</span>
  </div>`;
}

function setBadge(el, state, label) {
  el.className = 'status-badge ' + state;
  el.textContent = label;
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escHtmlAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatRole(role) {
  const map = {
    'cto':                       'CTO',
    'director-of-engineering':   'Director of Engineering',
    'engineering-manager':       'Engineering Manager',
    'product-manager':           'Product Manager',
    'security-engineer':         'Security Engineer',
    'software-developer':        'Software Developer',
    'technical-program-manager': 'Technical Program Manager',
    'vp-of-engineering':         'VP of Engineering',
    // legacy values kept for backward compatibility
    'tech-lead':                 'Tech Lead',
    'senior-engineer':           'Senior Engineer',
    'pm':                        'PM',
  };
  return map[role] || role;
}

function formatMcpKey(key) {
  const map = { email: 'Email', calendar: 'Calendar', slack: 'Messaging' };
  return map[key] || capitalize(key);
}

function formatSlug(slug) {
  if (!slug) return '';
  return slug.split('-').map(w => capitalize(w)).join('-');
}

function deepClone(obj) {
  try { return JSON.parse(JSON.stringify(obj)); }
  catch { return { ...obj }; }
}

// ── Time picker helpers ────────────────────────────────────────────────────

/**
 * Parse a "HH:MM" 24-hour string and set the hour/minute/AM-PM dropdowns.
 * prefix is "work-start" or "work-end".
 */
function setTimePicker(prefix, hhmm) {
  if (!hhmm) return;
  const parts = String(hhmm).split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] ? parts[1].slice(0, 2) : '00';

  const ampm = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;

  // Snap minute to nearest quarter
  const validMinutes = ['00', '15', '30', '45'];
  const snapMinute = validMinutes.includes(m) ? m : '00';

  const hourEl   = document.getElementById(prefix + '-hour');
  const minuteEl = document.getElementById(prefix + '-minute');
  const ampmEl   = document.getElementById(prefix + '-ampm');

  if (hourEl)   hourEl.value   = String(hour12);
  if (minuteEl) minuteEl.value = snapMinute;
  if (ampmEl)   ampmEl.value   = ampm;
}

/**
 * Read the hour/minute/AM-PM dropdowns for prefix and return "HH:MM" 24-hour.
 */
function getTimePicker(prefix) {
  const hourEl   = document.getElementById(prefix + '-hour');
  const minuteEl = document.getElementById(prefix + '-minute');
  const ampmEl   = document.getElementById(prefix + '-ampm');

  if (!hourEl || !minuteEl || !ampmEl) return '';

  let h = parseInt(hourEl.value, 10);
  const m = minuteEl.value || '00';
  const ampm = ampmEl.value;

  if (ampm === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }

  return String(h).padStart(2, '0') + ':' + m;
}

// ── TagInput component ─────────────────────────────────────────────────────

class TagInput {
  constructor(container, initialValues = [], options = {}) {
    this.container = container;
    this.tags = [];
    this.placeholder = options.placeholder || 'Add...';
    this.normalize = options.normalize || null; // optional fn(value) => string
    this.ghostPreview = options.ghostPreview || false;
    this._buildDOM();
    this.setValues(initialValues);
  }

  _buildDOM() {
    this.tagsContainer = this.container.querySelector('.tags-container');
    if (!this.tagsContainer) {
      this.tagsContainer = document.createElement('div');
      this.tagsContainer.className = 'tags-container';
      this.container.appendChild(this.tagsContainer);
    }

    this.input = this.tagsContainer.querySelector('.tag-text-input');
    if (!this.input) {
      this.input = document.createElement('input');
      this.input.type = 'text';
      this.input.className = 'tag-text-input';
      this.tagsContainer.appendChild(this.input);
    }
    this.input.placeholder = this.placeholder;

    // Ghost preview element (created lazily on first input)
    this.ghostEl = null;

    this.input.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ',') && !e.isComposing) {
        e.preventDefault();
        this._addFromInput();
      } else if (e.key === 'Backspace' && this.input.value === '' && this.tags.length > 0) {
        this._removeTag(this.tags.length - 1);
      }
    });

    // Comma typed triggers add too; also updates ghost preview
    this.input.addEventListener('input', () => {
      if (this.input.value.endsWith(',')) {
        this.input.value = this.input.value.slice(0, -1);
        this._addFromInput();
      } else {
        this._updateGhost();
      }
    });

    this.input.addEventListener('blur', () => {
      this._hideGhost();
    });

    this.input.addEventListener('focus', () => {
      this._updateGhost();
    });

    // Click on the container focuses the input
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container || e.target === this.tagsContainer) {
        this.input.focus();
      }
    });
  }

  _normalizeValue(val) {
    if (this.normalize) return this.normalize(val);
    return val;
  }

  _updateGhost() {
    if (!this.ghostPreview) return;
    const raw = this.input.value.trim();
    if (!raw) {
      this._hideGhost();
      return;
    }
    const preview = this._normalizeValue(raw);
    if (!this.ghostEl) {
      this.ghostEl = document.createElement('span');
      this.ghostEl.className = 'tag-pill tag-ghost';
    }
    this.ghostEl.textContent = preview;
    // Insert ghost just before the input
    if (this.ghostEl.parentNode !== this.tagsContainer) {
      this.tagsContainer.insertBefore(this.ghostEl, this.input);
    }
  }

  _hideGhost() {
    if (this.ghostEl && this.ghostEl.parentNode) {
      this.ghostEl.parentNode.removeChild(this.ghostEl);
    }
  }

  _addFromInput() {
    const val = this.input.value.trim();
    if (val) {
      const normalized = this._normalizeValue(val);
      if (!this.tags.includes(normalized)) {
        this.tags.push(normalized);
        this._renderTags();
      }
    }
    this.input.value = '';
    this._hideGhost();
  }

  _removeTag(idx) {
    this.tags.splice(idx, 1);
    this._renderTags();
  }

  _renderTags() {
    // Remove existing pills (keep the input and ghost)
    this.tagsContainer.querySelectorAll('.tag-pill:not(.tag-ghost)').forEach(p => p.remove());

    this.tags.forEach((tag, idx) => {
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.innerHTML = `${escHtml(tag)}<button type="button" class="tag-remove-btn" aria-label="Remove ${escHtml(tag)}">&#x2715;</button>`;
      pill.querySelector('.tag-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeTag(idx);
      });
      // Insert before ghost (if present) or before input
      const insertBefore = this.ghostEl && this.ghostEl.parentNode === this.tagsContainer
        ? this.ghostEl
        : this.input;
      this.tagsContainer.insertBefore(pill, insertBefore);
    });
  }

  getValues() {
    return [...this.tags];
  }

  setValues(values) {
    this.tags = (Array.isArray(values) ? values : []).filter(v => v && String(v).trim());
    this._renderTags();
  }

  clear() {
    this.tags = [];
    this._renderTags();
  }
}

// Normalize a raw string to Slack #channel-name format:
// lowercase, spaces → hyphens, leading # stripped then re-added.
function normalizeSlackChannel(val) {
  let s = val.toLowerCase().trim();
  s = s.replace(/^#+/, '');       // strip any leading #
  s = s.replace(/\s+/g, '-');     // spaces → hyphens
  return '#' + s;
}

// ── PeopleMultiSelect component ────────────────────────────────────────────

/**
 * Multi-select for Key People that validates against the People config.
 * - Selected names shown as chips (teal if known, orange if not found in People config)
 * - Typing filters the People dropdown; selecting adds the chip
 * - An inline warning is shown for any selected name not found in People config
 * - Does NOT create People config entries automatically
 */
class PeopleMultiSelect {
  constructor(container, initialValues = []) {
    this.container = container;
    this.selected = [];
    this._buildDOM();
    // Populate from People config (may already be loaded)
    this.availableNames = getPeopleNames();
    this.setValues(initialValues);
  }

  _buildDOM() {
    // Box: chips + text input
    this.box = document.createElement('div');
    this.box.className = 'people-select-box';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'people-select-input';
    this.input.placeholder = 'Search people...';
    this.box.appendChild(this.input);

    // Dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'people-select-dropdown';

    // Warning line below
    this.warning = document.createElement('div');
    this.warning.className = 'people-select-warning';
    this.warning.style.display = 'none';

    this.container.appendChild(this.box);
    this.container.appendChild(this.dropdown);
    this.container.appendChild(this.warning);

    // Events
    this.input.addEventListener('input', () => this._onInput());
    this.input.addEventListener('keydown', (e) => this._onKeyDown(e));
    this.input.addEventListener('focus', () => this._openDropdown());

    // Click on the box focuses the input
    this.box.addEventListener('click', (e) => {
      if (e.target === this.box) this.input.focus();
    });

    // Close dropdown on outside click
    document.addEventListener('mousedown', (e) => {
      if (!this.container.contains(e.target)) {
        this._closeDropdown();
      }
    });

    this._highlightedIdx = -1;
  }

  _onInput() {
    this._openDropdown();
    this._renderDropdown();
  }

  _onKeyDown(e) {
    const opts = this._visibleOptions();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._highlightedIdx = Math.min(this._highlightedIdx + 1, opts.length - 1);
      this._renderDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._highlightedIdx = Math.max(this._highlightedIdx - 1, 0);
      this._renderDropdown();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this._highlightedIdx >= 0 && opts[this._highlightedIdx]) {
        this._selectName(opts[this._highlightedIdx]);
      }
    } else if (e.key === 'Escape') {
      this._closeDropdown();
    } else if (e.key === 'Backspace' && this.input.value === '' && this.selected.length > 0) {
      this._removeByIndex(this.selected.length - 1);
    }
  }

  _visibleOptions() {
    const query = this.input.value.trim().toLowerCase();
    return this.availableNames.filter(name =>
      !this.selected.includes(name) &&
      (query === '' || name.toLowerCase().includes(query))
    );
  }

  _openDropdown() {
    this._highlightedIdx = -1;
    this._renderDropdown();
    this.dropdown.classList.add('open');
  }

  _closeDropdown() {
    this.dropdown.classList.remove('open');
    this._highlightedIdx = -1;
  }

  _renderDropdown() {
    const opts = this._visibleOptions();
    const query = this.input.value.trim();
    this.dropdown.innerHTML = '';

    if (opts.length === 0) {
      const el = document.createElement('div');
      el.className = 'people-select-option no-match';
      el.textContent = query
        ? `"${query}" not found — add them in the People section first`
        : 'No more people to add';
      this.dropdown.appendChild(el);
      return;
    }

    opts.forEach((name, i) => {
      const el = document.createElement('div');
      el.className = 'people-select-option' + (i === this._highlightedIdx ? ' highlighted' : '');
      el.textContent = name;
      el.addEventListener('mousedown', (e) => {
        e.preventDefault(); // keep focus on input
        this._selectName(name);
      });
      this.dropdown.appendChild(el);
    });
  }

  _selectName(name) {
    if (!this.selected.includes(name)) {
      this.selected.push(name);
      this._renderChips();
      this._updateWarning();
    }
    this.input.value = '';
    this._closeDropdown();
    this.input.focus();
  }

  _removeByIndex(idx) {
    this.selected.splice(idx, 1);
    this._renderChips();
    this._updateWarning();
  }

  _renderChips() {
    // Remove existing chips
    this.box.querySelectorAll('.tag-pill').forEach(p => p.remove());

    this.selected.forEach((name, idx) => {
      const isKnown = this.availableNames.includes(name);
      const pill = document.createElement('span');
      pill.className = 'tag-pill' + (isKnown ? '' : ' tag-unknown');
      pill.innerHTML = `${escHtml(name)}<button type="button" class="tag-remove-btn" aria-label="Remove ${escHtml(name)}">&#x2715;</button>`;
      pill.querySelector('.tag-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeByIndex(idx);
      });
      this.box.insertBefore(pill, this.input);
    });
  }

  _updateWarning() {
    const unknowns = this.selected.filter(n => !this.availableNames.includes(n));
    if (unknowns.length > 0) {
      const names = unknowns.map(n => `"${n}"`).join(', ');
      this.warning.textContent = `${names} not found in People config — add them in the People section first.`;
      this.warning.style.display = '';
    } else {
      this.warning.textContent = '';
      this.warning.style.display = 'none';
    }
  }

  getValues() {
    return [...this.selected];
  }

  setValues(values) {
    this.selected = (Array.isArray(values) ? values : []).filter(v => v && String(v).trim());
    this.availableNames = getPeopleNames();
    this._renderChips();
    this._updateWarning();
  }
}

/**
 * Return display names for all people in the People config.
 * Uses display_name if set, falls back to full_name, then name.
 */
function getPeopleNames() {
  if (!window.config) return [];
  const raw = window.config.people;
  const arr = Array.isArray(raw) ? raw
            : Array.isArray(raw && raw.people) ? raw.people
            : [];
  return arr
    .map(p => (p.display_name || p.full_name || p.name || '').trim())
    .filter(Boolean);
}

// ── Projects tab ───────────────────────────────────────────────────────────

// projectsData: array of project objects (source of truth for collapsed items)
let projectsData = [];
// tagInputInstances keyed by entity index, sub-key field name
const tagInputs = { projects: {}, people: {} };

function populateProjects() {
  const raw = window.config && window.config.projects;
  const arr = Array.isArray(raw) ? raw
            : Array.isArray(raw && raw.projects) ? raw.projects
            : [];
  projectsData = arr.map(p => ({ ...p }));
  renderProjectsList();
}

function renderProjectsList() {
  const list = document.getElementById('projects-list');
  list.innerHTML = '';
  tagInputs.projects = {};
  projectsData.forEach((proj, idx) => {
    list.appendChild(buildProjectCard(proj, idx));
  });
  // Re-attach help listeners after DOM is updated
  setTimeout(() => attachHelpListeners('projects'), 0);
}

function buildProjectCard(proj, idx) {
  const status = proj.status || 'active';
  const desc = proj.description || '';
  const truncDesc = desc.length > 80 ? desc.slice(0, 77) + '...' : desc;

  const card = document.createElement('div');
  card.className = 'entity-card';
  card.dataset.idx = idx;

  card.innerHTML = `
    <div class="entity-card-header" onclick="toggleProjectCard(${idx})">
      <div class="entity-card-header-left">
        <span class="entity-card-name">${escHtml(proj.name || 'Unnamed project')}</span>
        <span class="project-status-badge ${escHtml(status)}">${escHtml(status)}</span>
        ${truncDesc ? `<span class="entity-card-desc">${escHtml(truncDesc)}</span>` : ''}
      </div>
      <svg class="entity-card-chevron w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </div>
    <div class="entity-form">
      <div class="entity-form-grid">
        <div class="field-group">
          <label class="field-label">Name</label>
          <input type="text" class="field-input proj-name" value="${escHtmlAttr(proj.name || '')}" placeholder="Project name" oninput="syncProjectHeader(${idx})" onblur="saveTab('projects')" />
        </div>
        <div class="field-group">
          <label class="field-label">Status</label>
          <select class="field-input proj-status" onchange="syncProjectHeader(${idx}); saveTab('projects')">
            <option value="active" ${status === 'active' ? 'selected' : ''}>Active</option>
            <option value="paused" ${status === 'paused' ? 'selected' : ''}>Paused</option>
            <option value="complete" ${status === 'complete' ? 'selected' : ''}>Complete</option>
          </select>
        </div>
      </div>
      <div class="entity-form-full">
        <div class="field-group">
          <label class="field-label">Description</label>
          <textarea class="field-input proj-desc" rows="2" placeholder="Short description" oninput="syncProjectHeader(${idx})" onblur="saveTab('projects')">${escHtml(proj.description || '')}</textarea>
        </div>
        <div class="field-group">
          <label class="field-label">Aliases</label>
          <div class="tag-input" data-tag-field="aliases-${idx}"><div class="tags-container"><input type="text" class="tag-text-input" placeholder="Add..."></div></div>
        </div>
        <div class="field-group">
          <label class="field-label">Email Folders</label>
          <div class="tag-input" data-tag-field="email_folders-${idx}"><div class="tags-container"><input type="text" class="tag-text-input" placeholder="Type a folder and press Enter"></div></div>
        </div>
        <div class="field-group">
          <label class="field-label">Slack channels</label>
          <div class="tag-input" data-tag-field="slack_channels-${idx}"><div class="tags-container"><input type="text" class="tag-text-input" placeholder="Type a channel and press Enter"></div></div>
        </div>
        <div class="field-group">
          <label class="field-label">Key people</label>
          <div class="people-select" data-people-field="key_people-${idx}"></div>
        </div>
      </div>
      <div class="entity-form-actions">
        <button type="button" class="entity-form-done-btn" onclick="toggleProjectCard(${idx})">Done</button>
        <div class="inline-delete-wrapper" style="display:flex;align-items:center;gap:0.5rem;">
          <button type="button" class="entity-delete-btn" onclick="showProjectDeleteConfirm(${idx})">Delete</button>
          <div class="inline-confirm" id="proj-confirm-${idx}">
            <span>Delete this project?</span>
            <button type="button" class="inline-confirm-yes" onclick="deleteProject(${idx})">Confirm</button>
            <button type="button" class="inline-confirm-cancel" onclick="hideProjectDeleteConfirm(${idx})">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Wire up tag inputs synchronously on the detached card element
  const tagFields = ['aliases', 'email_folders', 'slack_channels'];
  if (!tagInputs.projects[idx]) tagInputs.projects[idx] = {};
  tagFields.forEach(field => {
    const el = card.querySelector(`[data-tag-field="${field}-${idx}"]`);
    if (!el) return;
    if (field === 'slack_channels') {
      tagInputs.projects[idx][field] = new TagInput(el, proj[field] || [], {
        placeholder: 'Type a channel and press Enter',
        normalize: normalizeSlackChannel,
        ghostPreview: true,
      });
    } else if (field === 'email_folders') {
      tagInputs.projects[idx][field] = new TagInput(el, proj[field] || [], {
        placeholder: 'Type a folder and press Enter',
      });
    } else {
      tagInputs.projects[idx][field] = new TagInput(el, proj[field] || []);
    }
  });

  // Wire up Key People multi-select (validates against People config)
  const keyPeopleEl = card.querySelector(`[data-people-field="key_people-${idx}"]`);
  if (keyPeopleEl) {
    tagInputs.projects[idx].key_people = new PeopleMultiSelect(keyPeopleEl, proj.key_people || []);
  }

  return card;
}

function toggleProjectCard(idx) {
  const card = document.querySelector(`#projects-list .entity-card[data-idx="${idx}"]`);
  if (!card) return;
  card.classList.toggle('expanded');
}

function syncProjectHeader(idx) {
  const card = document.querySelector(`#projects-list .entity-card[data-idx="${idx}"]`);
  if (!card) return;
  const name = card.querySelector('.proj-name').value.trim();
  const status = card.querySelector('.proj-status').value;
  const desc = card.querySelector('.proj-desc').value.trim();
  const truncDesc = desc.length > 80 ? desc.slice(0, 77) + '...' : desc;

  card.querySelector('.entity-card-name').textContent = name || 'Unnamed project';
  const badge = card.querySelector('.project-status-badge');
  badge.className = `project-status-badge ${status}`;
  badge.textContent = status;
  const descEl = card.querySelector('.entity-card-desc');
  if (descEl) descEl.textContent = truncDesc;
}

function showProjectDeleteConfirm(idx) {
  const card = document.querySelector(`#projects-list .entity-card[data-idx="${idx}"]`);
  if (!card) return;
  card.querySelector('.entity-delete-btn').style.display = 'none';
  card.querySelector(`#proj-confirm-${idx}`).classList.add('visible');
}

function hideProjectDeleteConfirm(idx) {
  const card = document.querySelector(`#projects-list .entity-card[data-idx="${idx}"]`);
  if (!card) return;
  card.querySelector(`#proj-confirm-${idx}`).classList.remove('visible');
  card.querySelector('.entity-delete-btn').style.display = '';
}

function deleteProject(idx) {
  projectsData.splice(idx, 1);
  renderProjectsList();
}

function addProject() {
  projectsData.push({ name: '', status: 'active', description: '', aliases: [], email_folders: [], slack_channels: [], key_people: [] });
  renderProjectsList();
  const list = document.getElementById('projects-list');
  const newCard = list.lastElementChild;
  if (newCard) {
    newCard.classList.add('expanded');
    newCard.querySelector('.proj-name').focus();
    newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function collectProjectsData() {
  const list = document.getElementById('projects-list');
  return Array.from(list.querySelectorAll('.entity-card')).map(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const base = projectsData[idx] || {};
    const tiMap = (tagInputs.projects[idx] || {});

    return {
      ...base,
      name:          card.querySelector('.proj-name').value.trim(),
      status:        card.querySelector('.proj-status').value,
      description:   card.querySelector('.proj-desc').value.trim(),
      aliases:       tiMap.aliases        ? tiMap.aliases.getValues()        : (base.aliases        || []),
      email_folders: tiMap.email_folders  ? tiMap.email_folders.getValues()  : (base.email_folders  || []),
      slack_channels:tiMap.slack_channels ? tiMap.slack_channels.getValues() : (base.slack_channels || []),
      key_people:    tiMap.key_people     ? tiMap.key_people.getValues()     : (base.key_people     || []),
    };
  });
}

// ── People tab ─────────────────────────────────────────────────────────────

let peopleData = [];

function populatePeople() {
  const raw = window.config && window.config.people;
  const arr = Array.isArray(raw) ? raw
            : Array.isArray(raw && raw.people) ? raw.people
            : [];
  peopleData = arr.map(p => ({ ...p }));
  renderPeopleList();
}

function renderPeopleList() {
  const list = document.getElementById('people-list');
  list.innerHTML = '';
  tagInputs.people = {};
  peopleData.forEach((person, idx) => {
    list.appendChild(buildPersonCard(person, idx));
  });
  // Re-attach help listeners after DOM is updated
  setTimeout(() => attachHelpListeners('people'), 0);
}

function buildPersonCard(person, idx) {
  const tier = person.relationship_tier || '';
  const tierLabel = tier ? tier.replace('-', '\u2011') : ''; // non-breaking hyphen

  const card = document.createElement('div');
  card.className = 'entity-card';
  card.dataset.idx = idx;

  const tierBadgeHtml = tier
    ? `<span class="tier-badge ${escHtml(tier)}">${escHtml(tier)}</span>`
    : '';
  const roleHtml = person.role
    ? `<span class="entity-card-desc">${escHtml(person.role)}</span>`
    : '';

  card.innerHTML = `
    <div class="entity-card-header" onclick="togglePersonCard(${idx})">
      <div class="entity-card-header-left">
        <span class="entity-card-name">${escHtml(person.display_name || person.name || 'Unnamed person')}</span>
        ${tierBadgeHtml}
        ${roleHtml}
      </div>
      <svg class="entity-card-chevron w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </div>
    <div class="entity-form">
      <div class="entity-form-grid">
        <div class="field-group">
          <label class="field-label">Display name</label>
          <input type="text" class="field-input person-display-name" value="${escHtmlAttr(person.display_name || '')}" placeholder="e.g. Sarah" oninput="syncPersonHeader(${idx})" onblur="saveTab('people')" />
        </div>
        <div class="field-group">
          <label class="field-label">Full name</label>
          <input type="text" class="field-input person-full-name" value="${escHtmlAttr(person.full_name || '')}" placeholder="e.g. Sarah Chen" onblur="saveTab('people')" />
        </div>
        <div class="field-group">
          <label class="field-label">Email</label>
          <input type="email" class="field-input person-email" value="${escHtmlAttr(person.email || '')}" placeholder="sarah@company.com" onblur="saveTab('people')" />
        </div>
        <div class="field-group">
          <label class="field-label">Slack handle</label>
          <input type="text" class="field-input person-slack" value="${escHtmlAttr(person.slack_handle || '')}" placeholder="@sarah" onblur="saveTab('people')" />
        </div>
        <div class="field-group">
          <label class="field-label">Relationship tier</label>
          <select class="field-input person-tier" onchange="syncPersonHeader(${idx}); saveTab('people')">
            <option value="" ${!tier ? 'selected' : ''}>Select tier</option>
            <option value="direct"     ${tier === 'direct'     ? 'selected' : ''}>Direct report</option>
            <option value="peer"       ${tier === 'peer'       ? 'selected' : ''}>Peer</option>
            <option value="upward"     ${tier === 'upward'     ? 'selected' : ''}>Upward</option>
            <option value="cross-team" ${tier === 'cross-team' ? 'selected' : ''}>Cross-team</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Role</label>
          <input type="text" class="field-input person-role" value="${escHtmlAttr(person.role || '')}" placeholder="e.g. Staff Engineer" oninput="syncPersonHeader(${idx})" onblur="saveTab('people')" />
        </div>
        <div class="field-group">
          <label class="field-label">Team</label>
          <input type="text" class="field-input person-team" value="${escHtmlAttr(person.team || '')}" placeholder="e.g. Platform" onblur="saveTab('people')" />
        </div>
        <div class="field-group">
          <label class="field-label">Feedback cycle (days)</label>
          <input type="number" class="field-input person-feedback-cycle" value="${escHtmlAttr(person.feedback_cycle_days != null ? String(person.feedback_cycle_days) : '')}" placeholder="30" min="1" onblur="saveTab('people')" />
        </div>
        <div class="field-group">
          <label class="field-label">Birthday (MM-DD)</label>
          <input type="text" class="field-input person-birthday" value="${escHtmlAttr(person.birthday || '')}" placeholder="03-15" onblur="saveTab('people')" />
        </div>
        <div class="field-group">
          <label class="field-label">Work anniversary (YYYY-MM-DD)</label>
          <input type="text" class="field-input person-anniversary" value="${escHtmlAttr(person.work_anniversary || '')}" placeholder="2022-06-01" onblur="saveTab('people')" />
        </div>
      </div>
      <div class="entity-form-full">
        <div class="field-group">
          <label class="field-label">Aliases</label>
          <div class="tag-input" data-tag-field="person-aliases-${idx}"><div class="tags-container"><input type="text" class="tag-text-input" placeholder="Add..."></div></div>
        </div>
      </div>
      <div class="entity-form-actions">
        <button type="button" class="entity-form-done-btn" onclick="togglePersonCard(${idx})">Done</button>
        <div class="inline-delete-wrapper" style="display:flex;align-items:center;gap:0.5rem;">
          <button type="button" class="entity-delete-btn" onclick="showPersonDeleteConfirm(${idx})">Delete</button>
          <div class="inline-confirm" id="person-confirm-${idx}">
            <span>Delete this person?</span>
            <button type="button" class="inline-confirm-yes" onclick="deletePerson(${idx})">Confirm</button>
            <button type="button" class="inline-confirm-cancel" onclick="hidePersonDeleteConfirm(${idx})">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Wire up aliases tag input synchronously on the detached card element
  if (!tagInputs.people[idx]) tagInputs.people[idx] = {};
  const aliasEl = card.querySelector(`[data-tag-field="person-aliases-${idx}"]`);
  if (aliasEl) tagInputs.people[idx].aliases = new TagInput(aliasEl, person.aliases || []);

  return card;
}

function togglePersonCard(idx) {
  const card = document.querySelector(`#people-list .entity-card[data-idx="${idx}"]`);
  if (!card) return;
  card.classList.toggle('expanded');
}

function syncPersonHeader(idx) {
  const card = document.querySelector(`#people-list .entity-card[data-idx="${idx}"]`);
  if (!card) return;
  const displayName = card.querySelector('.person-display-name').value.trim();
  const tier = card.querySelector('.person-tier').value;
  const role = card.querySelector('.person-role').value.trim();

  card.querySelector('.entity-card-name').textContent = displayName || 'Unnamed person';

  let badge = card.querySelector('.tier-badge');
  if (tier) {
    if (!badge) {
      badge = document.createElement('span');
      const nameEl = card.querySelector('.entity-card-name');
      nameEl.after(badge);
    }
    badge.className = `tier-badge ${tier}`;
    badge.textContent = tier;
  } else if (badge) {
    badge.remove();
  }

  let roleEl = card.querySelector('.entity-card-desc');
  if (role) {
    if (!roleEl) {
      roleEl = document.createElement('span');
      roleEl.className = 'entity-card-desc';
      card.querySelector('.entity-card-header-left').appendChild(roleEl);
    }
    roleEl.textContent = role;
  } else if (roleEl) {
    roleEl.remove();
  }
}

function showPersonDeleteConfirm(idx) {
  const card = document.querySelector(`#people-list .entity-card[data-idx="${idx}"]`);
  if (!card) return;
  card.querySelector('.entity-delete-btn').style.display = 'none';
  card.querySelector(`#person-confirm-${idx}`).classList.add('visible');
}

function hidePersonDeleteConfirm(idx) {
  const card = document.querySelector(`#people-list .entity-card[data-idx="${idx}"]`);
  if (!card) return;
  card.querySelector(`#person-confirm-${idx}`).classList.remove('visible');
  card.querySelector('.entity-delete-btn').style.display = '';
}

function deletePerson(idx) {
  peopleData.splice(idx, 1);
  renderPeopleList();
}

function addPerson() {
  peopleData.push({ display_name: '', full_name: '', aliases: [], email: '', slack_handle: '', relationship_tier: '', role: '', team: '', feedback_cycle_days: null, birthday: '', work_anniversary: '' });
  renderPeopleList();
  const list = document.getElementById('people-list');
  const newCard = list.lastElementChild;
  if (newCard) {
    newCard.classList.add('expanded');
    newCard.querySelector('.person-display-name').focus();
    newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function collectPeopleData() {
  const list = document.getElementById('people-list');
  return Array.from(list.querySelectorAll('.entity-card')).map(card => {
    const idx = parseInt(card.dataset.idx, 10);
    const base = peopleData[idx] || {};
    const tiMap = (tagInputs.people[idx] || {});

    const feedbackVal = card.querySelector('.person-feedback-cycle').value.trim();

    return {
      ...base,
      display_name:       card.querySelector('.person-display-name').value.trim(),
      full_name:          card.querySelector('.person-full-name').value.trim(),
      aliases:            tiMap.aliases ? tiMap.aliases.getValues() : (base.aliases || []),
      email:              card.querySelector('.person-email').value.trim(),
      slack_handle:       card.querySelector('.person-slack').value.trim(),
      relationship_tier:  card.querySelector('.person-tier').value,
      role:               card.querySelector('.person-role').value.trim(),
      team:               card.querySelector('.person-team').value.trim(),
      feedback_cycle_days:feedbackVal ? parseInt(feedbackVal, 10) : null,
      birthday:           card.querySelector('.person-birthday').value.trim(),
      work_anniversary:   card.querySelector('.person-anniversary').value.trim(),
    };
  });
}

// ── Files tab ──────────────────────────────────────────────────────────────

let filesTabLoaded = false;

function initFilesTab() {
  const zone = document.getElementById('upload-zone');
  if (!zone) return;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', (e) => {
    if (!zone.contains(e.relatedTarget)) {
      zone.classList.remove('drag-over');
    }
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });
}

function handleFileInputChange(e) {
  if (e.target.files.length > 0) {
    handleFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-selected
  }
}

async function handleFiles(fileList) {
  const files = Array.from(fileList);
  if (files.length === 0) return;

  const formData = new FormData();
  files.forEach(file => formData.append('file', file));

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });

    if (!res.ok) {
      let msg = 'Upload failed';
      try { const body = await res.json(); msg = body.error || body.message || msg; } catch {}
      showToast(msg, 'error');
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const section = document.getElementById('uploaded-files-section');
    const list    = document.getElementById('uploaded-files-list');
    section.classList.remove('hidden');

    files.forEach(file => {
      const row = document.createElement('div');
      row.className = 'file-row';
      row.innerHTML = `
        <svg class="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <div>
          <div class="file-row-name">${escHtml(file.name)}</div>
          <div class="file-row-meta">Uploaded at ${escHtml(now)}</div>
        </div>
      `;
      list.appendChild(row);
    });

    const label = files.length === 1 ? '1 file uploaded' : `${files.length} files uploaded`;
    showToast(label, 'success');
    loadImports(); // refresh pending imports list after upload
  } catch (err) {
    showToast('Upload failed: ' + err.message, 'error');
  }
}

async function loadImports() {
  const loadingEl = document.getElementById('pending-imports-loading');
  const contentEl = document.getElementById('pending-imports-content');
  if (!loadingEl || !contentEl) return;

  try {
    const res = await fetch('/api/imports');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const files = Array.isArray(data.files) ? data.files : [];

    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    if (files.length === 0) {
      contentEl.innerHTML = '<p class="text-slate-400 text-sm">No pending imports</p>';
      return;
    }

    const rows = files.map(f => {
      const name = f.split('/').pop();
      return `
        <div class="file-row">
          <svg class="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <div>
            <div class="file-row-name">${escHtml(name)}</div>
            <div class="file-row-meta">${escHtml(f)}</div>
          </div>
        </div>
      `;
    }).join('');

    contentEl.innerHTML = `
      <h2 class="section-title mb-3">Pending imports</h2>
      <div class="flex flex-col gap-1">${rows}</div>
    `;
  } catch (err) {
    if (loadingEl) {
      loadingEl.textContent = 'Could not load imports.';
      loadingEl.classList.remove('hidden');
    }
  }
}

// ── Defaults footer ────────────────────────────────────────────────────────

function toggleDefaults() {
  const content  = document.getElementById('defaults-content');
  const chevron  = document.getElementById('defaults-chevron');
  const expanded = !content.classList.contains('hidden');
  content.classList.toggle('hidden', expanded);
  chevron.style.transform = expanded ? '' : 'rotate(180deg)';
}

// ── Help panel ─────────────────────────────────────────────────────────────

/**
 * Field-level help content for each tab.
 * Structure:
 *   HELP_CONTENT[tabName] = {
 *     intro: string,
 *     fields: [{ id: 'element-id', label: 'Field name', desc: 'Explanation' }, ...]
 *   }
 * id matches the form element id (or a logical key for grouped fields).
 */
const HELP_CONTENT = {
  identity: {
    intro: 'Your personal profile and working preferences. Myna uses these to personalise daily notes, schedule suggestions, and the cadence of feedback reminders.',
    fields: [
      { id: 'user-name',        label: 'Name',               desc: 'Your full name, used in draft greetings and the header of your daily note.' },
      { id: 'user-email',       label: 'Email',              desc: 'Your primary email address. Used to identify emails you sent or received when processing your inbox.' },
      { id: 'user-role',        label: 'Role',               desc: 'Your job title. Myna surfaces role-relevant features — for example, team-health summaries are shown to managers but hidden for individual contributors.' },
      { id: 'user-timezone',    label: 'Timezone',           desc: 'Your local timezone. Used when converting meeting times, scheduling focus blocks, and anchoring daily note dates.' },
      { id: 'work-start-hour',  label: 'Work hours start',   desc: 'The start of your working day. Myna avoids scheduling focus blocks or reminders outside this window.' },
      { id: 'work-end-hour',    label: 'Work hours end',     desc: 'The end of your working day. Calendar events and reminders are kept within start-to-end unless you override them.' },
      { id: 'feedback-cycle',   label: 'Feedback cycle',     desc: 'How often you aim to give written feedback to each direct report. Myna flags anyone who is overdue when this interval passes without a logged feedback entry.' },
      { id: 'journal-archive',  label: 'Journal archive after', desc: 'Daily notes older than this many days are moved to an archive folder. Keeps your active vault uncluttered without deleting anything.' },
    ],
  },
  communication: {
    intro: 'Writing style settings that shape every draft Myna produces — emails, messages, and status updates. A good default plus per-tier overrides covers nearly all situations.',
    fields: [
      { id: 'comm-default-preset',   label: 'Default preset',        desc: 'The baseline tone for all drafts unless overridden. Choose the style that fits most of your everyday communications.' },
      { id: 'comm-upward',           label: 'Upward (manager, leadership)', desc: 'Override tone when drafting messages to your manager or senior leadership. Leave blank to use the default.' },
      { id: 'comm-peer',             label: 'Peer',                  desc: 'Override tone for peer-level colleagues. Useful if you are more formal with your manager but looser with teammates.' },
      { id: 'comm-direct',           label: 'Direct reports',        desc: 'Override tone for messages to your direct reports. Many managers prefer a warmer or more direct style here.' },
      { id: 'comm-cross-team',       label: 'Cross-team',            desc: 'Override tone for colleagues outside your immediate team — stakeholders, partner teams, or cross-functional peers.' },
      { id: 'comm-sign-off',         label: 'Sign-off',              desc: 'The closing phrase appended to email drafts, e.g. "Thanks" or "Best regards". Leave blank to skip a sign-off.' },
      { id: 'comm-email-length',     label: 'Max email length',      desc: 'Soft target for draft length. Short keeps replies to 1-3 sentences; Medium allows a few short paragraphs; Long gives Myna room to be thorough.' },
      { id: 'comm-email-greeting',   label: 'Greeting style',        desc: 'How email drafts open — first name only ("Hi Sarah"), formal ("Dear Ms. Chen"), or no greeting at all.' },
      { id: 'comm-email-filing',     label: 'Processed email filing', desc: 'Where processed emails land after Myna handles them. Per-project keeps each project tidy; one shared folder is simpler if you prefer a flat layout.' },
      { id: 'comm-msg-formality',    label: 'Messaging formality',   desc: 'Casual drafts read like Slack; Professional drafts suit more formal team channels or external partners.' },
      { id: 'comm-msg-emoji',        label: 'Emoji usage',           desc: 'How often Myna includes emoji in message drafts. None keeps it text-only; Minimal adds one or two where natural; Moderate uses them freely.' },
    ],
  },
  people: {
    intro: 'Your network of team members, managers, and collaborators. Myna uses this list to link emails and messages to individuals, track relationship health, and surface overdue connections.',
    fields: [
      { id: 'person-display-name',    label: 'Display name',          desc: 'Short name used in Myna\'s output — typically a first name. This is what appears in daily notes and briefings.' },
      { id: 'person-full-name',       label: 'Full name',             desc: 'Full legal or formal name. Used in formal email salutations and document references.' },
      { id: 'person-email',           label: 'Email',                 desc: 'Their email address. Myna matches incoming emails to this person and links them in project files.' },
      { id: 'person-slack',           label: 'Slack handle',          desc: 'Their Slack username (e.g. @sarah). Used to link Slack messages and draft @mentions.' },
      { id: 'person-tier',            label: 'Relationship tier',     desc: 'How you relate to this person. The tier controls communication style overrides and determines which team-health checks apply.' },
      { id: 'person-role',            label: 'Role',                  desc: 'Their job title. Shown in briefings so you have context before a meeting or message.' },
      { id: 'person-team',            label: 'Team',                  desc: 'The team or department they belong to. Helps Myna group people and provide team-level summaries.' },
      { id: 'person-feedback-cycle',  label: 'Feedback cycle (days)', desc: 'How often you aim to give this person written feedback. Overrides the global default set in Identity.' },
      { id: 'person-birthday',        label: 'Birthday (MM-DD)',      desc: 'Their birthday in MM-DD format. Myna surfaces this in your daily note so you can send a note on the day.' },
      { id: 'person-anniversary',     label: 'Work anniversary',      desc: 'Their work start date. Myna mentions upcoming anniversaries in the daily note as a prompt to recognise milestones.' },
      { id: 'person-aliases',         label: 'Aliases',               desc: 'Alternative names or nicknames for this person. Myna uses these to recognise them in emails and messages even when a different name is used.' },
    ],
  },
  projects: {
    intro: 'Active work streams you want Myna to track. Each project groups its emails, Slack channels, and key people so Myna can route information and produce focused briefings.',
    fields: [
      { id: 'proj-name',         label: 'Name',            desc: 'The project\'s canonical name. Used as the vault folder name and referenced in all project-related notes.' },
      { id: 'proj-status',       label: 'Status',          desc: 'Active projects appear in daily briefs and routing. Paused projects are kept but skipped in daily summaries. Complete projects are archived.' },
      { id: 'proj-desc',         label: 'Description',     desc: 'A short summary of what the project is about. Myna uses this as context when generating status updates or briefings.' },
      { id: 'proj-aliases',      label: 'Aliases',         desc: 'Other names this project goes by — shorthand, codenames, or common abbreviations. Myna uses these to recognise the project in emails and messages.' },
      { id: 'proj-email-folders', label: 'Email folders',  desc: 'Email folders or labels whose contents belong to this project. Myna reads these when building project context.' },
      { id: 'proj-slack-channels', label: 'Slack channels', desc: 'Slack channels tied to this project. Myna pulls messages from these channels when summarising project activity.' },
      { id: 'proj-key-people',   label: 'Key people',      desc: 'The main stakeholders or contributors for this project. Myna includes their recent activity and open items in project briefings.' },
    ],
  },
  integrations: {
    intro: 'MCP server connections that give Myna read access to your email, calendar, and messaging tools. All data stays local — Myna never sends or posts anything.',
    fields: [
      { id: 'mcp-email',    label: 'Email MCP server',     desc: 'The name of the MCP server registered with Claude Code that provides access to your email account. Run "claude mcp list" in a terminal to see available servers.' },
      { id: 'mcp-calendar', label: 'Calendar MCP server',  desc: 'The MCP server that connects to your calendar. Used for meeting prep, focus-block creation, and reading upcoming events.' },
      { id: 'mcp-slack',    label: 'Messaging MCP server', desc: 'The MCP server for Slack or another messaging platform. Used to process messages and draft replies. Leave blank if you paste messages manually.' },
    ],
  },
  features: {
    intro: 'Toggle individual Myna capabilities on or off. Disabled features are silently skipped — no errors, no partial output. Start with the features you need most and enable others as you get comfortable.',
    fields: [
      { id: 'feat-email_processing',       label: 'Email processing',        desc: 'Reads incoming emails and files them into project notes with action items extracted. Requires an Email MCP server.' },
      { id: 'feat-messaging_processing',   label: 'Messaging processing',    desc: 'Processes Slack messages and DMs to extract action items and decisions, then routes them to project files.' },
      { id: 'feat-email_triage',           label: 'Email triage',            desc: 'Sorts your inbox into four folders: Reply, FYI, Follow-Up, and Schedule — so you always know what needs action.' },
      { id: 'feat-meeting_prep',           label: 'Meeting prep',            desc: 'Generates a prep brief before each meeting, pulling in relevant project context, open items, and attendee notes.' },
      { id: 'feat-process_meeting',        label: 'Process meeting',         desc: 'After a meeting, extracts decisions and action items from your notes and closes them out in project files.' },
      { id: 'feat-time_blocks',            label: 'Time blocks',             desc: 'Creates labelled focus-time events on your calendar so your day is protected. Uses the Calendar MCP server.' },
      { id: 'feat-calendar_reminders',     label: 'Calendar reminders',      desc: 'Sets calendar reminders for tasks and follow-ups that have deadlines. Requires a Calendar MCP server.' },
      { id: 'feat-people_management',      label: 'People management',       desc: 'Maintains a person file for each team member — logs interactions, open items, and context over time.' },
      { id: 'feat-team_health',            label: 'Team health',             desc: 'Adds a team health snapshot to your daily note: who has open blockers, who you haven\'t connected with recently. Best for managers.' },
      { id: 'feat-attention_gap_detection', label: 'Attention gap detection', desc: 'Flags direct reports or key people you haven\'t interacted with in longer than your configured attention interval.' },
      { id: 'feat-feedback_gap_detection', label: 'Feedback gap detection',  desc: 'Alerts you when a feedback cycle is overdue for a direct report based on your configured feedback cadence.' },
      { id: 'feat-milestones',             label: 'Milestones',              desc: 'Surfaces birthdays and work anniversaries in the daily note so you can acknowledge them in the moment.' },
      { id: 'feat-self_tracking',          label: 'Self-tracking',           desc: 'Maintains a brag doc of your contributions and can generate self-review documents at performance-cycle time.' },
      { id: 'feat-contribution_detection', label: 'Contribution detection',  desc: 'Automatically scans your activity and logs notable contributions to your brag doc without you needing to capture them manually.' },
      { id: 'feat-weekly_summary',         label: 'Weekly summary',          desc: 'Generates a structured summary of the week\'s work — decisions made, items shipped, and things still in flight.' },
      { id: 'feat-monthly_updates',        label: 'Monthly updates',         desc: 'Drafts a monthly status update suitable for sharing with your manager or leadership team.' },
      { id: 'feat-park_resume',            label: 'Park & resume',           desc: 'Saves your working context (open items, current focus, recent decisions) so you can resume exactly where you left off in a new session.' },
    ],
  },
  overview: {
    intro: 'A summary of your current Myna configuration. Click any section to navigate directly to its settings.',
    fields: [],
  },
  files: {
    intro: 'Upload documents that describe your work context — project docs, team pages, Confluence exports, org charts. Run /myna-setup import in a Claude chat to process them into vault files.',
    fields: [],
  },
};

/**
 * Render the help panel for the given tab.
 * Populates #help-intro and #help-fields with the tab's content.
 */
function renderHelpPanel(tabName) {
  const panel = document.getElementById('help-panel');
  const introEl  = document.getElementById('help-intro');
  const fieldsEl = document.getElementById('help-fields');
  if (!panel || !introEl || !fieldsEl) return;

  const content = HELP_CONTENT[tabName];
  if (!content) {
    introEl.innerHTML  = '';
    fieldsEl.innerHTML = '';
    return;
  }

  const hasFields = content.fields && content.fields.length > 0;

  // Intro section — only show border when there are field items below
  introEl.className = hasFields ? 'help-intro' : 'help-intro help-intro--no-border';
  introEl.innerHTML = `
    <div class="help-intro-title">About this section</div>
    <div class="help-intro-text">${escHtml(content.intro)}</div>
  `;

  // Field explanations
  if (!hasFields) {
    fieldsEl.innerHTML = '';
    return;
  }

  fieldsEl.innerHTML = content.fields.map(f =>
    `<div class="help-field-item" data-help-id="${escHtmlAttr(f.id)}">
      <div class="help-field-name">${escHtml(f.label)}</div>
      <div class="help-field-desc">${escHtml(f.desc)}</div>
    </div>`
  ).join('');
}

/**
 * Highlight the help-panel entry whose data-help-id matches fieldId.
 * Pass null to clear all highlights.
 */
function highlightHelpField(fieldId) {
  document.querySelectorAll('.help-field-item').forEach(el => {
    el.classList.toggle('highlighted', !!fieldId && el.dataset.helpId === fieldId);
  });

  // Scroll the highlighted item into view within the panel
  if (fieldId) {
    const target = document.querySelector(`.help-field-item[data-help-id="${CSS.escape(fieldId)}"]`);
    if (target) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

/**
 * Attach focus/blur listeners to all focusable form fields in a tab panel.
 * On focus: highlights the matching help entry.
 * On blur:  clears the highlight.
 */
function attachHelpListeners(tabName) {
  const panel = document.getElementById('tab-' + tabName);
  if (!panel) return;
  const content = HELP_CONTENT[tabName];
  if (!content || !content.fields || content.fields.length === 0) return;

  // For static tabs, avoid adding duplicate listeners on repeat calls.
  // Projects/people are re-rendered and need fresh listeners each time.
  const isDynamic = tabName === 'projects' || tabName === 'people';
  if (!isDynamic && helpListenersAttached.has(tabName)) return;

  const fieldIds = new Set(content.fields.map(f => f.id));

  panel.querySelectorAll('input, select, textarea').forEach(el => {
    // Determine which help id to use for this element
    const helpId = resolveHelpId(el, tabName, fieldIds);
    if (!helpId) return;

    el.addEventListener('focus', () => highlightHelpField(helpId));
    el.addEventListener('blur',  () => highlightHelpField(null));
  });

  if (!isDynamic) helpListenersAttached.add(tabName);
}

/**
 * Given a form element, return the help panel field id it maps to.
 * Checks in order: exact id match, then class-based match for dynamically
 * generated entity-card fields (projects / people).
 */
function resolveHelpId(el, tabName, fieldIds) {
  // Direct id match
  if (el.id && fieldIds.has(el.id)) return el.id;

  // For dynamically built people/projects cards, match by CSS class
  const classMap = {
    // Projects
    'proj-name':    'proj-name',
    'proj-status':  'proj-status',
    'proj-desc':    'proj-desc',
    // People
    'person-display-name':   'person-display-name',
    'person-full-name':      'person-full-name',
    'person-email':          'person-email',
    'person-slack':          'person-slack',
    'person-tier':           'person-tier',
    'person-role':           'person-role',
    'person-team':           'person-team',
    'person-feedback-cycle': 'person-feedback-cycle',
    'person-birthday':       'person-birthday',
    'person-anniversary':    'person-anniversary',
    // Feature toggle inputs all use feat-* ids
  };

  for (const [cls, helpId] of Object.entries(classMap)) {
    if (el.classList.contains(cls) && fieldIds.has(helpId)) return helpId;
  }

  // TagInput and PeopleMultiSelect inner text inputs: map by container's data attribute
  const tagContainer = el.closest('[data-tag-field]');
  if (tagContainer) {
    const field = tagContainer.dataset.tagField; // e.g. "aliases-0" or "slack_channels-2"
    const baseName = field.replace(/-\d+$/, '');  // strip trailing index
    if (baseName === 'aliases' && tabName === 'projects') return 'proj-aliases';
    if (baseName === 'email_folders') return 'proj-email-folders';
    if (baseName === 'slack_channels') return 'proj-slack-channels';
    if (baseName === 'person-aliases') return 'person-aliases';
  }

  const peopleContainer = el.closest('[data-people-field]');
  if (peopleContainer) return 'proj-key-people';

  return null;
}

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  switchTab('overview');
  loadConfig();
  initFilesTab();
  renderHelpPanel('overview');

  // ── Identity: text inputs → save on blur ──────────────────────────────────
  ['user-name', 'user-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => saveTab('identity'));
  });

  // Custom role text input → save on blur
  const roleCustomInput = document.getElementById('user-role-custom');
  if (roleCustomInput) {
    roleCustomInput.addEventListener('blur', () => {
      if (document.getElementById('user-role').value === '_custom') {
        saveTab('identity');
      }
    });
  }

  // Custom timezone text input → save on blur
  const tzCustomInput = document.getElementById('user-timezone-custom');
  if (tzCustomInput) {
    tzCustomInput.addEventListener('blur', () => {
      if (document.getElementById('user-timezone').value === '_other') {
        saveTab('identity');
      }
    });
  }

  // Journal archive (number input) → save on blur
  const journalArchiveInput = document.getElementById('journal-archive');
  if (journalArchiveInput) {
    journalArchiveInput.addEventListener('blur', () => saveTab('identity'));
  }

  // ── Integrations: text inputs → save on blur ──────────────────────────────
  ['mcp-email', 'mcp-calendar', 'mcp-slack'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('blur', () => saveTab('integrations'));
  });

  // ── Communication: unwired dropdowns → save on change ─────────────────────
  ['comm-email-length', 'comm-email-greeting', 'comm-msg-formality', 'comm-msg-emoji'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => saveTab('communication'));
  });

  // Sign-off text input → save on blur
  const signOffInput = document.getElementById('comm-sign-off');
  if (signOffInput) {
    signOffInput.addEventListener('blur', () => saveTab('communication'));
  }

  // Auto-save on blur for communication style custom inputs (Design Decision #7)
  ['comm-default-preset', 'comm-upward', 'comm-peer', 'comm-direct', 'comm-cross-team'].forEach(selectId => {
    const customInput = document.getElementById(selectId + '-custom');
    if (customInput) {
      customInput.addEventListener('blur', () => {
        if (document.getElementById(selectId).value === '_custom') {
          saveTab('communication');
        }
      });
    }
  });

  // ── Features: toggles → save on change ───────────────────────────────────
  const featureKeys = [
    'email_processing', 'messaging_processing', 'email_triage',
    'meeting_prep', 'process_meeting',
    'time_blocks', 'calendar_reminders',
    'people_management', 'team_health', 'attention_gap_detection',
    'feedback_gap_detection', 'milestones',
    'self_tracking', 'contribution_detection',
    'weekly_summary', 'monthly_updates',
    'park_resume'
  ];
  featureKeys.forEach(key => {
    const el = document.getElementById('feat-' + key);
    if (el) el.addEventListener('change', () => saveTab('features'));
  });
});
