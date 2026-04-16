const textInput = document.querySelector("#text-input");
const frameRange = document.querySelector("#frame-range");
const charDelayInput = document.querySelector("#char-delay");
const fpsInput = document.querySelector("#fps-input");
const playToggle = document.querySelector("#play-toggle");
const loopToggle = document.querySelector("#loop-toggle");
const previewMode = document.querySelector("#preview-mode");
const frameLabel = document.querySelector("#frame-label");
const statusOutput = document.querySelector("#status-output");
const symbolGroups = document.querySelector("#symbol-groups");
const canvas = document.querySelector("#preview-canvas");
const ctx = canvas.getContext("2d");
const pixelFont = '"MinecraftUnifont", "Lucida Console", Monaco, monospace';
const viewportWidth = 960;
const viewportHeight = 540;
const iconScale = 2.4;
const iconAdvanceScale = 0.68;
const textAdvanceSpacing = 2;
const spaceAdvanceScale = 0.9;
const canvasResolutionScale = 2;
const symbolPreviewScale = 2;
const minecraftColors = {
  "0": "#000000",
  "1": "#0000aa",
  "2": "#00aa00",
  "3": "#00aaaa",
  "4": "#aa0000",
  "5": "#aa00aa",
  "6": "#ffaa00",
  "7": "#aaaaaa",
  "8": "#555555",
  "9": "#5555ff",
  a: "#55ff55",
  b: "#55ffff",
  c: "#ff5555",
  d: "#ff55ff",
  e: "#ffff55",
  f: "#ffffff",
  r: "#ffffff",
};
const symbolLibrary = [
  {
    title: "HUD",
    items: [
      { label: "鸡腿", char: "" },
      { label: "护甲", char: "" },
      { label: "硬币", char: "" },
      { label: "助手", char: "" },
      { label: "朗读", char: "" },
      { label: "代币", char: "" },
      { label: "空星", char: "" },
      { label: "实星", char: "" },
    ],
  },
  {
    title: "方向与交互",
    items: [
      { label: "上", char: "" },
      { label: "左", char: "" },
      { label: "下", char: "" },
      { label: "右", char: "" },
      { label: "跳跃", char: "" },
      { label: "潜行", char: "" },
      { label: "右上", char: "" },
      { label: "右下", char: "" },
      { label: "可合成", char: "" },
      { label: "不可合成", char: "" },
    ],
  },
  {
    title: "键鼠",
    items: [
      { label: "左键", char: "" },
      { label: "右键", char: "" },
      { label: "中键", char: "" },
      { label: "左键小", char: "" },
      { label: "右键小", char: "" },
      { label: "滚轮", char: "" },
      { label: "鼠标", char: "" },
    ],
  },
  {
    title: "手柄与平台",
    items: [
      { label: "A", char: "" },
      { label: "B", char: "" },
      { label: "X", char: "" },
      { label: "Y", char: "" },
      { label: "LB", char: "" },
      { label: "RB", char: "" },
      { label: "LT", char: "" },
      { label: "RT", char: "" },
      { label: "LS", char: "" },
      { label: "RS", char: "" },
      { label: "Win", char: "" },
      { label: "菜单", char: "" },
    ],
  },
];
const specialSymbolMap = new Map(
  symbolLibrary.flatMap((group) => group.items.map((item) => [item.char, item]))
);
const spriteSheetSources = {
  E0: ["assets/font/glyph_E0.png"],
  E1: ["assets/font/glyph_E1.png"],
};
const spriteSheetCache = new Map();
const symbolPreviewCanvases = new Map();

let isPlaying = false;
let playTimer = null;

function setupCanvasResolution() {
  const scale = canvasResolutionScale;

  canvas.width = viewportWidth * scale;
  canvas.height = viewportHeight * scale;
  canvas.style.aspectRatio = `${viewportWidth} / ${viewportHeight}`;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function parseInput() {
  const text = textInput.value.replace(/\r/g, "");
  const charDelay = Math.max(1, Number(charDelayInput.value) || 1);

  return {
    text,
    effect: "typewriter",
    charDelay,
  };
}

function evaluateFrame(config, frame) {
  const visibleCount = Math.min(
    config.text.length,
    Math.floor(frame / config.charDelay)
  );

  return {
    frame,
    visibleCount,
    visibleText: config.text.slice(0, visibleCount),
    totalChars: config.text.length,
    complete: visibleCount >= config.text.length,
  };
}

function parseMinecraftText(text) {
  const lines = [];
  let segments = [];
  let currentText = "";
  let color = "#ffffff";
  let bold = false;

  const pushSegment = () => {
    if (!currentText) {
      return;
    }

    segments.push({
      text: currentText,
      color,
      bold,
    });
    currentText = "";
  };

  const pushLine = () => {
    pushSegment();
    lines.push(segments);
    segments = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === "§" && index + 1 < text.length) {
      pushSegment();
      const code = text[index + 1].toLowerCase();
      index += 1;

      if (code === "l") {
        bold = true;
        continue;
      }

      if (code === "r") {
        color = "#ffffff";
        bold = false;
        continue;
      }

      if (minecraftColors[code]) {
        color = minecraftColors[code];
        continue;
      }

      continue;
    }

    if (char === "\n") {
      pushLine();
      continue;
    }

    currentText += char;
  }

  pushLine();

  return lines.filter((line) => line.length > 0);
}

