/* ServiceDesk Lite frontend controller.
    Sections: layout, shared rendering, dashboards/tables, ticket forms, users/profile.
   All mutations go through demo-data.js. Only local HTML layout fragments are fetched. */
(() => {
  'use strict';
  const L = window.ServiceDeskLanguage;
  const D = window.ServiceDeskData;
  const t = (key, values) => L.t(key, values);
  const $ = selector => document.querySelector(selector);
  const page = document.body.dataset.page;
  const root = new URL(document.body.dataset.root, window.location.href);
  const routes = {
    beneficiary: 'beneficiary/beneficiary-dashboard.html',
    technical: 'technical/technical-dashboard.html',
    admin: 'admin/admin-dashboard.html'
  };
  const listRoutes = { beneficiary: 'beneficiary/my-tickets.html', technical: 'technical/assigned-tickets.html', admin: 'admin/manage-tickets.html' };
  const pageKeys = { home: 'home', login: 'signIn', 'beneficiary-dashboard': 'dashboard', 'technical-dashboard': 'dashboard', 'admin-dashboard': 'dashboard', 'create-ticket': 'createTicket', 'my-tickets': 'myTickets', 'assigned-tickets': 'assignedTickets', 'manage-tickets': 'manageTickets', 'manage-users': 'manageUsers', 'ticket-details': 'ticketDetails', profile: 'profile', '403': 'accessRestricted', '404': 'pageNotFound' };
  const filters = { search: '', status: 'all', technician: 'all', sort: 'newest' };
  let userFilters = { search: '', role: 'all' };
  let pendingImage = null;
  let imageBusy = false;
  let imageGeneration = 0;
  let toastTimer;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const text = value => escapeHTML(L.text(value));
  const tr = (key, values) => escapeHTML(t(key, values));
  const url = path => new URL(path, root).href;
  const roleKey = role => ({ beneficiary: 'Beneficiary', technical: 'Technical', admin: 'Admin' }[role]);
  const name = id => D.user(id) ? L.text(D.user(id).name) : t('nameFallback');
  const initials = user => L.text(user.name).split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
  const slug = status => status.toLowerCase().replaceAll(' ', '-');
  const badge = status => `<span class="badge status-${slug(status)}">${tr(status)}</span>`;
  const isOpen = ticket => !['Resolved', 'Closed'].includes(ticket.status);
  const detailURL = id => url(`shared/ticket-details.html?id=${id}&role=${D.role}`);
  const sortedTickets = tickets => [...tickets].sort((a, b) => new Date(b.created) - new Date(a.created));

  function showToast(key, values) {
    const toast = $('#toast');
    toast.textContent = t(key, values);
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
  }
  function showError(element, key) {
    element.textContent = key ? t(key) : '';
    element.hidden = !key;
    if (key) element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function save(next, errorElement) {
    try { D.save(next); return true; }
    catch (_) { errorElement ? showError(errorElement, 'storageError') : showToast('storageError'); return false; }
  }
  function linkElements(scope = document) {
    scope.querySelectorAll('[data-link]').forEach(link => { link.href = url(link.dataset.link); });
    scope.querySelectorAll('[data-dashboard-link]').forEach(link => { link.href = url(routes[D.role]); });
    scope.querySelectorAll('[data-role-entry]').forEach(link => { link.href = url(routes[link.dataset.roleEntry]); });
  }
  function renderIdentity() {
    const user = D.currentUser();
    $('#sidebar-name').textContent = L.text(user.name);
    $('#sidebar-role').textContent = t(roleKey(D.role));
    $('#sidebar-avatar').textContent = initials(user);
    $('#header-avatar').textContent = initials(user);
    $('#breadcrumb-page').textContent = t(pageKeys[page]);
    document.title = `${t(pageKeys[page])} | ServiceDesk Lite`;
  }
  function renderNavigation() {
    const items = [{ key: 'dashboard', path: routes[D.role], icon: '▦', pages: [`${D.role}-dashboard`] }];
    if (D.role === 'beneficiary') items.push(
      { key: 'myTickets', path: listRoutes.beneficiary, icon: '▤', pages: ['my-tickets', 'ticket-details'], count: D.visibleTickets().length },
      { key: 'createTicket', path: 'beneficiary/create-ticket.html', icon: '⊕', pages: ['create-ticket'] });
    if (D.role === 'technical') items.push({ key: 'assignedTickets', path: listRoutes.technical, icon: '▤', pages: ['assigned-tickets', 'ticket-details'], count: D.visibleTickets().filter(isOpen).length });
    if (D.role === 'admin') items.push(
      { key: 'manageTickets', path: listRoutes.admin, icon: '▤', pages: ['manage-tickets', 'ticket-details'], count: D.state.tickets.length },
      { key: 'manageUsers', path: 'admin/manage-users.html', icon: '♙', pages: ['manage-users'] });
    const navItem = item => `<a href="${url(item.path)}" class="nav-link ${item.pages.includes(page) ? 'active' : ''}" ${item.pages.includes(page) ? 'aria-current="page"' : ''}><span class="nav-icon" aria-hidden="true">${item.icon}</span><span>${tr(item.key)}</span>${item.count !== undefined ? `<span class="nav-count">${L.number(item.count)}</span>` : ''}</a>`;
    $('#role-nav').innerHTML = items.map(navItem).join('') + '<hr class="nav-divider">' +
      navItem({ key: 'profile', path: 'shared/profile.html', icon: '○', pages: ['profile'] }) +
      navItem({ key: 'home', path: 'index.html', icon: '⌂', pages: ['home'] }) +
      navItem({ key: 'switchRole', path: 'login.html', icon: '⇄', pages: ['login'] });
    const helpLink = $('.help-card a');
    helpLink.href = url(D.role === 'beneficiary' ? 'beneficiary/create-ticket.html' : listRoutes[D.role]);
    helpLink.removeAttribute('data-link');
    helpLink.removeAttribute('data-i18n');
    helpLink.textContent = t(D.role === 'beneficiary' ? 'getSupport' : 'viewAll');
  }
  async function localFragment(path) {
    const response = await fetch(url(path));
    if (!response.ok) throw new Error(`Could not load ${path}`);
    return response.text();
  }
  async function init() {
    if (document.body.dataset.role) D.setRole(document.body.dataset.role);
    else if (page === 'ticket-details') {
      const requestedRole = new URLSearchParams(location.search).get('role');
      if (Object.keys(routes).includes(requestedRole)) D.setRole(requestedRole);
    }
    try {

      $('#main-content').append($('#page-content').content.cloneNode(true));
      linkElements();
      L.apply();
      renderIdentity();
      renderNavigation();
      ServiceDeskTheme.updateButton();
      $('#theme-toggle').addEventListener('click', () => ServiceDeskTheme.toggle());
      $('#language-toggle').addEventListener('click', () => L.toggle());
      bindMenu();
      initPage();
      document.addEventListener('languagechange', () => {
        renderIdentity(); renderNavigation(); renderPage(); linkElements();
        const toast = $('#toast'); if (toast) toast.hidden = true;
      });
      const notice = new URLSearchParams(location.search).get('notice');
      if (notice === 'created') {
        showToast('ticketSubmitted');
        const cleanURL = new URL(location.href); cleanURL.searchParams.delete('notice');
        history.replaceState(null, '', cleanURL);
      }
    } catch (error) {
      console.error('ServiceDesk Lite:', error);
      $('#app').innerHTML = `<main class="loading"><h1>ServiceDesk Lite</h1><p>This demo loads its reusable layout from local HTML files. Open <code>frontend/templates/index.html</code> with a static preview server, such as VS Code Live Server.</p><p>يحمّل هذا العرض التخطيط المشترك من ملفات HTML محلية. افتح الصفحة باستخدام خادم معاينة ملفات ثابتة مثل Live Server.</p><p>If you are already using a static server, check that base.html and shared/components are available beside the page templates.</p><p>No backend, API, or database is required.</p></main>`;
    }
  }
  function bindMenu() {
    const button = $('#menu-toggle');
    function close() { document.body.classList.remove('menu-open'); button.setAttribute('aria-expanded', 'false'); }
    button.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      button.setAttribute('aria-expanded', String(open));
      if (open) $('#sidebar a').focus();
    });
    $('#sidebar-shade').addEventListener('click', close);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.body.classList.contains('menu-open')) { close(); button.focus(); }
      if (event.key === 'Tab' && document.body.classList.contains('menu-open')) {
        const links = [...$('#sidebar').querySelectorAll('a[href], button')];
        if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); links.at(-1).focus(); }
        else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); links[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) close(); });
  }

  // Shared data-driven components. Text from inputs is escaped before insertion.
  function statCard(label, value, caption, icon, color = '') {
    return `<article class="stat-card"><div class="stat-top"><span>${tr(label)}</span><span class="stat-icon ${color}" aria-hidden="true">${icon}</span></div><div class="stat-value">${L.number(value)}</div><div class="stat-caption"><span aria-hidden="true">↗</span><span>${tr(caption)}</span></div></article>`;
  }
  function emptyState(title = 'noTickets', hint = 'noTicketsHint') {
    return `<div class="empty-state"><span class="role-icon" aria-hidden="true">▤</span><h3>${tr(title)}</h3><p>${tr(hint)}</p></div>`;
  }
  function technicianOptions(selected = '', placeholder = true) {
    return `${placeholder ? `<option value="">${tr('chooseTechnician')}</option>` : ''}` + D.state.users.filter(user => user.role === 'technical' && user.active).map(user => `<option value="${escapeHTML(user.id)}" ${user.id === selected ? 'selected' : ''}>${text(user.name)}</option>`).join('');
  }
  function assignmentForm(ticket, compact = false) {
    return `<form class="assignment-form" data-ticket-id="${ticket.id}"><label ${compact ? 'class="sr-only"' : ''} for="assign-${ticket.id}">${tr(ticket.technician ? 'reassignTechnician' : 'assignTechnician')}</label><select id="assign-${ticket.id}" name="technician" required class="${compact ? 'table-select' : ''}">${technicianOptions(ticket.technician)}</select><button class="button ${compact ? 'secondary small-button' : 'primary full-width'}" type="submit">${tr(ticket.technician ? 'reassign' : 'assign')}</button></form>`;
  }
  function ticketTable(tickets, compact = false) {
    if (!tickets.length) return emptyState();
    const admin = D.role === 'admin';
    return `<div class="table-wrap"><table><caption class="sr-only">${tr(compact ? 'recentTickets' : pageKeys[page])}</caption><thead><tr><th scope="col">${tr('ticket')}</th><th scope="col">${tr('title')}</th><th scope="col">${tr('status')}</th>${!compact && D.role !== 'beneficiary' ? `<th scope="col">${tr('requester')}</th>` : ''}${!compact ? `<th scope="col">${tr('technician')}</th>` : ''}<th scope="col">${tr('created')}</th>${!compact && admin ? `<th scope="col">${tr('actions')}</th>` : '<th scope="col"><span class="sr-only">' + tr('viewTicket') + '</span></th>'}</tr></thead><tbody>${tickets.map(ticket => `<tr><td><a class="ticket-id" href="${detailURL(ticket.id)}">#SD-${ticket.id}</a></td><td class="ticket-title-cell"><a href="${detailURL(ticket.id)}">${text(ticket.title)}</a><small>${text(D.user(ticket.requester)?.department)}</small></td><td>${badge(ticket.status)}</td>${!compact && D.role !== 'beneficiary' ? `<td>${escapeHTML(name(ticket.requester))}</td>` : ''}${!compact ? `<td>${ticket.technician ? escapeHTML(name(ticket.technician)) : `<span class="muted">${tr('unassigned')}</span>`}</td>` : ''}<td class="date-cell"><time datetime="${escapeHTML(ticket.created)}">${L.date(ticket.created)}</time></td>${!compact && admin ? `<td class="table-actions">${isOpen(ticket) ? assignmentForm(ticket, true) : `<a class="text-link" href="${detailURL(ticket.id)}">${tr('viewTicket')} →</a>`}</td>` : `<td><a class="table-chevron" href="${detailURL(ticket.id)}" aria-label="${tr('viewTicket')} #SD-${ticket.id}">›</a></td>`}</tr>`).join('')}</tbody></table></div>`;
  }
  function eventTitle(event) {
    if (event.type === 'created') return t('createdEvent');
    if (event.type === 'assigned' || event.type === 'reassigned') return t(event.type === 'assigned' ? 'assignedEvent' : 'reassignedEvent', { name: name(event.technician) });
    if (event.type === 'note') return t('noteEvent');
    return t('statusEvent', { status: t(event.status) });
  }
  function renderDashboard() {
    const tickets = D.visibleTickets();
    const open = tickets.filter(isOpen).length;
    const working = tickets.filter(ticket => ticket.status === 'In Progress').length;
    const resolved = tickets.filter(ticket => ticket.status === 'Resolved').length;
    if (D.role === 'admin') {
      $('#dashboard-stats').innerHTML = statCard('totalTickets', tickets.length, 'acrossWorkspace', '▤') + statCard('unassignedTickets', tickets.filter(ticket => !ticket.technician).length, 'readyForTechnician', '◷', 'gold') + statCard('inProgress', working, 'beingWorkedOn', '↻', 'blue') + statCard('totalUsers', D.state.users.length, 'registeredPeople', '♙', 'green');
      $('#status-chart').innerHTML = D.statuses.map(status => {
        const count = tickets.filter(ticket => ticket.status === status).length;
        return `<div class="chart-row"><span>${tr(status)}</span><div class="chart-track"><div class="chart-fill ${slug(status)}" style="width:${tickets.length ? count / tickets.length * 100 : 0}%"></div></div><b>${L.number(count)}</b></div>`;
      }).join('');
      $('#user-stats').innerHTML = ['beneficiary', 'technical', 'admin'].map((role, index) => `<div class="user-stat-row"><span class="stat-icon ${['gold', 'blue', 'green'][index]}" aria-hidden="true">${['◎', '⌘', '▦'][index]}</span><span>${tr({ beneficiary: 'beneficiaries', technical: 'technicians', admin: 'administrators' }[role])}</span><strong>${L.number(D.state.users.filter(user => user.role === role).length)}</strong></div>`).join('');
    } else {
      $('#dashboard-stats').innerHTML = statCard(D.role === 'technical' ? 'assignedTotal' : 'totalTickets', tickets.length, D.role === 'technical' ? 'yourAssignedRequests' : 'allYourRequests', '▤') + statCard('openTickets', open, 'needsAttention', '◷', 'gold') + statCard('inProgress', working, 'beingWorkedOn', '↻', 'blue') + statCard('resolvedTickets', resolved, 'solutionsDelivered', '✓', 'green');
      const events = tickets.flatMap(ticket => ticket.history.map(event => ({ ...event, ticket }))).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
      $('#recent-activity').innerHTML = events.length ? events.map(event => `<div class="activity-item"><span class="activity-symbol" aria-hidden="true">${event.type === 'created' ? '+' : event.status === 'Resolved' ? '✓' : '↻'}</span><div class="activity-content"><strong>${escapeHTML(eventTitle(event))}</strong><p><a href="${detailURL(event.ticket.id)}">#SD-${event.ticket.id} · ${text(event.ticket.title)}</a></p><time datetime="${escapeHTML(event.date)}">${L.date(event.date, true)}</time></div></div>`).join('') : emptyState('noActivity', 'noActivityHint');
    }
    $('#recent-tickets').innerHTML = ticketTable(sortedTickets(tickets).slice(0, 5), true);
  }
  function renderFilters() {
    $('#ticket-filters').innerHTML = `<div class="filter-bar"><div class="search-field"><label class="sr-only" for="ticket-search">${tr('searchTickets')}</label><span aria-hidden="true">⌕</span><input id="ticket-search" type="search" placeholder="${tr('searchTickets')}" value="${escapeHTML(filters.search)}"></div><div class="filter-field"><label for="status-filter">${tr('status')}</label><select id="status-filter"><option value="all">${tr('allStatuses')}</option>${D.statuses.map(status => `<option value="${status}" ${filters.status === status ? 'selected' : ''}>${tr(status)}</option>`).join('')}</select></div>${D.role === 'admin' ? `<div class="filter-field"><label for="technician-filter">${tr('technician')}</label><select id="technician-filter"><option value="all">${tr('allTechnicians')}</option><option value="unassigned">${tr('unassigned')}</option>${technicianOptions('', false)}</select></div>` : ''}<div class="filter-field"><label for="sort-filter">${tr('sortBy')}</label><select id="sort-filter">${[['newest', 'newestFirst'], ['oldest', 'oldestFirst'], ['title', 'titleAZ'], ['status', 'statusOrder']].map(([value, key]) => `<option value="${value}" ${filters.sort === value ? 'selected' : ''}>${tr(key)}</option>`).join('')}</select></div><button class="text-button" id="clear-filters" type="button">${tr('clearFilters')}</button></div>`;
    if ($('#technician-filter')) $('#technician-filter').value = filters.technician;
    $('#ticket-search').addEventListener('input', event => { filters.search = event.target.value; renderTicketList(); });
    $('#status-filter').addEventListener('change', event => { filters.status = event.target.value; renderTicketList(); });
    $('#sort-filter').addEventListener('change', event => { filters.sort = event.target.value; renderTicketList(); });
    $('#technician-filter')?.addEventListener('change', event => { filters.technician = event.target.value; renderTicketList(); });
    $('#clear-filters').addEventListener('click', () => { Object.assign(filters, { search: '', status: 'all', technician: 'all', sort: 'newest' }); renderFilters(); renderTicketList(); $('#ticket-search').focus(); });
  }
  function renderTicketList() {
    const all = D.visibleTickets();
    const query = filters.search.trim().toLocaleLowerCase();
    const tickets = all.filter(ticket => {
      const haystack = [`SD-${ticket.id}`, L.text(ticket.title), typeof ticket.title === 'object' ? Object.values(ticket.title).join(' ') : '', name(ticket.requester)].join(' ').toLocaleLowerCase();
      return haystack.includes(query) && (filters.status === 'all' || ticket.status === filters.status) && (filters.technician === 'all' || (filters.technician === 'unassigned' ? !ticket.technician : ticket.technician === filters.technician));
    });
    tickets.sort((a, b) => filters.sort === 'title' ? L.text(a.title).localeCompare(L.text(b.title), L.current) : filters.sort === 'status' ? D.statuses.indexOf(a.status) - D.statuses.indexOf(b.status) : (new Date(a.created) - new Date(b.created)) * (filters.sort === 'oldest' ? 1 : -1));
    $('#tickets-table').innerHTML = ticketTable(tickets);
    $('#table-summary').textContent = t('showingTickets', { count: L.number(tickets.length), total: L.number(all.length) });
    bindAssignments($('#tickets-table'));
  }
  function bindAssignments(scope) {
    scope.querySelectorAll('.assignment-form').forEach(form => form.addEventListener('submit', event => {
      event.preventDefault();
      if (D.role !== 'admin' || !form.reportValidity()) return;
      const next = D.snapshot();
      const ticket = next.tickets.find(item => item.id === Number(form.dataset.ticketId));
      const technician = form.elements.technician.value;
      if (!ticket || !isOpen(ticket) || !D.user(technician)?.active || D.user(technician).role !== 'technical') return;
      if (ticket.technician === technician) { showToast('noChanges'); return; }
      const date = new Date().toISOString();
      ticket.history.push({ type: ticket.technician ? 'reassigned' : 'assigned', actor: D.currentUser().id, technician, date });
      ticket.technician = technician;
      ticket.status = 'Assigned';
      ticket.updated = date;
      if (!save(next)) return;
      renderPage(); renderNavigation(); showToast('assignmentSaved');
    }));
  }

  // Beneficiary form: native constraints plus readable custom errors and image checks.
  function bindCreateTicket() {
    const input = $('#ticket-image');
    function clearImage() {
      imageGeneration++; pendingImage = null; imageBusy = false; input.value = '';
      input.setCustomValidity(''); input.removeAttribute('aria-invalid');
      $('#image-preview').hidden = true; $('#image-preview').removeAttribute('src');
      $('#remove-image').hidden = true; showError($('#image-error'), null);
    }
    $('#remove-image').addEventListener('click', clearImage);
    input.addEventListener('change', () => {
      const file = input.files[0];
      clearImage();
      if (!file) return;
      // File metadata is preserved separately; the input is reset to allow selecting it again.
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
        input.setAttribute('aria-invalid', 'true'); showError($('#image-error'), 'invalidImage'); return;
      }
      const generation = imageGeneration;
      imageBusy = true;
      const reader = new FileReader();
      reader.onerror = () => { if (generation !== imageGeneration) return; imageBusy = false; showError($('#image-error'), 'imageReadError'); };
      reader.onload = () => {
        if (generation !== imageGeneration) return;
        const image = new Image();
        image.onload = () => {
          if (generation !== imageGeneration) return;
          pendingImage = { name: file.name, data: reader.result, type: file.type };
          imageBusy = false;
          $('#image-preview').src = reader.result; $('#image-preview').hidden = false; $('#remove-image').hidden = false;
        };
        image.onerror = () => { if (generation !== imageGeneration) return; imageBusy = false; showError($('#image-error'), 'imageReadError'); };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    $('#create-ticket-form').addEventListener('submit', event => {
      event.preventDefault();
      const title = $('#ticket-title').value.trim();
      const description = $('#ticket-description').value.trim();
      if (title.length < 5 || description.length < 15) { showError($('#form-error'), 'invalidTicket'); return; }
      if (imageBusy) { showError($('#form-error'), 'imageLoading'); return; }
      if (!$('#image-error').hidden) { showError($('#form-error'), 'invalidImage'); return; }
      const next = D.snapshot();
      const id = Math.max(1000, ...next.tickets.map(ticket => ticket.id)) + 1;
      const date = new Date().toISOString();
      next.tickets.push({ id, title, description, requester: D.currentUser().id, technician: null, status: 'New', created: date, updated: date, resolution: '', attachment: pendingImage, history: [{ type: 'created', actor: D.currentUser().id, date }] });
      if (save(next, $('#form-error'))) location.href = `${detailURL(id)}&notice=created`;
    });
  }

  // One shared detail page, with presentation controls specific to the selected role.
  function renderTicketDetails() {
    const id = Number(new URLSearchParams(location.search).get('id'));
    const ticket = D.state.tickets.find(item => item.id === id);
    if (!ticket) { location.replace(url('shared/404.html')); return; }
    if (!D.visibleTickets().some(item => item.id === id)) { location.replace(url('shared/403.html')); return; }
    // Preserve an in-flight technical form when switching the language.
    const draftNotes = $('#resolution-notes')?.value;
    const draftStatus = $('#update-status')?.value;
    const position = D.statuses.indexOf(ticket.status);
    const canUpdate = D.role === 'technical' && ticket.technician === D.currentUser().id && ticket.status !== 'Closed';
    const allowedStatuses = ticket.status === 'Assigned' ? ['Assigned', 'In Progress', 'Resolved'] : ticket.status === 'In Progress' ? ['In Progress', 'Resolved'] : ['Resolved'];
    const attachment = ticket.attachment && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(ticket.attachment.data) ? `<div class="detail-attachment"><h3>${tr('attachment')}</h3><img src="${escapeHTML(ticket.attachment.data)}" alt="${tr('attachmentLabel')}"><small>${escapeHTML(ticket.attachment.name)} · ${tr('imageDemoOnly')}</small></div>` : '';
    $('#ticket-detail-content').innerHTML = `<section class="page-heading"><div><a class="back-link" href="${url(listRoutes[D.role])}">${tr('backTickets')}</a><h1 class="detail-title">${text(ticket.title)}</h1><div class="ticket-meta"><span class="ticket-id">#SD-${ticket.id}</span>${badge(ticket.status)}<span>${tr('created')} ${L.date(ticket.created)}</span></div></div></section><div class="detail-layout"><div class="detail-main"><section class="card"><div class="card-heading"><h2>${tr('ticketStatus')}</h2></div><div class="ticket-progress">${D.statuses.map((status, index) => `<div class="progress-step ${index <= position ? 'done' : ''} ${index === position ? 'current' : ''}" ${index === position ? 'aria-current="step"' : ''}><div class="progress-line"></div>${tr(status)}</div>`).join('')}</div></section><section class="card"><div class="card-heading"><h2>${tr('description')}</h2></div><div class="detail-body"><p class="detail-description">${text(ticket.description)}</p>${attachment}</div></section>${ticket.resolution ? `<section class="card"><div class="card-heading"><h2>${tr('resolutionNotes')}</h2><span class="success-circle" aria-hidden="true">✓</span></div><div class="detail-body"><p class="detail-description">${text(ticket.resolution)}</p></div></section>` : ''}<section class="card"><div class="card-heading"><h2>${tr('ticketHistory')}</h2><span class="pill">${L.number(ticket.history.length)}</span></div><div class="history-list">${[...ticket.history].reverse().map(event => `<div class="activity-item"><span class="activity-symbol" aria-hidden="true">${event.type === 'created' ? '+' : event.status === 'Resolved' || event.status === 'Closed' ? '✓' : '↻'}</span><div class="activity-content"><strong>${escapeHTML(eventTitle(event))}</strong><p>${tr('byPerson', { name: name(event.actor) })}</p><time datetime="${escapeHTML(event.date)}">${L.date(event.date, true)}</time>${event.note ? `<p class="history-note">${text(event.note)}</p>` : ''}</div></div>`).join('')}</div></section></div><aside class="detail-aside"><section class="card"><div class="card-heading"><h2>${tr('ticketInformation')}</h2></div><dl class="metadata-list"><div><dt>${tr('requester')}</dt><dd>${escapeHTML(name(ticket.requester))}</dd></div><div><dt>${tr('department')}</dt><dd>${text(D.user(ticket.requester)?.department)}</dd></div><div><dt>${tr('technician')}</dt><dd>${ticket.technician ? escapeHTML(name(ticket.technician)) : tr('unassigned')}</dd></div><div><dt>${tr('created')}</dt><dd>${L.date(ticket.created)}</dd></div><div><dt>${tr('updated')}</dt><dd>${L.date(ticket.updated)}</dd></div></dl><div class="detail-body"><div class="alert info">${tr(ticket.status === 'Closed' ? 'closedHint' : !ticket.technician ? 'awaitingAssignment' : 'readOnlyTicket')}</div></div></section>${D.role === 'admin' && isOpen(ticket) ? `<section class="card assignment-card"><div class="card-heading"><h2>${tr(ticket.technician ? 'reassignTechnician' : 'assignTechnician')}</h2></div>${assignmentForm(ticket)}</section>` : ''}${canUpdate ? `<section class="card"><div class="card-heading"><h2>${tr('updateStatus')}</h2></div><form id="status-form"><div class="form-field"><label for="update-status">${tr('status')}</label><select id="update-status" required>${allowedStatuses.map(status => `<option value="${status}" ${ticket.status === status ? 'selected' : ''}>${tr(status)}</option>`).join('')}</select></div><div class="form-field"><label for="resolution-notes">${tr('resolutionNotes')}</label><textarea id="resolution-notes" rows="5" maxlength="2000" placeholder="${tr('resolutionPlaceholder')}" aria-describedby="resolution-hint"></textarea><small id="resolution-hint">${tr('resolutionRequired')}</small></div><div id="status-error" class="alert error" role="alert" hidden></div><button type="submit" class="button primary full-width">${tr('saveUpdate')}</button></form></section>` : ''}${D.role === 'admin' && ticket.status === 'Resolved' ? `<section class="card"><div class="card-heading"><h2>${tr('closeTicket')}</h2></div><div class="detail-body"><p class="small">${tr('closeHint')}</p><button class="button primary full-width close-ticket-button" type="button" id="close-ticket">${tr('closeTicket')}</button></div></section>` : ''}</aside></div>`;
    bindAssignments($('#ticket-detail-content'));
    if (canUpdate) {
      $('#resolution-notes').value = draftNotes ?? L.text(ticket.resolution);
      if (draftStatus && allowedStatuses.includes(draftStatus)) $('#update-status').value = draftStatus;
      const updateRequired = () => { $('#resolution-notes').required = $('#update-status').value === 'Resolved'; $('#resolution-notes').minLength = $('#resolution-notes').required ? 10 : 0; };
      updateRequired(); $('#update-status').addEventListener('change', updateRequired);
      $('#status-form').addEventListener('submit', event => {
        event.preventDefault();
        const status = $('#update-status').value;
        const notes = $('#resolution-notes').value.trim();
        if (!allowedStatuses.includes(status)) return;
        if (status === 'Resolved' && notes.length < 10) { showError($('#status-error'), 'notesTooShort'); return; }
        if (status === ticket.status && notes === L.text(ticket.resolution)) { showToast('noChanges'); return; }
        const next = D.snapshot(); const target = next.tickets.find(item => item.id === id); const date = new Date().toISOString();
        target.history.push({ type: status === target.status ? 'note' : 'status', status, actor: D.currentUser().id, date, note: notes });
        target.status = status; target.resolution = notes; target.updated = date;
        if (save(next, $('#status-error'))) { renderTicketDetails(); renderNavigation(); showToast('statusSaved'); }
      });
    }
    $('#close-ticket')?.addEventListener('click', () => {
      const next = D.snapshot(); const target = next.tickets.find(item => item.id === id);
      if (D.role !== 'admin' || target.status !== 'Resolved') return;
      target.status = 'Closed'; target.updated = new Date().toISOString();
      target.history.push({ type: 'status', status: 'Closed', actor: D.currentUser().id, date: target.updated });
      if (save(next)) { renderTicketDetails(); renderNavigation(); showToast('ticketClosed'); }
    });
  }

  // User administration. Fixed persona identities keep the demo navigable.
  function renderUserStats() {
    $('#manage-user-stats').innerHTML = statCard('totalUsers', D.state.users.length, 'registeredPeople', '♙') + statCard('activeUsers', D.state.users.filter(user => user.active).length, 'acrossWorkspace', '✓', 'green') + statCard('technicians', D.state.users.filter(user => user.role === 'technical').length, 'acrossWorkspace', '⌘', 'blue');
  }
  function renderUsers() {
    renderUserStats();
    const query = userFilters.search.trim().toLocaleLowerCase();
    const users = D.state.users.filter(user => `${L.text(user.name)} ${user.email}`.toLocaleLowerCase().includes(query) && (userFilters.role === 'all' || user.role === userFilters.role)).sort((a, b) => L.text(a.name).localeCompare(L.text(b.name), L.current));
    $('#users-table').innerHTML = users.length ? `<div class="table-wrap"><table><caption class="sr-only">${tr('manageUsers')}</caption><thead><tr><th scope="col">${tr('user')}</th><th scope="col">${tr('role')}</th><th scope="col">${tr('department')}</th><th scope="col">${tr('status')}</th><th scope="col">${tr('actions')}</th></tr></thead><tbody>${users.map(user => `<tr><td><div class="user-cell"><span class="avatar">${escapeHTML(initials(user))}</span><span><strong>${text(user.name)}</strong><small>${escapeHTML(user.email)}</small></span></div></td><td><span class="pill">${tr(roleKey(user.role))}</span></td><td class="muted">${text(user.department) || '—'}</td><td><span class="badge ${user.active ? 'status-resolved' : 'status-closed'}">${tr(user.active ? 'active' : 'inactive')}</span></td><td><div class="row-actions"><button class="button secondary small-button" type="button" data-edit-user="${escapeHTML(user.id)}">${tr('edit')}</button>${Object.values(D.personas).includes(user.id) ? `<span class="muted small">${tr('demoPersona')}</span>` : `<button class="text-button" type="button" data-toggle-user="${escapeHTML(user.id)}">${tr(user.active ? 'deactivate' : 'activate')}</button>`}</div></td></tr>`).join('')}</tbody></table></div>` : emptyState('noUsers', 'noTicketsHint');
    $('#user-summary').textContent = t('showingUsers', { count: L.number(users.length), total: L.number(D.state.users.length) });
    document.querySelectorAll('[data-edit-user]').forEach(button => button.addEventListener('click', () => openUserDialog(button.dataset.editUser)));
    document.querySelectorAll('[data-toggle-user]').forEach(button => button.addEventListener('click', () => {
      const user = D.user(button.dataset.toggleUser);
      if (user.active && hasOpenAssignments(user.id)) { showToast('assignedUserWarning'); return; }
      const next = D.snapshot(); next.users.find(item => item.id === user.id).active = !user.active;
      if (save(next)) { renderUsers(); showToast('userStatusSaved'); }
    }));
  }
  function hasOpenAssignments(id) { return D.state.tickets.some(ticket => ticket.technician === id && isOpen(ticket)); }
  function openUserDialog(id = '') {
    const user = id ? D.user(id) : null;
    $('#user-form').reset(); $('#edit-user-id').value = id;
    $('#user-dialog-title').dataset.i18n = user ? 'editUser' : 'addUser';
    $('#user-dialog-title').textContent = t(user ? 'editUser' : 'addUser');
    $('#user-name').value = user ? L.text(user.name) : '';
    $('#user-email').value = user?.email || '';
    $('#user-role').value = user?.role || 'beneficiary';
    $('#user-role').disabled = Object.values(D.personas).includes(id);
    showError($('#user-error'), null);
    $('#user-dialog').showModal(); $('#user-name').focus();
  }
  function bindUsers() {
    $('#user-search').addEventListener('input', event => { userFilters.search = event.target.value; renderUsers(); });
    $('#user-role-filter').addEventListener('change', event => { userFilters.role = event.target.value; renderUsers(); });
    $('#add-user-button').addEventListener('click', () => openUserDialog());
    ['#close-user-dialog', '#cancel-user-dialog'].forEach(selector => $(selector).addEventListener('click', () => $('#user-dialog').close()));
    $('#user-form').addEventListener('submit', event => {
      event.preventDefault();
      const id = $('#edit-user-id').value; const fullName = $('#user-name').value.trim(); const email = $('#user-email').value.trim(); const role = $('#user-role').value;
      if (fullName.length < 2) { showError($('#user-error'), 'invalidName'); return; }
      if (D.state.users.some(user => user.id !== id && user.email.toLowerCase() === email.toLowerCase())) { showError($('#user-error'), 'emailExists'); return; }
      if (id && D.user(id).role === 'technical' && role !== 'technical' && hasOpenAssignments(id)) { showError($('#user-error'), 'assignedUserWarning'); return; }
      const next = D.snapshot();
      if (id) {
        const user = next.users.find(item => item.id === id);
        if (fullName !== L.text(user.name)) user.name = fullName;
        user.email = email; if (!Object.values(D.personas).includes(id)) user.role = role;
      } else next.users.push({ id: `u-${crypto.randomUUID()}`, name: fullName, email, role, department: '', active: true });
      if (save(next, $('#user-error'))) { $('#user-dialog').close(); renderUsers(); renderIdentity(); showToast('userSaved'); }
    });
  }
  function renderProfileSummary() {
    const user = D.currentUser();
    $('#profile-summary').innerHTML = `<span class="avatar">${escapeHTML(initials(user))}</span><h2>${text(user.name)}</h2><p>${escapeHTML(user.email)}</p><span class="pill">${tr(roleKey(user.role))}</span><p class="small">${text(user.department)}</p>`;
  }
  function fillProfile() {
    const user = D.currentUser();
    $('#profile-name').value = L.text(user.name); $('#profile-email').value = user.email; $('#profile-department').value = L.text(user.department);
    renderProfileSummary();
  }
  function bindProfile() {
    fillProfile();
    $('#profile-form').addEventListener('submit', event => {
      event.preventDefault();
      const fullName = $('#profile-name').value.trim(); const email = $('#profile-email').value.trim(); const department = $('#profile-department').value.trim();
      if (fullName.length < 2) { showError($('#profile-error'), 'invalidName'); return; }
      if (D.state.users.some(user => user.id !== D.currentUser().id && user.email.toLowerCase() === email.toLowerCase())) { showError($('#profile-error'), 'emailExists'); return; }
      const next = D.snapshot(); const user = next.users.find(item => item.id === D.currentUser().id);
      if (fullName !== L.text(user.name)) user.name = fullName;
      if (department !== L.text(user.department)) user.department = department;
      user.email = email;
      if (save(next, $('#profile-error'))) { showError($('#profile-error'), null); renderProfileSummary(); renderIdentity(); showToast('profileSaved'); }
    });
    $('#reset-demo').addEventListener('click', () => {
      if (!confirm(t('resetConfirm'))) return;
      try { D.reset(); fillProfile(); renderNavigation(); renderIdentity(); showToast('demoReset'); }
      catch (_) { showToast('storageError'); }
    });
  }
  function initPage() {
    if (page === 'login') {
      $('#login-role').value = D.role;
      $('#login-email').value = D.currentUser().email;
      $('#login-role').addEventListener('change', event => { $('#login-email').value = D.user(D.personas[event.target.value]).email; });
      $('#login-form').addEventListener('submit', event => { event.preventDefault(); D.setRole($('#login-role').value); location.href = url(routes[D.role]); });
    }
    if (page === 'create-ticket') bindCreateTicket();
    if (page === 'manage-users') bindUsers();
    if (page === 'profile') bindProfile();
    renderPage();
  }
  function renderPage() {
    if (page.endsWith('-dashboard')) renderDashboard();
    if (['my-tickets', 'assigned-tickets', 'manage-tickets'].includes(page)) { renderFilters(); renderTicketList(); }
    if (page === 'ticket-details') renderTicketDetails();
    if (page === 'manage-users') renderUsers();
    if (page === 'profile') renderProfileSummary();
  }
  init();
})();
