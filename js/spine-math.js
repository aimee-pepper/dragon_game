// ============================================================
// Shared spine curve math — used by both spine-placement.html and sprite-renderer.js
// Pure functions with no global state dependencies.
// ============================================================

export function catmullRomPoint(points, t) {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };
  if (points.length === 2) {
    return {
      x: points[0].x + (points[1].x - points[0].x) * t,
      y: points[0].y + (points[1].y - points[0].y) * t,
    };
  }

  const n = points.length - 1;
  const segment = Math.min(Math.floor(t * n), n - 1);
  const localT = t * n - segment;

  const p0 = points[Math.max(0, segment - 1)];
  const p1 = points[segment];
  const p2 = points[Math.min(n, segment + 1)];
  const p3 = points[Math.min(n, segment + 2)];

  const tt = localT * localT;
  const ttt = tt * localT;

  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * localT +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * localT +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt
    ),
  };
}

export function catmullRomTangentAngle(points, t) {
  const dt = 0.001;
  const a = catmullRomPoint(points, Math.max(0, t - dt));
  const b = catmullRomPoint(points, Math.min(1, t + dt));
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function computeArcLengthTable(points, samples = 200) {
  const table = [{ t: 0, dist: 0 }];
  let totalDist = 0;
  let prev = catmullRomPoint(points, 0);

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const pt = catmullRomPoint(points, t);
    const dx = pt.x - prev.x;
    const dy = pt.y - prev.y;
    totalDist += Math.sqrt(dx * dx + dy * dy);
    table.push({ t, dist: totalDist });
    prev = pt;
  }
  return { table, totalLength: totalDist };
}

export function tAtArcLength(arcTable, targetDist) {
  const { table } = arcTable;
  for (let i = 1; i < table.length; i++) {
    if (table[i].dist >= targetDist) {
      const prev = table[i - 1];
      const curr = table[i];
      const frac = (targetDist - prev.dist) / (curr.dist - prev.dist);
      return prev.t + (curr.t - prev.t) * frac;
    }
  }
  return 1;
}

// Envelope sampling — all take heightControlPoints as a parameter
function sampleEnvelope(hcp, t, prop, fallback) {
  if (hcp.length === 0) return fallback;
  if (hcp.length === 1) return hcp[0][prop] ?? fallback;

  const v0 = hcp[0][prop] ?? fallback;
  if (t <= hcp[0].t) return v0;
  const vLast = hcp[hcp.length - 1][prop] ?? fallback;
  if (t >= hcp[hcp.length - 1].t) return vLast;

  for (let i = 1; i < hcp.length; i++) {
    if (t <= hcp[i].t) {
      const prev = hcp[i - 1];
      const curr = hcp[i];
      const frac = (t - prev.t) / (curr.t - prev.t);
      const prevV = prev[prop] ?? fallback;
      const currV = curr[prop] ?? fallback;
      return prevV + (currV - prevV) * frac;
    }
  }
  return fallback;
}

export function sampleHeightMultiplier(hcp, t) { return sampleEnvelope(hcp, t, 'mul', 1.0); }
export function sampleHeightRotation(hcp, t)   { return sampleEnvelope(hcp, t, 'rot', 0); }
export function sampleHeightWidth(hcp, t)       { return sampleEnvelope(hcp, t, 'wid', 1.0); }
export function sampleHeightSpacing(hcp, t)     { return sampleEnvelope(hcp, t, 'spc', 1.0); }

/**
 * Compute spine positions along a curve.
 * @param {Object} pathData — saved path data from localStorage:
 *   { controlPoints, spineCount, spineSpacing, spineScale, globalRotation, heightControlPoints }
 * @returns {Array<{x, y, rot, scale, wid}>} — flattened positions for the renderer
 */
export function computeSpinePositions(pathData) {
  const {
    controlPoints,
    spineCount = 10,
    spineSpacing = 1.0,
    spineScale = 1.0,
    globalRotation = 0,
    heightControlPoints: hcp = [{ t: 0, mul: 1.0, rot: 0, wid: 1.0, spc: 1.0 }, { t: 1, mul: 1.0, rot: 0, wid: 1.0, spc: 1.0 }],
  } = pathData;

  if (!controlPoints || controlPoints.length < 2) return [];

  const arcData = computeArcLengthTable(controlPoints);
  const { totalLength } = arcData;

  const baseGap = (totalLength / (spineCount - 1)) * spineSpacing;

  // Pre-sample envelope spacing at each uniform position to compute gap weights.
  const uniformDists = [];
  for (let i = 0; i < spineCount; i++) {
    uniformDists.push(i * baseGap);
  }
  const uniformSpacings = uniformDists.map(d => {
    const t = tAtArcLength(arcData, Math.max(0, Math.min(totalLength, d)));
    return sampleHeightSpacing(hcp, t);
  });

  const gapWeights = [];
  for (let i = 0; i < spineCount - 1; i++) {
    gapWeights.push((uniformSpacings[i] + uniformSpacings[i + 1]) / 2);
  }
  const totalWeight = gapWeights.reduce((a, b) => a + b, 0) || 1;
  const totalSpan = baseGap * (spineCount - 1);
  const startOffset = (totalLength - totalSpan) / 2;

  const positions = [];
  let cumulativeDist = startOffset;
  for (let i = 0; i < spineCount; i++) {
    const dist = Math.max(0, Math.min(totalLength, cumulativeDist));
    const t = tAtArcLength(arcData, dist);
    const pt = catmullRomPoint(controlPoints, t);
    const tangentAngle = catmullRomTangentAngle(controlPoints, t);

    const envelopeRot = sampleHeightRotation(hcp, t);
    const angleDeg = (tangentAngle * 180 / Math.PI) - 90 + globalRotation + envelopeRot;

    const heightMul = sampleHeightMultiplier(hcp, t);
    const scale = spineScale * heightMul;
    const widthMul = sampleHeightWidth(hcp, t);

    positions.push({
      x: Math.round(pt.x),
      y: Math.round(pt.y),
      rot: parseFloat(angleDeg.toFixed(1)),
      scale: parseFloat(scale.toFixed(3)),
      wid: parseFloat(widthMul.toFixed(3)),
    });

    if (i < spineCount - 1) {
      cumulativeDist += totalSpan * (gapWeights[i] / totalWeight);
    }
  }

  return positions;
}
