import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Bot, User, Loader2, Stethoscope, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const VoiceLogView = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Send welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: ChatMessage = {
        id: 'welcome',
        role: 'ai',
        text: "Hello! I'm **Dr. AI**, your virtual health assistant. 🩺\n\nI can help you understand your symptoms, answer questions about your medications, and provide general health guidance.\n\n**Try saying or typing:**\n- \"I have a headache after taking my medicine\"\n- \"What are the side effects of aspirin?\"\n- \"I feel dizzy in the mornings\"\n\n*Remember: I'm an AI assistant — always consult your real doctor for medical decisions.*",
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Ensure voices are loaded so we don't get the robotic default Linux/espeak voice
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speakText = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[-•]\s/gm, '')
      .replace(/\n/g, '. ');
      
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Pick the best available voice (Google voices are much clearer than default OS voices)
    const preferredVoice = 
      voices.find(v => v.name.includes('Google US English')) ||
      voices.find(v => v.name.includes('Google UK English Female')) ||
      voices.find(v => v.lang === 'en-US' && v.name.includes('Natural')) ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.9; // Slightly slower
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  // --- MediaRecorder-based voice recording (works in ALL browsers) ---
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);

        if (audioChunksRef.current.length === 0) {
          setError('No audio was recorded. Please try again.');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          if (!base64) {
            setError('Failed to process audio. Please try again.');
            return;
          }
          await sendAudioMessage(base64, mimeType.split(';')[0]);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.onerror = () => {
        setError('Recording failed. Please check your microphone.');
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setError(null);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('🎤 Microphone access denied. Please allow microphone permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('🎤 No microphone found. Please connect a microphone and try again.');
      } else {
        setError('🎤 Could not access microphone. Please check your browser permissions.');
      }
    }
  };

  const sendAudioMessage = async (audioBase64: string, mimeType: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: '🎤 [Voice message]',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setError(null);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.text }));

      const { response, transcript } = await api.chatWithDoctorAudio(audioBase64, mimeType, history);

      // Update the user message with the transcript
      if (transcript) {
        setMessages(prev => prev.map(m =>
          m.id === userMsg.id ? { ...m, text: `🎤 "${transcript}"` } : m
        ));
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
      speakText(response);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to get response. Please try again.';
      setError(errMsg);
      const errAiMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'ai',
        text: `⚠️ ${errMsg}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errAiMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const msgText = (text || inputText).trim();
    if (!msgText || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: msgText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);
    setError(null);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', text: m.text }));

      const { response } = await api.chatWithDoctor(msgText, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
      speakText(response);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to get response. Please try again.';
      setError(errMsg);
      const errAiMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'ai',
        text: `⚠️ ${errMsg}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errAiMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      if (processed.startsWith('- ') || processed.startsWith('• ')) {
        return <div key={i} className="flex gap-2 ml-2 my-0.5"><span className="text-primary shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} /></div>;
      }
      if (processed.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between py-6 px-2 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Stethoscope size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight flex items-center gap-2">
              Dr. AI
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-widest">Online</span>
            </h1>
            <p className="text-on-surface-variant text-sm font-medium">Your virtual health assistant</p>
          </div>
        </div>
        <button
          onClick={() => { setTtsEnabled(!ttsEnabled); if (isSpeaking) stopSpeaking(); }}
          className={`p-3 rounded-xl transition-all ${ttsEnabled ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest/30 text-on-surface-variant/40'}`}
          title={ttsEnabled ? 'Disable voice responses' : 'Enable voice responses'}
        >
          {ttsEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4 min-h-0" id="ai-doctor-chat-messages">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'ai'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm'
                  : 'bg-gradient-primary shadow-sm'
              }`}>
                {msg.role === 'ai' ? <Bot size={18} className="text-white" /> : <User size={18} className="text-white" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                msg.role === 'ai'
                  ? 'bg-surface-container-lowest border border-outline-variant/10 text-on-surface rounded-tl-md'
                  : 'bg-primary text-on-primary rounded-tr-md'
              }`}>
                {msg.role === 'ai' ? (
                  <div className="space-y-0.5">{renderMarkdown(msg.text)}</div>
                ) : (
                  <p>{msg.text}</p>
                )}
                <p className={`text-[10px] mt-2 ${msg.role === 'ai' ? 'text-on-surface-variant/30' : 'text-white/40'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking Indicator */}
        <AnimatePresence>
          {isThinking && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={18} className="text-white" />
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl rounded-tl-md px-5 py-4 flex items-center gap-2">
                <div className="flex gap-1">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-emerald-400" />
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2 h-2 rounded-full bg-emerald-400" />
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-on-surface-variant/40 text-xs ml-2">Dr. AI is thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speaking indicator */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center">
              <button onClick={stopSpeaking} className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                  <Volume2 size={14} />
                </motion.div>
                Speaking... Tap to stop
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mx-2 mb-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-error/60 hover:text-error ml-3 shrink-0">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="shrink-0 px-2 pb-6 pt-3">
        <div className="glass-effect rounded-2xl border border-outline-variant/15 p-2 flex items-center gap-2">
          {/* Mic / Recording Button */}
          <motion.button
            onClick={toggleRecording}
            whileTap={{ scale: 0.9 }}
            className={`p-3 rounded-xl transition-all shrink-0 ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-surface-container-highest/30 text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-on-surface'
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice recording'}
            id="ai-doctor-mic-button"
            disabled={isThinking}
          >
            {isRecording ? (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                <MicOff size={20} />
              </motion.div>
            ) : (
              <Mic size={20} />
            )}
          </motion.button>

          {/* Recording indicator or text input */}
          {isRecording ? (
            <div className="flex-1 flex items-center gap-3 px-2">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-red-500 shrink-0"
              />
              <span className="text-red-400 text-sm font-bold">Recording... {formatTime(recordingTime)}</span>
              <span className="text-on-surface-variant/30 text-xs">Tap mic to stop & send</span>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or tap 🎤 to speak..."
              className="flex-1 bg-transparent text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none text-sm py-2 px-2"
              disabled={isThinking}
              id="ai-doctor-text-input"
            />
          )}

          {/* Send Button */}
          {!isRecording && (
            <motion.button
              onClick={() => sendMessage()}
              whileTap={{ scale: 0.9 }}
              disabled={!inputText.trim() || isThinking}
              className={`p-3 rounded-xl transition-all shrink-0 ${
                inputText.trim() && !isThinking
                  ? 'bg-secondary text-white shadow-lg shadow-secondary/20 hover:shadow-xl'
                  : 'bg-surface-container-highest/10 text-on-surface-variant/20 cursor-not-allowed'
              }`}
              id="ai-doctor-send-button"
            >
              <Send size={20} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
