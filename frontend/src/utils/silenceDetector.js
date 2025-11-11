/**
 * Silence Detector
 *
 * Monitors an audio track and detects continuous silence.
 * Triggers a callback when silence exceeds a specified threshold.
 */

export class SilenceDetector {
  constructor(audioTrack, options = {}) {
    this.audioTrack = audioTrack;
    this.silenceThreshold = options.silenceThreshold || 10000; // 10 seconds default
    this.volumeThreshold = options.volumeThreshold || -50; // dB
    this.checkInterval = options.checkInterval || 100; // Check every 100ms

    this.audioContext = null;
    this.analyser = null;
    this.mediaStreamSource = null;
    this.silenceTimer = null;
    this.silenceStartTime = null;
    this.isMonitoring = false;
    this.onSilenceDetected = options.onSilenceDetected || null;
    this.onAudioDetected = options.onAudioDetected || null;
    this.onSilenceProgress = options.onSilenceProgress || null;
  }

  /**
   * Start monitoring for silence
   */
  start() {
    if (this.isMonitoring) {
      console.warn('Silence detector already running');
      return;
    }

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Get MediaStreamTrack from LiveKit audio track
      const mediaStream = new MediaStream([this.audioTrack.mediaStreamTrack]);

      // Create source from media stream
      this.mediaStreamSource = this.audioContext.createMediaStreamSource(mediaStream);
      this.mediaStreamSource.connect(this.analyser);

      // Start monitoring
      this.isMonitoring = true;
      this.silenceStartTime = Date.now();
      this.checkAudioLevel();

      console.log('Silence detector started');
    } catch (error) {
      console.error('Failed to start silence detector:', error);
      this.stop();
    }
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.silenceStartTime = null;

    console.log('Silence detector stopped');
  }

  /**
   * Check audio level and detect silence
   */
  checkAudioLevel() {
    if (!this.isMonitoring || !this.analyser) {
      return;
    }

    // Get frequency data
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    // Convert to decibels (approximate)
    const db = average > 0 ? 20 * Math.log10(average / 255) : -Infinity;

    // Check if audio is detected (above threshold)
    const isAudioDetected = db > this.volumeThreshold;

    if (isAudioDetected) {
      // Audio detected - reset silence timer
      if (this.silenceStartTime !== null) {
        console.log('Audio detected, resetting silence timer');
        this.silenceStartTime = Date.now();

        if (this.onAudioDetected) {
          this.onAudioDetected();
        }
      }
    } else {
      // Check silence duration
      const silenceDuration = Date.now() - this.silenceStartTime;

      // Report progress
      if (this.onSilenceProgress) {
        this.onSilenceProgress(silenceDuration, this.silenceThreshold);
      }

      // Check if silence threshold exceeded
      if (silenceDuration >= this.silenceThreshold) {
        console.log(`Silence detected for ${silenceDuration}ms`);

        if (this.onSilenceDetected) {
          this.onSilenceDetected(silenceDuration);
        }

        // Stop monitoring after detecting silence
        this.stop();
        return;
      }
    }

    // Schedule next check
    this.silenceTimer = setTimeout(() => this.checkAudioLevel(), this.checkInterval);
  }

  /**
   * Reset the silence timer without stopping the detector
   */
  reset() {
    this.silenceStartTime = Date.now();
    console.log('Silence timer reset');
  }

  /**
   * Get current silence duration
   */
  getCurrentSilenceDuration() {
    if (this.silenceStartTime === null) {
      return 0;
    }
    return Date.now() - this.silenceStartTime;
  }
}

export default SilenceDetector;
