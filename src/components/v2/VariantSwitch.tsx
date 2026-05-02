import React from 'react';
import './VariantSwitch.css';

interface Props {
  isV2: boolean;
  onToggle: (next: boolean) => void;
}

export const VariantSwitch: React.FC<Props> = ({ isV2, onToggle }) => (
  <div className="v2-switch" role="group" aria-label="Design variant">
    <button
      className={`v2-switch-pill ${!isV2 ? 'on' : ''}`}
      onClick={() => onToggle(false)}
      aria-pressed={!isV2}>
      v1 · current
    </button>
    <button
      className={`v2-switch-pill ${isV2 ? 'on' : ''}`}
      onClick={() => onToggle(true)}
      aria-pressed={isV2}>
      v2 · taste-design
    </button>
  </div>
);

export default VariantSwitch;
