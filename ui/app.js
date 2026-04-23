/* =========================================================
   Myna Settings — app.js

   Architecture:
   - window.config  : raw config object from GET /api/config
   - switchTab()    : tab navigation
   - populateForms(): fills all forms from window.config
   - getTabData()   : reads a tab's form inputs → partial config object
   - saveTab()      : PUT /api/config/{name} with getTabData result
   - showToast()    : bottom-right toast, auto-dismiss after 3s
   ========================================================= */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────

window.config = null;
let activeTab = 'overview';

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
}

function populateIdentity() {
  const ws = window.config.workspace || {};
  const user = ws.user || {};
  const vault = ws.vault || {};
  const wh = ws.work_hours || {};
  const journal = ws.journal || {};
  const email = ws.email || {};

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

  // Email filing radio
  const filing = email.processed_folder || 'per-project';
  const radios = document.querySelectorAll('input[name="email-filing"]');
  radios.forEach(r => { r.checked = r.value === filing; });
}

function populateIntegrations() {
  const mcp = (window.config.workspace || {}).mcp_servers || {};
  setValue('mcp-email',    mcp.email    || '');
  setValue('mcp-calendar', mcp.calendar || '');
  setValue('mcp-slack',    mcp.slack    || '');
}

function populateCommunication() {
  const cs = window.config['communication-style'] || {};
  const tier = cs.presets_per_tier || {};
  const ep   = cs.email_preferences || {};
  const mp   = cs.messaging_preferences || {};

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

  const filingEl = document.querySelector('input[name="email-filing"]:checked');

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
    email: {
      ...(existing.email || {}),
      processed_folder: filingEl ? filingEl.value : (existing.email || {}).processed_folder,
    },
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

  const btn = document.querySelector(`#tab-${tabName} .save-btn`);
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

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

    renderOverview();
    showToast('Saved successfully', 'success');
  } catch (err) {
    console.error('Save failed:', err);
    showToast('Save failed: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = savedBtnLabel(tabName); }
  }
}

function savedBtnLabel(tabName) {
  const labels = {
    identity:      'Save identity',
    integrations:  'Save integrations',
    communication: 'Save communication',
    features:      'Save features',
    projects:      'Save projects',
    people:        'Save people',
  };
  return labels[tabName] || 'Save';
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
  } else {
    custom.classList.add('hidden');
    custom.value = '';
  }
}

// ── Timezone change handler ────────────────────────────────────────────────

function handleTimezoneChange() {
  const sel    = document.getElementById('user-timezone');
  const custom = document.getElementById('user-timezone-custom');
  if (sel.value === '_other') {
    custom.classList.remove('hidden');
    custom.focus();
  } else {
    custom.classList.add('hidden');
    custom.value = '';
  }
}

// ── Role change handler ────────────────────────────────────────────────────

function handleRoleChange() {
  const sel    = document.getElementById('user-role');
  const custom = document.getElementById('user-role-custom');
  if (sel.value === '_custom') {
    custom.classList.remove('hidden');
    custom.focus();
  } else {
    custom.classList.add('hidden');
    custom.value = '';
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
  }, 3000);
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
          <input type="text" class="field-input proj-name" value="${escHtmlAttr(proj.name || '')}" placeholder="Project name" oninput="syncProjectHeader(${idx})" />
        </div>
        <div class="field-group">
          <label class="field-label">Status</label>
          <select class="field-input proj-status" onchange="syncProjectHeader(${idx})">
            <option value="active" ${status === 'active' ? 'selected' : ''}>Active</option>
            <option value="paused" ${status === 'paused' ? 'selected' : ''}>Paused</option>
            <option value="complete" ${status === 'complete' ? 'selected' : ''}>Complete</option>
          </select>
        </div>
      </div>
      <div class="entity-form-full">
        <div class="field-group">
          <label class="field-label">Description</label>
          <textarea class="field-input proj-desc" rows="2" placeholder="Short description" oninput="syncProjectHeader(${idx})">${escHtml(proj.description || '')}</textarea>
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
          <div class="tag-input" data-tag-field="key_people-${idx}"><div class="tags-container"><input type="text" class="tag-text-input" placeholder="Add..."></div></div>
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
  const fields = ['aliases', 'email_folders', 'slack_channels', 'key_people'];
  if (!tagInputs.projects[idx]) tagInputs.projects[idx] = {};
  fields.forEach(field => {
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
          <input type="text" class="field-input person-display-name" value="${escHtmlAttr(person.display_name || '')}" placeholder="e.g. Sarah" oninput="syncPersonHeader(${idx})" />
        </div>
        <div class="field-group">
          <label class="field-label">Full name</label>
          <input type="text" class="field-input person-full-name" value="${escHtmlAttr(person.full_name || '')}" placeholder="e.g. Sarah Chen" />
        </div>
        <div class="field-group">
          <label class="field-label">Email</label>
          <input type="email" class="field-input person-email" value="${escHtmlAttr(person.email || '')}" placeholder="sarah@company.com" />
        </div>
        <div class="field-group">
          <label class="field-label">Slack handle</label>
          <input type="text" class="field-input person-slack" value="${escHtmlAttr(person.slack_handle || '')}" placeholder="@sarah" />
        </div>
        <div class="field-group">
          <label class="field-label">Relationship tier</label>
          <select class="field-input person-tier" onchange="syncPersonHeader(${idx})">
            <option value="" ${!tier ? 'selected' : ''}>Select tier</option>
            <option value="direct"     ${tier === 'direct'     ? 'selected' : ''}>Direct report</option>
            <option value="peer"       ${tier === 'peer'       ? 'selected' : ''}>Peer</option>
            <option value="upward"     ${tier === 'upward'     ? 'selected' : ''}>Upward</option>
            <option value="cross-team" ${tier === 'cross-team' ? 'selected' : ''}>Cross-team</option>
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Role</label>
          <input type="text" class="field-input person-role" value="${escHtmlAttr(person.role || '')}" placeholder="e.g. Staff Engineer" oninput="syncPersonHeader(${idx})" />
        </div>
        <div class="field-group">
          <label class="field-label">Team</label>
          <input type="text" class="field-input person-team" value="${escHtmlAttr(person.team || '')}" placeholder="e.g. Platform" />
        </div>
        <div class="field-group">
          <label class="field-label">Feedback cycle (days)</label>
          <input type="number" class="field-input person-feedback-cycle" value="${escHtmlAttr(person.feedback_cycle_days != null ? String(person.feedback_cycle_days) : '')}" placeholder="30" min="1" />
        </div>
        <div class="field-group">
          <label class="field-label">Birthday (MM-DD)</label>
          <input type="text" class="field-input person-birthday" value="${escHtmlAttr(person.birthday || '')}" placeholder="03-15" />
        </div>
        <div class="field-group">
          <label class="field-label">Work anniversary (YYYY-MM-DD)</label>
          <input type="text" class="field-input person-anniversary" value="${escHtmlAttr(person.work_anniversary || '')}" placeholder="2022-06-01" />
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

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  switchTab('overview');
  loadConfig();
  initFilesTab();

  // Auto-save on blur for custom role input (Design Decision #7)
  const roleCustomInput = document.getElementById('user-role-custom');
  if (roleCustomInput) {
    roleCustomInput.addEventListener('blur', () => {
      if (document.getElementById('user-role').value === '_custom') {
        saveTab('identity');
      }
    });
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
});
