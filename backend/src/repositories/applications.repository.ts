import type { Db } from "../db/database.ts";
import type { ApplicationDbo } from "../models/application.ts";
import type { OfferStatus } from "../models/offer.ts";

interface OfferStatusRow {
  status: OfferStatus;
}

interface ApplicationKeyParams {
  offerId: number;
  studentId: number;
}

interface InsertApplicationParams {
  offerId: number;
  studentId: number;
  message: string | null;
}

interface StudentApplicationsParams {
  studentId: number;
}

interface ApplicationOwnershipParams {
  id: number;
  studentId: number;
}

interface WithdrawApplicationParams {
  id: number;
  studentId: number;
}

export const createApplicationsRepository = (db: Db) => {
  const findOfferStatus = db.prepare<{ id: number }, OfferStatusRow>(
    "SELECT status FROM offers WHERE id = @id",
  );
  const findActive = db.prepare<ApplicationKeyParams, ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE offer_id = @offerId
      AND student_id = @studentId
      AND status IN ('IN_PROGRESS', 'SELECTED')
  `);
  const insert = db.prepare<InsertApplicationParams, ApplicationDbo>(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offerId, @studentId, @message)
    ON CONFLICT DO NOTHING
    RETURNING id, offer_id, student_id, message, status, applied_at
  `);
  const findByStudent = db.prepare<StudentApplicationsParams, ApplicationDbo>(`
    SELECT a.id, a.offer_id, a.student_id, a.message, a.status, a.applied_at,
           o.title AS offer_title, c.short_name AS company_short_name,
           ay.label AS academic_year_label, p.code AS period_code
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE a.student_id = @studentId
    ORDER BY a.applied_at DESC, a.id DESC
  `);
  const findOwned = db.prepare<ApplicationOwnershipParams, ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE id = @id AND student_id = @studentId
  `);
  const withdraw = db.prepare<WithdrawApplicationParams>(`
    UPDATE applications
    SET status = 'WITHDRAWN'
    WHERE id = @id AND student_id = @studentId AND status = 'IN_PROGRESS'
  `);

  return {
    findOfferStatus: (offerId: number): OfferStatusRow | undefined =>
      findOfferStatus.get({ id: offerId }),
    findActive: (offerId: number, studentId: number): ApplicationDbo | undefined =>
      findActive.get({ offerId, studentId }),
    insert: (offerId: number, studentId: number, message: string | null): ApplicationDbo | undefined =>
      insert.get({ offerId, studentId, message }),
    findByStudent: (studentId: number): ApplicationDbo[] => findByStudent.all({ studentId }),
    findOwned: (id: number, studentId: number): ApplicationDbo | undefined =>
      findOwned.get({ id, studentId }),
    withdraw: (id: number, studentId: number): boolean =>
      withdraw.run({ id, studentId }).changes === 1,
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
