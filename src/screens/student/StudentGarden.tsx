import React, { useState } from 'react';
import { Icon } from '../../components/ui';
import { ALC_DATA } from '../../data/seed';
import { useAppStore } from '../../store/app-store';

interface Plant {
  id: string;
  name: string;
  growth: number; // 0-100
  tone: string;
  area: string;
}

export const StudentGarden: React.FC = () => {
  const { parentChildId } = useAppStore();
  const child = ALC_DATA.children.find(c => c.id === parentChildId) ?? ALC_DATA.children[4];
  const firstName = child.name.split(' ')[0];

  const [watered, setWatered] = useState<string[]>([]);

  const plants: Plant[] = [
    { id: 'p1', name: child.strengths[0] ?? 'Strength', growth: 85, tone: 'sage', area: child.focus[0] ?? 'Learning' },
    { id: 'p2', name: child.focus[0] ?? 'Focus area', growth: 60, tone: 'ochre', area: child.focus[0] ?? 'Learning' },
    { id: 'p3', name: child.gaps[0] ?? 'Growing edge', growth: 35, tone: 'plum', area: 'Growing' },
    ...(child.strengths.length > 1 ? [{ id: 'p4', name: child.strengths[1], growth: 70, tone: 'sky', area: child.focus[1] ?? 'Learning' }] : []),
  ];

  const water = (id: string) => {
    if (!watered.includes(id)) setWatered(prev => [...prev, id]);
  };

  const getPlantEmoji = (growth: number) => {
    if (growth >= 80) return '🌳';
    if (growth >= 60) return '🌿';
    if (growth >= 40) return '🌱';
    return '🌰';
  };

  return (
    <div className="page-fade student-view">
      <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>{firstName}'s garden</h1>
        <div style={{ color: 'var(--ink-3)', fontSize: 15 }}>Watch your learning grow</div>
      </div>

      <div className="grid grid-2" style={{ gap: 14, marginBottom: 20 }}>
        {plants.map(plant => (
          <div key={plant.id} className={`card tone-${plant.tone}`} style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{getPlantEmoji(plant.growth + (watered.includes(plant.id) ? 10 : 0))}</div>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{plant.name}</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>{plant.area}</div>
            <div className="bar" style={{ height: 8, marginBottom: 12 }}>
              <span style={{ width: Math.min(plant.growth + (watered.includes(plant.id) ? 8 : 0), 100) + '%', transition: 'width 0.5s ease' }}/>
            </div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
              {Math.min(plant.growth + (watered.includes(plant.id) ? 8 : 0), 100)}% grown
            </div>
            <button
              className="btn"
              onClick={() => water(plant.id)}
              disabled={watered.includes(plant.id)}
              style={{ fontSize: 12, opacity: watered.includes(plant.id) ? 0.6 : 1 }}>
              {watered.includes(plant.id) ? '💧 Watered today!' : '💧 Water it'}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div className="tiny" style={{ marginBottom: 12 }}>How gardens grow</div>
        {[
          { step: 'Come to school and try things', plant: '🌰 Seed planted' },
          { step: 'Keep practising even when it\'s hard', plant: '🌱 Sprout appearing' },
          { step: 'Ask questions and explore', plant: '🌿 Growing strong' },
          { step: 'Help someone else learn it too', plant: '🌳 Fully bloomed!' },
        ].map((row, i) => (
          <div key={i} className="row" style={{ gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px dashed var(--line)' : 'none' }}>
            <div style={{ fontSize: 22, width: 30, textAlign: 'center' }}>{row.plant.split(' ')[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5 }}>{row.step}</div>
              <div className="muted" style={{ fontSize: 12 }}>{row.plant.split(' ').slice(1).join(' ')}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, background: 'var(--sage-soft)', textAlign: 'center' }}>
        <Icon name="leaf" size={24}/>
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 8, marginBottom: 4 }}>You have {plants.length} plants growing</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          Every day you come to school, every time you try something hard, and every time you help a friend — your garden grows a little bit more.
        </div>
      </div>
    </div>
  );
};

export default StudentGarden;
