import type { Evaluation, PlanCode } from "./evaluation";

export interface Plan {
  code: PlanCode;
  name: string;
  evaluations: Evaluation[];
}