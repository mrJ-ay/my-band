import { INSTRUMENTS, ENSEMBLE_PRESETS } from './presets.js';

// Theme & Stage Formation Configurations per Ensemble
export const STAGE_THEMES = {
  symphony: {
    id: 'symphony',
    label: '심포니 콘서트홀',
    en: 'SYMPHONY CONCERT HALL',
    accent: '#d4a259',
    accentSoft: 'rgba(212, 162, 89, 0.32)',
    bgCss: 'radial-gradient(ellipse at 50% 0%, rgba(165, 58, 52, 0.34), transparent 62%), radial-gradient(ellipse at 50% 100%, rgba(212, 162, 89, 0.16), #0d0c11 72%)',
    floorColor: '#241819',
    backdropSvg: `
      <path d="M40,210 Q500,30 960,210" fill="none" stroke="rgba(212,162,89,0.18)" stroke-width="2"/>
      <path d="M120,210 Q500,72 880,210" fill="none" stroke="rgba(212,162,89,0.12)" stroke-width="1.5"/>
      <g opacity="0.16" fill="#d4a259">
        <rect x="455" y="18" width="6" height="58" rx="2"/><rect x="466" y="10" width="7" height="66" rx="2"/>
        <rect x="478" y="4" width="8" height="72" rx="2"/><rect x="491" y="0" width="18" height="76" rx="2"/>
        <rect x="514" y="4" width="8" height="72" rx="2"/><rect x="527" y="10" width="7" height="66" rx="2"/>
        <rect x="539" y="18" width="6" height="58" rx="2"/>
      </g>`
  },
  chamber: {
    id: 'chamber',
    label: '클래식 살롱 홀',
    en: 'CHAMBER SALON',
    accent: '#9fb4d8',
    accentSoft: 'rgba(159, 180, 216, 0.34)',
    bgCss: 'radial-gradient(circle at 50% 15%, rgba(159, 180, 216, 0.25), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(212, 162, 89, 0.12), #0f1118 75%)',
    floorColor: '#1a1c26',
    backdropSvg: `
      <rect x="180" y="14" width="640" height="150" rx="80" fill="none" stroke="rgba(159,180,216,0.14)" stroke-width="1.5"/>
      <line x1="120" y1="186" x2="880" y2="186" stroke="rgba(159,180,216,0.12)" stroke-width="1"/>`
  },
  film: {
    id: 'film',
    label: '시네마틱 스코어링 스테이지',
    en: 'FILM SCORING STAGE',
    accent: '#e08b67',
    accentSoft: 'rgba(224, 139, 103, 0.35)',
    bgCss: 'radial-gradient(ellipse at 50% 20%, rgba(45, 118, 148, 0.35), transparent 58%), radial-gradient(ellipse at 50% 85%, rgba(224, 139, 103, 0.16), #080d14 75%)',
    floorColor: '#111824',
    backdropSvg: `
      <rect x="150" y="12" width="700" height="106" rx="6" fill="rgba(45,118,148,0.08)" stroke="rgba(224,139,103,0.22)" stroke-width="1.5"/>
      <line x1="80" y1="65" x2="920" y2="65" stroke="rgba(130,210,255,0.14)" stroke-width="2" stroke-dasharray="10 8"/>`
  },
  rock: {
    id: 'rock',
    label: '일렉트릭 록 아레나',
    en: 'ROCK ARENA STAGE',
    accent: '#ff4e5b',
    accentSoft: 'rgba(255, 78, 91, 0.38)',
    bgCss: 'radial-gradient(circle at 25% 10%, rgba(255, 62, 85, 0.28), transparent 48%), radial-gradient(circle at 75% 10%, rgba(168, 70, 255, 0.26), transparent 48%), #0c0910',
    floorColor: '#15101b',
    backdropSvg: `
      <line x1="110" y1="12" x2="890" y2="12" stroke="rgba(255,78,91,0.3)" stroke-width="4"/>
      <polygon points="180,14 90,210 270,210" fill="rgba(255,78,91,0.06)"/>
      <polygon points="820,14 730,210 910,210" fill="rgba(168,70,255,0.06)"/>
      <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,78,91,0.2)">
        <rect x="120" y="96" width="52" height="72" rx="4"/><rect x="828" y="96" width="52" height="72" rx="4"/>
      </g>`
  },
  pop: {
    id: 'pop',
    label: '네온 팝 라이브 스테이지',
    en: 'NEON POP LIVE',
    accent: '#5ce1c6',
    accentSoft: 'rgba(92, 225, 198, 0.35)',
    bgCss: 'radial-gradient(circle at 30% 15%, rgba(92, 225, 198, 0.25), transparent 50%), radial-gradient(circle at 75% 15%, rgba(244, 114, 182, 0.2), transparent 50%), #0a1016',
    floorColor: '#101b22',
    backdropSvg: `
      <circle cx="500" cy="105" r="78" fill="none" stroke="rgba(92,225,198,0.18)" stroke-width="2"/>
      <circle cx="500" cy="105" r="52" fill="none" stroke="rgba(244,114,182,0.16)" stroke-width="1.5"/>`
  },
  jazz: {
    id: 'jazz',
    label: '미드나잇 재즈 클럽',
    en: 'MIDNIGHT JAZZ LOUNGE',
    accent: '#f0b14b',
    accentSoft: 'rgba(240, 177, 75, 0.36)',
    bgCss: 'radial-gradient(circle at 50% 18%, rgba(240, 177, 75, 0.24), transparent 52%), radial-gradient(ellipse at 50% 100%, rgba(35, 58, 122, 0.32), #090b14 75%)',
    floorColor: '#141524',
    backdropSvg: `
      <path d="M260,210 L260,72 A240,72 0 0,1 740,72 L740,210" fill="none" stroke="rgba(240,177,75,0.2)" stroke-width="2"/>
      <ellipse cx="500" cy="182" rx="310" ry="30" fill="rgba(240,177,75,0.06)" stroke="rgba(240,177,75,0.16)"/>`
  },
  marching: {
    id: 'marching',
    label: '스타디움 마칭 필드',
    en: 'MARCHING STADIUM FIELD',
    accent: '#ff963c',
    accentSoft: 'rgba(255, 150, 60, 0.36)',
    bgCss: 'linear-gradient(180deg, rgba(16, 26, 46, 0.95) 0%, rgba(20, 64, 42, 0.72) 55%, rgba(16, 52, 34, 0.95) 100%)',
    floorColor: '#163d28',
    backdropSvg: `
      <g stroke="rgba(255,255,255,0.14)" stroke-width="1.5">
        <line x1="160" y1="60" x2="100" y2="210"/>
        <line x1="330" y1="60" x2="290" y2="210"/>
        <line x1="500" y1="60" x2="500" y2="210"/>
        <line x1="670" y1="60" x2="710" y2="210"/>
        <line x1="840" y1="60" x2="900" y2="210"/>
        <line x1="80" y1="115" x2="920" y2="115" stroke-dasharray="6 6"/>
      </g>
      <circle cx="140" cy="22" r="14" fill="rgba(255,220,160,0.14)"/>
      <circle cx="860" cy="22" r="14" fill="rgba(255,220,160,0.14)"/>`
  },
  brass: {
    id: 'brass',
    label: '로열 브라스 파빌리온',
    en: 'ROYAL BRASS PAVILION',
    accent: '#f5cb42',
    accentSoft: 'rgba(245, 203, 66, 0.36)',
    bgCss: 'radial-gradient(ellipse at 50% 0%, rgba(245, 203, 66, 0.28), transparent 62%), #110f0a',
    floorColor: '#211c12',
    backdropSvg: `
      <g stroke="rgba(245,203,66,0.18)" fill="rgba(245,203,66,0.04)">
        <rect x="90" y="18" width="24" height="175" rx="3"/><rect x="886" y="18" width="24" height="175" rx="3"/>
        <path d="M90,26 Q500,80 910,26" fill="none" stroke-width="2"/>
      </g>`
  }
};

