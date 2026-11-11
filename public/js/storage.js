const PROJECTS_KEY = 'myband_recent_projects_v1';
const CUSTOM_BANDS_KEY = 'myband_custom_ensembles_v1';

export function listRecentProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function decompressProjectXml(record) {
  if (record.xmlString) return record.xmlString;
  if (record.xmlZipBase64 && window.JSZip) {
    const zip = await window.JSZip.loadAsync(record.xmlZipBase64, { base64: true });
    const file = zip.file('score.xml');
    if (file) return await file.async('string');
  }
  return '';
}

export async function saveProject(project) {
  try {
    const list = listRecentProjects();
    const id = project.id || `proj_${Date.now()}`;

    let xmlString = project.xmlString;
    let xmlZipBase64 = null;

    // Compress large classical MusicXML scores (~20-30x smaller via DEFLATE)
    if (xmlString && xmlString.length > 60000 && window.JSZip) {
      const zip = new window.JSZip();
      zip.file('score.xml', xmlString);
      xmlZipBase64 = await zip.generateAsync({
        type: 'base64',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      xmlString = null;
    }

    const record = {
      id,
      title: project.title || '나만의 합주 프로젝트',
      ensembleId: project.ensembleId || 'original',
      ensembleLabel: project.ensembleLabel || '원본 악보 구성',
      instrumentCount: project.tracks?.length || 0,
      reverb: project.reverb ?? 0.28,
      rateMultiplier: project.rateMultiplier ?? 1.0,
      masterVolume: project.masterVolume ?? 0.85,
      xmlString,
      xmlZipBase64,
      trackSettings: (project.tracks || []).map((t) => ({
        id: t.id,
        instrumentKey: t.instrumentKey,
        volume: t.volume,
        pan: t.pan,
        muted: t.muted,
        solo: t.solo
      })),
      updatedAt: new Date().toISOString()
    };

    const filtered = list.filter((p) => p.id !== id);
    filtered.unshift(record);
    const trimmed = filtered.slice(0, 10);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(trimmed));
    return record;
  } catch (err) {
    console.warn('프로젝트 저장 실패:', err);
    return null;
  }
}

export function deleteProject(id) {
  try {
    const list = listRecentProjects().filter((p) => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
  } catch (_) {}
}

export function listCustomEnsembles() {
  try {
    const raw = localStorage.getItem(CUSTOM_BANDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomEnsemble(name, lineupKeys) {
  try {
    const list = listCustomEnsembles();
    const entry = {
      id: `custom_${Date.now()}`,
      name: name.trim() || '나만의 커스텀 악단',
      lineup: lineupKeys.slice(),
      createdAt: new Date().toISOString()
    };
    list.unshift(entry);
    localStorage.setItem(CUSTOM_BANDS_KEY, JSON.stringify(list.slice(0, 12)));
    return entry;
  } catch {
    return null;
  }
}
