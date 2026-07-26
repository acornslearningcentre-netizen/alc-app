import React from 'react';
import { Icon } from '../../../components/ui';
import { ALC_DATA } from '../../../data/seed';
import type { PlanStatus } from '../../../data/types';
import '../../../styles/v2/teacher-planning.css';

interface Props {
  onChild: (id: string) => void;
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  accepted: 'Accepted',
  edited: 'Edited',
  pending: 'Pending review',
};

const STATUS_CHIP: Record<PlanStatus, string> = {
  accepted: 'moss-soft',
  edited: 'solid',
  pending: 'tangerine-soft',
};

const STATUS_ICON: Record<PlanStatus, React.ComponentProps<typeof Icon>['name']> = {
  accepted: 'check',
  edited: 'sparkle',
  pending: 'clock',
};

function statusCounts(students: { status: PlanStatus }[]) {
  return students.reduce(
    (acc, s) => { acc[s.status]++; return acc; },
    { accepted: 0, edited: 0, pending: 0 } as Record<PlanStatus, number>
  );
}

export const TeacherPlanningV2: React.FC<Props> = ({ onChild }) => {
  const { children, lessonPlans } = ALC_DATA;

  return (
    <div className="v2-content">
      <header className="v2-masthead">
        <div>
          <div className="v2-masthead-sig">
            <span className="num">01</span>
            <span>— Planning</span>
            <span>·</span>
            <span>Upcoming session · 12 children</span>
          </div>
          <h1 className="v2-greeting-h1">This week's <em>plan.</em></h1>
        </div>
        <div className="v2-actions">
          <button className="v2-btn primary"><Icon name="sparkle" size={14}/> Generate week plan</button>
        </div>
      </header>

      <section className="v2-section-head">
        <div>
          <h3>Upcoming lessons</h3>
          <div className="sub">Student-level plan for each lesson</div>
        </div>
      </section>
      <section className="v2-card v2-plan-list">
        {lessonPlans.map(lesson => {
          const counts = statusCounts(lesson.students);
          return (
            <div key={lesson.id} className="v2-plan-lesson">
              <div className="v2-plan-lesson-head">
                <span className="v2-plan-row-day">{lesson.day}</span>
                <span className="v2-plan-row-time v2-mono">{lesson.time}</span>
                <span className="v2-plan-row-main">
                  <span className="v2-plan-row-title">{lesson.subject} · {lesson.title}</span>
                  <span className="v2-plan-row-sub">{lesson.summary}</span>
                </span>
                <span className="v2-plan-row-chips">
                  {counts.accepted > 0 && <span className="v2-chip moss-soft">{counts.accepted} accepted</span>}
                  {counts.edited > 0 && <span className="v2-chip solid">{counts.edited} edited</span>}
                  {counts.pending > 0 && <span className="v2-chip tangerine-soft">{counts.pending} pending</span>}
                </span>
              </div>
              <div className="v2-plan-lesson-students">
                {lesson.students.map(s => {
                  const child = children.find(c => c.id === s.childId);
                  if (!child) return null;
                  return (
                    <div key={s.childId} className="v2-plan-student-line">
                      <button className="v2-plan-student-name" onClick={() => onChild(child.id)}>{child.name}</button>
                      <span className="v2-plan-student-activity">{s.activity}</span>
                      <span className={`v2-chip ${STATUS_CHIP[s.status]}`}>
                        <Icon name={STATUS_ICON[s.status]} size={11}/> {STATUS_LABEL[s.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default TeacherPlanningV2;
