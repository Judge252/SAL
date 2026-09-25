import { doctors } from "./data";
import type { Appointment, Doctor } from "./types";

// Replace this adapter with authenticated API calls when the backend is ready.
export interface ClinicService {
  listDoctors(): Promise<Doctor[]>;
  createAppointment(
    input: Omit<Appointment, "id" | "status">,
  ): Promise<Appointment>;
}
export const clinicService: ClinicService = {
  async listDoctors() {
    return doctors;
  },
  async createAppointment(input) {
    return { ...input, id: crypto.randomUUID(), status: "upcoming" };
  },
};
