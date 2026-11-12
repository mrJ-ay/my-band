// Programmatic generator for clean, valid, multi-part MusicXML sample scores

function noteXml(pitchStr, durTicks, typeStr, { chord = false, tieStart = false, tieStop = false, dot = false, unpitched = null } = {}) {
  const chordTag = chord ? '<chord/>' : '';
  const tieTags = `${tieStop ? '<tie type="stop"/>' : ''}${tieStart ? '<tie type="start"/>' : ''}`;
  const dotTag = dot ? '<dot/>' : '';
  const notations = (tieStop || tieStart)
    ? `<notations>${tieStop ? '<tied type="stop"/>' : ''}${tieStart ? '<tied type="start"/>' : ''}</notations>`
    : '';

  if (unpitched) {
    return `<note>${chordTag}<unpitched><display-step>${unpitched.step}</display-step><display-octave>${unpitched.octave}</display-octave></unpitched><duration>${durTicks}</duration>${tieTags}<type>${typeStr}</type>${dotTag}${notations}</note>`;
  }

  if (pitchStr === 'R') {
    return `<note><rest/><duration>${durTicks}</duration><type>${typeStr}</type>${dotTag}</note>`;
  }

  // pitchStr like "C4", "F#5", "Bb3"
  const m = pitchStr.match(/^([A-G])([#b]?)(-?\d)$/);
  const step = m[1];
  const alter = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const octave = m[3];

  return `<note>${chordTag}<pitch><step>${step}</step>${alter !== 0 ? `<alter>${alter}</alter>` : ''}<octave>${octave}</octave></pitch><duration>${durTicks}</duration>${tieTags}<type>${typeStr}</type>${dotTag}${notations}</note>`;
}

function buildScoreXml({ title, tempo = 108, beats = 4, beatType = 4, divisions = 2, parts }) {

  const partListXml = parts
    .map(
      (p) => `
    <score-part id="${p.id}">
      <part-name>${p.name}</part-name>
      <score-instrument id="${p.id}-I1">
        <instrument-name>${p.name}</instrument-name>
      </score-instrument>
      <midi-instrument id="${p.id}-I1">
        ${p.unpitched ? '<midi-channel>10</midi-channel><midi-unpitched>38</midi-unpitched>' : `<midi-program>${p.midiProgram}</midi-program>`}
      </midi-instrument>
    </score-part>`
    )
    .join('');

  const partsBodyXml = parts
    .map((p, partIdx) => {
      const measuresXml = p.measures
        .map((mNotes, mIdx) => {
          let attr = '';
          if (mIdx === 0) {
            const clef = p.clef || { sign: 'G', line: 2 };
            const transpose = p.transpose
              ? `<transpose><diatonic>${p.transpose.diatonic}</diatonic><chromatic>${p.transpose.chromatic}</chromatic></transpose>`
              : '';
            attr = `
        <attributes>
          <divisions>${divisions}</divisions>
          <key><fifths>0</fifths></key>
          <time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>
          <clef><sign>${clef.sign}</sign><line>${clef.line}</line></clef>
          ${transpose}
        </attributes>`;
            if (partIdx === 0) {
              attr += `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${tempo}</per-minute></metronome></direction-type><sound tempo="${tempo}"/></direction>`;
            }
          }
          return `<measure number="${mIdx + 1}">${attr}${mNotes}</measure>`;
        })
        .join('');

      return `<part id="${p.id}">${measuresXml}</part>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${title}</work-title></work>
  <part-list>${partListXml}</part-list>
  ${partsBodyXml}
</score-partwise>`;
}

const Q = 2;
const H = 4;
const W = 8;
const E = 1;

function seq(items) {
  return items.map(([pitch, dur, type, opts]) => noteXml(pitch, dur, type, opts)).join('');
}

// 1. Twinkle Symphony Miniature (Flute, Bb Clarinet, Violin, Cello)
const SYMPHONY_XML = buildScoreXml({
  title: '작은 별 심포니 변주곡 (Symphony Miniature)',
  tempo: 108,
  parts: [
    {
      id: 'P1',
      name: 'Flute',
      midiProgram: 74,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['C5', Q, 'quarter'], ['C5', Q, 'quarter'], ['G5', Q, 'quarter'], ['G5', Q, 'quarter']]),
        seq([['A5', Q, 'quarter'], ['A5', Q, 'quarter'], ['G5', H, 'half']]),
        seq([['F5', Q, 'quarter'], ['F5', Q, 'quarter'], ['E5', Q, 'quarter'], ['E5', Q, 'quarter']]),
        seq([['D5', Q, 'quarter'], ['D5', Q, 'quarter'], ['C5', H, 'half']]),
        seq([['G5', Q, 'quarter'], ['G5', Q, 'quarter'], ['F5', Q, 'quarter'], ['F5', Q, 'quarter']]),
        seq([['E5', Q, 'quarter'], ['E5', Q, 'quarter'], ['D5', H, 'half']]),
        seq([['C5', Q, 'quarter'], ['E5', Q, 'quarter'], ['G5', Q, 'quarter'], ['C6', Q, 'quarter']]),
        seq([['G5', H, 'half'], ['C6', H, 'half']])
      ]
    },
    {
      id: 'P2',
      name: 'Clarinet in Bb',
      midiProgram: 72,
      clef: { sign: 'G', line: 2 },
      // Written 2 semitones higher so sounding C becomes written D
      transpose: { diatonic: -1, chromatic: -2 },
      measures: [
        seq([['D4', H, 'half'], ['B4', H, 'half']]),
        seq([['D5', H, 'half'], ['B4', H, 'half']]),
        seq([['B4', H, 'half'], ['A4', H, 'half']]),
        seq([['A4', Q, 'quarter'], ['F#4', Q, 'quarter'], ['D4', H, 'half']]),
        seq([['B4', H, 'half'], ['B4', H, 'half']]),
        seq([['A4', H, 'half'], ['A4', H, 'half']]),
        seq([['F#4', Q, 'quarter'], ['A4', Q, 'quarter'], ['B4', Q, 'quarter'], ['D5', Q, 'quarter']]),
        seq([['B4', H, 'half'], ['D5', H, 'half']])
      ]
    },
    {
      id: 'P3',
      name: 'Violin',
      midiProgram: 41,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['E4', E, 'eighth'], ['G4', E, 'eighth'], ['E4', E, 'eighth'], ['G4', E, 'eighth'], ['E4', E, 'eighth'], ['G4', E, 'eighth'], ['E4', E, 'eighth'], ['G4', E, 'eighth']]),
        seq([['F4', E, 'eighth'], ['A4', E, 'eighth'], ['F4', E, 'eighth'], ['A4', E, 'eighth'], ['E4', E, 'eighth'], ['G4', E, 'eighth'], ['E4', E, 'eighth'], ['G4', E, 'eighth']]),
        seq([['D4', E, 'eighth'], ['F4', E, 'eighth'], ['D4', E, 'eighth'], ['F4', E, 'eighth'], ['C4', E, 'eighth'], ['E4', E, 'eighth'], ['C4', E, 'eighth'], ['E4', E, 'eighth']]),
        seq([['D4', Q, 'quarter'], ['F4', Q, 'quarter'], ['E4', H, 'half']]),
        seq([['E4', E, 'eighth'], ['G4', E, 'eighth'], ['E4', E, 'eighth'], ['G4', E, 'eighth'], ['D4', E, 'eighth'], ['F4', E, 'eighth'], ['D4', E, 'eighth'], ['F4', E, 'eighth']]),
        seq([['C4', E, 'eighth'], ['E4', E, 'eighth'], ['C4', E, 'eighth'], ['E4', E, 'eighth'], ['B3', Q, 'quarter'], ['D4', Q, 'quarter']]),
        seq([['E4', Q, 'quarter'], ['G4', Q, 'quarter'], ['E4', Q, 'quarter'], ['E5', Q, 'quarter']]),
        seq([['D5', H, 'half'], ['E5', H, 'half']])
      ]
    },
    {
      id: 'P4',
      name: 'Cello',
      midiProgram: 43,
      clef: { sign: 'F', line: 4 },
      measures: [
        seq([['C3', H, 'half'], ['E3', H, 'half']]),
        seq([['F3', H, 'half'], ['C3', H, 'half']]),
        seq([['D3', H, 'half'], ['A2', H, 'half']]),
        seq([['G2', H, 'half'], ['C3', H, 'half']]),
        seq([['C3', H, 'half'], ['G2', H, 'half']]),
        seq([['A2', H, 'half'], ['G2', H, 'half']]),
        seq([['C3', Q, 'quarter'], ['G2', Q, 'quarter'], ['C3', H, 'half']]),
        seq([['G2', H, 'half'], ['C3', H, 'half']])
      ]
    }
  ]
});

