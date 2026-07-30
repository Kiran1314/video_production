"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { FiMusic, FiGlobe, FiVolume2, FiPlay, FiPause, FiRotateCcw } from 'react-icons/fi';

function getYouTubeID(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        if (u.hostname === "youtu.be") return u.pathname.slice(1);
        if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
            if (u.pathname === "/watch") return u.searchParams.get("v");
            if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
            if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
        }
        return null;
    } catch {
        return null;
    }
}

const MAIN_CATEGORIES = ["All", "Audio", "Video", "Photography", "AI Production", "Digital"];
const PREFERRED_CATEGORIES = ['IVR', 'On Hold Messages', 'Radio Commercials', 'Radio Spot'];

export default function ClientGallery() {
  const [mediaItems, setMediaItems] = useState([]);
  const [languagesDb, setLanguagesDb] = useState([]);
  
  // Filter States
  const [activeMainCategory, setActiveMainCategory] = useState('All');
  const [activeTabSelector, setActiveTabSelector] = useState('categories'); // 'categories' or 'languages'
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [activeLanguageFilter, setActiveLanguageFilter] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16; // 4 rows x 4 items per row on desktop
  
  const [modalIndex, setModalIndex] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const infoTimer = useRef(null);

  // Audio inline player states per item ID
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [audioDurations, setAudioDurations] = useState({});
  const audioRefs = useRef({});

  // Fetch Public Media & Languages from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Automatically uses localhost:5000 during local dev, and relative /api in production
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '/api';

        const resMedia = await fetch(`${baseUrl}/videos?limit=1000`);
        const dataMedia = await resMedia.json();
        const rawItems = dataMedia.items || dataMedia.videos || [];
        setMediaItems(rawItems.filter(v => v.isPublic !== false));

        const resLang = await fetch(`${baseUrl}/languages`);
        if (resLang.ok) {
          const langData = await resLang.json();
          setLanguagesDb(langData);
        }
      } catch (error) {
        console.error("Failed to load gallery data", error);
      }
    };
    fetchData();
  }, []);
  // Filter Logic (Tier 1: Main Category)
  const filteredByMain = activeMainCategory === 'All' 
    ? mediaItems 
    : mediaItems.filter(m => m.mainCategory === activeMainCategory);

  // Extract relevant Subcategories with precise counts, ordered with preferred ones first
  const subCategoryCounts = {};
  filteredByMain.forEach(m => {
    const subs = Array.isArray(m.subCategory) ? m.subCategory : [m.subCategory];
    subs.forEach(sub => {
      if (sub) {
        subCategoryCounts[sub] = (subCategoryCounts[sub] || 0) + 1;
      }
    });
  });

  const rawSubKeys = Object.keys(subCategoryCounts);
  const sortedSubs = rawSubKeys.sort((a, b) => {
    const indexA = PREFERRED_CATEGORIES.indexOf(a);
    const indexB = PREFERRED_CATEGORIES.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  const availableSubCategories = [
    { name: "All", count: filteredByMain.length },
    ...sortedSubs.map(sub => ({
      name: sub,
      count: subCategoryCounts[sub]
    }))
  ];

  // Extract Language Counts dynamically based on current audio items
  const languageCounts = {};
  filteredByMain.forEach(m => {
    if (m.language) {
      languageCounts[m.language] = (languageCounts[m.language] || 0) + 1;
    }
  });

  const availableLanguages = [
    { name: "All Languages", count: filteredByMain.length },
    ...languagesDb.map(lang => ({
      ...lang,
      count: languageCounts[lang.name] || 0
    }))
  ];

  // Filter Logic (Tier 2: Sub & Language)
  const fullyFilteredItems = filteredByMain.filter(m => {
    const matchesSub = activeSubCategory === 'All' || activeSubCategory === 'All Categories' || 
      (Array.isArray(m.subCategory) ? m.subCategory.includes(activeSubCategory) : m.subCategory === activeSubCategory);
    
    const matchesLang = activeLanguageFilter === 'All' || activeLanguageFilter === 'All Languages' || 
      m.language === activeLanguageFilter;

    return matchesSub && matchesLang;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = fullyFilteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(fullyFilteredItems.length / itemsPerPage);

  const handleMainCategoryChange = (cat) => {
    setActiveMainCategory(cat);
    setActiveSubCategory('All');
    setActiveLanguageFilter('All');
    setCurrentPage(1);
  };

  const handleSubCategoryChange = (subCat) => {
    setActiveSubCategory(subCat === 'All Categories' ? 'All' : subCat);
    setCurrentPage(1);
  };

  const handleLanguageFilterChange = (langName) => {
    setActiveLanguageFilter(langName === 'All Languages' ? 'All' : langName);
    setCurrentPage(1);
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKey = (e) => {
        if (modalIndex === null) return;
        if (e.key === "ArrowLeft") setModalIndex(prev => prev === 0 ? fullyFilteredItems.length - 1 : prev - 1);
        if (e.key === "ArrowRight") setModalIndex(prev => prev === fullyFilteredItems.length - 1 ? 0 : prev + 1);
        if (e.key === "Escape") setModalIndex(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalIndex, fullyFilteredItems]);

  const openModal = (item) => {
    const index = fullyFilteredItems.findIndex(v => v._id === item._id);
    setShowInfo(false);
    setModalIndex(index);
  };

  const activeMedia = modalIndex !== null && fullyFilteredItems[modalIndex] ? fullyFilteredItems[modalIndex] : null;

  useEffect(() => {
    if (!activeMedia) return;
    setShowInfo(true);
    if (infoTimer.current) clearTimeout(infoTimer.current);
    infoTimer.current = setTimeout(() => setShowInfo(false), 4000);
    return () => { if (infoTimer.current) clearTimeout(infoTimer.current); };
  }, [activeMedia]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

  // Helper format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Robust Audio Player Card with safe duration parsing, glowing effect, and real-time progress bar
  const renderAudioCard = (item) => {
    const isPlaying = playingAudioId === item._id;
    const progress = audioProgress[item._id] || 0;
    const duration = audioDurations[item._id] || 0;
    const subCatsArray = Array.isArray(item.subCategory) ? item.subCategory : [item.subCategory];

    const togglePlay = (e) => {
      e.stopPropagation();
      const audioEl = audioRefs.current[item._id];
      if (!audioEl) return;

      if (isPlaying) {
        audioEl.pause();
        setPlayingAudioId(null);
      } else {
        Object.keys(audioRefs.current).forEach(id => {
          if (id !== item._id && audioRefs.current[id]) {
            audioRefs.current[id].pause();
          }
        });
        audioEl.play().catch(() => {});
        setPlayingAudioId(item._id);
      }
    };

    const handleReplay = (e) => {
      e.stopPropagation();
      const audioEl = audioRefs.current[item._id];
      if (!audioEl) return;
      audioEl.currentTime = 0;
      audioEl.play().catch(() => {});
      setPlayingAudioId(item._id);
    };

    const handleProgressClick = (e) => {
      e.stopPropagation();
      const audioEl = audioRefs.current[item._id];
      if (!audioEl || !audioEl.duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * audioEl.duration;
      audioEl.currentTime = newTime;
      setAudioProgress(prev => ({ ...prev, [item._id]: newTime }));
    };

    return (
      <div className={`w-full bg-slate-900/95 border p-3.5 rounded-xl relative group flex flex-col justify-between transition-all duration-300 ${isPlaying ? 'border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.6)] ring-2 ring-indigo-400/60 scale-[1.02]' : 'border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.12)]'}`}>
        <audio 
          ref={el => {
            if (el) {
              audioRefs.current[item._id] = el;
              if (el.duration && !isNaN(el.duration) && el.duration !== Infinity && !audioDurations[item._id]) {
                setAudioDurations(prev => ({ ...prev, [item._id]: el.duration }));
              }
            }
          }} 
          src={item.mediaUrl} 
          preload="metadata"
          onLoadedMetadata={(e) => {
            const el = e.currentTarget;
            if (el && el.duration && !isNaN(el.duration)) {
              setAudioDurations(prev => ({ ...prev, [item._id]: el.duration }));
            }
          }}
          onDurationChange={(e) => {
            const el = e.currentTarget;
            if (el && el.duration && !isNaN(el.duration)) {
              setAudioDurations(prev => ({ ...prev, [item._id]: el.duration }));
            }
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            if (el) {
              setAudioProgress(prev => ({ ...prev, [item._id]: el.currentTime || 0 }));
              if (el.duration && !isNaN(el.duration) && !audioDurations[item._id]) {
                setAudioDurations(prev => ({ ...prev, [item._id]: el.duration }));
              }
            }
          }}
          onEnded={() => setPlayingAudioId(null)}
        />
        
        {/* Subcategory Tags displayed inside the audio player card */}
        <div className="flex flex-wrap gap-1 mb-2">
          {subCatsArray.map((cat, i) => cat && (
            <span key={i} className="bg-slate-800/80 text-slate-300 text-[9px] font-semibold px-2 py-0.5 rounded border border-slate-700/60">
              {cat}
            </span>
          ))}
          {item.language && (
            <span className="bg-indigo-950/80 text-indigo-300 text-[9px] font-semibold px-2 py-0.5 rounded border border-indigo-500/40">
              {item.language}
            </span>
          )}
        </div>

        {/* Slimmer player content layout */}
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePlay} 
            className="w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] transition shrink-0"
          >
            {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} className="ml-0.5" />}
          </button>

          <div className="flex-1 flex flex-col gap-1.5">
            {/* Interactive Progress Bar */}
            <div 
              className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden cursor-pointer relative group/bar"
              onClick={handleProgressClick}
            >
              <div 
                className="bg-indigo-400 h-full rounded-full transition-all relative shadow-[0_0_10px_rgba(129,140,248,0.9)]"
                style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
              <span className={isPlaying ? "text-indigo-300 font-bold" : ""}>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Replay Button */}
          <button 
            onClick={handleReplay} 
            className="text-slate-400 hover:text-indigo-300 transition p-1" 
            title="Replay Audio"
          >
            <FiRotateCcw size={14} />
          </button>
        </div>

        {/* Title and volume footer */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-indigo-500/10 text-xs">
          <span className="truncate text-slate-200 font-medium max-w-[140px]">{item.title}</span>
          <div className="flex items-center gap-1 text-indigo-400">
            <FiVolume2 size={14} />
            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-indigo-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderThumbnail = (item) => {
    if (item.mainCategory === 'Audio') return renderAudioCard(item);
    if (item.mainCategory === 'Photography') {
      return <img src={item.mediaUrl} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition duration-500 transform group-hover:scale-105" alt="Thumbnail" />;
    }
    if (item.mainCategory === 'Digital') {
      return <div className="w-full h-full flex flex-col items-center justify-center bg-blue-950/60 group-hover:bg-blue-900/60 transition"><FiGlobe size={35} className="text-blue-300 mb-1"/><span className="text-xs text-blue-200">Web Project</span></div>;
    }
    const ytID = getYouTubeID(item.mediaUrl);
    if (ytID) {
      return (
        <>
          <img src={`https://i.ytimg.com/vi/${ytID}/hqdefault.jpg`} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition duration-500 transform group-hover:scale-105" alt="Thumbnail" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg pl-0.5 shadow-lg shadow-indigo-500/50">▶</div>
          </div>
        </>
      );
    }
    return (
      <video src={item.mediaUrl} muted loop playsInline preload="metadata" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition duration-500 transform group-hover:scale-105" 
        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})} 
        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} 
      />
    );
  };

  const renderModalContent = (item) => {
    if (item.mainCategory === 'Audio') {
      return (
        <div className="bg-slate-900 border border-indigo-500/40 p-8 rounded-2xl flex flex-col items-center max-w-md w-full shadow-[0_0_50px_rgba(99,102,241,0.25)]">
          <FiMusic size={60} className="text-indigo-400 mb-4 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
          <h3 className="text-lg font-bold mb-1 text-white text-center">{item.title}</h3>
          <p className="text-indigo-300 text-xs mb-6">{item.language || 'Voiceover Sample'}</p>
          <audio src={item.mediaUrl} controls autoPlay className="w-full outline-none accent-indigo-500" />
        </div>
      );
    }
    if (item.mainCategory === 'Photography') return <img src={item.mediaUrl} className="w-full h-full object-contain rounded-xl" alt="Preview" />;
    if (item.mainCategory === 'Digital') {
      return (
        <div className="bg-slate-900 border border-indigo-500/40 p-8 rounded-2xl flex flex-col items-center max-w-md w-full shadow-[0_0_50px_rgba(99,102,241,0.25)]">
          <FiGlobe size={60} className="text-indigo-400 mb-4" />
          <p className="text-slate-300 text-center mb-6 text-sm">External digital asset destination.</p>
          <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full font-bold text-sm transition shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            Visit Destination
          </a>
        </div>
      );
    }
    const ytID = getYouTubeID(item.mediaUrl);
    if (ytID) {
      return <iframe key={item._id} className="w-full h-full rounded-xl shadow-2xl bg-black" src={`https://www.youtube-nocookie.com/embed/${ytID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen frameBorder="0" />;
    }
    return <video key={item._id} src={item.mediaUrl} controls autoPlay playsInline className="w-full h-full object-contain rounded-xl shadow-2xl bg-black" />;
  };

  return (
    <div className="min-h-screen animated-bg text-white px-4 py-8 md:px-8">
      
      {/* Header section */}
      <header className="max-w-[96%] mx-auto mb-6" style={{ fontFamily: "'Work Sans', sans-serif" }}>
        <div className="flex justify-between items-center mb-1">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-md">IBC Studio</h1>
          </div>
          <div className="shrink-0 ml-4">
            <img src="/logo.png" alt="IBC Studio Logo" className="w-16 h-16 md:w-40 md:h-40 object-contain" />
          </div>
        </div>

        <p className="text-lg md:text-xl font-light text-slate-300 mb-6 max-w-2xl leading-relaxed">
         Transforming UAE business objectives into compelling visual stories.
        </p>
      </header>

      {/* Sticky Navigation Section below header */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md py-4 mb-6 border-b border-indigo-500/20 shadow-xl">
        <div className="max-w-[96%] mx-auto flex flex-col gap-4">
          
          {/* Tier 1: Main Categories (Full rounded pills) */}
          <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-1 hide-scrollbar">
            {MAIN_CATEGORIES.map((cat) => (
              <button 
                key={cat} 
                onClick={() => handleMainCategoryChange(cat)} 
                className={`px-5 py-2 text-xs md:text-sm uppercase tracking-wider rounded-full font-semibold whitespace-nowrap transition-all duration-300 border border-transparent shadow-md ${activeMainCategory === cat ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105" : "bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tier 2: Show Categories & Languages panel with smooth slide-down & fade-in animation ONLY when activeMainCategory is 'Audio' */}
          <AnimatePresence>
            {activeMainCategory === 'Audio' && (
              <motion.div 
                initial={{ opacity: 0, y: -15, height: 0 }} 
                animate={{ opacity: 1, y: 0, height: 'auto' }} 
                exit={{ opacity: 0, y: -15, height: 0 }} 
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="bg-slate-900/90 border border-indigo-500/30 p-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.6)] overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 mb-3 border-b border-slate-800 pb-3">
                  <button 
                    onClick={() => setActiveTabSelector('categories')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs tracking-wider uppercase transition ${activeTabSelector === 'categories' ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-950 text-slate-300 hover:bg-slate-800'}`}
                  >
                    <img src="https://cdn-icons-png.flaticon.com/128/18589/18589911.png" alt="" className="w-4 h-4 object-contain" /> Categories
                  </button>

                  <button 
                    onClick={() => setActiveTabSelector('languages')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs tracking-wider uppercase transition ${activeTabSelector === 'languages' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'bg-slate-950 text-slate-300 hover:bg-slate-800'}`}
                  >
                    <span>🌐</span> Languages
                  </button>
                </div>

                <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {activeTabSelector === 'categories' ? (
                    availableSubCategories.map((sub) => (
                      <button 
                        key={sub.name} 
                        onClick={() => handleSubCategoryChange(sub.name)} 
                        className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider rounded-lg font-medium whitespace-nowrap transition-all duration-300 border flex items-center gap-1.5 shrink-0 ${activeSubCategory === sub.name || (sub.name === 'All' && activeSubCategory === 'All') ? "border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"}`}
                      >
                        <img src="https://cdn-icons-png.flaticon.com/128/18589/18589911.png" alt="" className="w-3.5 h-3.5 object-contain" />
                        <span>{sub.name}</span>
                        <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 font-mono">{sub.count}</span>
                      </button>
                    ))
                  ) : (
                    <>
                      <button 
                        onClick={() => handleLanguageFilterChange('All Languages')} 
                        className={`px-3.5 py-1.5 text-[11px] uppercase tracking-wider rounded-lg font-medium whitespace-nowrap transition-all duration-300 border flex items-center gap-1.5 shrink-0 ${activeLanguageFilter === 'All' ? "border-indigo-500 bg-indigo-500/20 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.3)]" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"}`}
                      >
                        <span>All Languages</span>
                        <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 font-mono">{filteredByMain.length}</span>
                      </button>
                      {availableLanguages.filter(l => l.name !== 'All Languages').map((lang) => (
                        <button 
                          key={lang._id || lang.name} 
                          onClick={() => handleLanguageFilterChange(lang.name)} 
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] uppercase tracking-wider rounded-lg font-medium whitespace-nowrap transition-all duration-300 border shrink-0 ${activeLanguageFilter === lang.name ? "border-indigo-500 bg-indigo-500/20 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.3)]" : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"}`}
                        >
                          {lang.flagIcon && <img src={lang.flagIcon} alt="" className="w-3.5 h-2.5 object-cover rounded" />}
                          <span>{lang.name}</span>
                          <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 font-mono">{lang.count}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tier 2: Subcategory layout for other main categories (excluding 'All' to prevent mixing) */}
          {activeMainCategory !== 'All' && activeMainCategory !== 'Audio' && availableSubCategories.length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }} 
              animate={{ opacity: 1, y: 0, height: 'auto' }} 
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex gap-2 md:gap-3 overflow-x-auto pb-1 hide-scrollbar"
            >
              {availableSubCategories.map((sub) => (
                <button 
                  key={sub.name} 
                  onClick={() => handleSubCategoryChange(sub.name)} 
                  className={`px-4 py-1.5 text-[11px] md:text-xs uppercase tracking-wider rounded-full font-medium whitespace-nowrap transition-all duration-300 border flex items-center gap-1.5 shrink-0 ${activeSubCategory === sub.name || (sub.name === 'All' && activeSubCategory === 'All') ? "border-blue-500 bg-blue-500/20 text-blue-100 shadow-[0_0_10px_rgba(37,99,235,0.3)]" : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"}`}
                >
                  <span>{sub.name}</span>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 font-mono">{sub.count}</span>
                </button>
              ))}
            </motion.div>
          )}

        </div>
      </div>

      {/* Main Grid with smooth slide-down & fade-in animation on category change */}
      <motion.main 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        key={activeMainCategory + activeSubCategory + activeLanguageFilter + currentPage} 
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-[96%] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
      >
        {currentItems.map((item) => {
          const subCatsArray = Array.isArray(item.subCategory) ? item.subCategory : [item.subCategory];

          return (
            <motion.div key={item._id} variants={itemVariants} className="cursor-pointer group flex flex-col relative" onClick={() => openModal(item)}>
              
              {/* Thumbnail / Player Box */}
              <div className={`relative ${item.mainCategory === 'Audio' ? 'bg-transparent border-none shadow-none mb-2' : 'aspect-video bg-slate-950 rounded-xl overflow-hidden mb-2 shadow-lg border border-slate-800 group-hover:border-indigo-500/50 transition duration-300'}`}>
                {renderThumbnail(item)}
                
                {item.mainCategory !== 'Audio' && (
                  <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1.5 pointer-events-none">
                    {subCatsArray.map((cat, i) => cat && (
                      <span key={i} className="bg-slate-900/80 backdrop-blur-md text-slate-200 text-[9px] font-semibold px-2.5 py-1 rounded-md border border-slate-700">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
                    
              {item.mainCategory !== 'Audio' && (
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-semibold text-base truncate text-slate-100 group-hover:text-indigo-300 transition">{item.title}</h3>
                </div>
              )}
            </motion.div>
          );
        })}
        {currentItems.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 text-base">No media assets found matching this filter criteria.</div>
        )}
      </motion.main>

      {/* Fullscreen Player Modal */}
      <AnimatePresence>
        {activeMedia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setModalIndex(null)}>
            
            <div className="absolute top-6 right-6 flex gap-5 z-[10000]">
              <button onClick={(e) => { e.stopPropagation(); setShowInfo(true); if (infoTimer.current) clearTimeout(infoTimer.current); infoTimer.current = setTimeout(() => setShowInfo(false), 8000); }} className="text-white text-2xl hover:text-indigo-400 transition">
                ℹ️
              </button>
              <button onClick={() => setModalIndex(null)} className="text-white text-5xl leading-none hover:text-red-400 transition">&times;</button>
            </div>

            <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              
              <button onClick={(e) => { e?.stopPropagation(); setShowInfo(false); setModalIndex(prev => prev === 0 ? fullyFilteredItems.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-[10001] w-12 h-12 rounded-full bg-slate-900/80 hover:bg-white hover:text-black text-2xl flex items-center justify-center transition shadow-lg border border-slate-700">&#10094;</button>

              {renderModalContent(activeMedia)}

              <button onClick={(e) => { e?.stopPropagation(); setShowInfo(false); setModalIndex(prev => prev === fullyFilteredItems.length - 1 ? 0 : prev + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-[10001] w-12 h-12 rounded-full bg-slate-900/80 hover:bg-white hover:text-black text-2xl flex items-center justify-center transition shadow-lg border border-slate-700">&#10095;</button>

              <AnimatePresence>
                {showInfo && (
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.35 }} className="absolute bottom-0 left-0 right-0 z-[10001] bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent px-8 py-6 rounded-b-xl pointer-events-none flex flex-col justify-end border-t border-indigo-500/20">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Array.isArray(activeMedia.subCategory) ? activeMedia.subCategory.map((cat, i) => (
                        <span key={i} className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded">{cat}</span>
                      )) : (
                        <span className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded">{activeMedia.subCategory}</span>
                      )}
                      <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-2.5 py-0.5 rounded">{activeMedia.mainCategory}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold mb-1 text-white">{activeMedia.title}</h2>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">{activeMedia.description}</p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 gap-3 pb-8">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-800 transition">Previous</button>
          <span className="flex items-center text-slate-400 text-sm font-medium px-3">Page {currentPage} of {totalPages || 1}</span>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-800 transition">Next</button>
        </div>
      )}
    </div>
  );
}