// General MIDI / SoundFont (MusyngKite) Instrument Catalog & Ensemble Presets

export const INSTRUMENTS = {
  // Keyboard
  acoustic_grand_piano: {
    key: 'acoustic_grand_piano',
    ko: '그랜드 피아노',
    en: 'Grand Piano',
    category: '건반',
    program: 1,
    sfName: 'acoustic_grand_piano',
    synthType: 'keyboard',
    minMidi: 21,
    maxMidi: 108
  },
  electric_piano_1: {
    key: 'electric_piano_1',
    ko: '일렉트릭 피아노',
    en: 'Electric Piano',
    category: '건반',
    program: 5,
    sfName: 'electric_piano_1',
    synthType: 'keyboard',
    minMidi: 28,
    maxMidi: 103
  },
  church_organ: {
    key: 'church_organ',
    ko: '오르간',
    en: 'Organ',
    category: '건반',
    program: 20,
    sfName: 'church_organ',
    synthType: 'pad',
    minMidi: 36,
    maxMidi: 96
  },

  // Strings
  violin: {
    key: 'violin',
    ko: '바이올린',
    en: 'Violin',
    category: '현악기',
    program: 41,
    sfName: 'violin',
    synthType: 'strings',
    minMidi: 55,
    maxMidi: 103
  },
  viola: {
    key: 'viola',
    ko: '비올라',
    en: 'Viola',
    category: '현악기',
    program: 42,
    sfName: 'viola',
    synthType: 'strings',
    minMidi: 48,
    maxMidi: 91
  },
  cello: {
    key: 'cello',
    ko: '첼로',
    en: 'Cello',
    category: '현악기',
    program: 43,
    sfName: 'cello',
    synthType: 'strings',
    minMidi: 36,
    maxMidi: 76
  },
  contrabass: {
    key: 'contrabass',
    ko: '콘트라베이스',
    en: 'Contrabass',
    category: '현악기',
    program: 44,
    sfName: 'contrabass',
    synthType: 'bass',
    minMidi: 28,
    maxMidi: 67
  },
  string_ensemble_1: {
    key: 'string_ensemble_1',
    ko: '스트링 앙상블',
    en: 'String Ensemble',
    category: '현악기',
    program: 49,
    sfName: 'string_ensemble_1',
    synthType: 'pad',
    minMidi: 36,
    maxMidi: 96
  },
  orchestral_harp: {
    key: 'orchestral_harp',
    ko: '오케스트라 하프',
    en: 'Harp',
    category: '현악기',
    program: 47,
    sfName: 'orchestral_harp',
    synthType: 'guitar',
    minMidi: 24,
    maxMidi: 103
  },

  // Woodwinds
  flute: {
    key: 'flute',
    ko: '플루트',
    en: 'Flute',
    category: '목관악기',
    program: 74,
    sfName: 'flute',
    synthType: 'woodwind',
    minMidi: 60,
    maxMidi: 96
  },
  piccolo: {
    key: 'piccolo',
    ko: '피콜로',
    en: 'Piccolo',
    category: '목관악기',
    program: 73,
    sfName: 'piccolo',
    synthType: 'woodwind',
    minMidi: 74,
    maxMidi: 108
  },
  oboe: {
    key: 'oboe',
    ko: '오보에',
    en: 'Oboe',
    category: '목관악기',
    program: 69,
    sfName: 'oboe',
    synthType: 'woodwind',
    minMidi: 58,
    maxMidi: 91
  },
  clarinet: {
    key: 'clarinet',
    ko: '클라리넷',
    en: 'Clarinet',
    category: '목관악기',
    program: 72,
    sfName: 'clarinet',
    synthType: 'woodwind',
    minMidi: 50,
    maxMidi: 94
  },
  bassoon: {
    key: 'bassoon',
    ko: '바순',
    en: 'Bassoon',
    category: '목관악기',
    program: 71,
    sfName: 'bassoon',
    synthType: 'woodwind',
    minMidi: 34,
    maxMidi: 72
  },
  alto_sax: {
    key: 'alto_sax',
    ko: '알토 색소폰',
    en: 'Alto Saxophone',
    category: '목관악기',
    program: 66,
    sfName: 'alto_sax',
    synthType: 'brass',
    minMidi: 49,
    maxMidi: 81
  },
  tenor_sax: {
    key: 'tenor_sax',
    ko: '테너 색소폰',
    en: 'Tenor Saxophone',
    category: '목관악기',
    program: 67,
    sfName: 'tenor_sax',
    synthType: 'brass',
    minMidi: 44,
    maxMidi: 76
  },

  // Brass
  trumpet: {
    key: 'trumpet',
    ko: '트럼펫',
    en: 'Trumpet',
    category: '금관악기',
    program: 57,
    sfName: 'trumpet',
    synthType: 'brass',
    minMidi: 55,
    maxMidi: 84
  },
  french_horn: {
    key: 'french_horn',
    ko: '호른',
    en: 'French Horn',
    category: '금관악기',
    program: 61,
    sfName: 'french_horn',
    synthType: 'brass',
    minMidi: 41,
    maxMidi: 77
  },
  trombone: {
    key: 'trombone',
    ko: '트롬본',
    en: 'Trombone',
    category: '금관악기',
    program: 58,
    sfName: 'trombone',
    synthType: 'brass',
    minMidi: 40,
    maxMidi: 72
  },
  tuba: {
    key: 'tuba',
    ko: '튜바',
    en: 'Tuba',
    category: '금관악기',
    program: 59,
    sfName: 'tuba',
    synthType: 'bass',
    minMidi: 28,
    maxMidi: 58
  },
  brass_section: {
    key: 'brass_section',
    ko: '브라스 섹션',
    en: 'Brass Section',
    category: '금관악기',
    program: 62,
    sfName: 'brass_section',
    synthType: 'brass',
    minMidi: 36,
    maxMidi: 84
  },

  // Guitar & Bass
  acoustic_guitar_nylon: {
    key: 'acoustic_guitar_nylon',
    ko: '클래식 기타',
    en: 'Acoustic Guitar',
    category: '기타 · 베이스',
    program: 25,
    sfName: 'acoustic_guitar_nylon',
    synthType: 'guitar',
    minMidi: 40,
    maxMidi: 84
  },
  electric_guitar_clean: {
    key: 'electric_guitar_clean',
    ko: '클린 일렉기타',
    en: 'Electric Guitar (Clean)',
    category: '기타 · 베이스',
    program: 28,
    sfName: 'electric_guitar_clean',
    synthType: 'guitar',
    minMidi: 40,
    maxMidi: 86
  },
  distortion_guitar: {
    key: 'distortion_guitar',
    ko: '디스토션 기타',
    en: 'Electric Guitar (Rock)',
    category: '기타 · 베이스',
    program: 31,
    sfName: 'distortion_guitar',
    synthType: 'guitar',
    minMidi: 40,
    maxMidi: 86
  },
  electric_bass_finger: {
    key: 'electric_bass_finger',
    ko: '일렉트릭 베이스',
    en: 'Electric Bass',
    category: '기타 · 베이스',
    program: 34,
    sfName: 'electric_bass_finger',
    synthType: 'bass',
    minMidi: 28,
    maxMidi: 67
  },
  acoustic_bass: {
    key: 'acoustic_bass',
    ko: '재즈 우드 베이스',
    en: 'Acoustic Bass',
    category: '기타 · 베이스',
    program: 33,
    sfName: 'acoustic_bass',
    synthType: 'bass',
    minMidi: 28,
    maxMidi: 67
  },

  // Synth & Choir
  choir_aahs: {
    key: 'choir_aahs',
    ko: '합창 (코러스)',
    en: 'Choir Aahs',
    category: '신스 · 보컬',
    program: 53,
    sfName: 'choir_aahs',
    synthType: 'pad',
    minMidi: 48,
    maxMidi: 84
  },
  pad_2_warm: {
    key: 'pad_2_warm',
    ko: '시네마틱 신스 패드',
    en: 'Warm Synth Pad',
    category: '신스 · 보컬',
    program: 90,
    sfName: 'pad_2_warm',
    synthType: 'pad',
    minMidi: 36,
    maxMidi: 96
  },

  // Percussion
  timpani: {
    key: 'timpani',
    ko: '팀파니',
    en: 'Timpani',
    category: '타악기',
    program: 48,
    sfName: 'timpani',
    synthType: 'bass',
    minMidi: 36,
    maxMidi: 60
  },
  percussion_kit: {
    key: 'percussion_kit',
    ko: '드럼 · 타악기 세트',
    en: 'Drum & Percussion Kit',
    category: '타악기',
    program: 119,
    sfName: 'synth_drum',
    synthType: 'percussion',
    isPercussion: true,
    minMidi: 35,
    maxMidi: 81
  },

  // Korean Traditional (국악기)
  gayageum: {
    key: 'gayageum',
    ko: '가야금',
    en: 'Gayageum',
    category: '국악기',
    program: 108,
    sfName: 'koto',
    synthType: 'guitar',
    minMidi: 48,
    maxMidi: 88
  },
  geomungo: {
    key: 'geomungo',
    ko: '거문고',
    en: 'Geomungo',
    category: '국악기',
    program: 107,
    sfName: 'shamisen',
    synthType: 'bass',
    minMidi: 36,
    maxMidi: 68
  },
  haegeum: {
    key: 'haegeum',
    ko: '해금',
    en: 'Haegeum',
    category: '국악기',
    program: 111,
    sfName: 'fiddle',
    synthType: 'strings',
    minMidi: 55,
    maxMidi: 88
  },
  daegeum: {
    key: 'daegeum',
    ko: '대금',
    en: 'Daegeum',
    category: '국악기',
    program: 78,
    sfName: 'shakuhachi',
    synthType: 'woodwind',
    minMidi: 55,
    maxMidi: 91
  },
  piri: {
    key: 'piri',
    ko: '피리 · 태평소',
    en: 'Piri / Taepyeongso',
    category: '국악기',
    program: 112,
    sfName: 'shanai',
    synthType: 'woodwind',
    minMidi: 53,
    maxMidi: 84
  },
  janggu: {
    key: 'janggu',
    ko: '장구 · 북',
    en: 'Janggu & Buk',
    category: '국악기',
    program: 117,
    sfName: 'taiko_drum',
    synthType: 'percussion',
    isPercussion: true,
    minMidi: 35,
    maxMidi: 81
  },
  pyeongyeong: {
    key: 'pyeongyeong',
    ko: '편경',
    en: 'Pyeongyeong (Stone Chimes)',
    category: '국악기',
    program: 15,
    sfName: 'tubular_bells',
    synthType: 'keyboard',
    minMidi: 48,
    maxMidi: 96
  }
};