// 2. Brass & Marching Fanfare (Trumpet, French Horn, Trombone, Tuba, Drums)
const BRASS_XML = buildScoreXml({
  title: '황금빛 브라스 팡파레 (Brass Fanfare)',
  tempo: 118,
  parts: [
    {
      id: 'P1',
      name: 'Trumpet',
      midiProgram: 57,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['G4', E, 'eighth'], ['G4', E, 'eighth'], ['G4', Q, 'quarter'], ['C5', H, 'half']]),
        seq([['D5', Q, 'quarter'], ['E5', Q, 'quarter'], ['C5', H, 'half']]),
        seq([['F5', Q, 'quarter'], ['E5', Q, 'quarter'], ['D5', Q, 'quarter'], ['C5', Q, 'quarter']]),
        seq([['D5', W, 'whole']]),
        seq([['G4', E, 'eighth'], ['G4', E, 'eighth'], ['C5', Q, 'quarter'], ['E5', H, 'half']]),
        seq([['G5', Q, 'quarter'], ['F5', Q, 'quarter'], ['E5', Q, 'quarter'], ['D5', Q, 'quarter']]),
        seq([['E5', Q, 'quarter'], ['D5', Q, 'quarter'], ['C5', Q, 'quarter'], ['B4', Q, 'quarter']]),
        seq([['C5', W, 'whole']])
      ]
    },
    {
      id: 'P2',
      name: 'French Horn',
      midiProgram: 61,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['E4', H, 'half'], ['E4', H, 'half']]),
        seq([['G4', H, 'half'], ['E4', H, 'half']]),
        seq([['A4', H, 'half'], ['G4', H, 'half']]),
        seq([['G4', W, 'whole']]),
        seq([['E4', H, 'half'], ['G4', H, 'half']]),
        seq([['B4', H, 'half'], ['G4', H, 'half']]),
        seq([['G4', H, 'half'], ['F4', H, 'half']]),
        seq([['E4', W, 'whole']])
      ]
    },
    {
      id: 'P3',
      name: 'Trombone',
      midiProgram: 58,
      clef: { sign: 'F', line: 4 },
      measures: [
        seq([['C3', Q, 'quarter'], ['G3', Q, 'quarter'], ['E3', H, 'half']]),
        seq([['B2', Q, 'quarter'], ['G3', Q, 'quarter'], ['E3', H, 'half']]),
        seq([['A2', Q, 'quarter'], ['C3', Q, 'quarter'], ['G3', H, 'half']]),
        seq([['G2', Q, 'quarter'], ['B2', Q, 'quarter'], ['D3', H, 'half']]),
        seq([['C3', Q, 'quarter'], ['E3', Q, 'quarter'], ['G3', H, 'half']]),
        seq([['D3', Q, 'quarter'], ['G3', Q, 'quarter'], ['C3', H, 'half']]),
        seq([['G3', H, 'half'], ['G2', H, 'half']]),
        seq([['C3', W, 'whole']])
      ]
    },
    {
      id: 'P4',
      name: 'Tuba',
      midiProgram: 59,
      clef: { sign: 'F', line: 4 },
      measures: [
        seq([['C2', H, 'half'], ['C2', H, 'half']]),
        seq([['G2', H, 'half'], ['C2', H, 'half']]),
        seq([['F2', H, 'half'], ['C2', H, 'half']]),
        seq([['G2', W, 'whole']]),
        seq([['C2', H, 'half'], ['C2', H, 'half']]),
        seq([['G2', H, 'half'], ['A2', H, 'half']]),
        seq([['G2', H, 'half'], ['G2', H, 'half']]),
        seq([['C2', W, 'whole']])
      ]
    },
    {
      id: 'P5',
      name: 'Drum Set',
      midiProgram: 119,
      unpitched: true,
      clef: { sign: 'percussion', line: 2 },
      measures: Array.from({ length: 8 }, (_, idx) => {
        if (idx === 7) {
          return seq([
            ['R', Q, 'quarter', { unpitched: { step: 'F', octave: 4 } }],
            ['R', Q, 'quarter', { unpitched: { step: 'C', octave: 5 } }],
            ['R', H, 'half', { unpitched: { step: 'F', octave: 4 } }]
          ]);
        }
        return seq([
          ['R', Q, 'quarter', { unpitched: { step: 'F', octave: 4 } }],
          ['R', Q, 'quarter', { unpitched: { step: 'C', octave: 5 } }],
          ['R', E, 'eighth', { unpitched: { step: 'F', octave: 4 } }],
          ['R', E, 'eighth', { unpitched: { step: 'F', octave: 4 } }],
          ['R', Q, 'quarter', { unpitched: { step: 'C', octave: 5 } }]
        ]);
      })
    }
  ]
});

