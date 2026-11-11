import { INSTRUMENTS, matchInstrumentFromNameOrProgram } from './presets.js';

const STEP_SEMITONES = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

function getText(parent, selector) {
  const el = parent ? parent.querySelector(selector) : null;
  return el ? el.textContent.trim() : '';
}

function getDirectText(parent, tagName) {
  if (!parent) return '';
  for (const child of parent.children) {
    if (child.tagName === tagName) return child.textContent.trim();
  }
  return '';
}

/**
 * Read File (.musicxml, .xml, or compressed .mxl) into an XML string
 */
export async function readScoreFileAsXML(file) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.mxl')) {
    if (!window.JSZip) {
      throw new Error('MXL 압축 해제 라이브러리(JSZip)를 불러오지 못했습니다.');
    }
    const buf = await file.arrayBuffer();
    const zip = await window.JSZip.loadAsync(buf);

    let rootPath = null;
    const containerFile = zip.file('META-INF/container.xml');
    if (containerFile) {
      const containerXml = await containerFile.async('string');
      const doc = new DOMParser().parseFromString(containerXml, 'application/xml');
      const rootfileEl = doc.querySelector('rootfile[full-path]');
      if (rootfileEl) {
        rootPath = rootfileEl.getAttribute('full-path');
      }
    }

    if (!rootPath || !zip.file(rootPath)) {
      rootPath = Object.keys(zip.files).find(
        (name) =>
          !name.startsWith('META-INF') &&
          (name.toLowerCase().endsWith('.musicxml') || name.toLowerCase().endsWith('.xml'))
      );
    }

    if (!rootPath || !zip.file(rootPath)) {
      throw new Error(`${file.name}: MXL 패키지 안에서 악보 XML 파일을 찾지 못했습니다.`);
    }
    return await zip.file(rootPath).async('string');
  }

  return await file.text();
}

/**
 * Convert score-timewise XML document to score-partwise XML string if needed
 */
function ensureScorePartwise(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const parserErr = doc.querySelector('parsererror');
  if (parserErr) {
    throw new Error('올바른 MusicXML 형식이 아닙니다. XML 구문 오류가 있습니다.');
  }

  const root = doc.documentElement;
  if (root.tagName === 'score-partwise') {
    return doc;
  }

  if (root.tagName === 'score-timewise') {
    const outDoc = document.implementation.createDocument(null, 'score-partwise', null);
    const outRoot = outDoc.documentElement;
    outRoot.setAttribute('version', root.getAttribute('version') || '3.1');

    const work = root.querySelector('work');
    if (work) outRoot.appendChild(outDoc.importNode(work, true));
    const movementTitle = root.querySelector('movement-title');
    if (movementTitle) outRoot.appendChild(outDoc.importNode(movementTitle, true));

    const partList = root.querySelector('part-list');
    if (partList) outRoot.appendChild(outDoc.importNode(partList, true));

    const partMap = new Map();
    root.querySelectorAll('part-list score-part').forEach((sp) => {
      const id = sp.getAttribute('id');
      const partEl = outDoc.createElement('part');
      partEl.setAttribute('id', id);
      partMap.set(id, partEl);
      outRoot.appendChild(partEl);
    });

    root.querySelectorAll('measure').forEach((m) => {
      const num = m.getAttribute('number') || '1';
      m.querySelectorAll(':scope > part').forEach((p) => {
        const pid = p.getAttribute('id');
        const targetPart = partMap.get(pid);
        if (!targetPart) return;
        const measureEl = outDoc.createElement('measure');
        measureEl.setAttribute('number', num);
        Array.from(p.children).forEach((child) => {
          measureEl.appendChild(outDoc.importNode(child, true));
        });
        targetPart.appendChild(measureEl);
      });
    });

    return outDoc;
  }

  throw new Error('지원하지 않는 XML 문서입니다. <score-partwise> 또는 <score-timewise>가 필요합니다.');
}

/**
 * Merge 1 or more MusicXML strings into a single unified score-partwise XML string
 * so both OSMD and the audio scheduler see one cohesive ensemble score.
 */