// Detailed, recognizable SVG artwork per instrument type
function getInstrumentGlyphSvg(instrumentKey) {
  const inst = INSTRUMENTS[instrumentKey] || INSTRUMENTS.acoustic_grand_piano;

  if (instrumentKey === 'percussion_kit' || instrumentKey === 'timpani') {
    if (instrumentKey === 'timpani') {
      return `
        <svg viewBox="0 0 64 64" class="inst-svg">
          <ellipse cx="22" cy="28" rx="14" ry="7" fill="currentColor" opacity="0.25" stroke="currentColor" stroke-width="2.5"/>
          <path d="M8,28 Q10,50 22,52 Q34,50 36,28" fill="currentColor" opacity="0.55" stroke="currentColor" stroke-width="2"/>
          <ellipse cx="44" cy="31" rx="12" ry="6" fill="currentColor" opacity="0.25" stroke="currentColor" stroke-width="2.5"/>
          <path d="M32,31 Q34,50 44,52 Q54,50 56,31" fill="currentColor" opacity="0.55" stroke="currentColor" stroke-width="2"/>
          <line x1="14" y1="12" x2="24" y2="26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="14" cy="12" r="3" fill="currentColor"/>
        </svg>`;
    }
    return `
      <svg viewBox="0 0 64 64" class="inst-svg">
        <circle cx="32" cy="38" r="15" fill="currentColor" opacity="0.22" stroke="currentColor" stroke-width="2.8"/>
        <circle cx="32" cy="38" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <rect x="11" y="21" width="15" height="9" rx="2" fill="currentColor" opacity="0.45" stroke="currentColor" stroke-width="2"/>
        <rect x="38" y="21" width="15" height="9" rx="2" fill="currentColor" opacity="0.45" stroke="currentColor" stroke-width="2"/>
        <line x1="14" y1="13" x2="26" y2="13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="40" y1="11" x2="54" y2="15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
  }

  if (instrumentKey === 'violin' || instrumentKey === 'viola' || instrumentKey === 'cello' || instrumentKey === 'contrabass') {
    const isLarge = instrumentKey === 'cello' || instrumentKey === 'contrabass';
    return `
      <svg viewBox="0 0 64 64" class="inst-svg">
        <path d="M32,8 L32,26" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="7" r="3" fill="currentColor"/>
        <path d="M24,25 C17,27 17,35 22,38 C16,42 17,53 32,53 C47,53 48,42 42,38 C47,35 47,27 40,25 Z" fill="currentColor" opacity="0.45" stroke="currentColor" stroke-width="2.2"/>
        <line x1="14" y1="45" x2="50" y2="28" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        ${isLarge ? '<line x1="32" y1="53" x2="32" y2="60" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' : ''}
      </svg>`;
  }

  if (instrumentKey === 'trumpet' || instrumentKey === 'trombone' || instrumentKey === 'brass_section') {
    return `
      <svg viewBox="0 0 64 64" class="inst-svg">
        <path d="M10,33 L40,33 L54,23 L54,43 L40,33" fill="currentColor" opacity="0.4" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
        <rect x="22" y="25" width="12" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
        <line x1="25" y1="22" x2="25" y2="25" stroke="currentColor" stroke-width="2"/>
        <line x1="28" y1="22" x2="28" y2="25" stroke="currentColor" stroke-width="2"/>
        <line x1="31" y1="22" x2="31" y2="25" stroke="currentColor" stroke-width="2"/>
      </svg>`;
  }

  if (instrumentKey === 'french_horn' || instrumentKey === 'tuba') {
    return `
      <svg viewBox="0 0 64 64" class="inst-svg">
        <circle cx="30" cy="34" r="15" fill="currentColor" opacity="0.25" stroke="currentColor" stroke-width="3"/>
        <circle cx="30" cy="34" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M41,42 L53,51 L55,34 Z" fill="currentColor" opacity="0.6" stroke="currentColor" stroke-width="2"/>
        <path d="M15,24 L10,16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
  }

  if (instrumentKey === 'alto_sax' || instrumentKey === 'tenor_sax') {
    return `
      <svg viewBox="0 0 64 64" class="inst-svg">
        <path d="M22,12 L28,12 L34,42 C35,50 45,50 47,42 L49,33 L42,31" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M41,31 L53,33 L48,43 Z" fill="currentColor" opacity="0.45"/>
        <circle cx="31" cy="24" r="1.8" fill="currentColor"/><circle cx="32" cy="30" r="1.8" fill="currentColor"/><circle cx="33" cy="36" r="1.8" fill="currentColor"/>
      </svg>`;
  }

  if (inst.category === '목관악기') {
    const isFlute = instrumentKey === 'flute' || instrumentKey === 'piccolo';
    return isFlute
      ? `<svg viewBox="0 0 64 64" class="inst-svg">
           <line x1="8" y1="36" x2="56" y2="24" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
           <circle cx="22" cy="32.5" r="2" fill="#0d0e13"/><circle cx="30" cy="30.5" r="2" fill="#0d0e13"/>
           <circle cx="38" cy="28.5" r="2" fill="#0d0e13"/><circle cx="46" cy="26.5" r="2" fill="#0d0e13"/>
         </svg>`
      : `<svg viewBox="0 0 64 64" class="inst-svg">
           <line x1="32" y1="8" x2="32" y2="48" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
           <path d="M25,54 L39,54 L35,46 L29,46 Z" fill="currentColor" opacity="0.7" stroke="currentColor" stroke-width="2"/>
           <circle cx="32" cy="20" r="1.8" fill="#0d0e13"/><circle cx="32" cy="28" r="1.8" fill="#0d0e13"/><circle cx="32" cy="36" r="1.8" fill="#0d0e13"/>
         </svg>`;
  }

  if (inst.category === '기타 · 베이스') {
    return `
      <svg viewBox="0 0 64 64" class="inst-svg">
        <line x1="48" y1="12" x2="34" y2="28" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M35,27 C41,31 43,40 36,47 C29,54 18,52 14,45 C10,38 14,29 22,27 C27,26 30,24 35,27 Z" fill="currentColor" opacity="0.45" stroke="currentColor" stroke-width="2.2"/>
        <circle cx="26" cy="39" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
      </svg>`;
  }

  if (instrumentKey === 'orchestral_harp') {
    return `
      <svg viewBox="0 0 64 64" class="inst-svg">
        <path d="M18,52 L18,12 C32,12 42,22 48,18 L24,52 Z" fill="currentColor" opacity="0.22" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
        <line x1="25" y1="15" x2="25" y2="49" stroke="currentColor" stroke-width="1.2"/>
        <line x1="31" y1="17" x2="31" y2="44" stroke="currentColor" stroke-width="1.2"/>
        <line x1="37" y1="19" x2="37" y2="36" stroke="currentColor" stroke-width="1.2"/>
      </svg>`;
  }

  // Keyboard / Piano / Choir / Pad default
  return `
    <svg viewBox="0 0 64 64" class="inst-svg">
      <rect x="10" y="18" width="44" height="28" rx="4" fill="currentColor" opacity="0.22" stroke="currentColor" stroke-width="2.4"/>
      <line x1="21" y1="18" x2="21" y2="46" stroke="currentColor" stroke-width="1.3"/>
      <line x1="32" y1="18" x2="32" y2="46" stroke="currentColor" stroke-width="1.3"/>
      <line x1="43" y1="18" x2="43" y2="46" stroke="currentColor" stroke-width="1.3"/>
      <rect x="18" y="18" width="6" height="16" rx="1" fill="currentColor"/>
      <rect x="29" y="18" width="6" height="16" rx="1" fill="currentColor"/>
      <rect x="40" y="18" width="6" height="16" rx="1" fill="currentColor"/>
    </svg>`;
}