export const ENSEMBLE_PRESETS = [
  {
    id: 'symphony',
    ko: '심포니 오케스트라',
    en: 'Symphony Orchestra',
    tag: '대편성 클래식',
    icon: '🎻',
    color: '#d4a259',
    reverb: 0.38,
    desc: '현악기·목관·금관·팀파니가 어우러진 웅장하고 균형 잡힌 풀 오케스트라 구성입니다.',
    lineup: ['flute', 'oboe', 'clarinet', 'bassoon', 'french_horn', 'trumpet', 'trombone', 'violin', 'cello', 'timpani'],
    roleMap: {
      melodyHigh: 'violin',
      melodyWind: 'flute',
      harmonyMid: 'french_horn',
      harmonyLow: 'cello',
      bass: 'contrabass',
      keyboard: 'acoustic_grand_piano',
      percussion: 'percussion_kit'
    }
  },
  {
    id: 'chamber',
    ko: '실내악 앙상블',
    en: 'Chamber Ensemble',
    tag: '섬세한 현악 · 피아노',
    icon: '🎼',
    color: '#9fb4d8',
    reverb: 0.28,
    desc: '바이올린, 비올라, 첼로와 플루트·피아노 중심의 맑고 세밀한 실내악 합주 구성입니다.',
    lineup: ['violin', 'violin', 'viola', 'cello', 'flute', 'acoustic_grand_piano'],
    roleMap: {
      melodyHigh: 'violin',
      melodyWind: 'flute',
      harmonyMid: 'viola',
      harmonyLow: 'cello',
      bass: 'cello',
      keyboard: 'acoustic_grand_piano',
      percussion: 'percussion_kit'
    }
  },
  {
    id: 'film',
    ko: '영화 음악 오케스트라',
    en: 'Film Score Orchestra',
    tag: '시네마틱 사운드',
    icon: '🎬',
    color: '#c97b63',
    reverb: 0.52,
    desc: '두터운 스트링 앙상블, 호른, 브라스, 합창 패드가 어우러진 웅장한 영화 OST 스타일입니다.',
    lineup: ['string_ensemble_1', 'french_horn', 'brass_section', 'choir_aahs', 'orchestral_harp', 'cello', 'timpani'],
    roleMap: {
      melodyHigh: 'string_ensemble_1',
      melodyWind: 'french_horn',
      harmonyMid: 'choir_aahs',
      harmonyLow: 'brass_section',
      bass: 'contrabass',
      keyboard: 'orchestral_harp',
      percussion: 'timpani'
    }
  },
  {
    id: 'rock',
    ko: '록 밴드',
    en: 'Rock Band',
    tag: '강렬한 밴드 사운드',
    icon: '🎸',
    color: '#e05a5a',
    reverb: 0.18,
    desc: '일렉트릭 기타, 디스토션 기타, 베이스, 드럼이 폭발적인 에너지를 만드는 록 밴드입니다.',
    lineup: ['distortion_guitar', 'electric_guitar_clean', 'electric_bass_finger', 'electric_piano_1', 'percussion_kit'],
    roleMap: {
      melodyHigh: 'distortion_guitar',
      melodyWind: 'electric_guitar_clean',
      harmonyMid: 'electric_piano_1',
      harmonyLow: 'electric_guitar_clean',
      bass: 'electric_bass_finger',
      keyboard: 'electric_piano_1',
      percussion: 'percussion_kit'
    }
  },
  {
    id: 'pop',
    ko: '팝 밴드',
    en: 'Pop Band',
    tag: '경쾌하고 대중적인',
    icon: '🎹',
    color: '#6ec6b8',
    reverb: 0.22,
    desc: '피아노, 클린 기타, 신스 패드, 베이스와 드럼으로 구성된 세련된 현대 팝 밴드 구성입니다.',
    lineup: ['acoustic_grand_piano', 'electric_guitar_clean', 'pad_2_warm', 'electric_bass_finger', 'percussion_kit'],
    roleMap: {
      melodyHigh: 'acoustic_grand_piano',
      melodyWind: 'electric_guitar_clean',
      harmonyMid: 'pad_2_warm',
      harmonyLow: 'electric_piano_1',
      bass: 'electric_bass_finger',
      keyboard: 'acoustic_grand_piano',
      percussion: 'percussion_kit'
    }
  },
  {
    id: 'jazz',
    ko: '재즈 밴드',
    en: 'Jazz Band',
    tag: '스윙 · 빅밴드 감성',
    icon: '🎷',
    color: '#d9a441',
    reverb: 0.25,
    desc: '색소폰과 트럼펫, 재즈 피아노, 우드 베이스, 드럼이 호흡을 맞추는 재즈 콤보 구성입니다.',
    lineup: ['alto_sax', 'tenor_sax', 'trumpet', 'acoustic_grand_piano', 'acoustic_bass', 'percussion_kit'],
    roleMap: {
      melodyHigh: 'alto_sax',
      melodyWind: 'trumpet',
      harmonyMid: 'tenor_sax',
      harmonyLow: 'trombone',
      bass: 'acoustic_bass',
      keyboard: 'acoustic_grand_piano',
      percussion: 'percussion_kit'
    }
  },
  {
    id: 'marching',
    ko: '마칭밴드',
    en: 'Marching Band',
    tag: '퍼레이드 · 관악 타악',
    icon: '🥁',
    color: '#e67e22',
    reverb: 0.2,
    desc: '피콜로·클라리넷·트럼펫·트롬본·튜바와 강렬한 마칭 퍼커션이 행진하는 관악대입니다.',
    lineup: ['piccolo', 'clarinet', 'trumpet', 'french_horn', 'trombone', 'tuba', 'percussion_kit'],
    roleMap: {
      melodyHigh: 'trumpet',
      melodyWind: 'piccolo',
      harmonyMid: 'french_horn',
      harmonyLow: 'trombone',
      bass: 'tuba',
      keyboard: 'clarinet',
      percussion: 'percussion_kit'
    }
  },
  {
    id: 'brass',
    ko: '브라스 밴드',
    en: 'Brass Band',
    tag: '화려한 금관 앙상블',
    icon: '🎺',
    color: '#f1c40f',
    reverb: 0.3,
    desc: '트럼펫, 호른, 트롬본, 튜바 등 순수 금관악기들의 묵직하고 찬란한 울림을 선사합니다.',
    lineup: ['trumpet', 'trumpet', 'french_horn', 'trombone', 'tuba', 'timpani'],
    roleMap: {
      melodyHigh: 'trumpet',
      melodyWind: 'trumpet',
      harmonyMid: 'french_horn',
      harmonyLow: 'trombone',
      bass: 'tuba',
      keyboard: 'brass_section',
      percussion: 'percussion_kit'
    }
  },
  {
    id: 'gugak',
    ko: '국악 밴드',
    en: 'Korean Traditional (Gugak)',
    tag: '전통 · 퓨전 국악',
    icon: '🏮',
    color: '#46c8a8',
    reverb: 0.34,
    desc: '가야금·거문고·해금·대금·피리·편경·장구가 어우러져 한국 전통의 멋과 여운을 울리는 국악 합주단입니다.',
    lineup: ['daegeum', 'gayageum', 'haegeum', 'geomungo', 'piri', 'pyeongyeong', 'janggu'],
    roleMap: {
      melodyHigh: 'gayageum',
      melodyWind: 'daegeum',
      harmonyMid: 'haegeum',
      harmonyLow: 'piri',
      bass: 'geomungo',
      keyboard: 'pyeongyeong',
      percussion: 'janggu'
    }
  }
];

