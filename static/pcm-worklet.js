class PcmChunks extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(64000);
    this.offset = 0;
  }
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    for (const value of channel) {
      this.buffer[this.offset++] = value;
      if (this.offset === this.buffer.length) {
        this.port.postMessage(this.buffer, [this.buffer.buffer]);
        this.buffer = new Float32Array(64000);
        this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor("vani-pcm", PcmChunks);
