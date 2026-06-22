import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  initBundleForTests,
  loginAs,
  makeForm,
  resetStoreData,
} from "./helpers/medcare.js";

describe("bundle.js business logic", () => {
  beforeAll(() => {
    initBundleForTests();
  });

  beforeEach(() => {
    resetStoreData();
    loginAs("u1");
  });

  describe("M.Rx.syncReminders", () => {
    it("creates reminders for active confirmed prescriptions", () => {
      const rx = {
        id: "rx_test",
        patientId: "p1",
        name: "Vitamin C",
        status: "active",
        statusConfirmedBy: "Admin Hệ thống",
        times: ["08:00", "20:00"],
      };

      globalThis.MedCare.Rx.syncReminders(rx);

      const reminders = globalThis.MedStore.get().reminders.filter((r) => r.rxId === "rx_test");
      expect(reminders).toHaveLength(2);
      expect(reminders.map((r) => r.time).sort()).toEqual(["08:00", "20:00"]);
      expect(reminders.every((r) => r.active)).toBe(true);
    });

    it("does not create reminders for pending prescriptions", () => {
      const rx = {
        id: "rx_pending",
        patientId: "p1",
        name: "Pending Med",
        status: "pending",
        statusConfirmedBy: null,
        times: ["09:00"],
      };

      globalThis.MedCare.Rx.syncReminders(rx);

      expect(globalThis.MedStore.get().reminders.some((r) => r.rxId === "rx_pending")).toBe(false);
    });

    it("replaces existing reminders when times change", () => {
      const d = globalThis.MedStore.get();
      d.reminders.push({
        id: "rem_old",
        rxId: "rx1",
        patientId: "p1",
        time: "07:00",
        days: [0, 1, 2, 3, 4, 5, 6],
        active: true,
      });
      globalThis.MedStore.save(d);

      const rx = globalThis.MedCare.rxById("rx1");
      rx.times = ["10:00", "22:00"];
      globalThis.MedCare.Rx.syncReminders(rx);

      const reminders = globalThis.MedStore.get().reminders.filter((r) => r.rxId === "rx1");
      expect(reminders).toHaveLength(2);
      expect(reminders.map((r) => r.time).sort()).toEqual(["10:00", "22:00"]);
      expect(reminders.some((r) => r.id === "rem_old")).toBe(false);
    });
  });

  describe("M.Patients.save", () => {
    it("creates a new patient from form data", () => {
      const before = globalThis.MedStore.get().patients.length;
      const form = makeForm({
        code: "BN100",
        name: "Nguyễn Test",
        phone: "0912345678",
        birth: "1990-01-15",
        gender: "Nam",
        department: "Tim mạch",
        status: "pending",
        lastVisit: "2026-06-01",
        note: "Unit test",
      });

      globalThis.MedCare.Patients.save(form, null);

      const patients = globalThis.MedStore.get().patients;
      expect(patients).toHaveLength(before + 1);
      const created = patients.find((p) => p.code === "BN100");
      expect(created).toMatchObject({
        name: "Nguyễn Test",
        phone: "0912345678",
        gender: "Nam",
        department: "Tim mạch",
        status: "pending",
      });
      expect(created.statusConfirmedBy).toBeNull();
    });

    it("updates an existing patient", () => {
      const form = makeForm({
        code: "BN001",
        name: "Nguyễn Văn A (updated)",
        phone: "0901111111",
        birth: "1981-05-10",
        gender: "Nam",
        department: "Tim mạch",
        status: "stable",
        lastVisit: "2026-06-10",
        note: "Updated via test",
      });

      globalThis.MedCare.Patients.save(form, "p1");

      const patient = globalThis.MedCare.patientById("p1");
      expect(patient.name).toBe("Nguyễn Văn A (updated)");
      expect(patient.status).toBe("stable");
      expect(patient.statusConfirmedBy).toBe("Admin Hệ thống");
      expect(patient.statusConfirmedAt).toBeTruthy();
    });
  });

  describe("M.Rx.save", () => {
    it("creates a prescription and parses reminder times", () => {
      const before = globalThis.MedStore.get().prescriptions.length;
      const form = makeForm({
        patientId: "p1",
        name: "Paracetamol",
        dosage: "500mg",
        frequency: "2 lần/ngày",
        times: "08:00, 20:00",
        intakeTime: "Sau ăn",
        status: "active",
        startDate: "2026-06-01",
        endDate: "2026-07-01",
        note: "Test rx",
      });

      globalThis.MedCare.Rx.save(form, null);

      const rxList = globalThis.MedStore.get().prescriptions;
      expect(rxList).toHaveLength(before + 1);
      const rx = rxList.find((r) => r.name === "Paracetamol");
      expect(rx.times).toEqual(["08:00", "20:00"]);
      expect(rx.statusConfirmedBy).toBe("Admin Hệ thống");

      const reminders = globalThis.MedStore.get().reminders.filter((r) => r.rxId === rx.id);
      expect(reminders).toHaveLength(2);
    });
  });

  describe("M.History.add", () => {
    it("records medication history as taken", () => {
      globalThis.MedCare.History.add("rx1", "taken");

      const history = globalThis.MedStore.get().history;
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toMatchObject({
        rxId: "rx1",
        patientId: "p1",
        medName: "Aspirin",
        status: "taken",
        confirmed: true,
        confirmedBy: "Admin Hệ thống",
      });
    });

    it("replaces same-day history for the same prescription", () => {
      globalThis.MedCare.History.add("rx1", "taken");
      const firstId = globalThis.MedStore.get().history[0].id;

      globalThis.MedCare.History.add("rx1", "skipped");

      const history = globalThis.MedStore.get().history.filter(
        (h) => h.rxId === "rx1" && h.at.startsWith(globalThis.MedCare.todayKey())
      );
      expect(history).toHaveLength(1);
      expect(history[0].status).toBe("skipped");
      expect(history[0].id).not.toBe(firstId);
    });
  });

  describe("M.Patients.delete (COD1-76)", () => {
    it("COD1-76 — admin xóa bệnh nhân và dữ liệu liên quan", async () => {
      expect(globalThis.MedStore.get().prescriptions.some((r) => r.patientId === "p4")).toBe(true);

      await globalThis.MedCare.Patients.delete("p4");

      const d = globalThis.MedStore.get();
      expect(d.patients.find((p) => p.id === "p4")).toBeUndefined();
      expect(d.prescriptions.some((r) => r.patientId === "p4")).toBe(false);
      expect(d.reminders.some((r) => r.patientId === "p4")).toBe(false);
    });

    it("COD1-76 — bác sĩ không xóa được BN còn liệu trình active", async () => {
      loginAs("u2");
      const before = globalThis.MedStore.get().patients.length;

      await globalThis.MedCare.Patients.delete("p1");

      expect(globalThis.MedStore.get().patients).toHaveLength(before);
      expect(globalThis.MedCare.patientById("p1")).toBeTruthy();
    });
  });

  describe("M.History (COD1-80, COD1-81)", () => {
    it("COD1-80 — lưu lịch sử dùng thuốc vào store và nhật ký", () => {
      globalThis.MedCare.History.add("rx1", "taken");

      const d = globalThis.MedStore.get();
      expect(d.history[0]).toMatchObject({
        rxId: "rx1",
        medName: "Aspirin",
        status: "taken",
        confirmed: true,
      });
      expect(d.activityLog.some((l) => l.text.includes("Aspirin"))).toBe(true);
    });

    it("COD1-81 — renderHistory hiển thị các mục lịch sử", () => {
      globalThis.MedCare.History.add("rx1", "taken");
      globalThis.MedCare.History.add("rx2", "skipped");
      document.getElementById("search-history").value = "";

      globalThis.MedCare.History.render();

      const html = document.getElementById("history-list").innerHTML;
      expect(html).toContain("Aspirin");
      expect(html).toContain("Metformin");
    });

    it("COD1-81 — renderHistory lọc theo tên thuốc", () => {
      globalThis.MedCare.History.add("rx1", "taken");
      globalThis.MedCare.History.add("rx2", "skipped");
      document.getElementById("search-history").value = "metformin";

      globalThis.MedCare.History.render();

      const html = document.getElementById("history-list").innerHTML;
      expect(html).toContain("Metformin");
      expect(html).not.toContain("Aspirin");
    });
  });

  describe("M.Rx.render filter (COD1-83)", () => {
    it("COD1-83 — lọc toa thuốc theo tên thuốc", () => {
      document.getElementById("search-rx").value = "aspirin";

      globalThis.MedCare.Rx.render();

      const html = document.getElementById("rx-list").innerHTML;
      expect(html).toContain("Aspirin");
      expect(html).not.toContain("Metformin");
    });

    it("COD1-83 — lọc toa thuốc theo tên bệnh nhân", () => {
      document.getElementById("search-rx").value = "trần thị b";

      globalThis.MedCare.Rx.render();

      const html = document.getElementById("rx-list").innerHTML;
      expect(html).toContain("Metformin");
      expect(html).not.toContain("Aspirin");
    });
  });

  describe("M.Notifications.push (COD1-87)", () => {
    it("COD1-87 — gửi push notification trong app", () => {
      const before = globalThis.MedStore.get().notifications.length;

      globalThis.MedCare.Notifications.push("Test nhắc uống thuốc", "reminder");

      const notifs = globalThis.MedStore.get().notifications;
      expect(notifs).toHaveLength(before + 1);
      expect(notifs[0]).toMatchObject({
        message: "Test nhắc uống thuốc",
        type: "reminder",
        read: false,
      });
    });
  });

  describe("MedCare permissions", () => {
    it("allows admin to manage any patient", () => {
      loginAs("u1");
      const patient = globalThis.MedCare.patientById("p1");
      expect(globalThis.MedCare.canManagePatient(patient)).toBe(true);
    });

    it("blocks doctor from managing another doctor's patient", () => {
      const d = globalThis.MedStore.get();
      d.patients.find((p) => p.id === "p1").doctorId = "u2";
      d.patients.find((p) => p.id === "p1").doctorName = "BS. Nguyễn Minh";
      globalThis.MedStore.save(d);

      loginAs("u3");
      const patient = globalThis.MedCare.patientById("p1");
      expect(globalThis.MedCare.canManagePatient(patient)).toBe(false);
      expect(globalThis.MedCare.getPatientManageBlock(patient)?.doctorName).toContain("Nguyễn Minh");
    });

    it("claimPatient assigns unassigned patient to current doctor", () => {
      loginAs("u2");
      const patient = globalThis.MedCare.patientById("p4");
      expect(patient.doctorId).toBeUndefined();

      const result = globalThis.MedCare.claimPatient(patient);
      expect(result).toEqual({ ok: true, claimed: true });
      expect(globalThis.MedCare.patientById("p4").doctorId).toBe("u2");
    });
  });
});
