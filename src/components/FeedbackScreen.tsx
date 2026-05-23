import { useEffect, useRef } from 'react';
import { FeedbackResult, QA } from '../types';
import { Loader2, Home, CheckCircle2, ChevronDown } from 'lucide-react';

interface FeedbackScreenProps {
  history: QA[];
  role: string;
  interviewType: string;
  resume: string;
  jobDescription: string;
  feedbackResult: FeedbackResult | null;
  setFeedbackResult: (r: FeedbackResult) => void;
  onRestart: () => void;
}

export default function FeedbackScreen({ 
  history, 
  role, 
  interviewType, 
  resume,
  jobDescription,
  feedbackResult, 
  setFeedbackResult,
  onRestart
}: FeedbackScreenProps) {
  const fetchBegan = useRef(false);

  useEffect(() => {
    if (!feedbackResult && history.length > 0 && !fetchBegan.current) {
      fetchBegan.current = true;
      const getFeedback = async () => {
        try {
           const res = await fetch("/api/interview/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history, role, interviewType, resume, jobDescription })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to generate feedback");
          }
          setFeedbackResult(data);
          
          // Save to localStorage
          const saved = localStorage.getItem('interview_sessions');
          const sessions = saved ? JSON.parse(saved) : [];
          sessions.unshift({
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            role,
            type: interviewType,
            score: data.summaryRating,
            summary: data.overallFeedback,
            history,
            resume,
            jobDescription,
            feedbackResult: data
          });
          localStorage.setItem('interview_sessions', JSON.stringify(sessions));
          
        } catch (error: any) {
          console.error(error);
          // Instead of alert, we let it fail or we could set an error state.
          // For now, let's just go back to start.
          onRestart();
        }
      };
      getFeedback();
    }
  }, [history, role, interviewType, resume, jobDescription, feedbackResult, setFeedbackResult]);

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-500 mb-4">You did not answer any questions.</p>
        <button onClick={onRestart} className="text-black font-medium hover:underline">Go back home</button>
      </div>
    );
  }

  if (!feedbackResult) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center mt-12">
        <div className="w-16 h-16 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center mb-6">
          <Loader2 size={32} className="animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Analyzing your performance</h2>
        <p className="text-gray-500 max-w-md">Our AI coach is reviewing your answers for clarity, knowledge, and presentation. This will just take a moment...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-16 max-w-[1600px] w-full mx-auto">
      {/* Score Header */}
      <div className="bg-white rounded-[2.5rem] p-10 lg:p-14 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col md:flex-row items-center gap-10 lg:gap-16 text-center md:text-left w-full relative">
        <div className="relative shrink-0">
          <svg className="w-48 h-48 lg:w-56 lg:h-56 transform -rotate-90">
            <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
            <circle 
              cx="50%" 
              cy="50%" 
              r="45%" 
              stroke="currentColor" 
              strokeWidth="8" 
              fill="transparent" 
              strokeLinecap="round"
              className={feedbackResult.summaryRating >= 80 ? "text-green-500" : feedbackResult.summaryRating >= 60 ? "text-yellow-500" : "text-amber-600"} 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * feedbackResult.summaryRating) / 100} 
              style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }} 
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-6xl lg:text-7xl font-bold tracking-tighter">{feedbackResult.summaryRating}</span>
            <span className="text-sm font-semibold tracking-widest text-gray-400 uppercase mt-1">out of 100</span>
          </div>
        </div>
        
        <div className="flex-1 w-full">
          <h2 className="text-3xl lg:text-4xl font-semibold mb-4 tracking-tight">Interview Complete</h2>
          <p className="text-gray-600 leading-relaxed text-lg lg:text-xl mb-8 max-w-3xl">
            {feedbackResult.overallFeedback}
          </p>
          <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
            <button 
              onClick={onRestart}
              className="bg-black text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 hover:bg-gray-800 transition-all hover:scale-105 shadow-md shadow-black/10 text-lg"
            >
              <Home size={18} /> Back to Home
            </button>
            
            <button 
              onClick={() => {
                document.getElementById('detailed-feedback')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors group cursor-pointer animate-pulse focus:outline-none"
            >
              <span className="text-sm font-bold tracking-widest uppercase">Scroll for detailed feedback</span>
              <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed review items mapped as full width blocks */}
      <div id="detailed-feedback" className="w-full mt-4">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
             <CheckCircle2 size={24} />
           </div>
           <h3 className="text-2xl font-semibold tracking-tight">Detailed Breakdown</h3>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {feedbackResult.questionReviews.map((review, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col gap-6 w-full">
              
              <div className="flex flex-col gap-2">
                <span className="text-sm uppercase tracking-widest font-bold text-gray-400">Question {i + 1}</span>
                <p className="text-2xl font-medium leading-relaxed max-w-4xl">{review.question}</p>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-100">
                <span className="text-sm uppercase tracking-widest font-bold text-gray-500 mb-3 block">Your Answer</span>
                <p className="text-gray-800 leading-relaxed text-lg">{review.userAnswer}</p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-6 w-full">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 lg:p-8 h-full">
                  <span className="text-sm uppercase tracking-widest font-bold text-gray-800 mb-3 block">Feedback</span>
                  <p className="text-gray-900/90 leading-relaxed text-lg">{review.feedback}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 lg:p-8 h-full">
                  <span className="text-sm uppercase tracking-widest font-bold text-amber-800 mb-3 block">Actionable Suggestion</span>
                  <p className="text-amber-900/90 leading-relaxed text-lg">{review.suggestionsForImprovement}</p>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