const MIDI_PROGRAM_TO_KEY = {
  1: 'acoustic_grand_piano',
  2: 'acoustic_grand_piano',
  3: 'acoustic_grand_piano',
  4: 'electric_piano_1',
  5: 'electric_piano_1',
  6: 'electric_piano_1',
  20: 'church_organ',
  25: 'acoustic_guitar_nylon',
  26: 'acoustic_guitar_nylon',
  27: 'electric_guitar_clean',
  28: 'electric_guitar_clean',
  30: 'distortion_guitar',
  31: 'distortion_guitar',
  33: 'acoustic_bass',
  34: 'electric_bass_finger',
  35: 'electric_bass_finger',
  41: 'violin',
  42: 'viola',
  43: 'cello',
  44: 'contrabass',
  47: 'orchestral_harp',
  48: 'timpani',
  49: 'string_ensemble_1',
  50: 'string_ensemble_1',
  53: 'choir_aahs',
  57: 'trumpet',
  58: 'trombone',
  59: 'tuba',
  61: 'french_horn',
  62: 'brass_section',
  66: 'alto_sax',
  67: 'tenor_sax',
  69: 'oboe',
  71: 'bassoon',
  72: 'clarinet',
  73: 'piccolo',
  74: 'flute',
  78: 'daegeum',
  90: 'pad_2_warm',
  107: 'geomungo',
  108: 'gayageum',
  111: 'haegeum',
  112: 'piri',
  117: 'janggu'
};

