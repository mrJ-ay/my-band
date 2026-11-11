import {
  INSTRUMENTS,
  ENSEMBLE_PRESETS,
  remapPartToEnsemble,
  applyEnsembleSpatialBalance
} from './presets.js';
import {
  readScoreFileAsXML,
  mergeMusicXMLStrings,
  parseMusicXML,
  buildRecognitionSummary
} from './musicxml-parser.js';
import { EnsembleAudioEngine } from './audio-engine.js';
import { ScoreDisplayView } from './osmd-view.js';
import { SAMPLE_SCORES } from './samples.js';
import {
  listRecentProjects,
  saveProject,
  deleteProject,
  decompressProjectXml
} from './storage.js';
import {
  startOneIdLogin,
  handleOneIdCallback,
  fetchCurrentOneIdUser,
  clearOneIdSession
} from './auth.js';
import { LiveStageVisualizer } from './stage-visualizer.js';

// ==========================================================================
// Application State
// ==========================================================================
const state = {
  currentScreen: 'home',
  currentUser: null,
  mode: 'simple', // 'simple' | 'studio'
  selectedEnsemble: {
    type: 'original', // 'original' | 'preset' | 'custom'
    id: 'original',
    name: '원본 악보 유지',
    lineup: [],
    reverb: 0.28
  },
  customLineup: ['violin', 'violin', 'cello', 'flute', 'trumpet', 'percussion_kit'],
  pickerCategory: '전체',
  pendingAnalysis: null, // Parsed score awaiting studio entry
  activeProject: null // Loaded scoreData in Studio
};

const audioEngine = new EnsembleAudioEngine();
const osmdView = new ScoreDisplayView(document.getElementById('osmdContainer'));
osmdView.onPageChange = ({ pagingEnabled, pageIndex, totalPages, startMeasure, endMeasure }) => {
  const ctrl = document.getElementById('scorePageControls');
  const lbl = document.getElementById('pageRangeLabel');
  if (!ctrl || !lbl) return;
  ctrl.classList.toggle('hidden', !pagingEnabled);
  if (pagingEnabled) {
    lbl.textContent = `${startMeasure}~${endMeasure}마디 (${pageIndex + 1}/${totalPages})`;
  }
};
const liveStage = new LiveStageVisualizer(
  document.getElementById('liveStagePanel'),
  (trackId) => {
    if (!state.activeProject) return;
    const track = state.activeProject.tracks.find((t) => t.id === trackId);
    if (!track) return;
    track.solo = !track.solo;
    audioEngine.syncTrackMixerStates();
    renderStudioTracks();
    liveStage.updateFrame(audioEngine.getCurrentBeat(), audioEngine.isPlaying);
  }
);

// ==========================================================================
// Utility & UI Helpers
// ==========================================================================
function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const total = Math.floor(sec);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function navigateTo(screenName) {
  state.currentScreen = screenName;
  document.querySelectorAll('.screen').forEach((el) => {
    el.classList.toggle('active', el.id === `screen-${screenName}`);
  });
  document.querySelectorAll('.main-nav .nav-pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.screen === screenName);
  });

  if (screenName === 'home') {
    renderHomeRecentProjects();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSelectedBandHeader() {
  const labelEl = document.getElementById('headerBandLabel');
  const mappingTitleEl = document.getElementById('mappingEnsembleTitle');
  labelEl.textContent = `선택된 악단: ${state.selectedEnsemble.name}`;
  if (mappingTitleEl) {
    mappingTitleEl.textContent =
      state.selectedEnsemble.type === 'original'
        ? '기본 오케스트라 밸런스로 보정'
        : `'${state.selectedEnsemble.name}' 구성으로 자동 변환`;
  }
}

function setMode(mode) {
  state.mode = mode;
  document.body.classList.toggle('mode-studio', mode === 'studio');
  document.getElementById('modeSimpleBtn').classList.toggle('active', mode === 'simple');
  document.getElementById('modeStudioBtn').classList.toggle('active', mode === 'studio');
  document.getElementById('transportModeTag').textContent =
    mode === 'simple' ? '간단 모드' : '스튜디오 모드';

  // Update friendly terminology vs technical labels
  document.getElementById('speedLabelText').textContent =
    mode === 'simple' ? '재생 속도' : '템포 · 재생 속도';

  if (state.activeProject) {
    renderStudioTracks();
  }
}

// ==========================================================================
// Screen 1: Home Rendering
// ==========================================================================
function renderHomeSamples() {
  const grid = document.getElementById('homeSampleGrid');
  grid.innerHTML = SAMPLE_SCORES.map(
    (s) => `
    <article class="sample-card">
      <div>
        <span class="card-tag">${s.tag}</span>
        <h3>${s.title}</h3>
        <p>${s.subtitle}</p>
      </div>
      <button type="button" class="btn-primary btn-sm sample-play-trigger" data-sample-id="${s.id}">
        ▶ 바로 합주 듣기
      </button>
    </article>
  `
  ).join('');

  grid.querySelectorAll('.sample-play-trigger').forEach((btn) => {
    btn.addEventListener('click', () => loadSampleIntoStudio(btn.dataset.sampleId));
  });
}

function renderHomeRecentProjects() {
  const grid = document.getElementById('homeRecentGrid');
  const projects = listRecentProjects();

  if (projects.length === 0) {
    grid.innerHTML = `
      <div class="empty-recent-box">
        아직 저장한 악단 프로젝트가 없습니다. 위의 샘플 악보를 실행하거나 악보를 업로드해 저장해 보세요!
      </div>`;
    return;
  }

  grid.innerHTML = projects
    .map((p) => {
      const dateStr = new Date(p.updatedAt).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `
      <article class="recent-card">
        <div>
          <span class="card-tag">${p.ensembleLabel}</span>
          <h3>${p.title}</h3>
          <p>악기 ${p.instrumentCount}파트 · ${dateStr}</p>
        </div>
        <div class="recent-actions">
          <button type="button" class="btn-primary btn-sm resume-proj-btn" data-id="${p.id}">스튜디오 열기</button>
          <button type="button" class="btn-ghost btn-sm delete-proj-btn" data-id="${p.id}">삭제</button>
        </div>
      </article>`;
    })
    .join('');

  grid.querySelectorAll('.resume-proj-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const proj = listRecentProjects().find((x) => x.id === btn.dataset.id);
      if (proj) resumeSavedProject(proj);
    });
  });

  grid.querySelectorAll('.delete-proj-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteProject(btn.dataset.id);
      renderHomeRecentProjects();
      showToast('저장된 프로젝트를 삭제했습니다.');
    });
  });
}

