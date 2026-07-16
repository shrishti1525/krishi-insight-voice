import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Home as HomeIcon, Camera, CloudSun, Volume2, Leaf,
  Droplets, Sun, CloudRain, AlertTriangle, CheckCircle2, ChevronRight,
  Languages, ImagePlus, X, Loader2, Sprout, ThermometerSun, Wind,
  MoreHorizontal, User, History as HistoryIcon, Settings as SettingsIcon,
  Info, ChevronDown, Gauge
} from "lucide-react";

/* ------------------------------------------------------------------
   i18n — small dictionary so the "regional language" promise is real
   in the UI chrome, not just a claim in the mic transcript.
------------------------------------------------------------------- */
const LANGUAGES = [
  { code: "en-IN", label: "English", native: "English" },
  { code: "hi-IN", label: "Hindi", native: "हिंदी" },
  { code: "mr-IN", label: "Marathi", native: "मराठी" },
  { code: "pa-IN", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ta-IN", label: "Tamil", native: "தமிழ்" },
  { code: "te-IN", label: "Telugu", native: "తెలుగు" },
  { code: "bn-IN", label: "Bengali", native: "বাংলা" },
  { code: "gu-IN", label: "Gujarati", native: "ગુજરાતી" },
];

const STRINGS = {
  "en-IN": { greetMorning: "Good morning", greetAfternoon: "Good afternoon", greetEvening: "Good evening",
    tagline: "Your farm, in your language.", navHome: "Home", navVoice: "Voice", navScan: "Scan", navWeather: "Weather",
    quickVoice: "Ask by voice", quickScan: "Scan crop", quickWeather: "Weather advisory", tapMic: "Tap to speak",
    listening: "Listening…", thinking: "Thinking…", noSupport: "Voice isn't supported in this browser. Try Chrome.",
    uploadPrompt: "Upload or capture a leaf photo", analyzing: "Analyzing image…", irrigate: "Irrigate today",
    holdOff: "Hold off on irrigation", askSomething: "Ask something like \"Should I water my wheat today?\"",
    navMore: "More", profile: "Profile", historyLabel: "Activity history", settingsLabel: "Settings", about: "About",
    farmerName: "Name", location: "Village / District", preferredLang: "Preferred language", saveProfile: "Save",
    voiceSpeed: "Voice reply speed", noHistory: "No activity yet. Try asking a question or scanning a leaf.",
    appVersion: "Frontend build — connects to NLP, CV, and weather services", clearHistory: "Clear history" },
  "hi-IN": { greetMorning: "सुप्रभात", greetAfternoon: "नमस्कार", greetEvening: "शुभ संध्या",
    tagline: "आपका खेत, आपकी भाषा में।", navHome: "होम", navVoice: "आवाज़", navScan: "स्कैन", navWeather: "मौसम",
    quickVoice: "आवाज़ से पूछें", quickScan: "फसल स्कैन करें", quickWeather: "मौसम सलाह", tapMic: "बोलने के लिए दबाएँ",
    listening: "सुन रहा है…", thinking: "सोच रहा है…", noSupport: "इस ब्राउज़र में आवाज़ काम नहीं करती। Chrome आज़माएँ।",
    uploadPrompt: "पत्ती की फोटो अपलोड करें", analyzing: "फोटो जांची जा रही है…", irrigate: "आज सिंचाई करें",
    holdOff: "सिंचाई रोकें", askSomething: "पूछें: \"क्या आज गेहूं को पानी देना चाहिए?\"",
    navMore: "अधिक", profile: "प्रोफ़ाइल", historyLabel: "गतिविधि इतिहास", settingsLabel: "सेटिंग्स", about: "जानकारी",
    farmerName: "नाम", location: "गाँव / जिला", preferredLang: "पसंदीदा भाषा", saveProfile: "सहेजें",
    voiceSpeed: "आवाज़ की गति", noHistory: "अभी कोई गतिविधि नहीं। सवाल पूछें या पत्ती स्कैन करें।",
    appVersion: "फ्रंटएंड बिल्ड — NLP, CV और मौसम सेवाओं से जुड़ता है", clearHistory: "इतिहास साफ़ करें" },
};
const t = (lang, key) => (STRINGS[lang] && STRINGS[lang][key]) || STRINGS["en-IN"][key];

/* ------------------------------------------------------------------
   Mock crop-disease classifier — this is the seam where the CV
   teammate's real model API gets wired in. Kept deterministic so
   demos are reproducible, and clearly labeled as preview data.
------------------------------------------------------------------- */
const DISEASE_LIBRARY = [
  { name: "Healthy leaf", severity: "none", advice: "No action needed. Continue regular watering schedule.", color: "var(--leaf)" },
  { name: "Leaf blight", severity: "high", advice: "Remove affected leaves and apply a copper-based fungicide within 48 hours.", color: "var(--soil)" },
  { name: "Powdery mildew", severity: "medium", advice: "Improve airflow between plants and apply sulfur spray in the evening.", color: "var(--marigold)" },
  { name: "Bacterial leaf spot", severity: "medium", advice: "Avoid overhead watering. Use a copper bactericide and rotate crops next season.", color: "var(--marigold)" },
];
function mockClassify(file) {
  const seed = (file.name.length * 31 + file.size) % DISEASE_LIBRARY.length;
  const base = DISEASE_LIBRARY[seed];
  const confidence = 78 + ((file.size + file.name.length) % 19);
  return { ...base, confidence };
}

/* ------------------------------------------------------------------
   Weather — real data from Open-Meteo (no key required), with a
   simple rule-based irrigation recommendation derived from it.
------------------------------------------------------------------- */
const DEFAULT_COORDS = { lat: 26.4499, lon: 80.3319, label: "Kanpur, Uttar Pradesh" };

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather fetch failed");
  return res.json();
}

