export function words(text) {
  return (
    text
      .normalize("NFKC")
      .toLocaleLowerCase()
      .match(/[\p{L}\p{M}\p{N}]+/gu) || []
  );
}
export function referenceDiff(reference, text) {
  const available = new Map();
  for (const word of words(text))
    available.set(word, (available.get(word) || 0) + 1);
  const missing = [];
  for (const word of words(reference)) {
    if (available.get(word)) available.set(word, available.get(word) - 1);
    else missing.push(word);
  }
  return {
    missing,
    extra: [...available].flatMap(([word, count]) => Array(count).fill(word)),
  };
}
export function agreement(reference, text) {
  const a = words(reference).slice(0, 1500),
    b = words(text).slice(0, 4000);
  if (!a.length) return null;
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(
        next[j - 1] + 1,
        row[j] + 1,
        row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    row = next;
  }
  return Math.max(0, Math.round(100 * (1 - row[b.length] / a.length)));
}
export function measurements(samples, rate, text) {
  const seconds = samples.length / rate,
    intervals = [];
  let quietStart = null;
  for (
    let offset = 0;
    offset < samples.length;
    offset += Math.round(rate / 10)
  ) {
    const end = Math.min(samples.length, offset + Math.round(rate / 10));
    let power = 0;
    for (let i = offset; i < end; i++) power += samples[i] * samples[i];
    const quiet = Math.sqrt(power / (end - offset)) < 0.008;
    if (quiet && quietStart === null) quietStart = offset / rate;
    if (!quiet && quietStart !== null) {
      if (offset / rate - quietStart >= 0.8)
        intervals.push([quietStart, offset / rate]);
      quietStart = null;
    }
  }
  if (quietStart !== null && seconds - quietStart >= 0.8)
    intervals.push([quietStart, seconds]);
  const tokens = words(text),
    fillers = tokens.filter((w) =>
      ["um", "uh", "umm", "erm"].includes(w),
    ).length;
  return {
    seconds: Number(seconds.toFixed(1)),
    words: tokens.length,
    wpm: seconds ? Math.round((tokens.length * 60) / seconds) : 0,
    quiet: intervals,
    longest_quiet: Number(
      Math.max(0, ...intervals.map(([a, b]) => b - a)).toFixed(1),
    ),
    possible_fillers: fillers,
  };
}
export function wav(samples, rate = 16000) {
  const data = new ArrayBuffer(44 + samples.length * 2),
    v = new DataView(data);
  const write = (at, s) =>
    [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  write(0, "RIFF");
  v.setUint32(4, data.byteLength - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  write(36, "data");
  v.setUint32(40, samples.length * 2, true);
  samples.forEach((x, i) =>
    v.setInt16(
      44 + i * 2,
      Math.round(Math.max(-1, Math.min(1, x)) * 32767),
      true,
    ),
  );
  return new Blob([data], { type: "audio/wav" });
}
export async function decode(blob) {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    if (audio.duration > 300)
      throw new Error("Choose at most five minutes of audio.");
    const offline = new OfflineAudioContext(
      1,
      Math.ceil(audio.duration * 16000),
      16000,
    );
    const source = offline.createBufferSource();
    source.buffer = audio;
    source.connect(offline.destination);
    source.start();
    return (await offline.startRendering()).getChannelData(0);
  } finally {
    await context.close();
  }
}
export function captions(segments, format) {
  const clock = (t) => {
    const ms = Math.round(t * 1000);
    return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}${format === "srt" ? "," : "."}${String(ms % 1000).padStart(3, "0")}`;
  };
  return (
    (format === "vtt" ? "WEBVTT\n\n" : "") +
    segments
      .map(
        (s, i) =>
          `${format === "srt" ? i + 1 + "\n" : ""}${clock(s.start)} --> ${clock(s.end)}\n${s.text.replace(/-->/g, "→")}\n`,
      )
      .join("\n")
  );
}
