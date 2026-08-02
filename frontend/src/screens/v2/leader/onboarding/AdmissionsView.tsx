// Orchestrates the Admissions section: the family list (SCRUM-90) and,
// once a family is tapped, their full detail page (SCRUM-91).
import React, { useState } from 'react';
import { AdmissionsQueue } from './AdmissionsQueue';
import { ProspectDetail } from './ProspectDetail';

export const AdmissionsView: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  if (openId !== null) {
    return <ProspectDetail id={openId} onBack={() => setOpenId(null)}/>;
  }

  return <AdmissionsQueue onOpen={setOpenId}/>;
};

export default AdmissionsView;