function irrigationAdvice(data, lang) {
  if (!data) return null;
  const rainNext = data.daily.precipitation_sum[0] + data.daily.precipitation_sum[1];
  const hot = data.current.temperature_2m > 32;
  const humid = data.current.relative_humidity_2m > 70;
  if (rainNext > 8) {
    return { verdict: t(lang, "holdOff"), reason: "Meaningful rain is expected in the next two days.", icon: "rain" };
  }
  if (hot && !humid) {
    return { verdict: t(lang, "irrigate"), reason: "High temperature and low humidity are increasing soil water loss.", icon: "sun" };
  }
  return { verdict: t(lang, "holdOff"), reason: "Current soil moisture from recent conditions should be sufficient.", icon: "cloud" };
}

/* ------------------------------------------------------------------
   Reusable bits
------------------------------------------------------------------- */
function WaveMic({ listening, onClick, size = 88 }) {
  return (
    <button className="wavemic" onClick={onClick} style={{ width: size, height: size }} aria-label="Toggle voice input">
      {listening && <><span className="ripple r1" /><span className="ripple r2" /><span className="ripple r3" /></>}
      <span className="wavemic-core">{listening ? <Mic size={size * 0.38} /> : <Mic size={size * 0.38} />}</span>
    </button>
  );
}

