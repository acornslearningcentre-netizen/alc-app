import { describe, it, expect } from 'vitest';
import { composeDraftReport } from './report-draft.js';

const prospect = { child_first_name: 'Verifina', year_group: 'year_1' };

describe('composeDraftReport', () => {
  it('references real observations instead of generic text', () => {
    const draft = composeDraftReport(prospect, {}, [
      { comment: 'Counted to 20 unprompted while sorting bead chains.' },
    ]);
    expect(draft).toContain('Counted to 20 unprompted while sorting bead chains.');
  });

  it('falls back to a plain visit line when there are no observations', () => {
    const draft = composeDraftReport(prospect, {}, []);
    expect(draft).toContain('Verifina attended an assessment visit');
  });

  it('gives hobbies their own paragraph, since Q17 is the highest-signal answer', () => {
    const draft = composeDraftReport(prospect, { hobbies: 'dinosaurs and Lego' }, []);
    expect(draft).toContain('What lights Verifina up: dinosaurs and Lego');
  });

  it('reads hobbies out of the hasOther shape too', () => {
    const draft = composeDraftReport(prospect, { hobbies: { value: 'other', other: 'building blanket forts' } }, []);
    expect(draft).toContain('building blanket forts');
  });

  it('omits the hobbies paragraph when nothing was said', () => {
    const draft = composeDraftReport(prospect, {}, []);
    expect(draft).not.toContain('What lights');
  });

  it('translates goal codes into readable labels', () => {
    const draft = composeDraftReport(prospect, { goals: ['phonics_reading', 'confidence'] }, []);
    expect(draft).toContain('strong foundations in phonics and reading');
    expect(draft).toContain('building confidence and a love of learning');
    expect(draft).toContain('Year 1');
  });

  it('only mentions diagnosed needs when something other than "none" is selected', () => {
    const withNeeds = composeDraftReport(prospect, { diagnosed_needs: ['none'] }, []);
    expect(withNeeds).not.toContain('The family noted');

    const withRealNeeds = composeDraftReport(prospect, { diagnosed_needs: ['dyslexia'] }, []);
    expect(withRealNeeds).toContain('dyslexia');
  });

  it('falls back to "This child" when no name is on file', () => {
    const draft = composeDraftReport({}, {}, []);
    expect(draft).toContain('This child attended an assessment visit');
  });
});
