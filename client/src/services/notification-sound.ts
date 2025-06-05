export class NotificationSoundService {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    this.loadPreferences();
    this.initializeAudio();
  }

  private loadPreferences() {
    const saved = localStorage.getItem('notification-sound-enabled');
    this.isEnabled = saved !== null ? JSON.parse(saved) : true;
  }

  private async initializeAudio() {
    try {
      // Primary method: HTML5 Audio - Load lazily, don't preload
      this.audio = new Audio('/sounds/notification.wav');
      this.audio.preload = 'none'; // Changed from 'auto' to 'none'
      this.audio.volume = 0.3; // Default volume (30%)

      // Secondary method: Web Audio API for programmatic fallback
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize notification sound:', error);
      this.isInitialized = false;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('notification-sound-enabled', JSON.stringify(enabled));
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  public async playNotificationSound(): Promise<void> {
    if (!this.isEnabled || !this.isInitialized) {
      return;
    }

    try {
      // Ensure audio context is running (required for Chrome autoplay policy)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Prefer programmatic beep over large audio file for performance
      if (this.audioContext && this.audioContext.state === 'running') {
        await this.playFallbackBeep();
      } else if (this.audio) {
        // Only load the audio file if Web Audio API is not available
        // Reset audio to beginning
        this.audio.currentTime = 0;
        
        // Play the sound
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
        }
      } else {
        // Fallback: Create a simple beep using Web Audio API
        await this.playFallbackBeep();
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
      
      // If primary method fails, try fallback beep
      try {
        await this.playFallbackBeep();
      } catch (fallbackError) {
        console.warn('Fallback sound also failed:', fallbackError);
      }
    }
  }

  private async playFallbackBeep(): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Create a pleasant notification beep
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  public setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public getVolume(): number {
    return this.audio?.volume || 0.3;
  }

  // Enable audio after user interaction (required for autoplay policy)
  public async enableAudioAfterUserInteraction(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAudio();
    }

    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Test play a silent sound to unlock audio
      if (this.audio) {
        const originalVolume = this.audio.volume;
        this.audio.volume = 0;
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          this.audio.pause();
          this.audio.currentTime = 0;
        }
        this.audio.volume = originalVolume;
      }
    } catch (error) {
      console.warn('Failed to enable audio after user interaction:', error);
    }
  }
}

// Create singleton instance
export const notificationSoundService = new NotificationSoundService(); 