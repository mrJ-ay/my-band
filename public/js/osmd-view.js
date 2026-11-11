export class ScoreDisplayView {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.osmd = null;
    this.zoom = 0.85;
    this.visiblePartIndex = -1; // -1 = full score
    this.lastCursorBeat = -1;
    this.isLoaded = false;
  }

  async loadXML(xmlString) {
    if (!window.opensheetmusicdisplay) {
      throw new Error('OpenSheetMusicDisplay 라이브러리를 불러오지 못했습니다.');
    }

    this.containerEl.innerHTML = '';
    const { OpenSheetMusicDisplay } = window.opensheetmusicdisplay;

    this.osmd = new OpenSheetMusicDisplay(this.containerEl, {
      autoResize: true,
      backend: 'svg',
      drawTitle: true,
      drawSubtitle: false,
      drawComposer: false,
      drawPartNames: true,
      followCursor: true,
      cursorsOptions: [
        {
          type: 0,
          color: '#d4a259',
          alpha: 0.38,
          follow: true
        }
      ]
    });

    await this.osmd.load(xmlString);
    this.osmd.Zoom = this.zoom;
    this._applyPartVisibility();
    this.osmd.render();
    this.osmd.cursor.show();
    this.osmd.cursor.reset();
    this.lastCursorBeat = 0;
    this.isLoaded = true;
  }

  setVisiblePartIndex(partIndex) {
    this.visiblePartIndex = partIndex;
    if (!this.osmd || !this.isLoaded) return;
    this._applyPartVisibility();
    this.osmd.render();
    this.osmd.cursor.show();
    this.osmd.cursor.reset();
    this.lastCursorBeat = 0;
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

  syncCursorToBeat(targetBeat) {
    if (!this.osmd || !this.isLoaded || !this.osmd.cursor) return;

    const cursor = this.osmd.cursor;
    if (cursor.Hidden) cursor.show();

    // If user jumped backwards or started over, reset cursor first
    if (targetBeat < this.lastCursorBeat - 0.1) {
      cursor.reset();
      this.lastCursorBeat = 0;
    }

    // Advance cursor until its next position exceeds targetBeat
    let safety = 0;
    while (!cursor.Iterator.EndReached && safety < 400) {
      const curWhole = cursor.Iterator.currentTimeStamp?.RealValue ?? 0;
      const curBeat = curWhole * 4;
      if (curBeat > targetBeat + 0.03) break;

      this.lastCursorBeat = curBeat;
      cursor.next();
      safety++;

      if (!cursor.Iterator.EndReached) {
        const nextWhole = cursor.Iterator.currentTimeStamp?.RealValue ?? 0;
        const nextBeat = nextWhole * 4;
        if (nextBeat > targetBeat + 0.03) {
          break;
        }
      }
    }
  }

  resetCursor() {
    if (!this.osmd || !this.isLoaded || !this.osmd.cursor) return;
    this.osmd.cursor.reset();
    this.osmd.cursor.show();
    this.lastCursorBeat = 0;
  }
}
