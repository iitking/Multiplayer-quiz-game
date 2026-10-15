import React, { useState, useRef } from 'react';
import { Volume2, Play, Pause, Image as ImageIcon } from 'lucide-react';

export function MediaViewer({ imageUrl, audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  if (!imageUrl && !audioUrl) return null;

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 my-3">
      {/* Image Question */}
      {imageUrl && (
        <div className="relative max-h-52 md:max-h-64 max-w-full rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-black/40 group">
          <img
            src={imageUrl}
            alt="Question visual"
            className="w-full h-full object-contain max-h-52 md:max-h-64 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-slate-300 text-xs flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Visual
          </div>
        </div>
      )}

      {/* Audio Question */}
      {audioUrl && (
        <div className="flex items-center gap-3 bg-purple-950/40 border border-purple-500/30 px-4 py-2.5 rounded-2xl backdrop-blur-sm shadow-lg">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <button
            type="button"
            onClick={toggleAudio}
            className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition shadow-md shadow-purple-600/30"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>Audio Question</span>
            </div>
            <p className="text-[11px] text-slate-400">Click to listen to the clue audio</p>
          </div>
        </div>
      )}
    </div>
  );
}