function LangChips({ lang, setLang }) {
  return (
    <div className="langrow" role="listbox" aria-label="Select language">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          className={"chip" + (lang === l.code ? " chip-active" : "")}
          onClick={() => setLang(l.code)}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ icon, children }) {
  return (
    <div className="section-label">
      {icon}
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------
   Screens
------------------------------------------------------------------- */
function HomeScreen({ lang, setLang, setTab, weather, profile }) {
  const hour = new Date().getHours();
  const greetKey = hour < 12 ? "greetMorning" : hour < 17 ? "greetAfternoon" : "greetEvening";
  const advice = irrigationAdvice(weather, lang);
  const displayName = profile?.name?.trim() || "किसान जी";

  return (
    <div className="screen">
      <div className="hero">
        <p className="eyebrow">Krishi Insight Voice</p>
        <h1 className="hero-title">{t(lang, greetKey)}, {displayName}</h1>
        <p className="hero-tag">{t(lang, "tagline")}</p>
      </div>

      <LangChips lang={lang} setLang={setLang} />

      <div className="tile-grid">
        <button className="tile tile-marigold" onClick={() => setTab("voice")}>
          <Mic size={22} />
          <span>{t(lang, "quickVoice")}</span>
          <ChevronRight size={16} className="tile-arrow" />
        </button>
        <button className="tile tile-leaf" onClick={() => setTab("scan")}>
          <Camera size={22} />
          <span>{t(lang, "quickScan")}</span>
          <ChevronRight size={16} className="tile-arrow" />
        </button>
        <button className="tile tile-sky" onClick={() => setTab("weather")}>
          <CloudSun size={22} />
          <span>{t(lang, "quickWeather")}</span>
          <ChevronRight size={16} className="tile-arrow" />
        </button>
      </div>

      <div className="card weather-mini" onClick={() => setTab("weather")}>
        {weather ? (
          <>
            <div className="weather-mini-left">
              <ThermometerSun size={20} color="var(--sky)" />
              <div>
                <div className="mono-num">{Math.round(weather.current.temperature_2m)}°C</div>
                <div className="muted-sm">{DEFAULT_COORDS.label}</div>
              </div>
            </div>
            {advice && (
              <div className={"advice-pill " + (advice.verdict === t(lang, "irrigate") ? "pill-marigold" : "pill-leaf")}>
                {advice.verdict}
              </div>
            )}
          </>
        ) : (
          <div className="muted-sm"><Loader2 className="spin" size={14} style={{ marginRight: 6 }} />Loading weather…</div>
        )}
      </div>

      <div className="fab-wrap">
        <WaveMic listening={false} onClick={() => setTab("voice")} />
        <span className="muted-sm" style={{ marginTop: 8 }}>{t(lang, "tapMic")}</span>
      </div>
    </div>
  );
}

function VoiceScreen({ lang, addHistory, voiceRate }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [supported, setSupported] = useState(true);
  const [thinking, setThinking] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      respondTo(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, [lang]);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = lang;
  }, [lang]);

  function respondTo(text) {
    setThinking(true);
    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply;
      if (/water|पानी|सिंचाई|irrigat/.test(lower)) {
        reply = "Based on today's forecast, hold off on irrigation — recent conditions have kept soil moisture adequate. Check again after the next rain window.";
      } else if (/disease|रोग|बीमारी|leaf|पत्ती/.test(lower)) {
        reply = "Open the Scan tab and photograph the affected leaf. I'll identify the likely disease and suggest treatment.";
      } else if (/weather|मौसम/.test(lower)) {
        reply = "Today looks warm with moderate humidity. Good conditions for fieldwork this morning.";
      } else {
        reply = "I heard you. This response is a placeholder — once connected to the NLP backend, I'll answer farming questions directly.";
      }
      setResponse(reply);
      setThinking(false);
      speak(reply);
      addHistory && addHistory({ type: "voice", summary: text, detail: reply, ts: Date.now() });
    }, 700);
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = voiceRate || 1;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (match) utter.voice = match;
    window.speechSynthesis.speak(utter);
  }

  function toggleListen() {
    if (!supported) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript(""); setResponse("");
      try { recognitionRef.current.start(); setListening(true); } catch (e) { /* already started */ }
    }
  }

  return (
    <div className="screen">
      <SectionLabel icon={<Mic size={16} />}>{t(lang, "navVoice")}</SectionLabel>
      <div className="voice-stage">
        <WaveMic listening={listening} onClick={toggleListen} size={120} />
        <p className="muted-sm" style={{ marginTop: 18 }}>
          {!supported ? t(lang, "noSupport") : listening ? t(lang, "listening") : t(lang, "tapMic")}
        </p>
      </div>

      {transcript && (
        <div className="card">
          <div className="card-label">You said</div>
          <p className="body-text">{transcript}</p>
        </div>
      )}

      {(thinking || response) && (
        <div className="card card-accent">
          <div className="card-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Volume2 size={14} /> Response
          </div>
          {thinking ? (
            <p className="body-text muted-sm"><Loader2 className="spin" size={14} style={{ marginRight: 6 }} />{t(lang, "thinking")}</p>
          ) : (
            <p className="body-text">{response}</p>
          )}
        </div>
      )}

      {!transcript && !thinking && (
        <p className="muted-sm" style={{ textAlign: "center", marginTop: 24 }}>{t(lang, "askSomething")}</p>
      )}
    </div>
  );
}

