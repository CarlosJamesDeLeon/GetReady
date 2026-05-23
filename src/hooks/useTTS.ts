import { useEffect, useRef, useState } from 'react';

export function useTTS(preferredProvider: 'elevenlabs' | 'webspeech' = 'elevenlabs') {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsProvider, setTtsProvider] = useState<"elevenlabs" | "webspeech" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setTtsProvider(null);
  };

  const playWebSpeech = (text: string) => {
    setTtsProvider("webspeech");
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("Google") || v.name.includes("Samantha"));
      if (preferred) utterance.voice = preferred;
      
      utterance.rate = 1.0;
      
      utterance.onend = () => {
        setIsPlaying(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  };

  const play = async (text: string, forceProvider?: 'elevenlabs' | 'webspeech') => {
    stop();
    setIsPlaying(true);
    
    const targetProvider = forceProvider || preferredProvider;

    try {
      if (targetProvider === 'webspeech') throw new Error("Fallback requested");
      
      const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      setTtsProvider("elevenlabs");
      
      return new Promise<void>((resolve) => {
        audio.onended = () => {
          setIsPlaying(false);
          resolve();
        };
        audio.onerror = () => {
          console.warn("ElevenLabs TTS streaming failed, falling back to WebSpeech");
          setIsPlaying(false);
          playWebSpeech(text).then(resolve);
        };
        audio.play().catch(e => {
          console.error("Audio playback blocked", e);
          setIsPlaying(false);
          playWebSpeech(text).then(resolve);
        });
      });

    } catch (err) {
      console.warn("Falling back to Web Speech API", err);
      return playWebSpeech(text);
    }
  };

  return { play, stop, isPlaying, ttsProvider };
}
