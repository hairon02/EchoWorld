import { useEffect, useRef, useState } from "react";

/**
 * useAudio manages a file-based ambient music loop with Web Audio sound effects.
 */
export default function useAudio() {
  const ambientRef = useRef(null);
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState(1);

  const createAudioContext = () => {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const masterGain = context.createGain();
    masterGain.gain.value = isMuted ? 0 : masterVolume;
    masterGain.connect(context.destination);
    audioContextRef.current = context;
    masterGainRef.current = masterGain;
    return context;
  };

  const setMasterVolume = (value) => {
    const clamped = Math.max(0, Math.min(1, value));
    setMasterVolumeState(clamped);
    if (ambientRef.current) {
      ambientRef.current.volume = clamped * 2;
    }
  };

  const toggleMute = () => {
    setIsMuted((current) => {
      const next = !current;
      if (ambientRef.current) {
        ambientRef.current.volume = next ? 0 : masterVolume * 0.3;
      }
      return next;
    });
  };

  const createAmbientMusic = () => {
    if (ambientRef.current) return ambientRef.current;

    const ambientMusic = new Audio(
      "/audio/sound-suspense-tense-atmosphere.mp3",
    );
    ambientMusic.loop = true;
    ambientMusic.volume = isMuted ? 0 : 0.3;
    ambientRef.current = ambientMusic;
    return ambientMusic;
  };

  const startAmbient = () => {
    const ambientMusic = createAmbientMusic();
    try {
      ambientMusic.play().catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("Autoplay blocked by browser:", err);
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Ambient audio start failed:", err);
    }
  };

  const stopAmbient = () => {
    const ambientMusic = ambientRef.current;
    if (!ambientMusic) return;

    let currentVolume = ambientMusic.volume;
    const step = currentVolume / 20;
    const fade = setInterval(() => {
      currentVolume -= step;
      if (currentVolume <= 0) {
        clearInterval(fade);
        ambientMusic.pause();
        ambientMusic.currentTime = 0;
        ambientMusic.volume = isMuted ? 0 : 0.3;
      } else {
        ambientMusic.volume = Math.max(0, currentVolume);
      }
    }, 50);
  };

  const playChoiceHover = () => {
    const context = createAudioContext();
    if (!context || !masterGainRef.current) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 440;
    gain.gain.value = 0.06;
    oscillator.connect(gain);
    gain.connect(masterGainRef.current);

    const now = context.currentTime;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  };

  const playChoiceClick = () => {
    const context = createAudioContext();
    if (!context || !masterGainRef.current) return;

    const createClickOscillator = (frequency) => {
      const osc = context.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = frequency;
      return osc;
    };

    const clickGain = context.createGain();
    clickGain.gain.value = 0.1;
    clickGain.connect(masterGainRef.current);

    const reverb = (() => {
      const sampleRate = context.sampleRate;
      const length = sampleRate * 0.4;
      const impulse = context.createBuffer(2, length, sampleRate);
      for (let channel = 0; channel < 2; channel += 1) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i += 1) {
          channelData[i] =
            (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
        }
      }
      const convolver = context.createConvolver();
      convolver.buffer = impulse;
      return convolver;
    })();

    clickGain.connect(reverb);
    reverb.connect(masterGainRef.current);

    const now = context.currentTime;
    const osc1 = createClickOscillator(523);
    const osc2 = createClickOscillator(659);
    osc1.connect(clickGain);
    osc2.connect(clickGain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.1);
    osc2.stop(now + 0.1);

    [osc1, osc2].forEach((osc) => {
      osc.onended = () => {
        try {
          osc.disconnect();
        } catch (e) {
          // ignore
        }
      };
    });

    clickGain.gain.setValueAtTime(0.1, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    setTimeout(() => {
      try {
        clickGain.disconnect();
        reverb.disconnect();
      } catch (e) {
        // ignore
      }
    }, 200);
  };

  const playSceneTransition = () => {
    const context = createAudioContext();
    if (!context || !masterGainRef.current) return;

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, context.currentTime);
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(masterGainRef.current);

    const now = context.currentTime;
    osc.start(now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.5);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
    osc.stop(now + 0.6);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  };

  const playGameStart = () => {
    const context = createAudioContext();
    if (!context || !masterGainRef.current) return;

    const notes = [261, 329, 392];
    notes.forEach((frequency, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "triangle";
      osc.frequency.value = frequency;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(masterGainRef.current);

      const startTime = context.currentTime + index * 0.15;
      const stopTime = startTime + 0.22;
      osc.start(startTime);
      osc.stop(stopTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  };

  useEffect(() => {
    return () => {
      if (ambientRef.current) {
        try {
          ambientRef.current.pause();
          ambientRef.current = null;
        } catch (err) {
          // ignore
        }
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (err) {
          // ignore
        }
      }
    };
  }, []);

  return {
    isMuted,
    startAmbient,
    stopAmbient,
    setMasterVolume,
    toggleMute,
    playChoiceHover,
    playChoiceClick,
    playSceneTransition,
    playGameStart,
  };
}
