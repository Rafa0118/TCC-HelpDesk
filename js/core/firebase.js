/* ============================================
   iHelpy - Firebase data and authentication
   ============================================ */

const FirebaseDB = (() => {
  const config = {
    apiKey: 'AIzaSyBWAYx36FezxNh231UrjhOfT1TfxR-cHY4',
    authDomain: 'helpdesktcc10.firebaseapp.com',
    projectId: 'helpdesktcc10',
    storageBucket: 'helpdesktcc10.firebasestorage.app',
    messagingSenderId: '1009242010672',
    appId: '1:1009242010672:web:8596b39487048a5c7e69f5'
  };
  const app = firebase.apps.find((item) => item.name === '[DEFAULT]') || firebase.initializeApp(config);
  const auth = app.auth();
  const db = app.firestore();
  const storage = app.storage();
  const roles = { professor: 'PROFESSOR', tecnico: 'TECNICO', direcao: 'DIRECAO' };
  const roleLabels = { PROFESSOR: 'professor', TECNICO: 'tecnico', DIRECAO: 'direcao' };
  const statusToDb = { 'Em espera': 'PENDENTE', Aberto: 'PENDENTE', 'Em andamento': 'EM_ATENDIMENTO', 'Concluído': 'CONCLUIDO', Resolvido: 'CONCLUIDO', Cancelado: 'CANCELADO' };
  const statusFromDb = { PENDENTE: 'Em espera', EM_ATENDIMENTO: 'Em andamento', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' };
  const priorityToDb = { Baixa: 'BAIXA', Média: 'MODERADA', Alta: 'ALTA', Urgente: 'ALTA' };
  const priorityFromDb = { BAIXA: 'Baixa', MODERADA: 'Média', ALTA: 'Alta' };
  const sessionKey = 'helpium_logged_user';

  function normalizeRole(value) {
    const normalized = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return roleLabels[normalized] || String(value || '').toLowerCase();
  }

  function profileFromData(uid, data) {
    return {
      uid,
      name: data.nome || data.name || '',
      email: data.email || '',
      role: normalizeRole(data.tipo || data.role)
    };
  }

  function cacheSession(user) {
    localStorage.setItem(sessionKey, JSON.stringify(user));
    return user;
  }

  function dateParts(data) {
    const dateValue = data.dataAbertura;
    const date = dateValue && typeof dateValue.toDate === 'function' ? dateValue.toDate() : null;
    return {
      date: data.date || (date ? date.toLocaleDateString('pt-BR') : ''),
      time: data.time || (date ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')
    };
  }

  function ticketFromDocument(document) {
    const data = document.data();
    const dates = dateParts(data);
    return {
      ...data,
      dbId: document.id,
      id: data.id || '#' + document.id.slice(0, 6).toUpperCase(),
      title: data.title || data.tipoProblema || 'Chamado',
      room: data.room || data.localNome || '',
      requester: data.requester || data.usuarioNome || '',
      date: dates.date,
      time: dates.time,
      type: data.type || data.category || data.tipoProblema || 'Outros',
      priority: priorityFromDb[data.prioridade] || data.priority || 'Média',
      status: statusFromDb[data.status] || data.status || 'Em espera',
      description: data.description || data.descricao || '',
      technicianName: data.technicianName || data.tecnicoNome || '',
      resolvedAt: data.resolvedAt || ''
    };
  }

  function ticketToDocument(ticket, user) {
    return {
      id: ticket.id,
      usuarioId: user.uid,
      usuarioNome: user.name,
      localNome: ticket.room,
      descricao: ticket.description,
      tipoProblema: ticket.type,
      prioridade: priorityToDb[ticket.priority] || 'MODERADA',
      status: statusToDb[ticket.status] || 'PENDENTE',
      tecnicoId: ticket.tecnicoId || null,
      tecnicoNome: ticket.technicianName || null,
      dataAbertura: firebase.firestore.FieldValue.serverTimestamp(),
      dataFechamento: null,
      title: ticket.title,
      type: ticket.type,
      priority: ticket.priority,
      date: ticket.date,
      time: ticket.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      locationDetails: ticket.locationDetails || '',
      photo: ticket.photo || '',
      resolutionCategory: ticket.resolutionCategory || '',
      resolutionSubcategory: ticket.resolutionSubcategory || '',
      resolutionDetails: ticket.resolutionDetails || '',
      resolutionTimeSpent: ticket.resolutionTimeSpent || '',
      resolutionParts: ticket.resolutionParts || '',
      resolutionUserNote: ticket.resolutionUserNote || '',
      resolvedAt: ticket.resolvedAt || ''
    };
  }

  async function saveProfile(uid, profile) {
    await db.collection('usuarios').doc(uid).set({
      nome: profile.name,
      email: profile.email,
      tipo: roles[profile.role] || 'PROFESSOR',
      name: profile.name,
      role: profile.role,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return cacheSession(profile);
  }

  async function login(email, password) {
    const credential = await auth.signInWithEmailAndPassword(email.trim(), password);
    const snapshot = await db.collection('usuarios').doc(credential.user.uid).get();
    if (!snapshot.exists) {
      await auth.signOut();
      throw new Error('A conta não possui perfil cadastrado na coleção usuarios.');
    }
    return cacheSession(profileFromData(credential.user.uid, snapshot.data()));
  }

  async function register(name, email, password) {
    const credential = await auth.createUserWithEmailAndPassword(email.trim(), password);
    try {
      return await saveProfile(credential.user.uid, { uid: credential.user.uid, name: name.trim(), email: email.trim(), role: 'professor' });
    } catch (error) {
      await credential.user.delete().catch(() => {});
      await auth.signOut().catch(() => {});
      throw error;
    }
  }

  async function createManagedUser(name, email, password, role) {
    const secondaryName = 'helpium-user-provisioning';
    const secondaryApp = firebase.apps.find((item) => item.name === secondaryName) || firebase.initializeApp(config, secondaryName);
    const secondaryAuth = secondaryApp.auth();
    let credential;
    try {
      credential = await secondaryAuth.createUserWithEmailAndPassword(email.trim(), password);
      const profile = { uid: credential.user.uid, name: name.trim(), email: email.trim(), role };
      await db.collection('usuarios').doc(profile.uid).set({
        nome: profile.name,
        email: profile.email,
        tipo: roles[role] || 'PROFESSOR',
        name: profile.name,
        role: profile.role,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
      await secondaryAuth.signOut();
      return profile;
    } catch (error) {
      if (credential?.user) await credential.user.delete().catch(() => {});
      await secondaryAuth.signOut().catch(() => {});
      throw error;
    }
  }

  async function listUsers() {
    const snapshot = await db.collection('usuarios').get();
    return snapshot.docs.map((item) => ({ id: item.id, ...profileFromData(item.id, item.data()) }));
  }

  async function listTickets(user) {
    let query = db.collection('chamados');
    if (user.role === 'professor') query = query.where('usuarioId', '==', user.uid);
    const snapshot = await query.get();
    return snapshot.docs.map(ticketFromDocument).sort((a, b) => {
      const first = a.dataAbertura?.toMillis?.() || 0;
      const second = b.dataAbertura?.toMillis?.() || 0;
      return second - first;
    });
  }

  async function createTicket(ticket, user) {
    const reference = db.collection('chamados').doc();
    const id = '#' + reference.id.slice(0, 6).toUpperCase();
    const photo = ticket.photo || '';
    let photoUrl = photo;
    let photoReference;
    if (photo.startsWith('data:image/')) {
      photoReference = storage.ref(`chamados/${user.uid}/${reference.id}/evidencia`);
      await photoReference.putString(photo, 'data_url');
      photoUrl = await photoReference.getDownloadURL();
    }
    try {
      await reference.set(ticketToDocument({ ...ticket, id, photo: photoUrl }, user));
    } catch (error) {
      if (photoReference) await photoReference.delete().catch(() => {});
      throw error;
    }
    return {
      ...ticket,
      id,
      dbId: reference.id,
      requester: user.name,
      priority: ticket.priority || 'Média'
    };
  }

  async function updateTicket(ticket, changes, user) {
    const reference = db.collection('chamados').doc(ticket.dbId);
    const update = { ...changes };
    if (update.status) update.status = statusToDb[update.status] || update.status;
    if (update.priority) update.prioridade = priorityToDb[update.priority] || 'MODERADA';
    if (user.role === 'tecnico') {
      update.technicianName = update.technicianName || user.name;
      update.tecnicoId = user.uid;
      update.tecnicoNome = update.technicianName;
    }
    if (changes.status === 'Concluído') {
      update.dataFechamento = firebase.firestore.FieldValue.serverTimestamp();
    } else if (changes.status) {
      update.dataFechamento = firebase.firestore.FieldValue.delete();
      update.resolvedAt = '';
    }
    delete update.dbId;
    delete update.id;

    const batch = db.batch();
    batch.update(reference, update);
    if (user.role === 'tecnico') {
      const attendance = db.collection('atendimentos').doc();
      batch.set(attendance, {
        chamadoId: ticket.dbId,
        chamadoNumero: ticket.id,
        tecnicoId: user.uid,
        tecnicoNome: user.name,
        observacao: changes.resolutionDetails || (changes.status === 'Em andamento' ? 'Chamado iniciado.' : 'Atualização do chamado.'),
        status: statusToDb[changes.status] || changes.status || ticket.status,
        categoriaResolucao: changes.resolutionCategory || '',
        acaoResolucao: changes.resolutionSubcategory || '',
        tempoAtendimento: changes.resolutionTimeSpent || '',
        pecas: changes.resolutionParts || '',
        observacaoSolicitante: changes.resolutionUserNote || '',
        dataRegistro: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    await batch.commit();
    return true;
  }

  async function listResources() {
    const snapshot = await db.collection('locais').get();
    return snapshot.docs.map((item) => {
      const data = item.data();
      return { id: item.id, name: data.name || data.nome || '', type: data.type || data.tipo || '' };
    });
  }

  async function createResource(resource) {
    const reference = await db.collection('locais').add({
      nome: resource.name,
      name: resource.name,
      tipo: resource.type,
      type: resource.type,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: reference.id, ...resource };
  }

  return { login, register, createManagedUser, listUsers, listTickets, createTicket, updateTicket, listResources, createResource, profileFromData, cacheSession, auth };
})();

window.FirebaseDB = FirebaseDB;