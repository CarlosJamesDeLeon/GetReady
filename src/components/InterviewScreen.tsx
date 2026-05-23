import { useState, useEffect, useRef, FormEvent } from 'react';
import { QA } from '../types';
import { Lightbulb, Mic, Send, SquareSquare, FastForward, Loader2, Volume2, Square, Sparkles, Volume1 } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';
import { useSTT } from '../hooks/useSTT';

interface InterviewScreenProps {
  role: string;
  interviewType: string;
  resume: string;
  jobDescription: string;
  onEnd: (history: QA[]) => void;
}

export default function InterviewScreen({ role, interviewType, resume, jobDescription, onEnd }: InterviewScreenProps) {
  const [history, setHistory] = useState<QA[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseAnswer, setBaseAnswer] = useState<string>('');
  const [hint, setHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [preferredVoice, setPreferredVoice] = useState<'elevenlabs' | 'webspeech'>('webspeech');
  
  const { play, stop, isPlaying, ttsProvider } = useTTS(preferredVoice);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);

  const { isListening, toggleListening, stopListening, error: sttError } = useSTT((text, isFinal) => {
    if (isTransitioningRef.current) return;
    setUserAnswer(baseAnswer + (baseAnswer ? ' ' : '') + text);
    if (isFinal) {
      setBaseAnswer(prev => prev + (prev ? ' ' : '') + text);
    }
  });

  // Keep baseAnswer in sync with manual typing if not listening
  // Removed useEffect to avoid race conditions, we now sync synchronously in onChange

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentQuestion, hint]);

  // Auto-scroll textarea when speaking
  useEffect(() => {
    if (isListening && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [userAnswer, isListening]);

  // Load first question
  const fetchNextQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, interviewType, history, resume, jobDescription })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch next question");
      }
      setCurrentQuestion(data.question);
      setHint(null);
      setIsLoading(false);
      isTransitioningRef.current = false;
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
      isTransitioningRef.current = false;
    }
  };

  const handleStart = () => {
    setHasStarted(true);
    // Unlock WebSpeech API by playing an empty utterance on user click
    const unlockUtterance = new SpeechSynthesisUtterance('');
    unlockUtterance.volume = 0;
    window.speechSynthesis.speak(unlockUtterance);
    fetchNextQuestion();
  };

  // Autoplay TTS when question arrives
  useEffect(() => {
    if (currentQuestion) {
      play(currentQuestion);
    }
  }, [currentQuestion]);

  const requestHint = async () => {
    if (!currentQuestion || isLoadingHint || hint) return;
    setIsLoadingHint(true);
    try {
      const res = await fetch("/api/interview/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion, role, interviewType, resume, jobDescription })
      });
      const data = await res.json();
      if (res.ok && data.hint) {
        setHint(data.hint);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!userAnswer.trim() || isLoading) return;
    
    stop(); // stop any playing audio
    stopListening();
    isTransitioningRef.current = true;
    const newQA = { question: currentQuestion, answer: userAnswer };
    
    // We update history and THEN fetch the next question
    setHistory(prev => [...prev, newQA]);
    setUserAnswer('');
    setBaseAnswer('');
    setCurrentQuestion('');

    // Fetch next question using updated history
    fetchNextQuestionWithHistory([...history, newQA]);
  };

  const fetchNextQuestionWithHistory = async (currentHistory: QA[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, interviewType, history: currentHistory, resume, jobDescription })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch next question");
      }
      setCurrentQuestion(data.question);
      setHint(null);
      setIsLoading(false);
      isTransitioningRef.current = false;
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
      isTransitioningRef.current = false;
    }
  };

  const handleEnd = () => {
    stop();
    // If they typed something but didn't hit send, add it.
    let finalHistory = [...history];
    if (userAnswer.trim() && currentQuestion) {
      finalHistory.push({ question: currentQuestion, answer: userAnswer });
    }
    onEnd(finalHistory);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-[1400px] mx-auto h-full min-h-0">
      {/* Sidebar / Mock Interviewer Area */}
      <div className="lg:w-1/3 flex flex-col gap-6 lg:h-full flex-shrink-0">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2rem] p-8 flex flex-col items-center justify-center relative overflow-hidden text-white min-h-[250px] lg:flex-1 shadow-xl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none z-0" />
          
          <div className={`w-32 h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 relative z-10 border shadow-2xl transition-all duration-700 ${isPlaying ? 'border-white/50 shadow-white/20 scale-105' : 'border-white/20'}`}>
            {isPlaying ? (
               <Volume2 size={48} className="text-white animate-pulse" />
            ) : (
               <Mic size={48} className="text-white/60" />
            )}
            {/* Simple audio visualizer ring when playing */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
            )}
          </div>
          
          <h3 className="text-2xl font-semibold relative z-10 text-center">{role}</h3>
          <p className="text-gray-400 text-sm relative z-10 uppercase tracking-[0.2em] mt-2 font-medium">Interviewer</p>
          
          <div className="absolute top-6 right-6 flex items-center gap-2 text-xs font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 z-10 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            Live
          </div>
        </div>

        {/* Desktop only: Stats block */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100/80 hidden lg:flex flex-col gap-6">
           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-1 border-b border-gray-50 pb-4">Session Details</h4>
           <div className="space-y-5">
             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-500 font-medium">Interview Type</span>
               <span className="font-semibold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{interviewType}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-500 font-medium">Questions Answered</span>
               <span className="font-semibold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{history.length}</span>
             </div>
             <div className="flex flex-col gap-3 mt-2">
               <span className="text-gray-500 font-medium text-sm">Voice Quality (TTS)</span>
               <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-xl">
                 <button
                   onClick={() => setPreferredVoice('elevenlabs')}
                   className={`flex-1 flex flex-col items-center justify-center py-2 px-2 text-xs font-semibold rounded-lg transition-all ${preferredVoice === 'elevenlabs' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                 >
                   <span className="flex items-center gap-1.5"><Sparkles size={14} className={preferredVoice==='elevenlabs' ? "text-yellow-500 fill-yellow-500" : ""} /> Premium</span>
                 </button>
                 <button
                   onClick={() => setPreferredVoice('webspeech')}
                   className={`flex-1 flex flex-col items-center justify-center py-2 px-2 text-xs font-semibold rounded-lg transition-all ${preferredVoice === 'webspeech' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                 >
                   <span className="flex items-center gap-1.5"><Volume1 size={14} /> Basic (Free)</span>
                 </button>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="lg:w-2/3 flex flex-col bg-white rounded-[2rem] shadow-sm border border-gray-100/80 overflow-hidden h-[600px] lg:h-full lg:flex-1 relative">
        <div className="p-5 sm:px-8 border-b border-gray-50 flex items-center justify-between bg-white z-10 hidden lg:flex flex-shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-gray-50 rounded-[1rem] flex items-center justify-center text-gray-700">
                <FastForward size={22} className="fill-current text-gray-400" />
             </div>
             <div>
               <h2 className="font-semibold text-lg text-gray-900">Interview Chat</h2>
               <p className="text-sm text-gray-500 mt-0.5">Recording transcripts and AI responses.</p>
             </div>
          </div>
          <button 
            onClick={handleEnd}
            className="text-sm font-semibold text-white bg-gray-900 hover:bg-black px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <SquareSquare size={16} className="text-gray-300" /> <span>End Interview</span>
          </button>
        </div>

        {/* Mobile Header (simplified) */}
        <div className="p-4 border-b border-gray-100 flex lg:hidden items-center justify-between bg-white backdrop-blur-md z-10 sticky top-0">
          <h2 className="font-semibold px-2">Interview Chat</h2>
          <button 
            onClick={handleEnd}
            className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
          >
            End
          </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-8 bg-white min-h-0">
          {!hasStarted ? (
            <div className="flex-1 flex items-center justify-center flex-col h-full">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-900 mb-6 border border-gray-100 shadow-sm">
                <Mic size={32} />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Ready to Start?</h3>
              <p className="text-gray-500 mb-8 max-w-sm text-center">
                Click below when you are ready for the first question. Make sure your microphone is working.
              </p>
              <button 
                onClick={handleStart}
                className="bg-gray-900 text-white rounded-xl px-10 py-4 flex items-center justify-center gap-2 font-semibold hover:bg-black hover:shadow-lg active:scale-[0.98] transition-all text-lg shadow-sm"
              >
                <FastForward size={20} className="fill-current text-gray-300" />
                Start Interview
              </button>
            </div>
          ) : (history.length === 0 && !isLoading && !currentQuestion && !error) ? (
             <div className="flex-1 flex items-center justify-center flex-col text-gray-400 h-full">
               <Loader2 size={32} className="animate-spin mb-4 text-gray-300" />
               <p className="font-medium text-gray-500">Preparing the interview environment...</p>
             </div>
          ) : null}

          {error && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-red-50/50 border border-red-100/50 rounded-2xl p-6 sm:p-8 w-full max-w-lg text-center flex flex-col items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 flex-shrink-0 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-1">
                  <span className="font-bold text-xl">!</span>
                </div>
                <h3 className="font-semibold text-red-900 text-lg">Failed to connect to AI</h3>
                <div className="text-red-700 text-sm max-h-[150px] overflow-y-auto break-all whitespace-pre-wrap bg-white/60 p-4 rounded-xl w-full border border-red-100 shadow-sm">
                  {error}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleEnd} className="px-5 py-2.5 rounded-xl text-red-700 font-semibold hover:bg-red-100 transition-colors text-sm">End Session</button>
                  <button onClick={fetchNextQuestion} className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-sm text-sm">Retry Request</button>
                </div>
              </div>
            </div>
          )}

          {history.map((qa, i) => (
            <div key={i} className="flex flex-col gap-6 w-full">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white">AI</div>
                <div className="bg-gray-50 border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-6 py-4 text-base max-w-[90%] md:max-w-[80%] leading-relaxed">
                  {qa.question}
                </div>
              </div>
              <div className="flex items-start justify-end gap-4">
                <div className="bg-gray-900 text-white rounded-2xl rounded-tr-sm px-6 py-4 text-base max-w-[90%] md:max-w-[80%] leading-relaxed shadow-sm">
                  {qa.answer}
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-700 ring-2 ring-white">You</div>
              </div>
            </div>
          ))}

          {isLoading ? (
            <div className="flex items-start gap-4 w-full">
              <div className="w-9 h-9 rounded-full bg-gray-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white">AI</div>
              <div className="bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl rounded-tl-sm px-6 py-5 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-gray-400" />
                <span className="text-sm font-medium">Generating next question...</span>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="flex items-start gap-4 w-full mb-4">
              <div className={`w-9 h-9 rounded-full bg-gray-900 flex-shrink-0 flex items-center justify-center text-white shadow-sm ring-2 ring-white transition-all ${isPlaying ? 'ring-4 ring-gray-900/10' : ''}`}>
                 <span className="text-xs font-bold">AI</span>
              </div>
              <div className="bg-white border border-gray-200 shadow-sm text-gray-900 rounded-2xl rounded-tl-sm px-6 py-5 max-w-[90%] md:max-w-[80%] leading-relaxed text-base">
                {currentQuestion}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {isPlaying ? (
                    <button 
                      onClick={() => stop()}
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-600 font-bold hover:text-red-700 transition-colors bg-gray-50 hover:bg-red-50 border border-gray-100 px-3 py-1.5 rounded-md inline-flex"
                    >
                      <Square size={12} className="fill-current text-red-500" /> Stop Audio
                    </button>
                  ) : (
                    <button 
                      onClick={() => play(currentQuestion)}
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-600 font-bold hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-md inline-flex"
                    >
                      <Volume2 size={14} className="text-gray-500" /> Replay Audio
                    </button>
                  )}
                  <button 
                    onClick={requestHint}
                    disabled={isLoadingHint || !!hint}
                    className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-600 font-bold hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-md inline-flex disabled:opacity-50"
                  >
                    {isLoadingHint ? (
                       <Loader2 size={12} className="animate-spin text-gray-500" />
                    ) : (
                       <Lightbulb size={12} className={hint ? "fill-current" : "text-gray-500"} />
                    )} 
                    {hint ? "Hint Provided" : "Get a Hint"}
                  </button>
                </div>
                {hint && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-800 leading-relaxed shadow-sm">
                    <span className="font-bold uppercase tracking-widest text-[10px] text-gray-500 mb-1 flex items-center gap-1.5"><Sparkles size={12} className="text-gray-400"/> Live Coaching</span>
                    {hint}
                  </div>
                )}
              </div>
            </div>
          ) : null}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <div className="p-4 sm:p-5 flex-shrink-0 border-t border-gray-100 bg-white relative z-20">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1 relative">
              <textarea 
                ref={textareaRef}
                value={userAnswer}
                onChange={e => {
                  const val = e.target.value;
                  setUserAnswer(val);
                  setBaseAnswer(val);
                  if (isListening) {
                    stopListening();
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (hasStarted) handleSubmit();
                  }
                }}
                disabled={isLoading || !hasStarted}
                placeholder={isListening ? "Listening... (Speak now)" : "Type your answer... (Press Return to send)"}
                className={`w-full resize-none bg-gray-50 border rounded-xl pl-5 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all disabled:opacity-50 text-base min-h-[56px] max-h-[160px] cursor-text shadow-sm ${isListening ? 'border-red-300 ring-4 ring-red-500/10 bg-red-50/20 text-red-900 overflow-y-auto' : 'border-gray-200 focus:border-gray-300'}`}
                rows={1}
              />
              <button 
                type="button" 
                onClick={toggleListening}
                disabled={isLoading || !hasStarted}
                className={`absolute right-3 top-3.5 transition-colors p-1.5 rounded-lg disabled:opacity-50 ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`} 
                title="Toggle Mic"
              >
                <Mic size={20} className={isListening ? 'fill-current' : ''} />
              </button>
            </div>
            
            <button 
              type="submit" 
              disabled={!userAnswer.trim() || isLoading || !hasStarted}
              className="w-[56px] h-[56px] flex items-center justify-center bg-gray-900 text-white rounded-xl hover:bg-black disabled:opacity-40 disabled:hover:bg-gray-900 transition-all flex-shrink-0 shadow-sm active:scale-95"
            >
              <Send size={20} className="ml-1" />
            </button>
          </form>
          {sttError && (
            <p className="text-red-500 text-xs mt-2 px-1 font-medium">{sttError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