// ==========================================================================
// Screen 2: Ensembles (Presets + Custom Builder)
// ==========================================================================
function renderEnsemblePresets() {
  const grid = document.getElementById('presetEnsemblesGrid');
  grid.innerHTML = ENSEMBLE_PRESETS.map((preset) => {
    const isSel = state.selectedEnsemble.type === 'preset' && state.selectedEnsemble.id === preset.id;
    const uniqueNames = Array.from(
      new Set(preset.lineup.map((k) => INSTRUMENTS[k]?.ko || k))
    ).slice(0, 6);

    return `
      <article class="preset-card ${isSel ? 'selected' : ''}" data-preset-id="${preset.id}">
        <div class="preset-top">
          <span class="preset-icon">${preset.icon}</span>
          <span class="preset-tag">${preset.tag}</span>
        </div>
        <div>
          <h3>${preset.ko}</h3>
          <span class="preset-en">${preset.en}</span>
        </div>
        <p class="preset-desc">${preset.desc}</p>
        <div class="preset-lineup">
          ${uniqueNames.map((n) => `<span>${n}</span>`).join('')}
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('.preset-card').forEach((card) => {
    card.addEventListener('click', () => {
      const preset = ENSEMBLE_PRESETS.find((p) => p.id === card.dataset.presetId);
      if (!preset) return;
      state.selectedEnsemble = {
        type: 'preset',
        id: preset.id,
        name: preset.ko,
        lineup: preset.lineup.slice(),
        reverb: preset.reverb
      };
      updateSelectedBandHeader();
      renderEnsemblePresets();
      showToast(`'${preset.ko}' 악단을 선택했습니다.`);
    });
  });
}

function renderCustomPicker() {
  const allInstruments = Object.values(INSTRUMENTS);
  const categories = ['전체', ...Array.from(new Set(allInstruments.map((i) => i.category)))];

  const tabsEl = document.getElementById('pickerCategoryTabs');
  tabsEl.innerHTML = categories
    .map(
      (cat) =>
        `<button type="button" class="filter-chip ${state.pickerCategory === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>`
    )
    .join('');

  tabsEl.querySelectorAll('.filter-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.pickerCategory = btn.dataset.cat;
      renderCustomPicker();
    });
  });

  const filtered =
    state.pickerCategory === '전체'
      ? allInstruments
      : allInstruments.filter((i) => i.category === state.pickerCategory);

  const pickerGrid = document.getElementById('instrumentPickerGrid');
  pickerGrid.innerHTML = filtered
    .map(
      (inst) => `
    <div class="inst-pick-card">
      <div>
        <strong>${inst.ko}</strong>
        <small>${inst.en} · ${inst.category}</small>
      </div>
      <div class="inst-pick-btns">
        <button type="button" class="btn-mini preview-inst-btn" data-key="${inst.key}">🔊 소리</button>
        <button type="button" class="btn-mini add add-inst-btn" data-key="${inst.key}">+ 추가</button>
      </div>
    </div>`
    )
    .join('');

  pickerGrid.querySelectorAll('.preview-inst-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      audioEngine.previewInstrument(btn.dataset.key);
    });
  });

  pickerGrid.querySelectorAll('.add-inst-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.customLineup.push(btn.dataset.key);
      renderCustomLineup();
    });
  });
}

function renderCustomLineup() {
  const listEl = document.getElementById('customLineupList');
  document.getElementById('customLineupCount').textContent = state.customLineup.length;

  if (state.customLineup.length === 0) {
    listEl.innerHTML = `<div class="empty-recent-box">왼쪽에서 원하는 악기를 추가하세요.</div>`;
    return;
  }

  // Group display with individual removal buttons
  listEl.innerHTML = state.customLineup
    .map((key, idx) => {
      const inst = INSTRUMENTS[key];
      return `
      <div class="lineup-row">
        <span>${idx + 1}. <strong>${inst ? inst.ko : key}</strong></span>
        <button type="button" class="remove-lineup-btn" data-idx="${idx}" title="삭제">✕</button>
      </div>`;
    })
    .join('');

  listEl.querySelectorAll('.remove-lineup-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      state.customLineup.splice(idx, 1);
      renderCustomLineup();
    });
  });
}