export function mergeMusicXMLStrings(entries) {
  if (!entries || entries.length === 0) {
    throw new Error('불러올 악보 데이터가 없습니다.');
  }

  if (entries.length === 1) {
    const doc = ensureScorePartwise(entries[0].xml);
    return new XMLSerializer().serializeToString(doc);
  }

  const outDoc = document.implementation.createDocument(null, 'score-partwise', null);
  const outRoot = outDoc.documentElement;
  outRoot.setAttribute('version', '3.1');

  const workEl = outDoc.createElement('work');
  const workTitleEl = outDoc.createElement('work-title');
  workTitleEl.textContent = entries.map((e) => e.name.replace(/\.(musicxml|xml|mxl)$/i, '')).slice(0, 2).join(' + ') + (entries.length > 2 ? ` 외 ${entries.length - 2}개` : '');
  workEl.appendChild(workTitleEl);
  outRoot.appendChild(workEl);

  const partListEl = outDoc.createElement('part-list');
  outRoot.appendChild(partListEl);

  let partCounter = 1;

  for (const entry of entries) {
    const srcDoc = ensureScorePartwise(entry.xml);
    const idMap = new Map();

    srcDoc.querySelectorAll('part-list score-part').forEach((sp) => {
      const oldId = sp.getAttribute('id');
      const newId = `P${partCounter++}`;
      idMap.set(oldId, newId);

      const importedSp = outDoc.importNode(sp, true);
      importedSp.setAttribute('id', newId);
      const partNameEl = importedSp.querySelector('part-name');
      const baseTitle = entry.name.replace(/\.(musicxml|xml|mxl)$/i, '');
      if (partNameEl && (!partNameEl.textContent.trim() || /^music$/i.test(partNameEl.textContent.trim()))) {
        partNameEl.textContent = baseTitle;
      }
      partListEl.appendChild(importedSp);
    });

    srcDoc.querySelectorAll('score-partwise > part').forEach((partEl) => {
      const oldId = partEl.getAttribute('id');
      const newId = idMap.get(oldId) || `P${partCounter++}`;
      const importedPart = outDoc.importNode(partEl, true);
      importedPart.setAttribute('id', newId);
      outRoot.appendChild(importedPart);
    });
  }

  return new XMLSerializer().serializeToString(outDoc);
}

function mapUnpitchedToDrumMidi(displayStep, displayOctave, instrumentName = '') {
  const lower = instrumentName.toLowerCase();
  if (/kick|bass\s*drum/i.test(lower)) return 36;
  if (/snare/i.test(lower)) return 38;
  if (/hi-?hat|hh/i.test(lower)) return 42;
  if (/crash|cymbal/i.test(lower)) return 49;
  if (/ride/i.test(lower)) return 51;
  if (/tom/i.test(lower)) return 45;

  const key = `${displayStep || 'C'}${displayOctave || 4}`;
  if (key === 'F4' || key === 'E4' || key === 'D4') return 36; // Bass drum position
  if (key === 'C5' || key === 'B4') return 38; // Snare drum position
  if (key === 'G5' || key === 'A5') return 42; // Hi-hat / cymbal position
  if (key === 'E5' || key === 'D5') return 45; // Tom
  return 38;
}

/**
 * Build linear playback order of measures handling simple <repeat> markers
 */
function expandMeasureRepeats(measureNodes) {
  const order = [];
  let repeatStartIdx = 0;
  const repeatedBackward = new Set();

  let i = 0;
  while (i < measureNodes.length) {
    const m = measureNodes[i];
    const barlines = Array.from(m.querySelectorAll(':scope > barline'));
    const hasForward = barlines.some((b) => b.querySelector('repeat[direction="forward"]'));
    const hasBackward = barlines.some((b) => b.querySelector('repeat[direction="backward"]'));

    if (hasForward) {
      repeatStartIdx = i;
    }

    order.push({ node: m, rawIndex: i });

    if (hasBackward && !repeatedBackward.has(i)) {
      repeatedBackward.add(i);
      i = repeatStartIdx;
      continue;
    }
    i++;
  }
  return order;
}

/**
 * Parse a unified MusicXML document into tracks, notes, measure timeline, and tempo map.
 */