/**
 * Determine if track has an active sounding note at currentBeat using binary search
 * Returns intensity in [0, 1].
 */
function getTrackActivityAtBeat(track, currentBeat) {
  const notes = track.notes;
  if (!notes || notes.length === 0) return 0;

  // Binary search for last note with startBeat <= currentBeat
  let lo = 0;
  let hi = notes.length - 1;
  let candidate = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (notes[mid].startBeat <= currentBeat + 0.02) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (candidate === -1) return 0;

  // Check backwards a few notes (for chords / sustained notes)
  let maxIntensity = 0;
  for (let i = candidate; i >= Math.max(0, candidate - 8); i--) {
    const n = notes[i];
    const endBeat = n.startBeat + Math.max(0.2, n.durationBeats);
    if (currentBeat >= n.startBeat - 0.02 && currentBeat <= endBeat + 0.06) {
      const age = Math.max(0, currentBeat - n.startBeat);
      const decay = Math.max(0.38, 1 - age / Math.max(0.5, n.durationBeats * 1.15));
      if (decay > maxIntensity) maxIntensity = decay;
    }
  }
  return maxIntensity;
}

/**
 * Resolve ensemble theme key cleanly even for 'original' or 'custom' projects
 */
export function resolveStageThemeId(project) {
  if (!project) return 'symphony';
  if (STAGE_THEMES[project.ensembleId]) return project.ensembleId;

  // Infer visual stage from actual instrument composition
  const keys = (project.tracks || []).map((t) => t.instrumentKey);
  if (keys.some((k) => k === 'distortion_guitar' || k === 'electric_guitar_clean')) return 'rock';
  if (keys.some((k) => k === 'alto_sax' || k === 'tenor_sax')) return 'jazz';
  if (keys.some((k) => k === 'tuba') && !keys.some((k) => k === 'violin')) return 'brass';
  if (keys.length <= 5 && keys.every((k) => ['violin', 'viola', 'cello', 'flute', 'acoustic_grand_piano'].includes(k))) {
    return 'chamber';
  }
  return 'symphony';
}