function setSegmentFont(size, bold, targetCtx = ctx) {
  targetCtx.font = `${bold ? "bold " : ""}${size}px ${pixelFont}`;
}

function measureMinecraftChar(char, size, bold) {
  setSegmentFont(size, bold);

  if (char === " ") {
    return Math.max(4, Math.round(size * spaceAdvanceScale));
  }

  return Math.ceil(ctx.measureText(char).width) + textAdvanceSpacing;
}

function measureMinecraftText(text, size, bold) {
  let width = 0;

  for (const char of text) {
    width += measureMinecraftChar(char, size, bold);
  }

  return width;
}

function getSpriteInfo(char) {
  const codePoint = char.codePointAt(0);
  if (!codePoint) {
    return null;
  }

  const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");
  const plane = hex.slice(0, 2);
  const lowByte = Number.parseInt(hex.slice(2), 16);

  if (!spriteSheetSources[plane]) {
    return null;
  }

  return {
    plane,
    hex,
    column: lowByte % 16,
    row: Math.floor(lowByte / 16),
  };
}

function renderSymbolPreviewCanvases() {
  symbolPreviewCanvases.forEach((previewCanvas, char) => {
    const previewCtx = previewCanvas.getContext("2d");
    const scale = symbolPreviewScale;
    const cssSize = 18;
    const drawSize = 16;

    previewCanvas.width = cssSize * scale;
    previewCanvas.height = cssSize * scale;
    previewCanvas.style.width = `${cssSize}px`;
    previewCanvas.style.height = `${cssSize}px`;

    previewCtx.setTransform(scale, 0, 0, scale, 0, 0);
    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, cssSize, cssSize);

    const spriteInfo = getSpriteInfo(char);
    const spriteState = spriteInfo ? getSpriteSheet(spriteInfo.plane) : null;

    if (spriteInfo && spriteState?.loaded && !spriteState.failed) {
      const cellWidth = spriteState.image.width / 16;
      const cellHeight = spriteState.image.height / 16;
      const sourceX = spriteInfo.column * cellWidth;
      const sourceY = spriteInfo.row * cellHeight;
      previewCtx.drawImage(
        spriteState.image,
        sourceX,
        sourceY,
        cellWidth,
        cellHeight,
        1,
        1,
        drawSize,
        drawSize
      );
      return;
    }

    previewCtx.fillStyle = "rgba(10, 14, 10, 0.92)";
    previewCtx.fillRect(1, 1, drawSize, drawSize);
    previewCtx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    previewCtx.lineWidth = 1;
    previewCtx.strokeRect(1, 1, drawSize, drawSize);

    const label = specialSymbolMap.get(char)?.label || "?";
    previewCtx.fillStyle = "#ffffff";
    setSegmentFont(7, true, previewCtx);
    previewCtx.textAlign = "center";
    previewCtx.textBaseline = "middle";
    previewCtx.fillText(label.slice(0, 2), 9, 9);
  });
}

function getSpriteSheet(plane) {
  const existing = spriteSheetCache.get(plane);
  if (existing) {
    return existing;
  }

  const image = new Image();

  const spriteState = {
    image,
    loaded: false,
    failed: false,
    sourceIndex: 0,
  };

  image.onload = () => {
    spriteState.loaded = true;
    spriteState.failed = false;
    render();
    renderSymbolPreviewCanvases();
  };

  image.onerror = () => {
    const nextIndex = spriteState.sourceIndex + 1;
    const sources = spriteSheetSources[plane];
    if (nextIndex < sources.length) {
      spriteState.sourceIndex = nextIndex;
      image.src = sources[nextIndex];
      return;
    }

    spriteState.failed = true;
    renderSymbolPreviewCanvases();
  };

  image.src = spriteSheetSources[plane][0];
  spriteSheetCache.set(plane, spriteState);
  return spriteState;
}

