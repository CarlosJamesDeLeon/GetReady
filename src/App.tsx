import { useState, useRef, useEffect } from 'react';
import { AppState, FeedbackResult, QA } from './types';
import Dashboard from './components/Dashboard';
import PreparationScreen from './components/PreparationScreen';
import InterviewScreen from './components/InterviewScreen';
import FeedbackScreen from './components/FeedbackScreen';
import AreasForImprovement from './components/AreasForImprovement';
import SettingsScreen from './components/SettingsScreen';
import { AnimatePresence, motion } from 'motion/react';
import { BriefcaseBusiness } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>('dashboard');
  const [role, setRole] = useState('Frontend Developer');
  const [interviewType, setInterviewType] = useState('Behavioral');
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [history, setHistory] = useState<QA[]>([]);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);

  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [appState]);

  const prepareInterview = (selectedRole: string, selectedType: string, selectedResume: string, selectedJobDescription: string) => {
    setRole(selectedRole);
    setInterviewType(selectedType);
    setResume(selectedResume);
    setJobDescription(selectedJobDescription);
    setAppState('preparation');
  };

  const startInterview = () => {
    setHistory([]);
    setFeedback(null);
    setAppState('interview');
  };

  const endInterview = async (finalHistory: QA[]) => {
    setHistory(finalHistory);
    setAppState('feedback'); // Initially switch to feedback to show loading state
  };

  return (
    <div className="h-screen flex flex-col bg-[#fcfcfc] w-full overflow-hidden">
      <header className="w-full px-6 sm:px-10 py-5 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100 flex-shrink-0 z-10">
        <div 
          className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-75"
          onClick={() => setAppState('dashboard')}
        >
          <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center shadow-md">
            <BriefcaseBusiness size={18} />
          </div>
          <span className="font-bold tracking-tight text-xl">GetReady</span>
        </div>
        <nav className="text-sm font-medium text-gray-500 hidden sm:flex gap-8">
          <button onClick={() => setAppState('dashboard')} className={`hover:text-black transition-colors ${appState === 'dashboard' ? 'text-black' : ''}`}>Home</button>
          <button onClick={() => setAppState('areas')} className={`hover:text-black transition-colors ${appState === 'areas' ? 'text-black' : ''}`}>Areas for Improvement</button>
          <button onClick={() => setAppState('settings')} className={`hover:text-black transition-colors ${appState === 'settings' ? 'text-black' : ''}`}>Settings</button>
        </nav>
      </header>

      <main ref={mainRef} className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col p-6 sm:p-8 md:p-10 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {appState === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Dashboard 
                onPrepare={prepareInterview} 
                onViewSession={(session) => {
                  setRole(session.role);
                  setInterviewType(session.type);
                  setResume(session.resume || "");
                  setJobDescription(session.jobDescription || "");
                  setHistory(session.history);
                  
                  if (session.feedbackResult) {
                     setFeedback(session.feedbackResult);
                  } else {
                     setFeedback({
                        summaryRating: session.score,
                        overallFeedback: session.summary,
                        questionReviews: session.history.map(h => ({
                          question: h.question,
                          userAnswer: h.answer,
                          feedback: "Detailed feedback not saved for this older session.",
                          suggestionsForImprovement: "N/A"
                        }))
                     });
                  }
                  
                  setAppState('feedback');
                }}
              />
            </motion.div>
          )}

          {appState === 'preparation' && (
            <motion.div
              key="preparation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <PreparationScreen 
                role={role}
                interviewType={interviewType}
                onBack={() => setAppState('dashboard')}
                onStartSession={startInterview}
              />
            </motion.div>
          )}

          {appState === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col h-full min-h-0"
            >
              <InterviewScreen 
                role={role} 
                interviewType={interviewType} 
                resume={resume}
                jobDescription={jobDescription}
                onEnd={endInterview} 
              />
            </motion.div>
          )}

          {appState === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <FeedbackScreen 
                history={history} 
                role={role} 
                interviewType={interviewType}
                resume={resume}
                jobDescription={jobDescription}
                feedbackResult={feedback}
                setFeedbackResult={setFeedback}
                onRestart={() => setAppState('dashboard')}
              />
            </motion.div>
          )}

          {appState === 'areas' && (
            <motion.div
              key="areas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <AreasForImprovement onBack={() => setAppState('dashboard')} />
            </motion.div>
          )}

          {appState === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <SettingsScreen onBack={() => setAppState('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