export function parseMusicXML(xmlString, fallbackTitle = '합주 프로젝트') {
  const doc = ensureScorePartwise(xmlString);

  const workTitle = getText(doc, 'work > work-title');
  const movementTitle = getText(doc, 'movement-title');
  const title = workTitle || movementTitle || fallbackTitle;

  // 1. Parse part-list metadata
  const partMetaMap = new Map();
  doc.querySelectorAll('part-list score-part').forEach((sp, index) => {
    const id = sp.getAttribute('id') || `P${index + 1}`;
    const rawName = getText(sp, 'part-name') || getText(sp, 'part-abbreviation') || `파트 ${index + 1}`;
    const midiProgramText = getText(sp, 'midi-instrument > midi-program');
    const midiProgram = midiProgramText ? parseInt(midiProgramText, 10) : null;
    const unpitchedEl = sp.querySelector('midi-instrument > midi-unpitched');
    const instrName = getText(sp, 'score-instrument > instrument-name');

    const detectedKey = matchInstrumentFromNameOrProgram(
      `${rawName} ${instrName}`,
      midiProgram,
      Boolean(unpitchedEl)
    );

    partMetaMap.set(id, {
      id,
      rawName,
      instrName,
      midiProgram,
      isUnpitched: Boolean(unpitchedEl),
      detectedKey
    });
  });

  const tempoChanges = []; // { beat, bpm }
  const measureTimeline = []; // { index, rawIndex, number, startBeat, endBeat, beats }
  const tracks = [];
  let maxEndBeat = 0;

  const partEls = Array.from(doc.querySelectorAll('score-partwise > part'));
  let rawMeasureCount = 0;

  partEls.forEach((partEl, partIdx) => {
    const partId = partEl.getAttribute('id') || `P${partIdx + 1}`;
    const meta = partMetaMap.get(partId) || {
      id: partId,
      rawName: `파트 ${partIdx + 1}`,
      instrName: '',
      midiProgram: null,
      isUnpitched: false,
      detectedKey: 'acoustic_grand_piano'
    };

    const rawMeasures = Array.from(partEl.querySelectorAll(':scope > measure'));
    if (partIdx === 0) rawMeasureCount = rawMeasures.length;
    const expandedMeasures = expandMeasureRepeats(rawMeasures);

    let divisions = 1;
    let beatsPerMeasure = 4;
    let beatType = 4;
    let transposeSemitones = 0;
    let measureStartBeat = 0;

    const notes = [];
    const activeTies = new Map();
    let hasUnpitchedNotes = meta.isUnpitched;
    let midiSum = 0;
    let midiCount = 0;

    expandedMeasures.forEach(({ node: measureEl, rawIndex }, mIdx) => {
      const mNum = measureEl.getAttribute('number') || String(mIdx + 1);
      let cursorBeats = 0;
      let lastNoteStartBeats = 0;
      let maxMeasureBeats = 0;

      for (const child of Array.from(measureEl.children)) {
        const tag = child.tagName;

        if (tag === 'attributes') {
          const divText = getDirectText(child, 'divisions');
          if (divText) {
            const parsedDiv = parseFloat(divText);
            if (parsedDiv > 0) divisions = parsedDiv;
          }

          const timeEl = child.querySelector('time');
          if (timeEl) {
            const b = parseInt(getDirectText(timeEl, 'beats'), 10);
            const bt = parseInt(getDirectText(timeEl, 'beat-type'), 10);
            if (b > 0 && bt > 0) {
              beatsPerMeasure = b;
              beatType = bt;
            }
          }

          const transposeEl = child.querySelector('transpose');
          if (transposeEl) {
            const chrom = parseInt(getDirectText(transposeEl, 'chromatic') || '0', 10);
            const oct = parseInt(getDirectText(transposeEl, 'octave-change') || '0', 10);
            transposeSemitones = chrom + oct * 12;
          }
        } else if (tag === 'direction') {
          const soundEl = child.querySelector('sound[tempo]');
          if (soundEl) {
            const bpm = parseFloat(soundEl.getAttribute('tempo'));
            if (bpm > 15 && bpm < 360) {
              tempoChanges.push({
                beat: measureStartBeat + cursorBeats,
                bpm
              });
            }
          } else {
            const perMin = getText(child, 'direction-type > metronome > per-minute');
            if (perMin) {
              const bpm = parseFloat(perMin);
              if (bpm > 15 && bpm < 360) {
                tempoChanges.push({
                  beat: measureStartBeat + cursorBeats,
                  bpm
                });
              }
            }
          }
        } else if (tag === 'backup') {
          const dur = parseFloat(getDirectText(child, 'duration') || '0');
          cursorBeats = Math.max(0, cursorBeats - dur / divisions);
        } else if (tag === 'forward') {
          const dur = parseFloat(getDirectText(child, 'duration') || '0');
          cursorBeats += dur / divisions;
          if (cursorBeats > maxMeasureBeats) maxMeasureBeats = cursorBeats;
        } else if (tag === 'note') {
          const isGrace = Boolean(child.querySelector(':scope > grace'));
          if (isGrace) continue;

          const isChord = Boolean(child.querySelector(':scope > chord'));
          const isRest = Boolean(child.querySelector(':scope > rest'));
          const durRaw = parseFloat(getDirectText(child, 'duration') || '0');
          const durBeats = durRaw > 0 ? durRaw / divisions : 0.25;

          const noteLocalStart = isChord ? lastNoteStartBeats : cursorBeats;
          if (!isChord) {
            lastNoteStartBeats = cursorBeats;
            cursorBeats += durBeats;
            if (cursorBeats > maxMeasureBeats) maxMeasureBeats = cursorBeats;
          }

          if (isRest) continue;

          const staff = getDirectText(child, 'staff') || '1';
          const voice = getDirectText(child, 'voice') || '1';

          let midi = null;
          let isPercNote = false;

          const pitchEl = child.querySelector(':scope > pitch');
          const unpitchedEl = child.querySelector(':scope > unpitched');

          if (pitchEl) {
            const step = getDirectText(pitchEl, 'step') || 'C';
            const alter = parseFloat(getDirectText(pitchEl, 'alter') || '0');
            const octave = parseInt(getDirectText(pitchEl, 'octave') || '4', 10);
            midi = Math.round((octave + 1) * 12 + (STEP_SEMITONES[step] ?? 0) + alter + transposeSemitones);
          } else if (unpitchedEl) {
            hasUnpitchedNotes = true;
            isPercNote = true;
            const dStep = getDirectText(unpitchedEl, 'display-step');
            const dOct = parseInt(getDirectText(unpitchedEl, 'display-octave') || '4', 10);
            midi = mapUnpitchedToDrumMidi(dStep, dOct, meta.rawName);
          }

          if (midi === null || Number.isNaN(midi)) continue;

          midiSum += midi;
          midiCount++;

          // Handle ties
          const tieEls = Array.from(child.querySelectorAll(':scope > tie'));
          const tiedEls = Array.from(child.querySelectorAll(':scope > notations > tied'));
          const hasTieStop =
            tieEls.some((t) => t.getAttribute('type') === 'stop') ||
            tiedEls.some((t) => t.getAttribute('type') === 'stop');
          const hasTieStart =
            tieEls.some((t) => t.getAttribute('type') === 'start') ||
            tiedEls.some((t) => t.getAttribute('type') === 'start');

          const tieKey = `${staff}:${voice}:${midi}`;
          if (hasTieStop && activeTies.has(tieKey)) {
            const prevNote = activeTies.get(tieKey);
            prevNote.durationBeats += durBeats;
            if (!hasTieStart) {
              activeTies.delete(tieKey);
            }
            continue;
          }

          const noteObj = {
            startBeat: measureStartBeat + noteLocalStart,
            durationBeats: durBeats,
            midi: Math.max(21, Math.min(108, midi)),
            velocity: 0.78,
            isPercussion: isPercNote,
            measureIndex: mIdx
          };
          notes.push(noteObj);

          if (hasTieStart) {
            activeTies.set(tieKey, noteObj);
          }
        }
      }

      // Advance measure start beat by expected time signature length (or actual max if pickup/over)
      const expectedMeasureBeats = beatsPerMeasure * (4 / beatType);
      const usedMeasureBeats = maxMeasureBeats > 0 ? maxMeasureBeats : expectedMeasureBeats;
      const actualMeasureLen =
        mIdx === 0 && usedMeasureBeats < expectedMeasureBeats
          ? usedMeasureBeats // pickup measure
          : expectedMeasureBeats;

      if (partIdx === 0) {
        measureTimeline.push({
          index: mIdx,
          rawIndex,
          number: mNum,
          startBeat: measureStartBeat,
          endBeat: measureStartBeat + actualMeasureLen,
          beats: actualMeasureLen
        });
      }

      measureStartBeat += actualMeasureLen;
    });

    if (measureStartBeat > maxEndBeat) {
      maxEndBeat = measureStartBeat;
    }

    const avgMidi = midiCount > 0 ? Math.round(midiSum / midiCount) : 60;
    const finalKey = hasUnpitchedNotes ? 'percussion_kit' : meta.detectedKey;
    const instDef = INSTRUMENTS[finalKey] || INSTRUMENTS.acoustic_grand_piano;

    tracks.push({
      id: partId,
      partName: meta.rawName,
      displayName: instDef.ko,
      originalInstrumentKey: finalKey,
      instrumentKey: finalKey,
      avgMidi,
      volume: 0.85,
      pan: 0,
      muted: false,
      solo: false,
      detuneCents: 0,
      humanizeMs: 0,
      notes: notes.sort((a, b) => a.startBeat - b.startBeat)
    });
  });

  // Deduplicate & sort tempo changes, and precompute O(1) note seconds at 1.0x
  const tempoMap = buildTempoMap(tempoChanges);
  const baseBpm = tempoMap[0].bpm;

  for (const track of tracks) {
    for (const note of track.notes) {
      const startSec = beatToSeconds(note.startBeat, tempoMap, 1.0);
      const endSec = beatToSeconds(note.startBeat + note.durationBeats, tempoMap, 1.0);
      note._sec1x = startSec;
      note._durSec1x = Math.max(0.05, endSec - startSec);
    }
  }

  return {
    title,
    xmlString,
    tracks,
    tempoMap,
    baseBpm,
    totalBeats: maxEndBeat,
    rawMeasureCount,
    measureTimeline,
    recognitionSummary: buildRecognitionSummary(tracks)
  };
}

