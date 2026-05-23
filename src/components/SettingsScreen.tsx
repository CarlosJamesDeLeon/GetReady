import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Trash2, Globe, Bell, Shield } from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [language, setLanguage] = useState('English');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);
  
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    // Load from local storage if exists
    const prefs = localStorage.getItem('user_settings');
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.emailNotifications !== undefined) setEmailNotifications(parsed.emailNotifications);
        if (parsed.dataSharing !== undefined) setDataSharing(parsed.dataSharing);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('user_settings', JSON.stringify({
      language,
      emailNotifications,
      dataSharing
    }));
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to delete all interview history and settings? This cannot be undone.")) {
      localStorage.removeItem('interview_sessions');
      localStorage.removeItem('user_settings');
      localStorage.removeItem('areas_for_improvement');
      alert("All data has been cleared.");
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="mb-10">
         <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">Settings</h1>
         <p className="text-gray-500 text-lg">Manage your application preferences and data.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 lg:p-10 shadow-sm border border-gray-100 flex flex-col gap-10">
        
        {/* Language Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
               <Globe size={20} />
             </div>
             <h2 className="text-xl font-semibold text-gray-900">Language Preferences</h2>
          </div>
          <div className="pl-13">
             <p className="text-gray-500 text-sm mb-3">Select the language used for the interface and AI transcription.</p>
             <select 
               value={language}
               onChange={(e) => setLanguage(e.target.value)}
               className="w-full md:w-1/2 p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
             >
               <option value="English">English</option>
               <option value="Spanish">Spanish</option>
               <option value="French">French</option>
               <option value="German">German</option>
             </select>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Notifications Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
               <Bell size={20} />
             </div>
             <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="pl-13 flex items-center justify-between md:justify-start md:gap-20">
             <div>
                <p className="font-medium text-gray-900">Email Reminders</p>
                <p className="text-gray-500 text-sm">Receive practice reminders in your inbox.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
               <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
             </label>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Privacy Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
               <Shield size={20} />
             </div>
             <h2 className="text-xl font-semibold text-gray-900">Privacy & Data</h2>
          </div>
          <div className="pl-13 flex flex-col gap-6">
             <div className="flex items-center justify-between md:justify-start md:gap-20">
                <div>
                   <p className="font-medium text-gray-900">Anonymous Data Sharing</p>
                   <p className="text-gray-500 text-sm">Help improve our AI models by sharing anonymized interview performance.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" checked={dataSharing} onChange={(e) => setDataSharing(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
             </div>

             <div>
               <p className="font-medium text-red-600 mb-2">Danger Zone</p>
               <button 
                 onClick={handleClearData}
                 className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
               >
                 <Trash2 size={16} /> Delete All Local Data
               </button>
             </div>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-4 pt-6 border-t border-gray-100 flex items-center justify-between">
           {savedMessage ? (
             <span className="text-green-600 font-medium text-sm animate-pulse">Settings saved successfully!</span>
           ) : (
             <span />
           )}
           <button 
             onClick={handleSave}
             className="bg-black text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-800 transition-all hover:scale-105 shadow-sm text-sm"
           >
             <Save size={18} /> Save Settings
           </button>
        </div>

      </div>
    </div>
  );
}