// 3. Rock Band Groove (Distortion Guitar, Electric Piano, Electric Bass, Drums)
const ROCK_XML = buildScoreXml({
  title: '미드나잇 록 밴드 세션 (Rock Band Groove)',
  tempo: 124,
  parts: [
    {
      id: 'P1',
      name: 'Electric Guitar',
      midiProgram: 31,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['A4', Q, 'quarter'], ['C5', Q, 'quarter'], ['E5', E, 'eighth'], ['D5', E, 'eighth'], ['C5', Q, 'quarter']]),
        seq([['G4', Q, 'quarter'], ['B4', Q, 'quarter'], ['D5', H, 'half']]),
        seq([['F4', Q, 'quarter'], ['A4', Q, 'quarter'], ['C5', E, 'eighth'], ['B4', E, 'eighth'], ['A4', Q, 'quarter']]),
        seq([['E4', Q, 'quarter'], ['G#4', Q, 'quarter'], ['B4', H, 'half']]),
        seq([['A4', E, 'eighth'], ['A4', E, 'eighth'], ['C5', Q, 'quarter'], ['E5', Q, 'quarter'], ['A5', Q, 'quarter']]),
        seq([['G5', Q, 'quarter'], ['E5', Q, 'quarter'], ['D5', H, 'half']]),
        seq([['C5', Q, 'quarter'], ['B4', Q, 'quarter'], ['A4', Q, 'quarter'], ['G4', Q, 'quarter']]),
        seq([['A4', W, 'whole']])
      ]
    },
    {
      id: 'P2',
      name: 'Electric Piano',
      midiProgram: 5,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['A3', W, 'whole'], ['C4', W, 'whole', { chord: true }], ['E4', W, 'whole', { chord: true }]]),
        seq([['G3', W, 'whole'], ['B3', W, 'whole', { chord: true }], ['D4', W, 'whole', { chord: true }]]),
        seq([['F3', W, 'whole'], ['A3', W, 'whole', { chord: true }], ['C4', W, 'whole', { chord: true }]]),
        seq([['E3', W, 'whole'], ['G#3', W, 'whole', { chord: true }], ['B3', W, 'whole', { chord: true }]]),
        seq([['A3', H, 'half'], ['C4', H, 'half', { chord: true }], ['A3', H, 'half'], ['E4', H, 'half', { chord: true }]]),
        seq([['G3', W, 'whole'], ['B3', W, 'whole', { chord: true }]]),
        seq([['F3', H, 'half'], ['G3', H, 'half']]),
        seq([['A3', W, 'whole'], ['E4', W, 'whole', { chord: true }]])
      ]
    },
    {
      id: 'P3',
      name: 'Electric Bass',
      midiProgram: 34,
      clef: { sign: 'F', line: 4 },
      measures: [
        seq([['A2', Q, 'quarter'], ['A2', E, 'eighth'], ['E2', E, 'eighth'], ['A2', Q, 'quarter'], ['E2', Q, 'quarter']]),
        seq([['G2', Q, 'quarter'], ['G2', E, 'eighth'], ['D2', E, 'eighth'], ['G2', Q, 'quarter'], ['D2', Q, 'quarter']]),
        seq([['F2', Q, 'quarter'], ['F2', E, 'eighth'], ['C2', E, 'eighth'], ['F2', Q, 'quarter'], ['C2', Q, 'quarter']]),
        seq([['E2', Q, 'quarter'], ['E2', E, 'eighth'], ['B2', E, 'eighth'], ['E2', H, 'half']]),
        seq([['A2', Q, 'quarter'], ['A2', Q, 'quarter'], ['A2', E, 'eighth'], ['C3', E, 'eighth'], ['A2', Q, 'quarter']]),
        seq([['G2', Q, 'quarter'], ['B2', Q, 'quarter'], ['D3', Q, 'quarter'], ['G2', Q, 'quarter']]),
        seq([['F2', H, 'half'], ['G2', H, 'half']]),
        seq([['A2', W, 'whole']])
      ]
    },
    {
      id: 'P4',
      name: 'Drums',
      midiProgram: 119,
      unpitched: true,
      clef: { sign: 'percussion', line: 2 },
      measures: Array.from({ length: 8 }, () =>
        seq([
          ['R', E, 'eighth', { unpitched: { step: 'F', octave: 4 } }],
          ['R', E, 'eighth', { unpitched: { step: 'G', octave: 5 } }],
          ['R', E, 'eighth', { unpitched: { step: 'C', octave: 5 } }],
          ['R', E, 'eighth', { unpitched: { step: 'G', octave: 5 } }],
          ['R', E, 'eighth', { unpitched: { step: 'F', octave: 4 } }],
          ['R', E, 'eighth', { unpitched: { step: 'G', octave: 5 } }],
          ['R', E, 'eighth', { unpitched: { step: 'C', octave: 5 } }],
          ['R', E, 'eighth', { unpitched: { step: 'G', octave: 5 } }]
        ])
      )
    }
  ]
});