// ==========================================================================
// Screen 3: Upload & Score Analysis
// ==========================================================================
function renderUploadSamplePills() {
  const row = document.getElementById('uploadSamplePills');
  row.innerHTML = SAMPLE_SCORES.map(
    (s) => `<button type="button" class="sample-pill-btn" data-sample-id="${s.id}">🎼 ${s.title}</button>`
  ).join('');

  row.querySelectorAll('.sample-pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sample = SAMPLE_SCORES.find((s) => s.id === btn.dataset.sampleId);
      if (sample) {
        processXmlEntries([{ name: sample.title, xml: sample.xml }], sample.title);
      }
    });
  });
}

async function handleUploadedFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) =>
    /\.(musicxml|xml|mxl)$/i.test(f.name)
  );
  if (files.length === 0) {
    showToast('지원되는 악보 파일(.musicxml, .xml, .mxl)을 선택해 주세요.');
    return;
  }

  try {
    showToast(`악보 파일 ${files.length}개를 분석하고 있습니다...`);
    const xmlEntries = [];
    for (const file of files) {
      const xml = await readScoreFileAsXML(file);
      xmlEntries.push({ name: file.name, xml });
    }
    const fallbackTitle = files[0].name.replace(/\.(musicxml|xml|mxl)$/i, '');
    processXmlEntries(xmlEntries, fallbackTitle);
  } catch (err) {
    console.error(err);
    showToast(`악보 분석 오류: ${err.message}`);
  }
}

function processXmlEntries(xmlEntries, fallbackTitle) {
  try {
    const unifiedXml = mergeMusicXMLStrings(xmlEntries);
    const parsed = parseMusicXML(unifiedXml, fallbackTitle);
    if (!parsed.tracks || parsed.tracks.length === 0) {
      throw new Error('악보에서 연주 가능한 파트를 찾지 못했습니다.');
    }
    state.pendingAnalysis = parsed;
    showAnalysisResult(parsed);
  } catch (err) {
    console.error(err);
    showToast(`악보 파싱 오류: ${err.message}`);
  }
}

function showAnalysisResult(parsed) {
  document.getElementById('analysisEmptyState').classList.add('hidden');
  document.getElementById('analysisResultState').classList.remove('hidden');

  document.getElementById('recognitionHeadline').textContent = parsed.recognitionSummary.headline;
  document.getElementById('recognitionMeta').textContent = `${parsed.title} · 기본 템포 ${Math.round(
    parsed.baseBpm
  )} BPM · 총 ${parsed.measureTimeline.length}마디`;

  const chipsEl = document.getElementById('recognizedInstrumentList');
  chipsEl.innerHTML = parsed.recognitionSummary.items
    .map((item) => `<div class="rec-chip">${item.name} <span>× ${item.count}</span></div>`)
    .join('');

  updateSelectedBandHeader();
}

// ==========================================================================
// Entering Studio & Applying Ensemble Mapping
// ==========================================================================
function applyEnsembleMappingToTracks(scoreData, mappingType, customName = null) {
  if (mappingType === 'original') {
    scoreData.tracks.forEach((t) => {
      t.instrumentKey = t.originalInstrumentKey;
      t.displayName = INSTRUMENTS[t.instrumentKey]?.ko || t.partName;
    });
    scoreData.ensembleId = 'original';
    scoreData.ensembleLabel = '원본 악보 구성';
  } else if (mappingType === 'custom') {
    const lineup = state.customLineup;
    if (lineup.length > 0) {
      scoreData.tracks.forEach((t, idx) => {
        if (INSTRUMENTS[t.originalInstrumentKey]?.isPercussion) {
          t.instrumentKey = lineup.includes('percussion_kit') ? 'percussion_kit' : t.originalInstrumentKey;
        } else {
          t.instrumentKey = lineup[idx % lineup.length];
        }
        t.displayName = INSTRUMENTS[t.instrumentKey]?.ko || t.partName;
      });
    }
    scoreData.ensembleId = 'custom';
    scoreData.ensembleLabel = customName || state.selectedEnsemble.name || '자유 구성 악단';
  } else {
    const presetId = mappingType;
    const preset = ENSEMBLE_PRESETS.find((p) => p.id === presetId);
    scoreData.tracks.forEach((t) => {
      t.instrumentKey = remapPartToEnsemble(t.originalInstrumentKey, t.avgMidi, presetId);
      t.displayName = INSTRUMENTS[t.instrumentKey]?.ko || t.partName;
    });
    scoreData.ensembleId = presetId;
    scoreData.ensembleLabel = preset ? preset.ko : '프리셋 악단';
    if (preset) {
      audioEngine.setReverb(preset.reverb);
      document.getElementById('reverbSlider').value = Math.round(preset.reverb * 100);
      document.getElementById('reverbVal').textContent = `${Math.round(preset.reverb * 100)}%`;
    }
  }

  applyEnsembleSpatialBalance(scoreData.tracks);
}

