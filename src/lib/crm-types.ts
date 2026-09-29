export type BoardCard = {
  id: string;
  stage: string;
  owner: string | null;
  qualified: boolean;
  ready: boolean;
  score: number | null;
  lastContactAt: string | null;
  createdAt: string;
  attempts: number;
  archiveReason: string | null;
  applicant: { name: string; phone: string | null; email: string | null; source: string | null };
  position: { title: string; location: string | null } | null;
};
