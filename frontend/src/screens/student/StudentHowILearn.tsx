import React from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import { useAppStore } from '../../store/app-store';

const styleDescriptions: Record<string, { desc: string; tips: string[]; emoji: string }> = {
  'Kinaesthetic': {
    emoji: '🖐',
    desc: 'You learn best by doing things with your hands and body. Moving, building, and touching helps you understand.',
    tips: ['Build or make something when you want to remember it', 'Act out stories or ideas', 'Use your hands to count and sort', 'Take movement breaks when you feel wiggly']
  },
  'Auditory': {
    emoji: '👂',
    desc: 'You learn best through sound and talking. Listening to stories, music, and conversations helps your brain.',
    tips: ['Talk through what you\'re learning out loud', 'Listen carefully to instructions before starting', 'Make up a song or rhyme to help you remember', 'Ask questions whenever you\'re curious']
  },
  'Visual': {
    emoji: '👁',
    desc: 'You learn best by seeing things. Pictures, colours, patterns, and maps help your brain make sense of ideas.',
    tips: ['Draw pictures to help you remember', 'Look for patterns in what you\'re learning', 'Use colour when you write or sort things', 'Watch carefully before you try something new']
  }
};

export const StudentHowILearn: React.FC = () => {
  const { parentChildId } = useAppStore();
  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[4];
  const firstName = child.name.split(' ')[0];
  const styleInfo = styleDescriptions[child.style] ?? styleDescriptions['Visual'];

  return (
    <div className="page-fade student-view">
      <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{styleInfo.emoji}</div>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>How you learn, {firstName}</h1>
        <div style={{ color: 'var(--ink-3)', fontSize: 15 }}>You're a {child.style} learner</div>
      </div>

      <div className={`card tone-${child.tone}`} style={{ padding: 24, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)' }}>{styleInfo.desc}</div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="tiny" style={{ marginBottom: 14 }}>Things that help you learn</div>
        {styleInfo.tips.map((tip, i) => (
          <div key={i} className="row" style={{ gap: 12, padding: '12px 0', borderBottom: i < styleInfo.tips.length - 1 ? '1px dashed var(--line)' : 'none', alignItems: 'flex-start' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sage-soft)', color: 'var(--sage-ink)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700 }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{tip}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ gap: 14, marginBottom: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="tiny" style={{ marginBottom: 10 }}>What I'm exploring</div>
          {child.focus.map((f, i) => (
            <div key={i} className="row" style={{ gap: 8, padding: '8px 0', borderBottom: i < child.focus.length - 1 ? '1px dashed var(--line)' : 'none' }}>
              <Icon name="book" size={13}/>
              <span style={{ fontSize: 13.5 }}>{f}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="tiny" style={{ marginBottom: 10 }}>Things I'm great at</div>
          {child.strengths.map((s, i) => (
            <div key={i} className="row" style={{ gap: 8, padding: '8px 0', borderBottom: i < child.strengths.length - 1 ? '1px dashed var(--line)' : 'none' }}>
              <Icon name="star" size={13}/>
              <span style={{ fontSize: 13.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20, background: 'var(--sage-soft)' }}>
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <Icon name="heart" size={18}/>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Everyone learns differently</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              Being a {child.style.toLowerCase()} learner doesn't mean you can only learn one way. It just means this way feels easiest and most fun for you right now.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHowILearn;