async function openScoreInStudio(scoreData, { autoPlay = false, presetOverride = null } = {}) {
  state.activeProject = scoreData;

  if (presetOverride) {
    applyEnsembleMappingToTracks(scoreData, presetOverride);
  }

  navigateTo('studio');
  document.getElementById('studioProjectTitle').value = scoreData.title;
  document.getElementById('studioTempoBadge').textContent = `${Math.round(scoreData.baseBpm)} BPM`;

  // Populate OSMD part filter dropdown
  const partFilter = document.getElementById('scorePartFilterSelect');
  partFilter.innerHTML =
    `<option value="-1">전체 총보 (모든 악기)</option>` +
    scoreData.tracks
      .map((t, idx) => `<option value="${idx}">${idx + 1}. ${t.partName} (${t.displayName})</option>`)
      .join('');
  osmdView.visiblePartIndex = -1;

  // Bind audio engine
  audioEngine.setRateMultiplier(1.0);
  document.getElementById('speedSlider').value = 100;
  updateSpeedLabel(100);
  audioEngine.setScore(scoreData);

  renderStudioTracks();
  renderStudioQuickPresets();
  liveStage.renderStage(scoreData);
  updateSoundfontBadge();

  try {
    await osmdView.loadXML(scoreData.xmlString, scoreData.measureTimeline);
    document.getElementById('measureIndicator').textContent = `마디 1 / ${scoreData.measureTimeline.length}`;
  } catch (err) {
    console.error('OSMD render error:', err);
    showToast('악보 렌더링 중 일부 기호를 생략했습니다.');
  }

  const totalSec = audioEngine.getTotalSeconds();
  document.getElementById('timeDuration').textContent = formatTime(totalSec);
  document.getElementById('timeElapsed').textContent = '00:00';
  document.getElementById('seekSlider').value = 0;

  if (autoPlay) {
    audioEngine.play();
    updatePlayButtonState(true);
  }
}

async function loadSampleIntoStudio(sampleId) {
  const sample = SAMPLE_SCORES.find((s) => s.id === sampleId);
  if (!sample) return;
  const parsed = parseMusicXML(sample.xml, sample.title);
  applyEnsembleSpatialBalance(parsed.tracks);
  parsed.ensembleId = sample.ensembleId;
  const preset = ENSEMBLE_PRESETS.find((p) => p.id === sample.ensembleId);
  parsed.ensembleLabel = preset ? preset.ko : '원본 악보 구성';

  await openScoreInStudio(parsed, { autoPlay: false });
  showToast(`샘플 악보 '${sample.title}'을(를) 불러왔습니다. 재생 버튼을 눌러 감상하세요!`);
}

async function resumeSavedProject(saved) {
  const xmlStr = await decompressProjectXml(saved);
  const parsed = parseMusicXML(xmlStr, saved.title);
  parsed.id = saved.id;
  parsed.ensembleId = saved.ensembleId;
  parsed.ensembleLabel = saved.ensembleLabel;

  // Apply saved track overrides
  if (Array.isArray(saved.trackSettings)) {
    saved.trackSettings.forEach((cfg) => {
      const track = parsed.tracks.find((t) => t.id === cfg.id);
      if (track) {
        track.instrumentKey = cfg.instrumentKey || track.instrumentKey;
        track.displayName = INSTRUMENTS[track.instrumentKey]?.ko || track.partName;
        track.volume = cfg.volume ?? track.volume;
        track.pan = cfg.pan ?? track.pan;
        track.muted = Boolean(cfg.muted);
        track.solo = Boolean(cfg.solo);
      }
    });
  }

  audioEngine.setReverb(saved.reverb ?? 0.28);
  audioEngine.setMasterVolume(saved.masterVolume ?? 0.85);
  document.getElementById('reverbSlider').value = Math.round((saved.reverb ?? 0.28) * 100);
  document.getElementById('reverbVal').textContent = `${Math.round((saved.reverb ?? 0.28) * 100)}%`;
  document.getElementById('masterVolSlider').value = Math.round((saved.masterVolume ?? 0.85) * 100);
  document.getElementById('masterVolVal').textContent = `${Math.round((saved.masterVolume ?? 0.85) * 100)}%`;

  await openScoreInStudio(parsed);
  showToast(`'${saved.title}' 프로젝트를 이어서 열었습니다.`);
}

