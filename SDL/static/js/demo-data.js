/* Browser-local fixtures only. Replace this small data layer with Django-rendered
   context later. No authentication, network requests, API, or database. */
(() => {
  const STORAGE_KEY = 'sdl-demo-v1';
  const statuses = ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const personas = { beneficiary: 'u1', technical: 'u2', admin: 'u3' };
  const users = [
    { id: 'u1', name: { en: 'Amina Saleh', ar: 'أمينة صالح' }, email: 'amina.saleh@example.com', role: 'beneficiary', department: { en: 'Operations', ar: 'العمليات' }, active: true },
    { id: 'u2', name: { en: 'Omar Hassan', ar: 'عمر حسن' }, email: 'omar.hassan@example.com', role: 'technical', department: { en: 'IT Support', ar: 'الدعم الفني' }, active: true },
    { id: 'u3', name: { en: 'Layla Ahmed', ar: 'ليلى أحمد' }, email: 'layla.ahmed@example.com', role: 'admin', department: { en: 'IT Management', ar: 'إدارة تقنية المعلومات' }, active: true },
    { id: 'u4', name: { en: 'Yousef Ali', ar: 'يوسف علي' }, email: 'yousef.ali@example.com', role: 'technical', department: { en: 'IT Support', ar: 'الدعم الفني' }, active: true },
    { id: 'u5', name: { en: 'Sara Khalid', ar: 'سارة خالد' }, email: 'sara.khalid@example.com', role: 'beneficiary', department: { en: 'Finance', ar: 'المالية' }, active: true },
    { id: 'u6', name: { en: 'Khalid Nasser', ar: 'خالد ناصر' }, email: 'khalid.nasser@example.com', role: 'beneficiary', department: { en: 'Human Resources', ar: 'الموارد البشرية' }, active: true },
    { id: 'u7', name: { en: 'Noura Saeed', ar: 'نورة سعيد' }, email: 'noura.saeed@example.com', role: 'technical', department: { en: 'Infrastructure', ar: 'البنية التحتية' }, active: false },
    { id: 'u8', name: { en: 'Faisal Omar', ar: 'فيصل عمر' }, email: 'faisal.omar@example.com', role: 'beneficiary', department: { en: 'Marketing', ar: 'التسويق' }, active: true }
  ];
  const fixtures = [
    [1048, 'Unable to connect to office Wi-Fi', 'تعذر الاتصال بشبكة المكتب اللاسلكية', 'My laptop disconnects from Acme-Office every few minutes. This started this morning on the second floor. Restarting the laptop and forgetting the network did not help.', 'ينقطع اتصال حاسوبي بشبكة المكتب كل بضع دقائق. بدأت المشكلة صباح اليوم في الطابق الثاني. جرّبت إعادة التشغيل وإزالة الشبكة دون نجاح.', 'New', 'u1', null, '2026-09-14T08:20:00'],
    [1047, 'Outlook not syncing new emails', 'لا تتم مزامنة الرسائل الجديدة في أوتلوك', 'Outlook desktop has not received new messages since yesterday afternoon. Webmail works normally. I have restarted Outlook and checked that offline mode is disabled.', 'لم يستقبل أوتلوك رسائل جديدة منذ عصر الأمس. يعمل البريد عبر المتصفح بشكل طبيعي. أعدت تشغيل التطبيق وتأكدت من تعطيل وضع عدم الاتصال.', 'In Progress', 'u1', 'u2', '2026-09-13T09:15:00'],
    [1046, 'Printer unavailable on third floor', 'طابعة الطابق الثالث غير متاحة', 'The shared printer in the third-floor meeting area shows as offline for everyone in our team. Its screen is on, but documents remain in the print queue.', 'تظهر الطابعة المشتركة في منطقة الاجتماعات بالطابق الثالث غير متصلة لدى جميع أفراد الفريق. الشاشة تعمل لكن المستندات تبقى في قائمة الانتظار.', 'Assigned', 'u1', 'u4', '2026-09-12T10:40:00'],
    [1045, 'Access to the shared project folder', 'الوصول إلى مجلد المشروع المشترك', 'I need access to the Q3 Operations folder to upload this week’s reports. The folder currently shows an access denied message when opened from File Explorer.', 'أحتاج إلى الوصول إلى مجلد عمليات الربع الثالث لرفع تقارير هذا الأسبوع. تظهر رسالة رفض الوصول عند فتح المجلد من مستكشف الملفات.', 'Resolved', 'u1', 'u2', '2026-09-11T08:30:00'],
    [1044, 'External monitor keeps flickering', 'الشاشة الخارجية تومض باستمرار', 'The monitor connected to my docking station flickers when I join a video call. I tested another HDMI cable, but the same issue occurred.', 'تومض الشاشة المتصلة بمحطة الإرساء عند الانضمام إلى مكالمة فيديو. جرّبت كابل HDMI آخر لكن المشكلة استمرت.', 'Closed', 'u1', 'u4', '2026-09-10T11:00:00'],
    [1043, 'VPN connection fails from home', 'فشل الاتصال بالشبكة الافتراضية من المنزل', 'The VPN client reports a connection timeout from my home network. My internet connection is stable, and I can access other websites without any issues.', 'يعرض عميل الشبكة الافتراضية رسالة انتهاء مهلة الاتصال من شبكة المنزل. اتصال الإنترنت مستقر ويمكنني الوصول إلى المواقع الأخرى.', 'In Progress', 'u5', 'u2', '2026-09-10T07:45:00'],
    [1042, 'New employee laptop setup', 'إعداد حاسوب موظف جديد', 'Please prepare a laptop for our new HR coordinator starting next week. We need office applications, access to the HR shared folder, and a company email account.', 'يرجى تجهيز حاسوب لمنسق الموارد البشرية الجديد الذي يبدأ الأسبوع القادم. نحتاج تطبيقات المكتب والوصول للمجلد المشترك وحساب بريد مؤسسي.', 'Assigned', 'u6', 'u2', '2026-09-09T13:00:00'],
    [1041, 'Video meeting microphone not detected', 'لا يتم التعرف على ميكروفون الاجتماعات', 'The meeting app cannot detect my USB headset microphone. Audio playback works. I checked the privacy settings and selected the headset in the app.', 'لا يتعرف تطبيق الاجتماعات على ميكروفون سماعتي. يعمل إخراج الصوت. راجعت إعدادات الخصوصية واخترت السماعة في التطبيق.', 'Resolved', 'u8', 'u4', '2026-09-08T10:10:00'],
    [1040, 'Software installation request', 'طلب تثبيت برنامج', 'Please install the approved diagramming tool on my workstation for the upcoming process review. My device name is OPS-LT-024.', 'يرجى تثبيت أداة رسم المخططات المعتمدة على جهازي لمراجعة الإجراءات القادمة. اسم الجهاز OPS-LT-024.', 'Closed', 'u1', 'u2', '2026-09-07T08:00:00'],
    [1039, 'Finance application login error', 'خطأ الدخول إلى التطبيق المالي', 'The finance portal displays an unexpected error after I enter my credentials. Other colleagues can sign in. Clearing browser cache has not resolved the issue.', 'تعرض البوابة المالية خطأ غير متوقع بعد إدخال بياناتي. يمكن للزملاء الدخول. لم يؤد مسح ذاكرة المتصفح إلى حل المشكلة.', 'New', 'u5', null, '2026-09-06T12:20:00'],
    [1038, 'Keyboard replacement request', 'طلب استبدال لوحة المفاتيح', 'Several keys on my keyboard are no longer responding consistently. I tested it on another computer and the issue remains.', 'بعض مفاتيح لوحة المفاتيح لا تستجيب باستمرار. اختبرتها على حاسوب آخر واستمرت المشكلة.', 'Resolved', 'u1', 'u2', '2026-09-05T09:30:00'],
    [1037, 'Meeting room display has no signal', 'شاشة غرفة الاجتماعات لا تستقبل إشارة', 'The display in meeting room B shows no signal when connected to the conference laptop. The power indicator is on and the correct input is selected.', 'تعرض شاشة غرفة الاجتماعات ب رسالة عدم وجود إشارة عند توصيل حاسوب الاجتماعات. مؤشر الطاقة يعمل وتم اختيار المدخل الصحيح.', 'Assigned', 'u6', 'u4', '2026-09-04T14:00:00']
  ];
  function seed() {
    return { version: 1, users: structuredClone(users), tickets: fixtures.map(([id, en, ar, descEn, descAr, status, requester, technician, created]) => {
      const history = [{ type: 'created', actor: requester, date: created }];
      const after = hours => new Date(new Date(created).getTime() + hours * 3600000).toISOString();
      if (technician) history.push({ type: 'assigned', actor: 'u3', technician, date: after(1) });
      if (['In Progress', 'Resolved', 'Closed'].includes(status)) history.push({ type: 'status', actor: technician, status: 'In Progress', date: after(3) });
      let resolution = '';
      if (['Resolved', 'Closed'].includes(status)) {
        resolution = { en: id === 1045 ? 'Updated the project folder permissions and verified access with the requester. Reports can now be uploaded normally.' : 'Completed the requested changes and verified normal operation with the requester. No further technical work is needed.', ar: id === 1045 ? 'تم تحديث صلاحيات مجلد المشروع والتحقق من الوصول مع مقدّم الطلب. يمكن الآن رفع التقارير بشكل طبيعي.' : 'تم تنفيذ التغييرات المطلوبة والتحقق من العمل الطبيعي مع مقدّم الطلب. لا حاجة لعمل تقني إضافي.' };
        history.push({ type: 'status', actor: technician, status: 'Resolved', note: resolution, date: after(6) });
      }
      if (status === 'Closed') history.push({ type: 'status', actor: 'u3', status: 'Closed', date: after(24) });
      return { id, title: { en, ar }, description: { en: descEn, ar: descAr }, status, requester, technician, created, updated: history.at(-1).date, resolution, attachment: null, history };
    }) };
  }
  function valid(value) {
    return value?.version === 1 && Array.isArray(value.users) && Array.isArray(value.tickets) &&
      Object.values(personas).every(id => value.users.some(user => user.id === id)) &&
      value.users.every(user => typeof user.id === 'string' && typeof user.email === 'string' && Object.keys(personas).includes(user.role) && typeof user.active === 'boolean') &&
      value.tickets.every(ticket => Number.isInteger(ticket.id) && statuses.includes(ticket.status) && Array.isArray(ticket.history) && Number.isFinite(Date.parse(ticket.created)) && Number.isFinite(Date.parse(ticket.updated)));
  }
  let state = seed();
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (valid(saved)) state = saved; } catch (_) { /* Missing or invalid data uses fixtures. */ }
  let role = 'beneficiary';
  try { const saved = sessionStorage.getItem('sdl-role'); if (saved in personas) role = saved; } catch (_) { /* Default persona. */ }
  window.ServiceDeskData = {
    statuses, personas,
    get state() { return state; },
    get role() { return role; },
    setRole(value) { if (!(value in personas)) return; role = value; try { sessionStorage.setItem('sdl-role', value); } catch (_) { /* Role pages still work. */ } },
    user(id) { return state.users.find(user => user.id === id); },
    currentUser() { return this.user(personas[role]); },
    visibleTickets() {
      return state.tickets.filter(ticket => role === 'admin' || (role === 'technical' ? ticket.technician === personas.technical : ticket.requester === personas.beneficiary));
    },
    /* Persist first, then publish. A failed write does not pretend data was saved. */
    save(next) { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); state = next; },
    reset() { const next = seed(); this.save(next); },
    snapshot() { return structuredClone(state); }
  };
})();