export class LiveStageVisualizer {
  constructor(containerEl, onMusicianClick = null) {
    this.containerEl = containerEl;
    this.onMusicianClick = onMusicianClick;
    this.project = null;
    this.nodeRefs = new Map(); // trackId -> { rootEl, meterEl, pulseEl }
    this.currentThemeId = 'symphony';
  }

  renderStage(project) {
    this.project = project;
    this.nodeRefs.clear();
    if (!project || !this.containerEl) return;

    this.currentThemeId = resolveStageThemeId(project);
    const theme = STAGE_THEMES[this.currentThemeId] || STAGE_THEMES.symphony;

    this.containerEl.style.background = theme.bgCss;
    this.containerEl.style.setProperty('--stage-accent', theme.accent);
    this.containerEl.style.setProperty('--stage-accent-soft', theme.accentSoft);

    const tracks = project.tracks || [];

    this.containerEl.innerHTML = `
      <svg class="stage-backdrop-svg" viewBox="0 0 1000 210" preserveAspectRatio="none">
        ${theme.backdropSvg}
      </svg>
      <div class="stage-floor-arc" style="background: radial-gradient(ellipse at 50% 0%, ${theme.floorColor}, rgba(8,8,12,0.92) 75%);"></div>
      <div class="stage-hud-top">
        <span class="stage-theme-pill">✦ ${theme.label}</span>
        <span class="stage-sub-hint">연주 중인 악기가 실시간으로 빛납니다 · 클릭하여 단독 듣기</span>
      </div>
      <div class="stage-musicians-arc" id="stageMusiciansArc"></div>
    `;

    const arcEl = this.containerEl.querySelector('#stageMusiciansArc');

    tracks.forEach((track, idx) => {
      const inst = INSTRUMENTS[track.instrumentKey] || INSTRUMENTS.acoustic_grand_piano;
      const musicianEl = document.createElement('button');
      musicianEl.type = 'button';
      musicianEl.className = 'stage-musician';
      musicianEl.dataset.trackId = track.id;

      // Subtle semicircle seating arc vertical curve + slight staggered depth
      const total = tracks.length;
      const norm = total > 1 ? (idx / (total - 1)) * 2 - 1 : 0; // -1 to +1
      const arcLift = Math.round((1 - norm * norm) * 14);
      musicianEl.style.setProperty('--arc-y', `${arcLift}px`);

      musicianEl.innerHTML = `
        <div class="musician-spotlight"></div>
        <div class="musician-pulse-ring"></div>
        <div class="musician-glyph">${getInstrumentGlyphSvg(track.instrumentKey)}</div>
        <div class="musician-label">
          <span class="m-name">${inst.ko}</span>
          <span class="m-part">${track.partName}</span>
        </div>
        <div class="musician-energy-bar"><span class="energy-fill"></span></div>
      `;

      musicianEl.addEventListener('click', () => {
        if (this.onMusicianClick) {
          this.onMusicianClick(track.id);
        }
      });

      arcEl.appendChild(musicianEl);

      this.nodeRefs.set(track.id, {
        rootEl: musicianEl,
        energyEl: musicianEl.querySelector('.energy-fill')
      });
    });

    this.updateFrame(0, false);
  }

  updateFrame(currentBeat, isPlaying) {
    if (!this.project) return;
    const tracks = this.project.tracks || [];
    const anySolo = tracks.some((t) => t.solo);

    for (const track of tracks) {
      const refs = this.nodeRefs.get(track.id);
      if (!refs) continue;

      const isAudible = anySolo ? track.solo : !track.muted;
      refs.rootEl.classList.toggle('muted-slot', !isAudible);
      refs.rootEl.classList.toggle('solo-slot', Boolean(track.solo));

      if (!isPlaying || !isAudible) {
        refs.rootEl.classList.remove('playing-glow');
        refs.rootEl.style.setProperty('--glow-intensity', '0');
        refs.energyEl.style.width = '0%';
        continue;
      }

      const intensity = getTrackActivityAtBeat(track, currentBeat);
      if (intensity > 0.05) {
        refs.rootEl.classList.add('playing-glow');
        refs.rootEl.style.setProperty('--glow-intensity', intensity.toFixed(2));
        refs.energyEl.style.width = `${Math.round(intensity * 100)}%`;
      } else {
        refs.rootEl.classList.remove('playing-glow');
        refs.rootEl.style.setProperty('--glow-intensity', '0');
        refs.energyEl.style.width = '0%';
      }
    }
  }
}
