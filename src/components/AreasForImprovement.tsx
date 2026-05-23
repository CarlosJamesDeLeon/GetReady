import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SessionRecord } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, Loader2, Target, Zap, ShieldAlert, Rocket } from 'lucide-react';

interface AreasForImprovementProps {
  onBack: () => void;
}

interface SWOTData {
  strengths: { title: string; description: string; }[];
  weaknesses: { title: string; description: string; actionableResource: string; }[];
  opportunities: { title: string; description: string; actionableResource: string; }[];
  threats: { title: string; description: string; }[];
  skills: { subject: string; A: number; fullMark: number; }[];
}

export default function AreasForImprovement({ onBack }: AreasForImprovementProps) {
  const [data, setData] = useState<SWOTData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const saved = localStorage.getItem('interview_sessions');
        const sessions: SessionRecord[] = saved ? JSON.parse(saved) : [];

        if (sessions.length === 0) {
          setData({
             strengths: [],
             weaknesses: [],
             opportunities: [],
             threats: [],
             skills: [
              { subject: 'Communication', A: 0, fullMark: 100 },
              { subject: 'Technical', A: 0, fullMark: 100 },
              { subject: 'Behavioral', A: 0, fullMark: 100 },
              { subject: 'Confidence', A: 0, fullMark: 100 },
              { subject: 'Clarity', A: 0, fullMark: 100 }
             ]
          });
          setLoading(false);
          return;
        }

        const res = await fetch("/api/interview/swot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessions })
        });
        
        if (!res.ok) throw new Error("Failed to fetch SWOT analysis");
        
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
         <Loader2 className="animate-spin text-gray-400 mb-4" size={32} />
         <p className="text-gray-500 font-medium animate-pulse">Analyzing your interview history...</p>
      </div>
    );
  }

  if (error) {
     return (
        <div className="text-center text-red-500 p-10">
           <p>Failed to load analysis: {error}</p>
           <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-black">Go Back</button>
        </div>
     );
  }

  const hasData = data && (data.strengths.length > 0 || data.weaknesses.length > 0);

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Areas for Improvement</h1>
        <p className="text-gray-500 mt-2">Personalized SWOT analysis based on your past mock interviews.</p>
      </div>

      {!hasData ? (
         <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <h3 className="text-xl font-semibold mb-2">No Interview History Yet</h3>
            <p className="text-gray-500">Complete at least one mock interview to unlock your personalized improvement analysis.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col">
               <h3 className="text-xl font-semibold mb-6 tracking-tight text-gray-900">Skill Profile</h3>
               <div className="flex-1 w-full min-h-[350px] relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 to-transparent rounded-2xl -z-10" />
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data.skills}>
                      <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Proficiency" dataKey="A" stroke="#4f46e5" strokeWidth={2.5} fill="#4f46e5" fillOpacity={0.15} dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
                        formatter={((value: any) => [`${value}%`, 'Score']) as any}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100/50 shadow-sm">
                        <Zap size={20} />
                     </div>
                     <h3 className="text-xl font-semibold text-gray-900">Strengths</h3>
                  </div>
                  <ul className="space-y-5 relative z-10 flex-1">
                     {data.strengths.map((s, i) => (
                        <li key={i}>
                           <h4 className="font-semibold text-gray-900 text-base mb-1">{s.title}</h4>
                           <p className="text-gray-500 text-sm leading-relaxed">{s.description}</p>
                        </li>
                     ))}
                     {data.strengths.length === 0 && <p className="text-sm text-gray-400">No specific strengths identified yet.</p>}
                  </ul>
               </motion.div>

               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100/50 shadow-sm">
                        <Target size={20} />
                     </div>
                     <h3 className="text-xl font-semibold text-gray-900">Weaknesses</h3>
                  </div>
                  <ul className="space-y-5 relative z-10 flex-1">
                     {data.weaknesses.map((w, i) => (
                        <li key={i}>
                           <h4 className="font-semibold text-gray-900 text-base mb-1">{w.title}</h4>
                           <p className="text-gray-500 text-sm mb-2 leading-relaxed">{w.description}</p>
                           {w.actionableResource && (
                              <div className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-100/50">
                                 Action: {w.actionableResource}
                              </div>
                           )}
                        </li>
                     ))}
                     {data.weaknesses.length === 0 && <p className="text-sm text-gray-400">No specific weaknesses identified yet.</p>}
                  </ul>
               </motion.div>

               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50 shadow-sm">
                        <Rocket size={20} />
                     </div>
                     <h3 className="text-xl font-semibold text-gray-900">Opportunities</h3>
                  </div>
                  <ul className="space-y-5 relative z-10 flex-1">
                     {data.opportunities.map((o, i) => (
                        <li key={i}>
                           <h4 className="font-semibold text-gray-900 text-base mb-1">{o.title}</h4>
                           <p className="text-gray-500 text-sm mb-2 leading-relaxed">{o.description}</p>
                           {o.actionableResource && (
                              <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100/50">
                                 Action: {o.actionableResource}
                              </div>
                           )}
                        </li>
                     ))}
                     {data.opportunities.length === 0 && <p className="text-sm text-gray-400">No specific opportunities identified yet.</p>}
                  </ul>
               </motion.div>

               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform duration-500" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50 shadow-sm">
                        <ShieldAlert size={20} />
                     </div>
                     <h3 className="text-xl font-semibold text-gray-900">Threats</h3>
                  </div>
                  <ul className="space-y-5 relative z-10 flex-1">
                     {data.threats.map((t, i) => (
                        <li key={i}>
                           <h4 className="font-semibold text-gray-900 text-base mb-1">{t.title}</h4>
                           <p className="text-gray-500 text-sm leading-relaxed">{t.description}</p>
                        </li>
                     ))}
                     {data.threats.length === 0 && <p className="text-sm text-gray-400">No specific threats identified yet.</p>}
                  </ul>
               </motion.div>
            </div>
         </div>
      )}
    </div>
  );
}
