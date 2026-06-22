/**
 * MedCare — đồng bộ localStorage ↔ SQL Server (qua API)
 */
const MedSync = (function () {
  function useApi() {
    try {
      const d = MedStore.get();
      if (!d.session?.token || d.session?.source !== "api") return false;
      if (typeof MedCare !== "undefined" && MedCare.isUser && MedCare.isUser()) return false;
      return true;
    } catch (_) {
      return false;
    }
  }

  function normDate(v) {
    if (!v) return null;
    if (typeof v === "string") return v.slice(0, 10);
    try {
      return new Date(v).toISOString().slice(0, 10);
    } catch (_) {
      return null;
    }
  }

  function normTs(v) {
    if (!v) return null;
    return typeof v === "string" ? v : new Date(v).toISOString();
  }

  function mapPatient(p) {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      phone: p.phone || "",
      birth: normDate(p.birth),
      gender: p.gender || "Nam",
      department: p.department || "Đa khoa",
      status: p.status || "pending",
      statusConfirmedBy: p.statusConfirmedBy || null,
      statusConfirmedAt: normTs(p.statusConfirmedAt),
      doctorId: p.doctorId || null,
      userId: p.userId || null,
      lastVisit: normDate(p.lastVisit),
      note: p.note || "",
      avatar: p.avatar || null,
      createdAt: normTs(p.createdAt) || new Date().toISOString(),
      updatedAt: normTs(p.updatedAt) || new Date().toISOString(),
    };
  }

  function mapRx(r) {
    return {
      id: r.id,
      patientId: r.patientId,
      name: r.name,
      dosage: r.dosage || "",
      frequency: r.frequency || "",
      intakeTime: r.intakeTime || "",
      times: Array.isArray(r.times) ? r.times : [],
      status: r.status || "pending",
      statusConfirmedBy: r.statusConfirmedBy || null,
      statusConfirmedAt: normTs(r.statusConfirmedAt),
      startDate: normDate(r.startDate),
      endDate: normDate(r.endDate),
      note: r.note || "",
      runningOut: !!r.runningOut,
      createdAt: normTs(r.createdAt) || new Date().toISOString(),
    };
  }

  function mapRecord(r) {
    return {
      id: r.id,
      patientId: r.patientId,
      title: r.title,
      diagnosis: r.diagnosis || "",
      doctor: r.doctor || "",
      visitDate: normDate(r.visitDate),
      symptoms: r.symptoms || "",
      treatment: r.treatment || "",
      vitals: r.vitals || "",
      note: r.note || "",
      createdAt: normTs(r.createdAt) || new Date().toISOString(),
    };
  }

  function mapHistory(h) {
    return {
      id: h.id,
      rxId: h.rxId,
      patientId: h.patientId,
      medName: h.medName,
      status: h.status || "taken",
      confirmed: h.confirmed !== false,
      confirmedBy: h.confirmedBy || "",
      confirmedAt: normTs(h.confirmedAt),
      at: normTs(h.at) || new Date().toISOString(),
    };
  }

  function mapReminder(rem) {
    return {
      id: rem.id,
      rxId: rem.rxId,
      patientId: rem.patientId,
      time: rem.time,
      days: Array.isArray(rem.days) ? rem.days : [0, 1, 2, 3, 4, 5, 6],
      active: rem.active !== false,
    };
  }

  function mapNotif(n) {
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type || "info",
      icon: n.icon || "info",
      read: !!n.read,
      at: normTs(n.at) || new Date().toISOString(),
    };
  }

  function rewirePatientId(d, oldId, newId) {
    if (!oldId || oldId === newId) return;
    (d.prescriptions || []).forEach((r) => {
      if (r.patientId === oldId) r.patientId = newId;
    });
    (d.medicalRecords || []).forEach((r) => {
      if (r.patientId === oldId) r.patientId = newId;
    });
    (d.reminders || []).forEach((r) => {
      if (r.patientId === oldId) r.patientId = newId;
    });
    (d.history || []).forEach((h) => {
      if (h.patientId === oldId) h.patientId = newId;
    });
    if (MedCare.state.selectedPatientId === oldId) MedCare.state.selectedPatientId = newId;
  }

  async function pullAll() {
    if (!useApi()) return false;
    const res = await MedApi.syncAll();
    const d = MedStore.get();
    d.patients = (res.patients || []).map(mapPatient);
    d.prescriptions = (res.prescriptions || []).map(mapRx);
    d.medicalRecords = (res.medicalRecords || []).map(mapRecord);
    d.history = (res.history || []).map(mapHistory);
    d.reminders = (res.reminders || []).map(mapReminder);
    d.notifications = (res.notifications || []).map(mapNotif);
    d.lastSync = res.syncedAt || new Date().toISOString();
    MedStore.save(d);
    return true;
  }

  async function savePatient(patient, isNew) {
    if (!useApi() || !patient) return patient;
    const body = {
      code: patient.code,
      name: patient.name,
      phone: patient.phone,
      birth: patient.birth,
      gender: patient.gender,
      department: patient.department,
      status: patient.status,
      lastVisit: patient.lastVisit,
      note: patient.note,
      statusConfirmedBy: patient.statusConfirmedBy,
      doctorId: patient.doctorId ?? null,
    };
    if (isNew) {
      const res = await MedApi.createPatient(body);
      const oldId = patient.id;
      Object.assign(patient, mapPatient(res.data));
      rewirePatientId(MedStore.get(), oldId, patient.id);
      MedStore.save(MedStore.get());
    } else {
      await MedApi.updatePatient(patient.id, body);
    }
    return patient;
  }

  async function deletePatient(id) {
    if (!useApi() || !id) return;
    await MedApi.deletePatient(id);
  }

  async function patchPatient(id, patch) {
    if (!useApi() || !id) return;
    await MedApi.updatePatient(id, patch);
  }

  async function savePrescription(rx, isNew) {
    if (!useApi() || !rx) return rx;
    const body = {
      patientId: rx.patientId,
      name: rx.name,
      dosage: rx.dosage,
      frequency: rx.frequency,
      intakeTime: rx.intakeTime,
      times: rx.times || [],
      status: rx.status,
      startDate: rx.startDate,
      endDate: rx.endDate,
      note: rx.note,
      runningOut: rx.runningOut,
    };
    if (isNew) {
      const res = await MedApi.createPrescription(body);
      const oldId = rx.id;
      Object.assign(rx, mapRx(res.data));
      const d = MedStore.get();
      (d.reminders || []).forEach((rem) => {
        if (rem.rxId === oldId) rem.rxId = rx.id;
      });
      (d.history || []).forEach((h) => {
        if (h.rxId === oldId) h.rxId = rx.id;
      });
      MedStore.save(d);
    } else {
      await MedApi.updatePrescription(rx.id, body);
    }
    await syncReminders(rx);
    return rx;
  }

  async function deletePrescription(id) {
    if (!useApi() || !id) return;
    await MedApi.deletePrescription(id);
  }

  async function syncReminders(rx) {
    if (!useApi() || !rx?.id) return;
    const active = rx.status === "active" && !!rx.statusConfirmedBy;
    const times = active ? (rx.times || []) : [];
    const res = await MedApi.syncReminders(rx.id, { times, active });
    const d = MedStore.get();
    d.reminders = (d.reminders || []).filter((rem) => rem.rxId !== rx.id);
    (res.data || []).forEach((rem) => d.reminders.push(mapReminder(rem)));
    MedStore.save(d);
  }

  async function saveMedicalRecord(record, isNew) {
    if (!useApi() || !record) return record;
    const body = {
      patientId: record.patientId,
      title: record.title,
      diagnosis: record.diagnosis,
      doctor: record.doctor,
      visitDate: record.visitDate,
      symptoms: record.symptoms,
      treatment: record.treatment,
      vitals: record.vitals,
      note: record.note,
    };
    if (isNew) {
      const res = await MedApi.createMedicalRecord(body);
      Object.assign(record, mapRecord(res.data));
      MedStore.save(MedStore.get());
    } else {
      await MedApi.updateMedicalRecord(record.id, body);
    }
    return record;
  }

  async function deleteMedicalRecord(id) {
    if (!useApi() || !id) return;
    await MedApi.deleteMedicalRecord(id);
  }

  async function addHistory(entry) {
    if (!useApi() || !entry) return entry;
    const res = await MedApi.addHistory({
      id: entry.id,
      rxId: entry.rxId,
      patientId: entry.patientId,
      medName: entry.medName,
      status: entry.status,
      confirmed: entry.confirmed,
      confirmedBy: entry.confirmedBy,
      confirmedAt: entry.confirmedAt,
      at: entry.at,
    });
    Object.assign(entry, mapHistory(res.data));
    MedStore.save(MedStore.get());
    return entry;
  }

  async function pushNotification(n) {
    if (!useApi() || !n) return;
    const res = await MedApi.createNotification({
      title: n.title,
      message: n.message,
      type: n.type,
      icon: n.icon,
    });
    Object.assign(n, mapNotif(res.data));
    MedStore.save(MedStore.get());
  }

  async function markNotifRead(id) {
    if (!useApi() || !id) return;
    await MedApi.markNotifRead(id);
  }

  async function deleteNotification(id) {
    if (!useApi() || !id) return;
    await MedApi.deleteNotification(id);
  }

  async function run(fn) {
    if (!useApi()) return;
    try {
      await fn();
    } catch (err) {
      console.warn("[MedSync]", err.message);
      if (typeof MedCare !== "undefined" && MedCare.toast) {
        MedCare.toast(err.message || "Lỗi đồng bộ API", "warn");
      }
    }
  }

  return {
    useApi,
    pullAll,
    savePatient,
    deletePatient,
    patchPatient,
    savePrescription,
    deletePrescription,
    syncReminders,
    saveMedicalRecord,
    deleteMedicalRecord,
    addHistory,
    pushNotification,
    markNotifRead,
    deleteNotification,
    run,
  };
})();