// ==========================================================================
// Studio UI Rendering & Interactions
// ==========================================================================
function renderStudioTracks() {
  const proj = state.activeProject;
  if (!proj) return;

  const listEl = document.getElementById('studioTrackList');
  document.getElementById('studioTrackCount').textContent = proj.tracks.length;

  const instOptions = Object.values(INSTRUMENTS)
    .map((inst) => `<option value="${inst.key}">${inst.ko} (${inst.category})</option>`)
    .join('');

  listEl.innerHTML = proj.tracks
    .map((t, idx) => {
      const sfStatus = audioEngine.getInstrumentStatus(t.instrumentKey);
      const statusText = sfStatus === 'ready' ? '실제 음원' : sfStatus === 'loading' ? '음원 로딩...' : '신스 음원';
      const instName = INSTRUMENTS[t.instrumentKey]?.ko || t.displayName;
      const muteLabel = state.mode === 'simple' ? '이 악기 끄기' : 'Mute';
      const soloLabel = state.mode === 'simple' ? '이 악기만 듣기' : 'Solo';

      return `
      <div class="track-card ${t.muted ? 'muted' : ''} ${t.solo ? 'soloed' : ''}" data-track-id="${t.id}">
        <div class="track-top">
          <div class="track-name-col">
            <strong>${idx + 1}. ${instName}</strong>
            <small>악보 파트: ${t.partName}</small>
          </div>
          <span class="sf-badge ${sfStatus === 'ready' ? 'ready' : ''}">${statusText}</span>
        </div>

        <div class="track-actions-row">
          <button type="button" class="trk-btn trk-mute-btn ${t.muted ? 'active-mute' : ''}" data-id="${t.id}">
            ${muteLabel}
          </button>
          <button type="button" class="trk-btn trk-solo-btn ${t.solo ? 'active-solo' : ''}" data-id="${t.id}">
            ${soloLabel}
          </button>
        </div>

        <div class="track-studio-controls studio-only">
          <select class="track-select trk-inst-select" data-id="${t.id}" aria-label="악기 음색 변경">
            ${instOptions}
          </select>
          <div class="slider-mini-row">
            <span>음량</span>
            <input type="range" class="trk-vol-slider" data-id="${t.id}" min="0" max="120" value="${Math.round(t.volume * 100)}" />
            <span>${Math.round(t.volume * 100)}%</span>
          </div>
          <div class="slider-mini-row">
            <span>좌우</span>
            <input type="range" class="trk-pan-slider" data-id="${t.id}" min="-100" max="100" value="${Math.round((t.pan || 0) * 100)}" />
            <span>${t.pan === 0 ? '중앙' : t.pan < 0 ? 'L' : 'R'}</span>
          </div>
          <div class="track-actions-row">
            <button type="button" class="btn-mini trk-dup-btn" data-id="${t.id}">+ 파트 복제(더블링)</button>
            ${t.isClone ? `<button type="button" class="btn-mini-danger trk-del-btn" data-id="${t.id}">삭제</button>` : ''}
          </div>
        </div>
      </div>`;
    })
    .join('');

  // Sync select values & bind events
  listEl.querySelectorAll('.trk-inst-select').forEach((sel) => {
    const t = proj.tracks.find((x) => x.id === sel.dataset.id);
    if (t) sel.value = t.instrumentKey;
    sel.addEventListener('change', async () => {
      const track = proj.tracks.find((x) => x.id === sel.dataset.id);
      if (!track) return;
      track.instrumentKey = sel.value;
      track.displayName = INSTRUMENTS[sel.value]?.ko || track.partName;
      applyEnsembleSpatialBalance(proj.tracks);
      audioEngine.syncTrackMixerStates();
      renderStudioTracks();
      liveStage.renderStage(proj);
      await audioEngine.loadInstrumentSoundfont(sel.value);
      updateSoundfontBadge();
    });
  });

  listEl.querySelectorAll('.trk-mute-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const track = proj.tracks.find((x) => x.id === btn.dataset.id);
      if (!track) return;
      track.muted = !track.muted;
      audioEngine.syncTrackMixerStates();
      renderStudioTracks();
      liveStage.updateFrame(audioEngine.getCurrentBeat(), audioEngine.isPlaying);
    });
  });

  listEl.querySelectorAll('.trk-solo-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const track = proj.tracks.find((x) => x.id === btn.dataset.id);
      if (!track) return;
      track.solo = !track.solo;
      audioEngine.syncTrackMixerStates();
      renderStudioTracks();
      liveStage.updateFrame(audioEngine.getCurrentBeat(), audioEngine.isPlaying);
    });
  });

  listEl.querySelectorAll('.trk-vol-slider').forEach((slider) => {
    slider.addEventListener('input', () => {
      const track = proj.tracks.find((x) => x.id === slider.dataset.id);
      if (!track) return;
      track.volume = parseInt(slider.value, 10) / 100;
      slider.nextElementSibling.textContent = `${slider.value}%`;
      audioEngine.syncTrackMixerStates();
    });
  });

  listEl.querySelectorAll('.trk-pan-slider').forEach((slider) => {
    slider.addEventListener('input', () => {
      const track = proj.tracks.find((x) => x.id === slider.dataset.id);
      if (!track) return;
      const val = parseInt(slider.value, 10) / 100;
      track.pan = val;
      slider.nextElementSibling.textContent = val === 0 ? '중앙' : val < 0 ? `L${Math.abs(Math.round(val * 10))}` : `R${Math.round(val * 10)}`;
      audioEngine.syncTrackMixerStates();
    });
  });

  listEl.querySelectorAll('.trk-dup-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = proj.tracks.find((x) => x.id === btn.dataset.id);
      if (!src) return;
      const clone = {
        ...src,
        id: `${src.id}_clone_${Date.now().toString(36)}`,
        partName: `${src.partName} (추가)`,
        isClone: true,
        muted: false,
        solo: false,
        notes: src.notes.map((n) => ({ ...n }))
      };
      proj.tracks.push(clone);
      applyEnsembleSpatialBalance(proj.tracks);
      audioEngine.rebuildTrackNodes();
      renderStudioTracks();
      liveStage.renderStage(proj);
      showToast(`${src.displayName} 파트를 복제해 입체 합주를 구성했습니다.`);
    });
  });

  listEl.querySelectorAll('.trk-del-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = proj.tracks.findIndex((x) => x.id === btn.dataset.id);
      if (idx === -1) return;
      proj.tracks.splice(idx, 1);
      applyEnsembleSpatialBalance(proj.tracks);
      audioEngine.rebuildTrackNodes();
      renderStudioTracks();
      liveStage.renderStage(proj);
    });
  });
}