const KEYWORD_RULES = [
  { regex: /pyeongyeong|편경/i, key: 'pyeongyeong' },
  { regex: /gayageum|가야금/i, key: 'gayageum' },
  { regex: /geomungo|거문고/i, key: 'geomungo' },
  { regex: /haegeum|아쟁|해금/i, key: 'haegeum' },
  { regex: /daegeum|소금|대금/i, key: 'daegeum' },
  { regex: /piri|taepyeongso|피리|태평소/i, key: 'piri' },
  { regex: /janggu|buk|kkwaenggwari|장구|장고|북|꽹과리/i, key: 'janggu' },
  { regex: /drum|perc|snare|cymbal|kick|타악|드럼/i, key: 'percussion_kit' },
  { regex: /timpani|팀파니/i, key: 'timpani' },
  { regex: /piccolo|피콜로/i, key: 'piccolo' },
  { regex: /flute|플루트|플룻/i, key: 'flute' },
  { regex: /oboe|오보에/i, key: 'oboe' },
  { regex: /clarinet|클라리넷/i, key: 'clarinet' },
  { regex: /bassoon|fagott|바순/i, key: 'bassoon' },
  { regex: /alto\s*sax|알토\s*색소폰/i, key: 'alto_sax' },
  { regex: /tenor\s*sax|테너\s*색소폰|sax|색소폰/i, key: 'tenor_sax' },
  { regex: /horn|호른/i, key: 'french_horn' },
  { regex: /trumpet|cornet|트럼펫/i, key: 'trumpet' },
  { regex: /trombone|트롬본/i, key: 'trombone' },
  { regex: /tuba|튜바|sousaphone/i, key: 'tuba' },
  { regex: /violin|fiddle|바이올린/i, key: 'violin' },
  { regex: /viola|비올라/i, key: 'viola' },
  { regex: /cello|violoncello|첼로/i, key: 'cello' },
  { regex: /contrabass|double\s*bass|콘트라베이스|더블베이스/i, key: 'contrabass' },
  { regex: /string|스트링|현악/i, key: 'string_ensemble_1' },
  { regex: /harp|하프/i, key: 'orchestral_harp' },
  { regex: /electric\s*bass|bass\s*guitar|일렉\s*베이스|베이스/i, key: 'electric_bass_finger' },
  { regex: /dist|overdrive|rock\s*guitar|디스토션/i, key: 'distortion_guitar' },
  { regex: /electric\s*guitar|일렉\s*기타/i, key: 'electric_guitar_clean' },
  { regex: /guitar|기타/i, key: 'acoustic_guitar_nylon' },
  { regex: /e\.?\s*piano|rhodes|일렉\s*피아노/i, key: 'electric_piano_1' },
  { regex: /organ|오르간/i, key: 'church_organ' },
  { regex: /piano|klavier|피아노/i, key: 'acoustic_grand_piano' },
  { regex: /choir|vocal|voice|코러스|합창/i, key: 'choir_aahs' },
  { regex: /synth|pad|신스/i, key: 'pad_2_warm' }
];