// 4. Chamber String Quartet (Violin 1, Violin 2, Viola, Cello)
const CHAMBER_XML = buildScoreXml({
  title: '봄날의 현악 4중주 (Chamber Quartet)',
  tempo: 96,
  parts: [
    {
      id: 'P1',
      name: 'Violin I',
      midiProgram: 41,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['E5', H, 'half'], ['G5', Q, 'quarter'], ['F5', Q, 'quarter']]),
        seq([['E5', Q, 'quarter'], ['D5', Q, 'quarter'], ['C5', H, 'half']]),
        seq([['D5', H, 'half'], ['F5', Q, 'quarter'], ['E5', Q, 'quarter']]),
        seq([['D5', H, 'half'], ['B4', H, 'half']]),
        seq([['C5', Q, 'quarter'], ['E5', Q, 'quarter'], ['G5', H, 'half']]),
        seq([['A5', H, 'half'], ['G5', H, 'half']]),
        seq([['F5', Q, 'quarter'], ['E5', Q, 'quarter'], ['D5', H, 'half']]),
        seq([['C5', W, 'whole']])
      ]
    },
    {
      id: 'P2',
      name: 'Violin II',
      midiProgram: 41,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['C5', H, 'half'], ['E5', Q, 'quarter'], ['D5', Q, 'quarter']]),
        seq([['C5', Q, 'quarter'], ['B4', Q, 'quarter'], ['A4', H, 'half']]),
        seq([['B4', H, 'half'], ['D5', Q, 'quarter'], ['C5', Q, 'quarter']]),
        seq([['B4', H, 'half'], ['G4', H, 'half']]),
        seq([['G4', Q, 'quarter'], ['C5', Q, 'quarter'], ['E5', H, 'half']]),
        seq([['F5', H, 'half'], ['E5', H, 'half']]),
        seq([['D5', Q, 'quarter'], ['C5', Q, 'quarter'], ['B4', H, 'half']]),
        seq([['C5', W, 'whole']])
      ]
    },
    {
      id: 'P3',
      name: 'Viola',
      midiProgram: 42,
      clef: { sign: 'C', line: 3 },
      measures: [
        seq([['G4', H, 'half'], ['G4', H, 'half']]),
        seq([['G4', H, 'half'], ['E4', H, 'half']]),
        seq([['F4', H, 'half'], ['G4', H, 'half']]),
        seq([['G4', H, 'half'], ['D4', H, 'half']]),
        seq([['E4', H, 'half'], ['C4', H, 'half']]),
        seq([['C4', H, 'half'], ['C5', H, 'half']]),
        seq([['A4', H, 'half'], ['G4', H, 'half']]),
        seq([['E4', W, 'whole']])
      ]
    },
    {
      id: 'P4',
      name: 'Cello',
      midiProgram: 43,
      clef: { sign: 'F', line: 4 },
      measures: [
        seq([['C3', W, 'whole']]),
        seq([['A2', W, 'whole']]),
        seq([['F2', H, 'half'], ['E2', H, 'half']]),
        seq([['G2', W, 'whole']]),
        seq([['C3', H, 'half'], ['E3', H, 'half']]),
        seq([['F3', H, 'half'], ['C3', H, 'half']]),
        seq([['D3', H, 'half'], ['G2', H, 'half']]),
        seq([['C3', W, 'whole']])
      ]
    }
  ]
});

