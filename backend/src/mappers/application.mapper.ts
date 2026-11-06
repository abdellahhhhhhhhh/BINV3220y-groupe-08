import type { Application, ApplicationDbo, ApplicationDto } from "../models/application.ts";

export const toApplication = (dbo: ApplicationDbo): Application => ({
  id: dbo.id,
  offerId: dbo.offer_id,
  studentId: dbo.student_id,
  message: dbo.message,
  status: dbo.status,
  appliedAt: dbo.applied_at,
  ...(dbo.offer_title !== undefined &&
  dbo.company_short_name !== undefined &&
  dbo.academic_year_label !== undefined &&
  dbo.period_code !== undefined
    ? {
        offer: {
          title: dbo.offer_title,
          companyShortName: dbo.company_short_name,
          academicYear: dbo.academic_year_label,
          period: dbo.period_code,
        },
      }
    : {}),
});

export const toApplicationDto = (application: Application): ApplicationDto => application;
