-- Un étudiant ne peut avoir qu'une candidature active ou retenue pour une offre.
-- Les candidatures retirées ou non retenues restent conservées et permettent une
-- nouvelle candidature.
CREATE UNIQUE INDEX applications_active_student_offer
  ON applications (student_id, offer_id)
  WHERE status IN ('IN_PROGRESS', 'SELECTED');