function tokenizeSegment(segment) {
  const tokens = [];
  let buffer = "";

  for (const char of segment.text) {
    const spriteInfo = getSpriteInfo(char);
    if (spriteInfo) {
      if (buffer) {
        tokens.push({
          type: "text",
          text: buffer,
        });
        buffer = "";
      }

      tokens.push({
        type: "icon",
        char,
        label: specialSymbolMap.get(char)?.label || `U+${spriteInfo.hex}`,
        spriteInfo,
      });
      continue;
    }

    buffer += char;
  }

  if (buffer) {
    tokens.push({
      type: "text",
      text: buffer,
    });
  }

  return tokens;
}

function measureSegmentWidth(segment, size) {
  const iconSize = Math.round(size * iconScale);
  const iconAdvance = Math.round(iconSize * iconAdvanceScale);
  let width = 0;

  tokenizeSegment(segment).forEach((token) => {
    if (token.type === "icon") {
      width += iconAdvance;
      return;
    }

    width += measureMinecraftText(token.text, size, segment.bold);
  });

  return width;
}

function measureLineWidth(line, size) {
  let width = 0;

  line.forEach((segment) => {
    width += measureSegmentWidth(segment, size);
  });

  return width;
}

function drawIconPlaceholder(x, baselineY, size, label, color) {
  const iconSize = Math.round(size * iconScale);
  const iconAdvance = Math.round(iconSize * iconAdvanceScale);
  const top = baselineY - iconSize + Math.round(size * 0.9);
  const shortLabel = label.slice(0, 2);

  ctx.fillStyle = "rgba(10, 14, 10, 0.92)";
  ctx.fillRect(x, top, iconSize, iconSize);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, top, iconSize, iconSize);

  ctx.fillStyle = color;
  ctx.font = `bold ${Math.max(8, Math.round(size * 0.42))}px ${pixelFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(shortLabel, x + iconSize / 2, top + iconSize / 2 + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  return iconAdvance;
}

function drawMinecraftLine(line, x, y, size) {
  let currentX = x;

  line.forEach((segment) => {
    tokenizeSegment(segment).forEach((token) => {
      if (token.type === "icon") {
        const iconSize = Math.round(size * iconScale);
        const iconAdvance = Math.round(iconSize * iconAdvanceScale);
        const spriteInfo = token.spriteInfo || getSpriteInfo(token.char);
        const spriteState = spriteInfo ? getSpriteSheet(spriteInfo.plane) : null;

        if (spriteInfo && spriteState?.loaded && !spriteState.failed) {
          const top = y - iconSize + Math.round(size * 0.9);
          const cellWidth = spriteState.image.width / 16;
          const cellHeight = spriteState.image.height / 16;
          const sourceX = spriteInfo.column * cellWidth;
          const sourceY = spriteInfo.row * cellHeight;

          ctx.drawImage(
            spriteState.image,
            sourceX,
            sourceY,
            cellWidth,
            cellHeight,
            currentX,
            top,
            iconSize,
            iconSize
          );
          currentX += iconAdvance;
          return;
        }

        currentX += drawIconPlaceholder(currentX, y, size, token.label, segment.color);
        return;
      }

      for (const char of token.text) {
        setSegmentFont(size, segment.bold);
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillText(char, currentX + 2, y + 2);
        ctx.fillStyle = segment.color;
        ctx.fillText(char, currentX, y);
        currentX += measureMinecraftChar(char, size, segment.bold);
      }
    });
  });
}

function drawSceneBackground() {
  const horizon = viewportHeight * 0.62;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#8ec5ff");
  sky.addColorStop(1, "#a7d0ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewportWidth, horizon);

  const ground = ctx.createLinearGradient(0, horizon, 0, viewportHeight);
  ground.addColorStop(0, "#567f2e");
  ground.addColorStop(1, "#39551f");
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, viewportWidth, viewportHeight - horizon);

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(0, horizon - 2, viewportWidth, 3);

  for (let index = 0; index < 18; index += 1) {
    const y = horizon + index * 12;
    ctx.strokeStyle = `rgba(32, 62, 24, ${0.18 + index * 0.01})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewportWidth, y + 24);
    ctx.stroke();
  }
}

function insertAtCursor(textarea, value) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const nextValue = `${textarea.value.slice(0, start)}${value}${textarea.value.slice(end)}`;

  textarea.value = nextValue;
  textarea.focus();

  const nextCursor = start + value.length;
  textarea.setSelectionRange(nextCursor, nextCursor);
}