export function matchInstrumentFromNameOrProgram(name = '', midiProgram = null, isUnpitched = false) {
  for (const rule of KEYWORD_RULES) {
    if (rule.regex.test(name)) return rule.key;
  }
  if (isUnpitched) return 'percussion_kit';
  if (midiProgram && MIDI_PROGRAM_TO_KEY[midiProgram]) {
    return MIDI_PROGRAM_TO_KEY[midiProgram];
  }
  if (midiProgram >= 1 && midiProgram <= 8) return 'acoustic_grand_piano';
  if (midiProgram >= 25 && midiProgram <= 32) return 'electric_guitar_clean';
  if (midiProgram >= 33 && midiProgram <= 40) return 'electric_bass_finger';
  if (midiProgram >= 41 && midiProgram <= 48) return 'violin';
  if (midiProgram >= 49 && midiProgram <= 56) return 'string_ensemble_1';
  if (midiProgram >= 57 && midiProgram <= 64) return 'trumpet';
  if (midiProgram >= 65 && midiProgram <= 80) return 'flute';
  return 'acoustic_grand_piano';
}

export function classifyPartRole(instrumentKey, avgMidi = 60) {
  const inst = INSTRUMENTS[instrumentKey];
  if (!inst) return 'harmonyMid';
  if (inst.isPercussion) return 'percussion';
  if (inst.category === '건반') return 'keyboard';
  if (avgMidi < 47 || inst.synthType === 'bass') return 'bass';
  if (avgMidi < 56) return 'harmonyLow';
  if (inst.category === '목관악기') return 'melodyWind';
  if (avgMidi >= 66) return 'melodyHigh';
  return 'harmonyMid';
}