function buildTempoMap(rawChanges) {
  const sorted = rawChanges
    .slice()
    .sort((a, b) => a.beat - b.beat);

  const map = [];
  for (const item of sorted) {
    const existing = map.find((x) => Math.abs(x.beat - item.beat) < 0.01);
    if (existing) {
      existing.bpm = item.bpm;
    } else {
      map.push({ beat: item.beat, bpm: item.bpm });
    }
  }

  if (map.length === 0 || map[0].beat > 0.01) {
    map.unshift({ beat: 0, bpm: map[0]?.bpm || 108 });
  }
  return map;
}

export function buildRecognitionSummary(tracks) {
  const counts = new Map();
  for (const t of tracks) {
    const inst = INSTRUMENTS[t.instrumentKey];
    const label = inst ? inst.ko : t.partName;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return {
    totalCount: tracks.length,
    headline: `악기 ${tracks.length}개를 찾았어요!`,
    items: Array.from(counts.entries()).map(([name, count]) => ({ name, count }))
  };
}

/**
 * Convert beat position to seconds using tempoMap and playback rate
 */
export function beatToSeconds(beat, tempoMap, rateMultiplier = 1.0) {
  let seconds = 0;
  for (let i = 0; i < tempoMap.length; i++) {
    const cur = tempoMap[i];
    const nextBeat = i + 1 < tempoMap.length ? tempoMap[i + 1].beat : Infinity;
    if (beat <= cur.beat) break;
    const segmentEnd = Math.min(beat, nextBeat);
    const segBeats = segmentEnd - cur.beat;
    const effBpm = cur.bpm * rateMultiplier;
    seconds += (segBeats * 60) / effBpm;
  }
  return seconds;
}

export function secondsToBeat(targetSeconds, tempoMap, rateMultiplier = 1.0) {
  let elapsed = 0;
  for (let i = 0; i < tempoMap.length; i++) {
    const cur = tempoMap[i];
    const nextBeat = i + 1 < tempoMap.length ? tempoMap[i + 1].beat : Infinity;
    const effBpm = cur.bpm * rateMultiplier;
    if (nextBeat === Infinity) {
      return cur.beat + ((targetSeconds - elapsed) * effBpm) / 60;
    }
    const segDur = ((nextBeat - cur.beat) * 60) / effBpm;
    if (elapsed + segDur >= targetSeconds) {
      return cur.beat + ((targetSeconds - elapsed) * effBpm) / 60;
    }
    elapsed += segDur;
  }
  return 0;
}
