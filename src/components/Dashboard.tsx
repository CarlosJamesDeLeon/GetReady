import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Trash2, Upload, FileText, Loader2 } from "lucide-react";
import { SessionRecord } from "../types";

interface DashboardProps {
  onPrepare: (role: string, type: string, resume: string, jobDescription: string) => void;
  onViewSession?: (session: SessionRecord) => void;
}

export default function Dashboard({ onPrepare, onViewSession }: DashboardProps) {
  const [role, setRole] = useState("Frontend Developer");
  const [type, setType] = useState("Behavioral");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('interview_sessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  const clearSessions = () => {
    localStorage.removeItem('interview_sessions');
    setSessions([]);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('interview_sessions', JSON.stringify(updated));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse PDF");
      }

      const data = await response.json();
      setResume(data.text);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const types = ["Behavioral", "Technical", "System Design", "Leadership"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 min-h-[calc(100vh-10rem)]">
      <div className="lg:col-span-5 flex flex-col justify-center py-6">
        <h1 className="text-5xl lg:text-7xl font-semibold tracking-tighter mb-6 leading-[1.1]">
          Nail your next <br className="hidden lg:block"/><span className="text-gray-400">interview.</span>
        </h1>
        <p className="text-gray-500 text-lg sm:text-xl mb-10 lg:mb-12 max-w-xl leading-relaxed">
          Practice with a hyper-realistic AI interviewer. Get instant feedback on your answers, clarity, and pacing.
        </p>

        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-8 lg:mb-0">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider text-xs">
              Target Role
            </label>
            <input 
              type="text" 
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Product Manager, Software Engineer..."
              className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-base"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider text-xs">
              Interview Type
            </label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-3.5 px-4 rounded-xl text-sm sm:text-base font-medium transition-all ${
                    type === t 
                      ? "bg-black text-white shadow-md shadow-black/10 scale-[1.02]" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider text-xs">
                  Your Resume
                </label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {isUploading ? "Extracting..." : "Upload PDF"}
                  </button>
                </div>
              </div>
              <textarea 
                value={resume}
                onChange={e => setResume(e.target.value)}
                placeholder="Paste your resume here, or upload a PDF to extract text..."
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm flex-1 min-h-[160px] resize-none cursor-text"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider text-xs mt-[38px] md:mt-0">
                Job Description
              </label>
              <textarea 
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm flex-1 min-h-[160px] resize-none cursor-text"
              />
            </div>
          </div>

          <button
            onClick={() => onPrepare(role, type, resume, jobDescription)}
            className="w-full bg-gray-900 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-semibold hover:bg-black hover:shadow-lg active:scale-[0.98] transition-all text-lg"
          >
            Go to Interview Room
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <div className="lg:col-span-7 bg-gray-50/80 rounded-[2.5rem] border border-gray-200 backdrop-blur-sm p-8 lg:p-10 flex flex-col gap-8 flex-1 w-full">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Recent Sessions</h3>
            <p className="text-gray-500 mt-1">Review your past performance</p>
          </div>
          {sessions.length > 0 && (
            <button 
              onClick={clearSessions}
              className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Trash2 size={16} />
              Clear
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 content-start overflow-y-auto max-h-[600px] pr-2">
          {sessions.length === 0 ? (
            <div className="p-6 md:p-8 rounded-3xl border-2 border-dashed border-gray-200 bg-transparent flex flex-col items-center justify-center min-h-[160px] text-gray-400 col-span-1 md:col-span-2">
              <p className="font-medium text-center">Complete more interviews to see them here.</p>
            </div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id} 
                onClick={() => onViewSession?.(session)}
                className="p-6 md:p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-md transition-all flex flex-col justify-between min-h-[160px] cursor-pointer group relative"
              >
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  title="Delete Session"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex justify-between items-start mb-4 pr-8">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 line-clamp-1">{session.role}</h4>
                    <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">{session.type} • {session.history.length} Qs</p>
                  </div>
                  <span className={`font-semibold text-sm px-3.5 py-1.5 rounded-full border ${
                    session.score >= 80 ? 'bg-green-100 text-green-700 border-green-200' :
                    session.score >= 60 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {session.score} / 100
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{session.summary}</p>
                <div className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50 font-medium tracking-wide">
                  {new Date(session.date).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