export function remapPartToEnsemble(originalKey, avgMidi, ensembleId) {
  const preset = ENSEMBLE_PRESETS.find((p) => p.id === ensembleId);
  if (!preset) return originalKey;
  const role = classifyPartRole(originalKey, avgMidi);
  return preset.roleMap[role] || preset.lineup[0] || originalKey;
}

/**
 * Automatically distribute stereo panning and slight humanize offsets
 * when multiple tracks share the same instrument.
 */
export function applyEnsembleSpatialBalance(tracks) {
  const groups = new Map();
  for (const t of tracks) {
    if (!groups.has(t.instrumentKey)) groups.set(t.instrumentKey, []);
    groups.get(t.instrumentKey).push(t);
  }

  for (const [key, list] of groups.entries()) {
    if (list.length === 1) {
      // Gentle default orchestral stereo spread by instrument category
      const inst = INSTRUMENTS[key];
      if (!inst || inst.isPercussion || inst.synthType === 'bass') {
        list[0].pan = 0;
      } else if (inst.key === 'violin' || inst.key === 'flute') {
        list[0].pan = -0.25;
      } else if (inst.key === 'cello' || inst.key === 'trombone' || inst.key === 'electric_guitar_clean') {
        list[0].pan = 0.25;
      } else if (inst.key === 'trumpet' || inst.key === 'french_horn') {
        list[0].pan = 0.15;
      } else {
        list[0].pan = 0;
      }
      list[0].detuneCents = 0;
      list[0].humanizeMs = 0;
    } else {
      const span = 0.7;
      list.forEach((track, idx) => {
        const ratio = list.length > 1 ? idx / (list.length - 1) : 0.5;
        track.pan = Number(((-span) + ratio * (span * 2)).toFixed(2));
        track.detuneCents = (idx - (list.length - 1) / 2) * 3.5; // slight chorus richness
        track.humanizeMs = idx * 6; // subtle ensemble spread
      });
    }
  }
  return tracks;
}