function renderStudioQuickPresets() {
  const container = document.getElementById('studioQuickPresets');
  const activeId = state.activeProject?.ensembleId || 'original';

  container.innerHTML = ENSEMBLE_PRESETS.map(
    (p) => `
    <button type="button" class="studio-preset-btn ${activeId === p.id ? 'active' : ''}" data-preset-id="${p.id}" title="${p.ko}">
      ${p.icon} ${p.ko}
    </button>
  `
  ).join('');

  container.querySelectorAll('.studio-preset-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!state.activeProject) return;
      applyEnsembleMappingToTracks(state.activeProject, btn.dataset.presetId);
      audioEngine.syncTrackMixerStates();
      liveStage.renderStage(state.activeProject);
      renderStudioTracks();
      renderStudioQuickPresets();
      await audioEngine.preloadScoreInstruments();
      updateSoundfontBadge();
      showToast(`'${state.activeProject.ensembleLabel}' 편성으로 전환했습니다.`);
    });
  });
}

function updateSoundfontBadge() {
  const badge = document.getElementById('soundfontStatusBadge');
  if (!state.activeProject) return;
  const statuses = state.activeProject.tracks.map((t) => audioEngine.getInstrumentStatus(t.instrumentKey));
  if (statuses.some((s) => s === 'loading')) {
    badge.textContent = '실제 악기 음원 로딩 중...';
  } else if (statuses.every((s) => s === 'ready')) {
    badge.textContent = '실제 악기 음원 준비 완료';
  } else {
    badge.textContent = '신스/음원 하이브리드 재생';
  }
}

function updatePlayButtonState(isPlaying) {
  const btn = document.getElementById('tpPlayBtn');
  btn.textContent = isPlaying ? '⏸ 일시정지' : '▶ 합주 재생';
}

function updateSpeedLabel(percent) {
  const rate = percent / 100;
  const baseBpm = state.activeProject?.baseBpm || 108;
  const effBpm = Math.round(baseBpm * rate);
  document.getElementById('speedVal').textContent = `${rate.toFixed(2)}x (${effBpm} BPM)`;
  document.getElementById('studioTempoBadge').textContent = `${effBpm} BPM`;

  document.querySelectorAll('.quick-rate-btns .rate-chip').forEach((chip) => {
    chip.classList.toggle('active', parseInt(chip.dataset.rate, 10) === percent);
  });
}

// ==========================================================================
// Audio Engine Callbacks
// ==========================================================================
audioEngine.onTrackLoadUpdate = () => {
  updateSoundfontBadge();
  if (state.currentScreen === 'studio' && state.activeProject) {
    renderStudioTracks();
  }
};

let isSeeking = false;
let lastUiSecStr = '';
let lastUiDurStr = '';
let lastUiMeasureStr = '';
let lastUiSeekVal = -1;
let lastOsmdSyncMs = 0;

function findMeasureIndexBinary(timeline, beat) {
  if (!timeline || timeline.length === 0) return 0;
  let lo = 0;
  let hi = timeline.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timeline[mid].startBeat <= beat + 0.05) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

audioEngine.onProgress = ({ currentSeconds, totalSeconds, currentBeat, isPlaying }) => {
  if (!state.activeProject) return;

  const secStr = formatTime(currentSeconds);
  if (secStr !== lastUiSecStr) {
    lastUiSecStr = secStr;
    document.getElementById('timeElapsed').textContent = secStr;
  }

  const durStr = formatTime(totalSeconds);
  if (durStr !== lastUiDurStr) {
    lastUiDurStr = durStr;
    document.getElementById('timeDuration').textContent = durStr;
  }

  if (!isSeeking && totalSeconds > 0) {
    const seekVal = Math.round(Math.min(1, Math.max(0, currentSeconds / totalSeconds)) * 1000);
    if (seekVal !== lastUiSeekVal) {
      lastUiSeekVal = seekVal;
      document.getElementById('seekSlider').value = seekVal;
    }
  }

  const timeline = state.activeProject.measureTimeline || [];
  const curMeasure = timeline.length > 0 ? findMeasureIndexBinary(timeline, currentBeat) + 1 : 1;
  const measureStr = `마디 ${curMeasure} / ${timeline.length || '-'}`;
  if (measureStr !== lastUiMeasureStr) {
    lastUiMeasureStr = measureStr;
    document.getElementById('measureIndicator').textContent = measureStr;
  }

  liveStage.updateFrame(currentBeat, isPlaying);

  if (isPlaying || currentBeat > 0) {
    const nowMs = performance.now();
    if (!isPlaying || nowMs - lastOsmdSyncMs >= 75) {
      lastOsmdSyncMs = nowMs;
      osmdView.syncCursorToBeat(currentBeat, timeline);
    }
  }
};

audioEngine.onEnded = () => {
  updatePlayButtonState(false);
  osmdView.resetCursor();
  liveStage.updateFrame(0, false);
};

