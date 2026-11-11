export class ScoreDisplayView {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.osmd = null;
    this.zoom = 0.85;
    this.visiblePartIndex = -1; // -1 = full score
    this.lastCursorLocalBeat = -1;
    this.isLoaded = false;

    // Paging state for long classical scores
    this.sourceDoc = null;
    this.partEntries = []; // [{ partId, rawMeasures, attrSnapshots }]
    this.rawMeasureCount = 0;
    this.rawMeasureBeats = []; // beat length per raw measure index
    this.pageSize = 20;
    this.pagingEnabled = false;
    this.forceFullScore = false;
    this.currentPageIndex = 0;
    this.totalPages = 1;
    this.isRenderingPage = false;

    this.onPageChange = null;
  }

  async loadXML(xmlString, measureTimeline = [], forceFull = false) {
    if (!window.opensheetmusicdisplay) {
      throw new Error('OpenSheetMusicDisplay 라이브러리를 불러오지 못했습니다.');
    }

    this.forceFullScore = forceFull;
    this.sourceDoc = new DOMParser().parseFromString(xmlString, 'application/xml');
    this._indexSourceDocument(measureTimeline);

    this.pagingEnabled = !forceFull && this.rawMeasureCount > 28;
    this.totalPages = this.pagingEnabled ? Math.ceil(this.rawMeasureCount / this.pageSize) : 1;
    this.currentPageIndex = 0;

    await this.renderCurrentView();
  }

  _indexSourceDocument(measureTimeline) {
    this.partEntries = [];
    this.rawMeasureCount = 0;
    this.rawMeasureBeats = [];

    // Map rawIndex -> beats from timeline
    const beatMap = new Map();
    for (const m of measureTimeline) {
      if (!beatMap.has(m.rawIndex)) {
        beatMap.set(m.rawIndex, m.beats);
      }
    }

    const partEls = Array.from(this.sourceDoc.querySelectorAll('score-partwise > part'));
    partEls.forEach((partEl, pIdx) => {
      const rawMeasures = Array.from(partEl.querySelectorAll(':scope > measure'));
      if (pIdx === 0) {
        this.rawMeasureCount = rawMeasures.length;
        for (let i = 0; i < rawMeasures.length; i++) {
          this.rawMeasureBeats[i] = beatMap.get(i) ?? 4;
        }
      }

      // Snapshot active clef/key/time/divisions/staves before each measure index
      const attrSnapshots = [];
      const curState = {
        divisions: null,
        key: null,
        time: null,
        staves: null,
        clefs: [] // indexed by staff number
      };

      rawMeasures.forEach((mEl) => {
        attrSnapshots.push({
          divisions: curState.divisions ? curState.divisions.cloneNode(true) : null,
          key: curState.key ? curState.key.cloneNode(true) : null,
          time: curState.time ? curState.time.cloneNode(true) : null,
          staves: curState.staves ? curState.staves.cloneNode(true) : null,
          clefs: curState.clefs.map((c) => c.cloneNode(true))
        });

        const attrEls = mEl.querySelectorAll(':scope > attributes');
        attrEls.forEach((attrEl) => {
          const div = attrEl.querySelector(':scope > divisions');
          if (div) curState.divisions = div.cloneNode(true);
          const key = attrEl.querySelector(':scope > key');
          if (key) curState.key = key.cloneNode(true);
          const time = attrEl.querySelector(':scope > time');
          if (time) curState.time = time.cloneNode(true);
          const staves = attrEl.querySelector(':scope > staves');
          if (staves) curState.staves = staves.cloneNode(true);
          const clefs = attrEl.querySelectorAll(':scope > clef');
          if (clefs.length > 0) {
            clefs.forEach((cl) => {
              const num = cl.getAttribute('number') || '1';
              const idx = Math.max(0, parseInt(num, 10) - 1);
              curState.clefs[idx] = cl.cloneNode(true);
            });
          }
        });
      });

      this.partEntries.push({
        partId: partEl.getAttribute('id') || `P${pIdx + 1}`,
        rawMeasures,
        attrSnapshots
      });
    });
  }

  _buildSlicedXml(startIdx, endIdx) {
    const outDoc = document.implementation.createDocument(null, 'score-partwise', null);
    const outRoot = outDoc.documentElement;
    outRoot.setAttribute('version', '3.1');

    const work = this.sourceDoc.querySelector('work');
    if (work) outRoot.appendChild(outDoc.importNode(work, true));
    const mov = this.sourceDoc.querySelector('movement-title');
    if (mov) outRoot.appendChild(outDoc.importNode(mov, true));
    const partList = this.sourceDoc.querySelector('part-list');
    if (partList) outRoot.appendChild(outDoc.importNode(partList, true));

    for (const pEntry of this.partEntries) {
      const partOut = outDoc.createElement('part');
      partOut.setAttribute('id', pEntry.partId);

      const slice = pEntry.rawMeasures.slice(startIdx, endIdx);
      slice.forEach((mNode, localIdx) => {
        const clonedM = outDoc.importNode(mNode, true);

        // Ensure first measure of sliced page carries key/time/clef/divisions
        if (localIdx === 0 && startIdx > 0) {
          const snap = pEntry.attrSnapshots[startIdx];
          let attrEl = clonedM.querySelector(':scope > attributes');
          if (!attrEl) {
            attrEl = outDoc.createElement('attributes');
            clonedM.insertBefore(attrEl, clonedM.firstChild);
          }

          if (snap.divisions && !attrEl.querySelector(':scope > divisions')) {
            attrEl.appendChild(outDoc.importNode(snap.divisions, true));
          }
          if (snap.key && !attrEl.querySelector(':scope > key')) {
            attrEl.appendChild(outDoc.importNode(snap.key, true));
          }
          if (snap.time && !attrEl.querySelector(':scope > time')) {
            attrEl.appendChild(outDoc.importNode(snap.time, true));
          }
          if (snap.staves && !attrEl.querySelector(':scope > staves')) {
            attrEl.appendChild(outDoc.importNode(snap.staves, true));
          }
          if (snap.clefs.length > 0 && !attrEl.querySelector(':scope > clef')) {
            snap.clefs.forEach((c) => {
              if (c) attrEl.appendChild(outDoc.importNode(c, true));
            });
          }
        }

        partOut.appendChild(clonedM);
      });

      outRoot.appendChild(partOut);
    }

    return new XMLSerializer().serializeToString(outDoc);
  }

  async renderCurrentView() {
    if (!this.sourceDoc || this.isRenderingPage) return;
    this.isRenderingPage = true;

    try {
      const startIdx = this.pagingEnabled ? this.currentPageIndex * this.pageSize : 0;
      const endIdx = this.pagingEnabled
        ? Math.min(this.rawMeasureCount, startIdx + this.pageSize)
        : this.rawMeasureCount;

      const xmlToRender = this.pagingEnabled
        ? this._buildSlicedXml(startIdx, endIdx)
        : new XMLSerializer().serializeToString(this.sourceDoc);

      this.containerEl.innerHTML = '';
      const { OpenSheetMusicDisplay } = window.opensheetmusicdisplay;

      this.osmd = new OpenSheetMusicDisplay(this.containerEl, {
        autoResize: true,
        backend: 'svg',
        drawTitle: this.currentPageIndex === 0,
        drawSubtitle: false,
        drawComposer: false,
        drawPartNames: true,
        followCursor: !this.pagingEnabled, // avoid aggressive scroll jumps on paged view
        cursorsOptions: [
          {
            type: 0,
            color: '#d4a259',
            alpha: 0.38,
            follow: false
          }
        ]
      });

      await this.osmd.load(xmlToRender);
      this.osmd.Zoom = this.zoom;
      this._applyPartVisibility();
      this.osmd.render();
      this.osmd.cursor.show();
      this.osmd.cursor.reset();
      this.lastCursorLocalBeat = 0;
      this.isLoaded = true;

      if (this.onPageChange) {
        this.onPageChange({
          pagingEnabled: this.pagingEnabled,
          pageIndex: this.currentPageIndex,
          totalPages: this.totalPages,
          startMeasure: startIdx + 1,
          endMeasure: endIdx,
          totalMeasures: this.rawMeasureCount
        });
      }
    } finally {
      this.isRenderingPage = false;
    }
  }

  async setPage(pageIndex) {
    if (!this.pagingEnabled) return;
    const clamped = Math.max(0, Math.min(this.totalPages - 1, pageIndex));
    if (clamped === this.currentPageIndex) return;
    this.currentPageIndex = clamped;
    await this.renderCurrentView();
  }

  async setPagingMode(enabled) {
    this.forceFullScore = !enabled;
    this.pagingEnabled = enabled && this.rawMeasureCount > 28;
    this.totalPages = this.pagingEnabled ? Math.ceil(this.rawMeasureCount / this.pageSize) : 1;
    this.currentPageIndex = 0;
    await this.renderCurrentView();
  }

  setVisiblePartIndex(partIndex) {
    this.visiblePartIndex = partIndex;
    if (!this.osmd || !this.isLoaded) return;
    this._applyPartVisibility();
    this.osmd.render();
    this.osmd.cursor.show();
    this.osmd.cursor.reset();
    this.lastCursorLocalBeat = 0;
  }

  setZoom(newZoom) {
    this.zoom = Math.max(0.5, Math.min(1.4, newZoom));
    if (!this.osmd || !this.isLoaded) return;
    this.osmd.Zoom = this.zoom;
    this.osmd.render();
    this.osmd.cursor.show();
  }

  _applyPartVisibility() {
    if (!this.osmd?.Sheet?.Instruments) return;
    const instruments = this.osmd.Sheet.Instruments;
    instruments.forEach((inst, idx) => {
      inst.Visible = this.visiblePartIndex === -1 || this.visiblePartIndex === idx;
    });
  }

  syncCursorToBeat(targetBeat, measureTimeline = []) {
    if (!this.osmd || !this.isLoaded || !this.osmd.cursor || this.isRenderingPage) return;

    let localBeat = targetBeat;

    if (this.pagingEnabled && measureTimeline.length > 0) {
      // Find active timeline entry via binary search
      let lo = 0;
      let hi = measureTimeline.length - 1;
      let curEntry = measureTimeline[0];
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (measureTimeline[mid].startBeat <= targetBeat + 0.02) {
          curEntry = measureTimeline[mid];
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      const rawIdx = curEntry?.rawIndex ?? 0;
      const neededPage = Math.min(this.totalPages - 1, Math.floor(rawIdx / this.pageSize));
      if (neededPage !== this.currentPageIndex) {
        this.currentPageIndex = neededPage;
        this.renderCurrentView().then(() => {
          this._positionCursorAtLocalBeat(this._computePageLocalBeat(targetBeat, curEntry));
        });
        return;
      }

      localBeat = this._computePageLocalBeat(targetBeat, curEntry);
    }

    this._positionCursorAtLocalBeat(localBeat);
  }

  _computePageLocalBeat(targetBeat, curEntry) {
    if (!curEntry) return 0;
    const pageStartRaw = this.currentPageIndex * this.pageSize;
    let beatsBeforeCurMeasure = 0;
    for (let r = pageStartRaw; r < curEntry.rawIndex; r++) {
      beatsBeforeCurMeasure += this.rawMeasureBeats[r] || 4;
    }
    const offsetInMeasure = Math.max(0, targetBeat - curEntry.startBeat);
    return beatsBeforeCurMeasure + offsetInMeasure;
  }

  _positionCursorAtLocalBeat(localBeat) {
    if (!this.osmd?.cursor) return;
    const cursor = this.osmd.cursor;
    if (cursor.Hidden) cursor.show();

    if (localBeat < this.lastCursorLocalBeat - 0.1) {
      cursor.reset();
      this.lastCursorLocalBeat = 0;
    }

    // Avoid redundant OSMD stepping if cursor is already ahead/on target
    if (!cursor.Iterator.EndReached) {
      const curWhole = cursor.Iterator.currentTimeStamp?.RealValue ?? 0;
      if (curWhole * 4 > localBeat + 0.03) return;
    }

    let safety = 0;
    while (!cursor.Iterator.EndReached && safety < 240) {
      const curWhole = cursor.Iterator.currentTimeStamp?.RealValue ?? 0;
      const curBeat = curWhole * 4;
      if (curBeat > localBeat + 0.03) break;

      this.lastCursorLocalBeat = curBeat;
      cursor.next();
      safety++;

      if (!cursor.Iterator.EndReached) {
        const nextWhole = cursor.Iterator.currentTimeStamp?.RealValue ?? 0;
        if (nextWhole * 4 > localBeat + 0.03) break;
      }
    }
  }

  resetCursor() {
    if (!this.osmd || !this.isLoaded || !this.osmd.cursor) return;
    if (this.pagingEnabled && this.currentPageIndex !== 0) {
      this.setPage(0);
      return;
    }
    this.osmd.cursor.reset();
    this.osmd.cursor.show();
    this.lastCursorLocalBeat = 0;
  }
}
