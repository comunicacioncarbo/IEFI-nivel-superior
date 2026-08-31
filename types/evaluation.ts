export type PlanCode = "PEP" | "PEI";

export type SectionCode = "A" | "B" | "C" | "D";

export interface Evaluation {
  id: string;
  plan: PlanCode;
  year: number;
  section: SectionCode;
  time: string | null;
  date: string;
  subject: string;
  teacher: string | null;
  notes: string | null;
}