function ScanScreen({ lang, addHistory }) {
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setAnalyzing(true);
    setTimeout(() => {
      const classified = mockClassify(file);
      setResult(classified);
      setAnalyzing(false);
      addHistory && addHistory({ type: "scan", summary: classified.name, detail: `${classified.confidence}% confidence — ${classified.advice}`, ts: Date.now() });
    }, 1400);
  }

  function reset() {
    setPreview(null); setResult(null); setAnalyzing(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="screen">
      <SectionLabel icon={<Camera size={16} />}>{t(lang, "navScan")}</SectionLabel>

      {!preview && (
        <button className="upload-well" onClick={() => inputRef.current?.click()}>
          <ImagePlus size={32} color="var(--leaf)" />
          <span>{t(lang, "uploadPrompt")}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />

      {preview && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ position: "relative" }}>
            <img src={preview} alt="Leaf preview" className="preview-img" />
            <button className="img-close" onClick={reset}><X size={16} /></button>
          </div>
          <div style={{ padding: "14px 16px" }}>
            {analyzing && (
              <p className="body-text muted-sm"><Loader2 className="spin" size={14} style={{ marginRight: 6 }} />{t(lang, "analyzing")}</p>
            )}
            {result && (
              <>
                <div className="result-header">
                  <span className="result-name" style={{ color: result.color }}>
                    {result.severity === "none" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {result.name}
                  </span>
                  <span className="mono-num">{result.confidence}%</span>
                </div>
                <p className="body-text" style={{ marginTop: 8 }}>{result.advice}</p>
                <span className="badge">Preview mode — connects to detection model API</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherScreen({ lang, weather, loading, error }) {
  const advice = irrigationAdvice(weather, lang);
  return (
    <div className="screen">
      <SectionLabel icon={<CloudSun size={16} />}>{t(lang, "navWeather")}</SectionLabel>

      {loading && <p className="muted-sm"><Loader2 className="spin" size={14} style={{ marginRight: 6 }} />Loading live conditions…</p>}
      {error && <p className="muted-sm">Couldn't load live weather ({DEFAULT_COORDS.label} shown as fallback).</p>}

      {weather && (
        <>
          <div className="card weather-hero">
            <div>
              <div className="mono-num-lg">{Math.round(weather.current.temperature_2m)}°C</div>
              <div className="muted-sm">{DEFAULT_COORDS.label}</div>
            </div>
            <div className="weather-stats">
              <div><Droplets size={14} /> {weather.current.relative_humidity_2m}%</div>
              <div><Wind size={14} /> {Math.round(weather.current.wind_speed_10m)} km/h</div>
              <div><CloudRain size={14} /> {weather.current.precipitation} mm</div>
            </div>
          </div>

          {advice && (
            <div className={"card card-accent"}>
              <div className="card-label">Irrigation advisory</div>
              <p className="body-text" style={{ fontWeight: 700 }}>{advice.verdict}</p>
              <p className="body-text muted-sm">{advice.reason}</p>
            </div>
          )}

          <div className="card">
            <div className="card-label">Next 5 days</div>
            <div className="forecast-row">
              {weather.daily.temperature_2m_max.map((max, i) => {
                const min = weather.daily.temperature_2m_min[i];
                const rain = weather.daily.precipitation_sum[i];
                const h = Math.max(20, Math.min(70, max * 1.1));
                return (
                  <div className="forecast-col" key={i}>
                    <div className="forecast-bar" style={{ height: h }} />
                    <div className="mono-num-sm">{Math.round(max)}°</div>
                    <div className="muted-sm" style={{ fontSize: 11 }}>{Math.round(min)}°</div>
                    {rain > 1 && <CloudRain size={12} color="var(--sky)" style={{ marginTop: 2 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Accordion({ title, icon, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button className="accordion-head" onClick={() => setOpen((o) => !o)}>
        <span className="accordion-title">{icon}{title}</span>
        <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function MoreScreen({ lang, profile, setProfile, history, clearHistory, voiceRate, setVoiceRate }) {
  const [draft, setDraft] = useState(profile);

  return (
    <div className="screen">
      <SectionLabel icon={<MoreHorizontal size={16} />}>{t(lang, "navMore")}</SectionLabel>

      <Accordion title={t(lang, "profile")} icon={<User size={15} />} defaultOpen>
        <label className="field-label">{t(lang, "farmerName")}</label>
        <input className="field-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Ramesh Yadav" />
        <label className="field-label">{t(lang, "location")}</label>
        <input className="field-input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="e.g. Bilhaur, Kanpur" />
        <button className="save-btn" onClick={() => setProfile(draft)}>{t(lang, "saveProfile")}</button>
      </Accordion>

      <Accordion title={t(lang, "historyLabel")} icon={<HistoryIcon size={15} />} defaultOpen>
        {history.length === 0 ? (
          <p className="muted-sm">{t(lang, "noHistory")}</p>
        ) : (
          <>
            {history.map((h, i) => (
              <div className="history-row" key={i}>
                {h.type === "voice" ? <Mic size={14} color="var(--marigold)" /> : <Camera size={14} color="var(--leaf)" />}
                <div style={{ flex: 1 }}>
                  <div className="body-text" style={{ fontWeight: 600 }}>{h.summary}</div>
                  <div className="muted-sm">{h.detail}</div>
                </div>
                <span className="muted-sm" style={{ whiteSpace: "nowrap" }}>{timeAgo(h.ts)}</span>
              </div>
            ))}
            <button className="clear-btn" onClick={clearHistory}>{t(lang, "clearHistory")}</button>
          </>
        )}
      </Accordion>

      <Accordion title={t(lang, "settingsLabel")} icon={<SettingsIcon size={15} />}>
        <label className="field-label"><Gauge size={13} style={{ verticalAlign: -2, marginRight: 4 }} />{t(lang, "voiceSpeed")}</label>
        <div className="speed-row">
          {[0.8, 1, 1.2].map((r) => (
            <button key={r} className={"chip" + (voiceRate === r ? " chip-active" : "")} onClick={() => setVoiceRate(r)}>
              {r === 0.8 ? "Slow" : r === 1 ? "Normal" : "Fast"}
            </button>
          ))}
        </div>
      </Accordion>

      <Accordion title={t(lang, "about")} icon={<Info size={15} />}>
        <p className="body-text muted-sm">Krishi Insight Voice — {t(lang, "appVersion")}.</p>
      </Accordion>
    </div>
  );
}

/* ------------------------------------------------------------------
   App shell
------------------------------------------------------------------- */
export default function App() {
  const [tab, setTab] = useState("home");
  const [lang, setLang] = useState("en-IN");
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState({ name: "", location: "" });
  const [voiceRate, setVoiceRate] = useState(1);

  const addHistory = useCallback((entry) => {
    setHistory((h) => [entry, ...h].slice(0, 30));
  }, []);
  const clearHistory = useCallback(() => setHistory([]), []);

  useEffect(() => {
    let coords = DEFAULT_COORDS;
    function load(lat, lon) {
      fetchWeather(lat, lon)
        .then((d) => { setWeather(d); setWeatherLoading(false); })
        .catch(() => { setWeatherError(true); setWeatherLoading(false); });
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => load(coords.lat, coords.lon),
        { timeout: 4000 }
      );
    } else {
      load(coords.lat, coords.lon);
    }
  }, []);

  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  const NAV = [
    { id: "home", label: t(lang, "navHome"), icon: HomeIcon },
    { id: "voice", label: t(lang, "navVoice"), icon: Mic },
    { id: "scan", label: t(lang, "navScan"), icon: Camera },
    { id: "weather", label: t(lang, "navWeather"), icon: CloudSun },
    { id: "more", label: t(lang, "navMore"), icon: MoreHorizontal },
  ];

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Mukta:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

        :root{
          --paper:#F0F2E6; --card:#FBFAF2; --ink:#1E3628; --leaf:#2F6B4F; --leaf-deep:#1F4A37;
          --marigold:#E7A93C; --soil:#B85C34; --sky:#4F8FA3; --line:#DCE1CE;
        }
        .app-root{
          font-family:'Mukta',sans-serif; background:var(--paper); color:var(--ink);
          max-width:430px; margin:0 auto; min-height:640px; border-radius:24px; overflow:hidden;
          box-shadow:0 20px 60px rgba(30,54,40,0.18); display:flex; flex-direction:column; position:relative;
        }
        *{box-sizing:border-box;}
        .screen{ padding:20px 18px 100px; overflow-y:auto; flex:1; }
        .eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--leaf); font-weight:600; margin:0 0 6px; }
        .hero-title{ font-family:'Fraunces',serif; font-size:26px; font-weight:700; margin:0 0 4px; line-height:1.2; }
        .hero-tag{ margin:0 0 18px; color:#4B5D50; font-size:14px; }
        .hero{ padding-top:6px; }

        .langrow{ display:flex; gap:8px; overflow-x:auto; padding-bottom:14px; margin-bottom:16px; border-bottom:1px dashed var(--line); }
        .chip{ font-family:'Mukta',sans-serif; font-size:13px; font-weight:600; white-space:nowrap; padding:7px 14px; border-radius:999px; border:1px solid var(--line); background:var(--card); color:var(--ink); cursor:pointer; }
        .chip-active{ background:var(--leaf); color:#fff; border-color:var(--leaf); }

        .tile-grid{ display:flex; flex-direction:column; gap:10px; margin-bottom:18px; }
        .tile{ display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:16px; border:none; cursor:pointer; font-family:'Mukta',sans-serif; font-weight:600; font-size:14.5px; color:#fff; text-align:left; }
        .tile span:first-of-type{ flex:0; }
        .tile > span:nth-child(2){ flex:1; }
        .tile-arrow{ opacity:0.7; }
        .tile-marigold{ background:linear-gradient(135deg,var(--marigold),#D89328); }
        .tile-leaf{ background:linear-gradient(135deg,var(--leaf),var(--leaf-deep)); }
        .tile-sky{ background:linear-gradient(135deg,var(--sky),#3B7385); }

        .card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px 16px; margin-bottom:14px; }
        .card-accent{ border-left:4px solid var(--marigold); }
        .card-label{ font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#6B7A6C; margin-bottom:6px; }
        .body-text{ font-size:14.5px; line-height:1.5; margin:0; }
        .muted-sm{ font-size:12.5px; color:#6B7A6C; }

        .weather-mini{ display:flex; align-items:center; justify-content:space-between; cursor:pointer; }
        .weather-mini-left{ display:flex; align-items:center; gap:10px; }
        .mono-num{ font-family:'IBM Plex Mono',monospace; font-weight:600; font-size:16px; }
        .mono-num-lg{ font-family:'IBM Plex Mono',monospace; font-weight:600; font-size:34px; line-height:1; }
        .mono-num-sm{ font-family:'IBM Plex Mono',monospace; font-weight:600; font-size:12px; }
        .advice-pill{ font-size:12px; font-weight:700; padding:6px 10px; border-radius:999px; }
        .pill-marigold{ background:#FBEAD0; color:#9A6414; }
        .pill-leaf{ background:#E1EEE4; color:var(--leaf-deep); }

        .fab-wrap{ display:flex; flex-direction:column; align-items:center; margin-top:8px; }

        .wavemic{ position:relative; border-radius:50%; border:none; background:radial-gradient(circle at 35% 30%, #F2C476, var(--marigold)); box-shadow:0 8px 24px rgba(231,169,60,0.45); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .wavemic-core{ color:#3A2405; display:flex; }
        .ripple{ position:absolute; inset:0; border-radius:50%; border:2px solid var(--marigold); animation:ripple 1.8s ease-out infinite; }
        .ripple.r2{ animation-delay:0.5s; } .ripple.r3{ animation-delay:1s; }
        @keyframes ripple{ 0%{ transform:scale(1); opacity:0.7;} 100%{ transform:scale(1.9); opacity:0;} }
        .spin{ animation:spin 1s linear infinite; display:inline-block; } @keyframes spin{ to{ transform:rotate(360deg);} }

        .voice-stage{ display:flex; flex-direction:column; align-items:center; padding:28px 0 20px; }

        .section-label{ display:flex; align-items:center; gap:8px; font-family:'IBM Plex Mono',monospace; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:var(--leaf-deep); font-weight:600; margin-bottom:16px; }

        .upload-well{ width:100%; border:2px dashed var(--line); border-radius:16px; padding:40px 16px; display:flex; flex-direction:column; align-items:center; gap:10px; background:var(--card); cursor:pointer; font-family:'Mukta',sans-serif; font-weight:600; font-size:14px; color:var(--ink); }
        .preview-img{ width:100%; height:220px; object-fit:cover; display:block; }
        .img-close{ position:absolute; top:10px; right:10px; background:rgba(30,54,40,0.7); border:none; color:#fff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .result-header{ display:flex; align-items:center; justify-content:space-between; }
        .result-name{ display:flex; align-items:center; gap:6px; font-weight:700; font-size:15px; }
        .badge{ display:inline-block; margin-top:10px; font-size:11px; font-weight:600; color:#6B7A6C; background:#EDEEE1; padding:4px 8px; border-radius:6px; }

        .weather-hero{ display:flex; align-items:center; justify-content:space-between; }
        .weather-stats{ display:flex; flex-direction:column; gap:6px; font-family:'IBM Plex Mono',monospace; font-size:12.5px; }
        .weather-stats div{ display:flex; align-items:center; gap:6px; }
        .forecast-row{ display:flex; justify-content:space-between; align-items:flex-end; padding-top:10px; }
        .forecast-col{ display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
        .forecast-bar{ width:8px; background:linear-gradient(180deg,var(--marigold),var(--sky)); border-radius:4px; margin-bottom:4px; }

        .accordion-head{ width:100%; display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:none; border:none; cursor:pointer; font-family:'Mukta',sans-serif; }
        .accordion-title{ display:flex; align-items:center; gap:8px; font-weight:700; font-size:14.5px; color:var(--leaf-deep); }
        .accordion-body{ padding:0 16px 16px; border-top:1px solid var(--line); padding-top:12px; }
        .field-label{ display:block; font-size:12px; font-weight:600; color:#6B7A6C; margin:10px 0 4px; }
        .field-input{ width:100%; padding:9px 12px; border-radius:10px; border:1px solid var(--line); background:#fff; font-family:'Mukta',sans-serif; font-size:14px; color:var(--ink); }
        .save-btn{ margin-top:14px; width:100%; padding:10px; border-radius:10px; border:none; background:var(--leaf); color:#fff; font-weight:700; font-size:14px; cursor:pointer; }
        .clear-btn{ margin-top:6px; width:100%; padding:9px; border-radius:10px; border:1px solid var(--line); background:none; color:#8A9587; font-weight:600; font-size:12.5px; cursor:pointer; }
        .history-row{ display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid var(--line); }
        .history-row:last-of-type{ border-bottom:none; }
        .speed-row{ display:flex; gap:8px; }

        .bottomnav{ display:flex; border-top:1px solid var(--line); background:var(--card); padding:8px 6px 12px; position:absolute; bottom:0; left:0; right:0; }
        .navbtn{ flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; cursor:pointer; color:#8A9587; font-size:10.5px; font-weight:600; font-family:'Mukta',sans-serif; padding:6px 0; }
        .navbtn.active{ color:var(--leaf-deep); }
        .navbtn.active .navdot{ opacity:1; }
        .navdot{ width:4px; height:4px; border-radius:50%; background:var(--marigold); opacity:0; margin-top:1px; }
      `}</style>

      {tab === "home" && <HomeScreen lang={lang} setLang={setLang} setTab={setTab} weather={weather} profile={profile} />}
      {tab === "voice" && <VoiceScreen lang={lang} addHistory={addHistory} voiceRate={voiceRate} />}
      {tab === "scan" && <ScanScreen lang={lang} addHistory={addHistory} />}
      {tab === "weather" && <WeatherScreen lang={lang} weather={weather} loading={weatherLoading} error={weatherError} />}
      {tab === "more" && (
        <MoreScreen
          lang={lang} profile={profile} setProfile={setProfile}
          history={history} clearHistory={clearHistory}
          voiceRate={voiceRate} setVoiceRate={setVoiceRate}
        />
      )}

      <div className="bottomnav">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button key={n.id} className={"navbtn" + (active ? " active" : "")} onClick={() => setTab(n.id)}>
              <Icon size={20} />
              {n.label}
              <span className="navdot" />
            </button>
          );
        })}
      </div>
    </div>
  );
}