// 5. Real Bonjo Arirang (본조 아리랑 - 16마디, 3/4 세마치장단, divisions=4 -> 12 ticks/bar)
const HD = 12; // dotted half
const QD = 6;  // dotted quarter
const H4 = 8;  // half
const Q4 = 4;  // quarter
const E4 = 2;  // eighth

const ARIRANG_XML = buildScoreXml({
  title: '경기 아리랑 국악 합주 (Gyeonggi Arirang)',
  tempo: 96,
  beats: 3,
  beatType: 4,
  divisions: 4,
  parts: [
    {
      id: 'P1',
      name: '대금 (Daegeum)',
      midiProgram: 78,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['G4', Q4, 'quarter'], ['A4', E4, 'eighth'], ['G4', Q4, 'quarter'], ['A4', E4, 'eighth']]),
        seq([['C5', Q4, 'quarter'], ['D5', E4, 'eighth'], ['C5', Q4, 'quarter'], ['D5', E4, 'eighth']]),
        seq([['E5', E4, 'eighth'], ['D5', E4, 'eighth'], ['E5', Q4, 'quarter'], ['C5', E4, 'eighth'], ['A4', E4, 'eighth']]),
        seq([['G4', Q4, 'quarter'], ['A4', E4, 'eighth'], ['G4', Q4, 'quarter'], ['A4', E4, 'eighth']]),
        seq([['C5', Q4, 'quarter'], ['D5', E4, 'eighth'], ['C5', Q4, 'quarter'], ['D5', E4, 'eighth']]),
        seq([['E5', E4, 'eighth'], ['D5', E4, 'eighth'], ['C5', E4, 'eighth'], ['A4', E4, 'eighth'], ['G4', E4, 'eighth'], ['A4', E4, 'eighth']]),
        seq([['C5', Q4, 'quarter'], ['D5', Q4, 'quarter'], ['C5', Q4, 'quarter']]),
        seq([['C5', H4, 'half'], ['R', Q4, 'quarter']]),
        seq([['G5', H4, 'half'], ['G5', Q4, 'quarter']]),
        seq([['G5', Q4, 'quarter'], ['E5', Q4, 'quarter'], ['D5', Q4, 'quarter']]),
        seq([['E5', E4, 'eighth'], ['D5', E4, 'eighth'], ['E5', Q4, 'quarter'], ['C5', E4, 'eighth'], ['A4', E4, 'eighth']]),
        seq([['G4', Q4, 'quarter'], ['A4', E4, 'eighth'], ['G4', Q4, 'quarter'], ['A4', E4, 'eighth']]),
        seq([['C5', Q4, 'quarter'], ['D5', E4, 'eighth'], ['C5', Q4, 'quarter'], ['D5', E4, 'eighth']]),
        seq([['E5', E4, 'eighth'], ['D5', E4, 'eighth'], ['C5', E4, 'eighth'], ['A4', E4, 'eighth'], ['G4', E4, 'eighth'], ['A4', E4, 'eighth']]),
        seq([['C5', Q4, 'quarter'], ['D5', Q4, 'quarter'], ['C5', Q4, 'quarter']]),
        seq([['C5', HD, 'half', { dot: true }]])
      ]
    },
    {
      id: 'P2',
      name: '해금 (Haegeum)',
      midiProgram: 111,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['C4', H4, 'half'], ['E4', Q4, 'quarter']]),
        seq([['G4', H4, 'half'], ['E4', Q4, 'quarter']]),
        seq([['A4', H4, 'half'], ['G4', Q4, 'quarter']]),
        seq([['E4', HD, 'half', { dot: true }]]),
        seq([['C5', H4, 'half'], ['G4', Q4, 'quarter']]),
        seq([['A4', H4, 'half'], ['E4', Q4, 'quarter']]),
        seq([['G4', H4, 'half'], ['G4', Q4, 'quarter']]),
        seq([['E4', HD, 'half', { dot: true }]]),
        seq([['C5', H4, 'half'], ['G4', Q4, 'quarter']]),
        seq([['E4', H4, 'half'], ['G4', Q4, 'quarter']]),
        seq([['A4', H4, 'half'], ['G4', Q4, 'quarter']]),
        seq([['E4', HD, 'half', { dot: true }]]),
        seq([['C4', H4, 'half'], ['E4', Q4, 'quarter']]),
        seq([['G4', H4, 'half'], ['E4', Q4, 'quarter']]),
        seq([['A4', H4, 'half'], ['G4', Q4, 'quarter']]),
        seq([['E4', HD, 'half', { dot: true }]])
      ]
    },
    {
      id: 'P3',
      name: '가야금 (Gayageum)',
      midiProgram: 108,
      clef: { sign: 'G', line: 2 },
      measures: [
        seq([['C4', E4, 'eighth'], ['G4', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth'], ['E5', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['G4', E4, 'eighth'], ['D5', E4, 'eighth'], ['G5', E4, 'eighth'], ['D5', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['A3', E4, 'eighth'], ['E4', E4, 'eighth'], ['A4', E4, 'eighth'], ['G4', E4, 'eighth'], ['D4', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['C4', E4, 'eighth'], ['G4', E4, 'eighth'], ['C5', E4, 'eighth'], ['E5', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['C4', E4, 'eighth'], ['G4', E4, 'eighth'], ['C5', E4, 'eighth'], ['E5', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['A3', E4, 'eighth'], ['E4', E4, 'eighth'], ['A4', E4, 'eighth'], ['E4', E4, 'eighth'], ['A4', E4, 'eighth'], ['C5', E4, 'eighth']]),
        seq([['G3', E4, 'eighth'], ['D4', E4, 'eighth'], ['G4', E4, 'eighth'], ['D5', E4, 'eighth'], ['G4', E4, 'eighth'], ['D4', E4, 'eighth']]),
        seq([['C4', E4, 'eighth'], ['G4', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth'], ['E4', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['C4', E4, 'eighth'], ['G4', E4, 'eighth'], ['C5', E4, 'eighth'], ['E5', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['C4', E4, 'eighth'], ['G4', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth'], ['E4', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['A3', E4, 'eighth'], ['E4', E4, 'eighth'], ['A4', E4, 'eighth'], ['G4', E4, 'eighth'], ['D4', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['C4', E4, 'eighth'], ['G4', E4, 'eighth'], ['C5', E4, 'eighth'], ['E5', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['C4', E4, 'eighth'], ['G4', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth'], ['E5', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['G4', E4, 'eighth'], ['D5', E4, 'eighth'], ['G5', E4, 'eighth'], ['D5', E4, 'eighth'], ['C5', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['A3', E4, 'eighth'], ['E4', E4, 'eighth'], ['A4', E4, 'eighth'], ['G4', E4, 'eighth'], ['D4', E4, 'eighth'], ['G4', E4, 'eighth']]),
        seq([['C4', HD, 'half', { dot: true }]])
      ]
    },
    {
      id: 'P4',
      name: '거문고 (Geomungo)',
      midiProgram: 107,
      clef: { sign: 'F', line: 4 },
      measures: [
        seq([['C3', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['G2', H4, 'half'], ['C3', Q4, 'quarter']]),
        seq([['A2', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['C3', HD, 'half', { dot: true }]]),
        seq([['C3', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['A2', H4, 'half'], ['E2', Q4, 'quarter']]),
        seq([['G2', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['C3', HD, 'half', { dot: true }]]),
        seq([['C3', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['C3', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['A2', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['C3', HD, 'half', { dot: true }]]),
        seq([['C3', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['G2', H4, 'half'], ['C3', Q4, 'quarter']]),
        seq([['A2', H4, 'half'], ['G2', Q4, 'quarter']]),
        seq([['C3', HD, 'half', { dot: true }]])
      ]
    },
    {
      id: 'P5',
      name: '장구 (Janggu)',
      midiProgram: 117,
      unpitched: true,
      clef: { sign: 'percussion', line: 2 },
      measures: Array.from({ length: 16 }, (_, idx) => {
        if (idx === 15) {
          return seq([['R', HD, 'half', { dot: true, unpitched: { step: 'F', octave: 4 } }]]);
        }
        return seq([
          ['R', Q4, 'quarter', { unpitched: { step: 'F', octave: 4 } }],
          ['R', Q4, 'quarter', { unpitched: { step: 'C', octave: 5 } }],
          ['R', E4, 'eighth', { unpitched: { step: 'F', octave: 4 } }],
          ['R', E4, 'eighth', { unpitched: { step: 'C', octave: 5 } }]
        ]);
      })
    }
  ]
});

export const SAMPLE_SCORES = [
  {
    id: 'symphony_twinkle',
    title: '작은 별 심포니 변주곡',
    subtitle: '플루트 · Bb 클라리넷(이조) · 바이올린 · 첼로 (4파트)',
    ensembleId: 'symphony',
    tag: '오케스트라',
    xml: SYMPHONY_XML
  },
  {
    id: 'arirang_gugak',
    title: '경기 아리랑 국악 합주',
    subtitle: '대금 · 해금 · 가야금 · 거문고 · 장구 (5파트)',
    ensembleId: 'gugak',
    tag: '국악 밴드',
    xml: ARIRANG_XML
  },
  {
    id: 'brass_fanfare',
    title: '황금빛 브라스 팡파레',
    subtitle: '트럼펫 · 호른 · 트롬본 · 튜바 · 드럼 (5파트)',
    ensembleId: 'brass',
    tag: '브라스 · 마칭',
    xml: BRASS_XML
  },
  {
    id: 'rock_groove',
    title: '미드나잇 록 밴드 세션',
    subtitle: '디스토션 기타 · 일렉 피아노 · 베이스 · 드럼 (4파트)',
    ensembleId: 'rock',
    tag: '록 밴드',
    xml: ROCK_XML
  },
  {
    id: 'chamber_quartet',
    title: '봄날의 현악 4중주',
    subtitle: '바이올린 I · 바이올린 II · 비올라 · 첼로 (4파트)',
    ensembleId: 'chamber',
    tag: '실내악',
    xml: CHAMBER_XML
  }
];
