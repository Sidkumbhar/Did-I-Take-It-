import React, { useState, useEffect, useRef } from 'react';
import { FileText, Send, Download, Loader2, HeartPulse, Activity, Pill } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const ReportView = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary: string; chartData: any[]; period?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; url?: string } | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    console.log('Fetching report data...');
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReportData('all');
      console.log('Report data received:', res);
      setData(res);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load report data. Please ensure Groq API key is set.');
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async (): Promise<string> => {
    if (!reportRef.current) {
      throw new Error('Report container not found on the page.');
    }
    
    // Temporarily apply white background for PDF
    const originalBg = reportRef.current.style.backgroundColor;
    reportRef.current.style.backgroundColor = '#ffffff';
    reportRef.current.style.color = '#000000'; // Force dark text for PDF readability
    
    try {
      console.log('Generating PDF using html-to-image...');
      // Wait a bit for animations to finish
      await new Promise(resolve => setTimeout(resolve, 300));
      const imgData = await toJpeg(reportRef.current, { 
        quality: 0.75, 
        backgroundColor: '#ffffff', 
        pixelRatio: 1.5,
        cacheBust: true,
        skipFonts: false, 
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (reportRef.current.offsetHeight * pdfWidth) / reportRef.current.offsetWidth;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      return pdf.output('datauristring');
    } catch (err: any) {
      console.error('PDF generation failed:', err);
      throw new Error(`PDF Error: ${err.message || 'Unknown error during rendering'}`);
    } finally {
      // Restore styles
      if (reportRef.current) {
        reportRef.current.style.backgroundColor = originalBg;
        reportRef.current.style.color = '';
      }
    }
  };

  const handleEmailReport = async () => {
    setSendingEmail(true);
    setEmailStatus(null);
    setError(null);

    try {
      const pdfBase64 = await generatePdf();
      
      const res = await api.emailReportPdf(pdfBase64);
      setEmailStatus({ success: res.success, url: res.etherealUrl });
    } catch (err: any) {
      setError(err.message || 'Failed to email report.');
    } finally {
      setSendingEmail(false);
    }
  };

  const downloadPdf = async () => {
    const pdfBase64 = await generatePdf();
    if (pdfBase64) {
      const link = document.createElement('a');
      link.href = pdfBase64;
      link.download = `Clinical_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col p-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <FileText className="text-primary" /> Doctor-Ready Reports
          </h1>
          <p className="text-sm text-on-surface-variant">Automated clinical summaries for your healthcare provider</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleEmailReport}
            disabled={!data || loading || sendingEmail}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-2"
          >
            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Email to Me
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-center justify-between">
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-error/60 hover:text-error">✕</button>
          </motion.div>
        )}

        {emailStatus?.success && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <p className="text-sm font-medium flex items-center gap-2">
              ✅ Report successfully emailed to your account!
            </p>
            {emailStatus.url && (
              <a href={emailStatus.url} target="_blank" rel="noreferrer" className="text-xs mt-2 underline block opacity-80 hover:opacity-100">
                View Email Preview (Ethereal)
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto min-h-0 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-xl overflow-hidden relative">
        {loading && !data ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-on-surface-variant animate-pulse font-medium">Generating AI Clinical Summary...</p>
          </div>
        ) : null}

        <div ref={reportRef} className="p-8 md:p-12 h-full overflow-y-auto bg-white text-slate-900 font-sans">
          {/* Medical Header */}
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                <HeartPulse size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Clinical Summary</h2>
                <p className="text-slate-500 font-medium uppercase text-xs tracking-widest mt-1">Patient Progress Report • Internal Use Only</p>
              </div>
            </div>
            <div className="text-right border-l-2 border-slate-200 pl-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Generated On</div>
              <div className="text-xl font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Patient Info Card */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Patient Profile</div>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-slate-500">Full Name</div>
                    <div className="text-lg font-bold text-slate-900">Yash Narawade</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Report Period</div>
                    <div className="text-sm font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded inline-block">{data?.period || 'All Time'}</div>
                  </div>
                </div>
              </div>

              {/* Medication List */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Active Regimen</div>
                <div className="space-y-3">
                  {data?.summary.includes('Metaformin') && (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Pill size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">Metformin</div>
                        <div className="text-[10px] text-slate-500">500mg • Once daily</div>
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 italic">Pulled from active medication records</div>
                </div>
              </div>
            </div>

            {/* Clinical Notes & Trend */}
            <div className="md:col-span-2 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                    <Activity size={18} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">AI Synthesized Assessment</h3>
                </div>
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-200 rounded-full" />
                  <p className="text-lg text-slate-700 leading-relaxed font-serif pl-2">
                    {data?.summary || 'Generating clinical synthesis...'}
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <HeartPulse size={18} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Symptom Severity Matrix</h3>
                </div>
                
                {data?.chartData && data.chartData.length > 0 ? (
                  <div className="h-[280px] w-full bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chartData}>
                        <defs>
                          <linearGradient id="colorSymp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickMargin={10} 
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="symptoms" name="Symptoms" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorSymp)" />
                        <Area type="monotone" dataKey="maxSeverity" name="Severity" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-medium italic">No longitudinal data available for current period</p>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            <div>Authored by Did I Take It? AI clinical engine</div>
            <div className="flex gap-4">
              <span>Confidential Document</span>
              <span>•</span>
              <span>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