function renderSymbolPanel() {
  symbolGroups.innerHTML = "";
  symbolPreviewCanvases.clear();

  symbolLibrary.forEach((group) => {
    const groupEl = document.createElement("section");
    groupEl.className = "symbol-group";

    const titleEl = document.createElement("div");
    titleEl.className = "symbol-group-title";
    titleEl.textContent = group.title;
    groupEl.appendChild(titleEl);

    const gridEl = document.createElement("div");
    gridEl.className = "symbol-grid";

    group.items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "symbol-chip";
      button.title = `${item.label} ${item.char}`;

      const previewCanvas = document.createElement("canvas");
      previewCanvas.className = "symbol-chip-canvas";
      button.appendChild(previewCanvas);
      symbolPreviewCanvases.set(item.char, previewCanvas);

      const label = document.createElement("span");
      label.className = "symbol-chip-label";
      label.textContent = item.label;
      button.appendChild(label);

      button.addEventListener("click", () => {
        insertAtCursor(textInput, item.char);
        render();
      });
      gridEl.appendChild(button);
    });

    groupEl.appendChild(gridEl);
    symbolGroups.appendChild(groupEl);
  });

  renderSymbolPreviewCanvases();
}

function renderPreview(state) {
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  drawSceneBackground();

  const displayText = state.visibleText || "_";
  const lines = parseMinecraftText(displayText);
  const isActionbarMode = previewMode.checked;
  const fontSize = isActionbarMode ? 18 : 26;
  const lineHeight = isActionbarMode ? 28 : 40;
  const maxWidth = lines.reduce((largest, line) => {
    return Math.max(largest, measureLineWidth(line, fontSize));
  }, 0);
  const contentHeight = Math.max(lines.length, 1) * lineHeight;
  const panelWidth = Math.max(240, Math.min(viewportWidth * 0.54, maxWidth + 36));
  const panelHeight = contentHeight + 22;
  const panelX = (viewportWidth - panelWidth) / 2;
  const panelY = isActionbarMode ? viewportHeight - panelHeight - 28 : 36;

  ctx.fillStyle = "rgba(6, 10, 6, 0.78)";
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  ctx.strokeStyle = "rgba(0, 0, 0, 0.52)";
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  const startY = panelY + 20;
  lines.forEach((line, index) => {
    const lineWidth = measureLineWidth(line, fontSize);
    const startX = panelX + (panelWidth - lineWidth) / 2;
    drawMinecraftLine(line, startX, startY + index * lineHeight, fontSize);
  });
}

function syncFrameBounds(config) {
  const nextMax = Math.max(config.text.length * config.charDelay + 2, 10);
  frameRange.max = String(nextMax);

  if (Number(frameRange.value) > nextMax) {
    frameRange.value = String(nextMax);
  }
}

function render() {
  const config = parseInput();
  syncFrameBounds(config);

  const frame = Number(frameRange.value) || 0;
  const state = evaluateFrame(config, frame);

  frameLabel.textContent = `Frame ${frame}`;
  renderPreview(state);

  statusOutput.textContent = JSON.stringify(
    {
      input: config,
      state,
      playback: {
        isPlaying,
        fps: Math.max(1, Number(fpsInput.value) || 1),
        loop: loopToggle.checked,
      },
      preview: {
        actionbarMode: previewMode.checked,
      },
    },
    null,
    2
  );
}

function stopPlayback() {
  if (playTimer) {
    window.clearInterval(playTimer);
    playTimer = null;
  }

  isPlaying = false;
  playToggle.textContent = "播放";
}

function startPlayback() {
  const fps = Math.max(1, Number(fpsInput.value) || 1);
  const interval = Math.max(33, Math.floor(1000 / fps));

  stopPlayback();
  isPlaying = true;
  playToggle.textContent = "暂停";

  playTimer = window.setInterval(() => {
    const maxFrame = Number(frameRange.max) || 0;
    const nextFrame = Number(frameRange.value) + 1;

    if (nextFrame > maxFrame) {
      if (loopToggle.checked) {
        frameRange.value = "0";
        render();
        return;
      }

      stopPlayback();
      render();
      return;
    }

    frameRange.value = String(nextFrame);
    render();
  }, interval);
}

[textInput, frameRange, charDelayInput, fpsInput, loopToggle, previewMode].forEach((element) => {
  element.addEventListener("input", render);
});

frameRange.addEventListener("input", () => {
  if (isPlaying) {
    stopPlayback();
  }
});

playToggle.addEventListener("click", () => {
  if (isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }

  render();
});

setupCanvasResolution();
render();
renderSymbolPanel();
