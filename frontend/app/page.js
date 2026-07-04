"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to extract YouTube ID
function getYouTubeID(url) {
  
    try {
        const u = new URL(url);

        if (u.hostname === "youtu.be") {
            return u.pathname.slice(1);
        }

        if (u.hostname.includes("youtube.com")) {

            if (u.pathname === "/watch")
                return u.searchParams.get("v");

            if (u.pathname.startsWith("/embed/"))
                return u.pathname.split("/")[2];

            if (u.pathname.startsWith("/shorts/"))
                return u.pathname.split("/")[2];
        }

        return null;

    } catch {

        return null;
    }
}



export default function ClientGallery() {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 6;
  const [modalIndex, setModalIndex] = useState(null);
  const [showInfo, setShowInfo] = useState(false); // Toggle for description card

  useEffect(() => {
    const fetchPublicVideos = async () => {
      const res = await fetch(`/api/videos?limit=1000`);
      const data = await res.json();
      const publicVideos = data.videos.filter(v => v.isPublic !== false);
      setVideos(publicVideos);
      const uniqueCats = ['All', ...new Set(publicVideos.map(v => v.category))];
      setCategories(uniqueCats);
    };
    fetchPublicVideos();
  }, []);

  const filteredVideos = activeCategory === 'All' ? videos : videos.filter(v => v.category === activeCategory);
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);



  useEffect(() => {

    const handleKey = (e) => {

        if (modalIndex === null) return;

        if (e.key === "ArrowLeft") {

            setModalIndex(prev =>
                prev === 0
                    ? filteredVideos.length - 1
                    : prev - 1
            );

        }

        if (e.key === "ArrowRight") {

            setModalIndex(prev =>
                prev === filteredVideos.length - 1
                    ? 0
                    : prev + 1
            );

        }

        if (e.key === "Escape") {

            setModalIndex(null);

        }

    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);

}, [modalIndex, filteredVideos]);

  
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  const openModal = (video) => {
    const index = filteredVideos.findIndex(v => v._id === video._id);
    setShowInfo(false);
    setModalIndex(index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    
    <div className="min-h-screen animated-bg text-white px-4 py-8 md:px-8">
       

      
      {/* Fully Responsive Orientation-Aware Modal */}
   
    <header className="max-w-[96%] mx-auto mb-4" style={{ fontFamily: "'Work Sans', sans-serif" }}>
  
  {/* Flex container to hold text on left and logo on right */}
  <div className="flex justify-between items-center mb-1">
    
    {/* Text area */}
    <div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
        IBC Studio
      </h1>
    </div>

    {/* Logo placed on the right */}
    <div className="shrink-0 ml-4">
      <img 
        src="/logo.png" 
        alt="IBC Studio Logo" 
        className="w-16 h-16 md:w-40 md:h-40 object-contain" 
      />
    </div>
  </div>

  {/* Description - stays below the header block */}
  <p className="text-lg md:text-xl font-light text-gray-300 mb-8 max-w-2xl leading-relaxed">
   Transforming UAE business objectives into compelling visual stories.
  </p>

  {/* Categories */}
  <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 hide-scrollbar">
    {categories.map(cat => (
      <button 
        key={cat} 
        onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
        className={`px-6 py-2 text-sm uppercase tracking-wider rounded-md font-semibold transition-all duration-300 border border-transparent ${
          activeCategory === cat 
            ? 'bg-white text-black shadow-lg' 
            : 'bg-transparent text-gray-400 hover:border-gray-600 hover:text-white'
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
</header>
 

      <motion.main 
        variants={containerVariants} initial="hidden" animate="show" key={activeCategory + currentPage}
        className="max-w-[96%] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10"
      >
        {currentVideos.map((video) => {
          const isYouTube =
        video.videoUrl.includes("youtube.com") ||
        video.videoUrl.includes("youtu.be");

    const ytID = isYouTube
        ? getYouTubeID(video.videoUrl)
        : null;

   

          const prevVideo = (e) => {
            e.stopPropagation();

            setShowInfo(false);

            setModalIndex((prev) =>
              prev === 0 ? filteredVideos.length - 1 : prev - 1
            );
          };

          const nextVideo = (e) => {
            e.stopPropagation();

            setShowInfo(false);

            setModalIndex((prev) =>
              prev === filteredVideos.length - 1 ? 0 : prev + 1
            );
          };



          return (
            <motion.div key={video._id} variants={itemVariants} className="cursor-pointer group flex flex-col" onClick={() => openModal(video)}>
              
              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden mb-3 shadow-lg shadow-black/50">
              <button
                  onClick={prevVideo}
                  className="absolute left-4 z-50 w-14 h-14 rounded-full
                            bg-black/60 hover:bg-white hover:text-black
                            flex items-center justify-center
                            text-3xl transition-all"
              >
                  &#10094;
              </button>

                {isYouTube ? (
                  <img src={`https://i.ytimg.com/vi/${ytID}/hqdefault.jpg`} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition duration-500 transform group-hover:scale-105" alt="Thumbnail" />
                ) : (
                 <video
                    src={video.videoUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover
                              opacity-85
                              group-hover:opacity-100
                              transition-all duration-500
                              group-hover:scale-105"
                    onMouseEnter={(e) => {
                        e.currentTarget.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                    }}
                />
                )}
                <button
                        onClick={nextVideo}
                        className="absolute right-4 z-50 w-14 h-14 rounded-full
                                  bg-black/60 hover:bg-white hover:text-black
                                  flex items-center justify-center
                                  text-3xl transition-all"
                    >
                        &#10095;
                    </button>
              </div>
                    
              <h3 className="font-semibold text-xl truncate px-1">{video.title}</h3>
            </motion.div>
          );
        })}
      </motion.main>

      <AnimatePresence>
        {modalIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setModalIndex(null)}
          >
            {/* Modal Controls */}
            <div className="absolute top-6 right-8 flex gap-6 z-50">
              <button onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }} className="text-white text-2xl hover:text-blue-400">ℹ️Info</button>
              <button className="text-white text-4xl hover:text-gray-400" onClick={() => setModalIndex(null)}>&times;</button>
            </div>

            {/* Video Player Container */}
            <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center" onClick={e => e.stopPropagation()}>
              {/* Floating Description Card */}
              <AnimatePresence>
                {showInfo && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="absolute bottom-4 right-4 z-50 bg-gray-900/90 backdrop-blur-md p-6 rounded-xl border border-gray-700 shadow-[0_0_25px_rgba(0,0,0,0.5)] max-w-xs"
                  >
                    <h2 className="text-xl font-bold mb-2">{filteredVideos[modalIndex].title}</h2>
                    <p className="text-gray-300 text-sm">{filteredVideos[modalIndex].description}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player */}
              {filteredVideos[modalIndex].videoUrl.includes('youtube.com') || filteredVideos[modalIndex].videoUrl.includes('youtu.be') ? (
               <iframe
                  className="w-full h-full rounded-lg"
                  src={`https://www.youtube-nocookie.com/embed/${getYouTubeID(filteredVideos[modalIndex].videoUrl)}?autoplay=1&rel=0&modestbranding=1`}
                  title={filteredVideos[modalIndex].title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
              />
              ) : (
                <video src={filteredVideos[modalIndex].videoUrl} controls autoPlay className="w-full h-full object-contain" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
     

     

      {/* Responsive Pagination */}

      {totalPages > 1 && (
        <div className="flex justify-center mt-12 md:mt-16 gap-3 md:gap-4 pb-8">
          <button 
            disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
            className="px-6 py-2 md:px-8 md:py-3 bg-gray-800 rounded-lg text-sm md:text-base font-medium disabled:opacity-50 hover:bg-gray-700 transition"
          >
            Previous
          </button>
          <span className="flex items-center text-gray-400 text-sm md:text-base font-medium px-2 md:px-4">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button 
            disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
            className="px-6 py-2 md:px-8 md:py-3 bg-gray-800 rounded-lg text-sm md:text-base font-medium disabled:opacity-50 hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>
      )}

         </div>



  );
}