import { BookOpen, Calendar, Clock, Video, Play, ArrowLeft } from 'lucide-react';

interface PreparationScreenProps {
  role: string;
  interviewType: string;
  onBack: () => void;
  onStartSession: () => void;
}

export default function PreparationScreen({ role, interviewType, onBack, onStartSession }: PreparationScreenProps) {
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto py-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 self-start transition-colors font-medium text-sm"
      >
        <ArrowLeft size={16} />
        Back to Home
      </button>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-bl-[100px] -z-0 opacity-50" />
        
        <div className="relative z-10 flex flex-col gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-gray-200">
                AI Interview Session
              </span>
              <span className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                <Clock size={14} /> ~15-30 mins
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 mb-3">
              {role} Interview
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
              You are about to start a {interviewType.toLowerCase()} interview session. Review the details below and ensure your environment is quiet before beginning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                <Video size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Audio and Voice</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                  The AI interviewer will speak to you. You can respond via text or by using the microphone (voice-to-text).
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Format & Expectations</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                  Questions are generated dynamically based on your {interviewType.toLowerCase()} profile. Answer naturally and clearly.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex items-start gap-4 md:col-span-2">
               <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Schedule & Setup</h3>
                <ul className="text-gray-500 text-sm mt-2 leading-relaxed space-y-2 list-disc list-inside">
                   <li>Ensure a stable internet connection.</li>
                   <li>Allow microphone access if you plan to speak.</li>
                   <li>You can end the session anytime to receive feedback.</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="text-sm text-gray-500 font-medium">Ready when you are.</div>
             <button 
               onClick={onStartSession}
               className="w-full sm:w-auto bg-gray-900 text-white rounded-xl px-8 py-4 flex items-center justify-center gap-2 font-semibold hover:bg-black hover:shadow-lg active:scale-[0.98] transition-all text-base"
             >
               <Play size={18} className="fill-current text-white" />
               Begin Interview
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
