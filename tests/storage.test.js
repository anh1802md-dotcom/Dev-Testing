import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  loadStorageScript,
  resetStoreData,
} from "./helpers/medcare.js";

describe("MedStore (storage.js)", () => {
  beforeEach(() => {
    localStorage.clear();
    loadStorageScript();
  });

  it("get() seeds demo data when localStorage is empty", () => {
    const data = globalThis.MedStore.get();

    expect(data.users.length).toBeGreaterThanOrEqual(3);
    expect(data.patients.length).toBeGreaterThanOrEqual(8);
    expect(data.prescriptions.length).toBeGreaterThanOrEqual(4);
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it("save() persists data to localStorage", () => {
    const data = globalThis.MedStore.get();
    data.patients.push({
      id: "p_test",
      code: "BN999",
      name: "Test Patient",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    globalThis.MedStore.save(data);

    globalThis.MedStore.invalidate();
    const reloaded = globalThis.MedStore.get();
    expect(reloaded.patients.some((p) => p.id === "p_test")).toBe(true);
  });

  it("uid() returns ids with the given prefix", () => {
    const id = globalThis.MedStore.uid("p");
    expect(id.startsWith("p_")).toBe(true);
    expect(globalThis.MedStore.uid("p")).not.toBe(id);
  });

  it("log() prepends activity and keeps at most 100 entries", () => {
    const data = globalThis.MedStore.get();
    data.activityLog = [];
    globalThis.MedStore.save(data);

    for (let i = 0; i < 105; i++) {
      globalThis.MedStore.log("event " + i);
    }

    const log = globalThis.MedStore.get().activityLog;
    expect(log).toHaveLength(100);
    expect(log[0].text).toBe("event 104");
    expect(log[99].text).toBe("event 5");
  });

  it("reset() clears storage and returns fresh default data", () => {
    const data = globalThis.MedStore.get();
    data.patients = [];
    globalThis.MedStore.save(data);
    expect(globalThis.MedStore.get().patients).toHaveLength(0);

    const fresh = globalThis.MedStore.reset();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(fresh.patients.length).toBeGreaterThan(0);
    expect(globalThis.MedStore.get().patients.length).toBeGreaterThan(0);
  });

  it("get() migrates legacy patients missing status and gender", () => {
    const legacy = {
      users: [{ id: "u1", email: "admin@demo.com", password: "123456", role: "admin" }],
      session: null,
      patients: [
        {
          id: "p_old",
          code: "BNOLD",
          name: "Legacy Patient",
          status: "",
          createdAt: "2020-01-01T00:00:00.000Z",
          updatedAt: "2020-01-01T00:00:00.000Z",
        },
      ],
      medicalRecords: [],
      prescriptions: [],
      reminders: [],
      history: [],
      notifications: [],
      activityLog: [],
      pendingOtp: null,
      lastSync: null,
      _clearedDemoDoctorAssign: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));

    globalThis.MedStore.invalidate();
    const patient = globalThis.MedStore.get().patients[0];
    expect(patient.status).toBe("pending");
    expect(patient.gender).toBe("Nam");
    expect(patient.department).toBe("Đa khoa");
  });
});

describe("MedStore reset helper", () => {
  beforeEach(() => {
    loadStorageScript();
    resetStoreData();
  });

  it("resetStoreData() restores demo dataset for bundle tests", () => {
    expect(globalThis.MedStore.get().patients.some((p) => p.code === "BN001")).toBe(true);
  });
});