// ==========================================================================
// Event Bindings & Bootstrap
// ==========================================================================
function bindEvents() {
  // Header Navigation
  document.getElementById('logoHomeBtn').addEventListener('click', () => navigateTo('home'));
  document.querySelectorAll('.main-nav .nav-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.screen === 'studio' && !state.activeProject) {
        loadSampleIntoStudio(SAMPLE_SCORES[0].id);
        return;
      }
      navigateTo(btn.dataset.screen);
    });
  });

  // Home CTA buttons
  document.getElementById('homeNewBandBtn').addEventListener('click', () => navigateTo('ensembles'));
  document.getElementById('homeUploadBtn').addEventListener('click', () => navigateTo('upload'));
  document.getElementById('homeBrowsePresetsBtn').addEventListener('click', () => navigateTo('ensembles'));

  // Ensembles Screen
  document.getElementById('ensembleGoUploadBtn').addEventListener('click', () => navigateTo('upload'));
  document.getElementById('clearCustomLineupBtn').addEventListener('click', () => {
    state.customLineup = [];
    renderCustomLineup();
  });

  document.getElementById('applyCustomBandBtn').addEventListener('click', () => {
    if (state.customLineup.length === 0) {
      showToast('최소 1개 이상의 악기를 편성해 주세요.');
      return;
    }
    const name = document.getElementById('customBandNameInput').value.trim() || '나만의 자유 합주단';
    state.selectedEnsemble = {
      type: 'custom',
      id: 'custom',
      name,
      lineup: state.customLineup.slice(),
      reverb: 0.28
    };
    updateSelectedBandHeader();
    renderEnsemblePresets();
    showToast(`자유 구성 '${name}' 악단이 선택되었습니다.`);
  });

  // Upload Screen
  const dropzone = document.getElementById('scoreDropzone');
  const fileInput = document.getElementById('scoreFileInput');

  document.getElementById('browseScoreBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files?.length) handleUploadedFiles(e.target.files);
    fileInput.value = '';
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer?.files?.length) handleUploadedFiles(e.dataTransfer.files);
  });

  document.getElementById('enterStudioBtn').addEventListener('click', async () => {
    if (!state.pendingAnalysis) return;
    const mappingRadio = document.querySelector('input[name="mappingMode"]:checked')?.value || 'original';
    const clonedScore = {
      ...state.pendingAnalysis,
      tracks: state.pendingAnalysis.tracks.map((t) => ({ ...t, notes: t.notes.slice() }))
    };

    if (mappingRadio === 'ensemble' && state.selectedEnsemble.type !== 'original') {
      applyEnsembleMappingToTracks(
        clonedScore,
        state.selectedEnsemble.type === 'custom' ? 'custom' : state.selectedEnsemble.id,
        state.selectedEnsemble.name
      );
    } else {
      applyEnsembleMappingToTracks(clonedScore, 'original');
    }

    await openScoreInStudio(clonedScore);
  });

  // Studio Top Controls
  document.getElementById('modeSimpleBtn').addEventListener('click', () => setMode('simple'));
  document.getElementById('modeStudioBtn').addEventListener('click', () => setMode('studio'));
  document.getElementById('studioChangeScoreBtn').addEventListener('click', () => navigateTo('upload'));
  document.getElementById('studioLoadSampleQuickBtn')?.addEventListener('click', () =>
    loadSampleIntoStudio(SAMPLE_SCORES[0].id)
  );

  document.getElementById('studioProjectTitle').addEventListener('change', (e) => {
    if (state.activeProject) {
      state.activeProject.title = e.target.value.trim() || '나만의 합주 프로젝트';
    }
  });

  document.getElementById('studioSaveBtn').addEventListener('click', async () => {
    if (!state.activeProject) return;
    state.activeProject.title =
      document.getElementById('studioProjectTitle').value.trim() || state.activeProject.title;
    state.activeProject.reverb = audioEngine.reverbAmount;
    state.activeProject.masterVolume = audioEngine.masterVolume;
    const saved = await saveProject(state.activeProject);
    if (saved) {
      state.activeProject.id = saved.id;
      showToast(`'${saved.title}' 프로젝트를 저장했습니다.`);
    } else {
      showToast('브라우저 저장 공간 한도로 인해 일부 프로젝트 저장에 실패했습니다.');
    }
  });

  document.getElementById('resetSoloMuteBtn').addEventListener('click', () => {
    if (!state.activeProject) return;
    state.activeProject.tracks.forEach((t) => {
      t.muted = false;
      t.solo = false;
    });
    audioEngine.syncTrackMixerStates();
    renderStudioTracks();
    liveStage.updateFrame(audioEngine.getCurrentBeat(), audioEngine.isPlaying);
  });

  // Score Toolbar
  document.getElementById('toggleStageBtn').addEventListener('click', (e) => {
    const panel = document.getElementById('liveStagePanel');
    const isCollapsed = panel.classList.toggle('collapsed');
    e.currentTarget.classList.toggle('active', !isCollapsed);
    e.currentTarget.textContent = isCollapsed ? '🎭 무대 열기' : '🎭 무대 보기';
  });

  document.getElementById('pagePrevBtn').addEventListener('click', () => {
    osmdView.setPage(osmdView.currentPageIndex - 1);
  });

  document.getElementById('pageNextBtn').addEventListener('click', () => {
    osmdView.setPage(osmdView.currentPageIndex + 1);
  });

  document.getElementById('scorePartFilterSelect').addEventListener('change', (e) => {
    const idx = parseInt(e.target.value, 10);
    osmdView.setVisiblePartIndex(idx);
    if (audioEngine.getCurrentBeat() > 0 && state.activeProject) {
      osmdView.syncCursorToBeat(audioEngine.getCurrentBeat(), state.activeProject.measureTimeline);
    }
  });

  document.getElementById('zoomInBtn').addEventListener('click', () => {
    osmdView.setZoom(osmdView.zoom + 0.1);
    document.getElementById('zoomLabel').textContent = `${Math.round(osmdView.zoom * 100)}%`;
  });

  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    osmdView.setZoom(osmdView.zoom - 0.1);
    document.getElementById('zoomLabel').textContent = `${Math.round(osmdView.zoom * 100)}%`;
  });

  // Right Controls
  document.getElementById('masterVolSlider').addEventListener('input', (e) => {
    const pct = parseInt(e.target.value, 10);
    audioEngine.setMasterVolume(pct / 100);
    document.getElementById('masterVolVal').textContent = `${pct}%`;
  });

  document.getElementById('speedSlider').addEventListener('input', (e) => {
    const pct = parseInt(e.target.value, 10);
    audioEngine.setRateMultiplier(pct / 100);
    updateSpeedLabel(pct);
    document.getElementById('timeDuration').textContent = formatTime(audioEngine.getTotalSeconds());
  });

  document.querySelectorAll('.quick-rate-btns .rate-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const pct = parseInt(chip.dataset.rate, 10);
      document.getElementById('speedSlider').value = pct;
      audioEngine.setRateMultiplier(pct / 100);
      updateSpeedLabel(pct);
      document.getElementById('timeDuration').textContent = formatTime(audioEngine.getTotalSeconds());
    });
  });

  document.getElementById('reverbSlider').addEventListener('input', (e) => {
    const pct = parseInt(e.target.value, 10);
    audioEngine.setReverb(pct / 100);
    document.getElementById('reverbVal').textContent = `${pct}%`;
  });

  document.getElementById('restoreOriginalInstBtn').addEventListener('click', async () => {
    if (!state.activeProject) return;
    applyEnsembleMappingToTracks(state.activeProject, 'original');
    audioEngine.syncTrackMixerStates();
    liveStage.renderStage(state.activeProject);
    renderStudioTracks();
    renderStudioQuickPresets();
    await audioEngine.preloadScoreInstruments();
    updateSoundfontBadge();
    showToast('원본 악보에 지정된 악기로 되돌렸습니다.');
  });

  // Bottom Transport
  document.getElementById('tpPlayBtn').addEventListener('click', () => {
    if (!state.activeProject) return;
    if (audioEngine.isPlaying) {
      audioEngine.pause();
      updatePlayButtonState(false);
      liveStage.updateFrame(audioEngine.getCurrentBeat(), false, true);
    } else {
      audioEngine.play();
      updatePlayButtonState(true);
    }
  });

  document.getElementById('tpRewindBtn').addEventListener('click', () => {
    if (!state.activeProject) return;
    audioEngine.stop();
    osmdView.resetCursor();
    updatePlayButtonState(false);
    liveStage.updateFrame(0, false, true);
  });

  const seekSlider = document.getElementById('seekSlider');
  seekSlider.addEventListener('mousedown', () => { isSeeking = true; });
  seekSlider.addEventListener('touchstart', () => { isSeeking = true; });
  seekSlider.addEventListener('change', () => {
    isSeeking = false;
    if (!state.activeProject) return;
    const ratio = parseInt(seekSlider.value, 10) / 1000;
    const targetSec = audioEngine.getTotalSeconds() * ratio;
    audioEngine.seekToSeconds(targetSec);
    osmdView.syncCursorToBeat(audioEngine.getCurrentBeat(), state.activeProject.measureTimeline);
    liveStage.updateFrame(audioEngine.getCurrentBeat(), audioEngine.isPlaying, true);
  });
}

