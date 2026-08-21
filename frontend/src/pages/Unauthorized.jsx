import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 mb-6 text-red-500 animate-bounce">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
        403 - Access Denied
      </h1>
      <p className="text-lg text-slate-400 max-w-md mb-8">
        Your current role does not have permission to view this resource. If you believe this is an error, please contact your administrator.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-700"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-sky-500/20"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
