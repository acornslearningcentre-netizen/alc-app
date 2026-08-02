// Orchestrates the Admissions section: the family list (SCRUM-90) and,
// once a family is tapped, their detail page. The detail page itself
// ships in SCRUM-91 — until then this shows a minimal placeholder so
// SCRUM-90 is independently useful (the list works today) without
// promising a screen that doesn't exist yet.
import React, { useState } from 'react';
import { Icon } from '../../../../components/ui';
import { AdmissionsQueue } from './AdmissionsQueue';

export const AdmissionsView: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  if (openId !== null) {
    return (
      <div className="page-fade">
        <div className="topbar">
          <button className="btn ghost" onClick={() => setOpenId(null)}>
            <Icon name="arrow-right" size={12} stroke="var(--ink-3)" style={{ transform: 'rotate(180deg)' }}/> Back to Admissions
          </button>
        </div>
        <div className="card muted" style={{ textAlign: 'center', padding: '32px 0' }}>
          Family detail (SCRUM-91) isn't built yet — this list screen (SCRUM-90) ships first.
        </div>
      </div>
    );
  }

  return <AdmissionsQueue onOpen={setOpenId}/>;
};

export default AdmissionsView;