function renderAuthArea() {
  const authArea = document.getElementById('authArea');
  if (!authArea) return;

  if (state.currentUser) {
    const label =
      state.currentUser.nickname ||
      state.currentUser.name ||
      state.currentUser.username ||
      'ONEID 회원';
    authArea.innerHTML = '';

    const chip = document.createElement('span');
    chip.className = 'user-chip';
    chip.textContent = `● ${label}`;

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'util-btn';
    logoutBtn.textContent = '로그아웃';
    logoutBtn.addEventListener('click', () => {
      clearOneIdSession();
      state.currentUser = null;
      renderAuthArea();
      showToast('로그아웃되었습니다.');
    });

    authArea.appendChild(chip);
    authArea.appendChild(logoutBtn);
  } else {
    authArea.innerHTML = `<button type="button" id="oneidLoginBtn" class="util-btn-login">ONEID 로그인</button>`;
    authArea.querySelector('#oneidLoginBtn').addEventListener('click', () => {
      startOneIdLogin();
    });
  }
}

// Initialize App
async function init() {
  bindEvents();
  renderAuthArea();
  renderHomeSamples();
  renderHomeRecentProjects();
  renderEnsemblePresets();
  renderCustomPicker();
  renderCustomLineup();
  renderUploadSamplePills();
  updateSelectedBandHeader();
  setMode('simple');

  // Handle ONEID SSO callback or restore existing session
  const callbackUser = await handleOneIdCallback((msg) => showToast(msg));
  if (callbackUser) {
    state.currentUser = callbackUser;
    renderAuthArea();
    showToast(`${callbackUser.nickname || callbackUser.username || 'ONEID'}님 로그인 완료!`);
    return;
  }

  const restored = await fetchCurrentOneIdUser();
  if (restored) {
    state.currentUser = restored;
    renderAuthArea();
  }
}

init();
