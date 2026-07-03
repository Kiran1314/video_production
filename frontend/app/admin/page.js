"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Parser } from 'json2csv';
import toast from 'react-hot-toast';
import { FiLogOut, FiDownload } from 'react-icons/fi';

// Helper to extract YouTube ID
const getYouTubeID = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function AdminDashboard() {
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [preview, setPreview] = useState(null);
  const router = useRouter();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState('file'); 
  const [file, setFile] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const [existingCategories, setExistingCategories] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', category: '', description: '' });

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/admin/login');
    fetchVideos();
  }, [page, search]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/videos?limit=1000`);
        const data = await res.json();
        const uniqueCats = [...new Set(data.videos.map(v => v.category))];
        setExistingCategories(uniqueCats);
      } catch (error) {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/videos?page=${page}&search=${search}`);
      const data = await res.json();
      setVideos(data.videos);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load videos.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Adding video...');
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    
    if (uploadType === 'file' && file) {
      formData.append('video', file);
    } else if (uploadType === 'youtube' && youtubeLink) {
      formData.append('youtubeLink', youtubeLink);
    } else {
      toast.error('Please provide a file or link.', { id: loadingToast });
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/videos', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Upload failed');

      toast.success('Production video added successfully!', { id: loadingToast });
      
      if (!existingCategories.includes(category)) {
        setExistingCategories(prev => [...prev, category]);
      }

      fetchVideos();
      setIsAddModalOpen(false);
      
      setTitle(''); setCategory(''); setDescription('');
      setFile(null); setYoutubeLink('');
    } catch (error) {
      toast.error('Action failed. Please try again.', { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await fetch(`http://localhost:5000/api/videos/${id}`, { method: 'DELETE' });
      setSelectedVideos(prev => prev.filter(vidId => vidId !== id));
      toast.success('Video deleted successfully.');
      fetchVideos();
    } catch (error) {
      toast.error('Failed to delete video.');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedVideos.length} videos?`)) return;
    const loadingToast = toast.loading('Deleting selected videos...');
    try {
      await fetch('http://localhost:5000/api/videos/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedVideos })
      });
      setSelectedVideos([]);
      toast.success(`${selectedVideos.length} videos deleted.`, { id: loadingToast });
      fetchVideos();
    } catch (error) {
      toast.error('Failed to perform bulk delete.', { id: loadingToast });
    }
  };

  const handleToggleVisibility = async (vid) => {
    const currentStatus = vid.isPublic !== false; 
    const newStatus = !currentStatus;

    setVideos(prevVideos => prevVideos.map(v => v._id === vid._id ? { ...v, isPublic: newStatus } : v));
    const loadingToast = toast.loading('Updating visibility...');
    
    try {
      const res = await fetch(`http://localhost:5000/api/videos/${vid._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newStatus }) 
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(`Video marked as ${newStatus ? 'Visible' : 'Hidden'}.`, { id: loadingToast });
    } catch (error) {
      setVideos(prevVideos => prevVideos.map(v => v._id === vid._id ? { ...v, isPublic: currentStatus } : v));
      toast.error('Failed to update visibility.', { id: loadingToast });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVideos(videos.map(vid => vid._id));
    } else {
      setSelectedVideos([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedVideos(prev => [...prev, id]);
    } else {
      setSelectedVideos(prev => prev.filter(vidId => vidId !== id));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving changes...');
    try {
      await fetch(`http://localhost:5000/api/videos/${editingVideo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!existingCategories.includes(editForm.category)) {
        setExistingCategories(prev => [...prev, editForm.category]);
      }
      setEditingVideo(null);
      toast.success('Video details updated.', { id: loadingToast });
      fetchVideos();
    } catch (error) {
      toast.error('Failed to update details.', { id: loadingToast });
    }
  };

  const openEditModal = (vid) => {
    setEditingVideo(vid);
    setEditForm({ title: vid.title, category: vid.category, description: vid.description });
  };

 const exportCSV = () => {
  try {
    // Transform the data so the 'videoUrl' property is named 'Links' in the CSV
    const csvData = videos.map(v => ({
      Title: v.title,
      Category: v.category,
      Description: v.description,
      Links: v.videoUrl.startsWith('http') ? v.videoUrl : `http://localhost:5000${v.videoUrl}`,
      Date: v.createdAt
    }));
    
    const fields = ['Title', 'Category', 'Description', 'Links', 'Date'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'IBC_Studio_Web_Portfolio_List.csv';
    a.click();
    toast.success('CSV Export downloaded.');
  } catch (error) {
    toast.error('Failed to generate CSV.');
  }
};

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully.');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen animated-bg text-gray-200 p-4 md:p-8">
      <datalist id="category-suggestions">
        {existingCategories.map((cat, index) => (
          <option key={index} value={cat} />
        ))}
      </datalist>

      <div className="max-w-7xl mx-auto">
        
        {/* Mobile Responsive Header */}
       <div className="flex justify-between items-center mb-8">
  <h1 className="text-3xl font-bold text-white">IBC Studio Showreels</h1>
  
  <div className="flex gap-4 items-center">
    <button 
      onClick={() => setIsAddModalOpen(true)}
      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded transition shadow-lg shadow-blue-500/30 text-sm md:text-base font-medium"
    >
      + Add Video
    </button>
    
    {/* Glowing Logout Icon */}
    <button 
      onClick={handleLogout} 
      className="p-3 bg-gray-800 rounded-full text-red-500 hover:text-red-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] border border-gray-700"
      title="Logout"
    >
      <FiLogOut size={22} />
    </button>
  </div>
</div>

        <div className="bg-gray-900 border border-gray-800 p-4 md:p-6 rounded-lg shadow-sm">
          
          {/* Mobile Responsive Toolbars */}
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
             <div className="relative w-full sm:max-w-xs">
                    <input 
                        type="text" 
                        placeholder="Filter by title or category..." 
                        value={search} // Controlled component
                        className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 p-2.5 pr-10 rounded w-full focus:outline-none focus:border-blue-500 text-sm md:text-base"
                        onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                        }}
                    />
                    
                    {/* Clear Icon: Only shows when search text is present */}
                    {search && (
                        <button 
                        onClick={() => {
                            setSearch('');
                            setPage(1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                        title="Clear filter"
                        >
                        &times;
                        </button>
                    )}
                    </div>
              <AnimatePresence>
                {selectedVideos.length > 0 && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleBulkDelete} 
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded transition text-sm md:text-base font-medium w-full sm:w-auto"
                  >
                    Delete Selected ({selectedVideos.length})
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <button 
                onClick={exportCSV} 
                className="p-2.5 bg-green-600 hover:bg-green-500 text-white rounded transition"
                title="Export CSV"
                >
                <FiDownload size={20} />
                </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-800/50">
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3 w-12 text-center">
                    <input 
                      type="checkbox" className="cursor-pointer"
                      checked={videos.length > 0 && selectedVideos.length === videos.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-3 font-medium">Media</th>
                  <th className="p-3 font-medium whitespace-nowrap">Title</th>
                  <th className="p-3 font-medium whitespace-nowrap">Category</th>
                  <th className="p-3 font-medium text-center whitespace-nowrap">Visibility</th>
                  <th className="p-3 font-medium whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(vid => {
                  const isYouTube = vid.videoUrl.includes('youtube.com') || vid.videoUrl.includes('youtu.be');
                  const ytID = isYouTube ? getYouTubeID(vid.videoUrl) : null;

                  return (
                    <tr key={vid._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" className="cursor-pointer"
                          checked={selectedVideos.includes(vid._id)}
                          onChange={(e) => handleSelectOne(e, vid._id)}
                        />
                      </td>
                      <td className="p-3 w-40">
                        <div className="w-28 h-16 md:w-32 md:h-20 bg-black rounded overflow-hidden relative cursor-pointer group" onClick={() => setPreview(vid)}>
                          {isYouTube ? (
                            <>
                              <img src={`https://img.youtube.com/vi/${ytID}/mqdefault.jpg`} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" alt="YT Thumbnail"/>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 md:w-8 md:h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs pl-0.5 opacity-90">▶</div>
                              </div>
                            </>
                          ) : (
                            <video 
                              src={`http://localhost:5000${vid.videoUrl}`} 
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition duration-300" 
                              muted loop playsInline
                              onMouseEnter={(e) => e.target.play().catch(() => {})}
                              onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm md:text-base font-medium max-w-[200px] truncate">{vid.title}</td>
                      <td className="p-3 text-sm md:text-base text-gray-400 whitespace-nowrap">{vid.category}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleToggleVisibility(vid)}
                          className={`relative inline-flex h-5 w-10 md:h-6 md:w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${vid.isPublic !== false ? 'bg-blue-600' : 'bg-orange-500'}`}
                        >
                          <span className={`inline-block h-3 w-3 md:h-4 md:w-4 transform rounded-full bg-white transition-transform duration-300 ${vid.isPublic !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <div className={`text-[10px] md:text-xs mt-1 font-medium ${vid.isPublic !== false ? 'text-blue-400' : 'text-orange-400'}`}>
                          {vid.isPublic !== false ? 'Visible' : 'Hidden'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-3 mt-4 md:mt-6 text-sm">
                          <button onClick={() => openEditModal(vid)} className="text-yellow-500 hover:text-yellow-400 transition font-medium">Edit</button>
                          <button onClick={() => setPreview(vid)} className="text-blue-400 hover:text-blue-300 transition font-medium">Preview</button>
                          <button onClick={() => handleDelete(vid._id)} className="text-red-400 hover:text-red-300 transition font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center mt-6 gap-3 text-sm md:text-base">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 md:px-4 md:py-2 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 transition">Prev</button>
            <span className="px-3 py-1.5 font-medium">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 md:px-4 md:py-2 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 transition">Next</button>
          </div>
        </div>

        {/* --- Add Video Modal --- */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-[95%] max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Add New Video</h2>
                
                <div className="flex gap-3 mb-6">
                  <button 
                    type="button" 
                    onClick={() => setUploadType('file')}
                    className={`flex-1 py-2 rounded text-sm md:text-base font-medium transition ${uploadType === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    MP4 File
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setUploadType('youtube')}
                    className={`flex-1 py-2 rounded text-sm md:text-base font-medium transition ${uploadType === 'youtube' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                  >
                    YouTube Link
                  </button>
                </div>

                <form onSubmit={handleUpload} className="flex flex-col gap-4">
                  <input 
                    type="text" placeholder="Title" required 
                    className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 p-3 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base" 
                    onChange={e => setTitle(e.target.value)} 
                  />
                  <input 
                    type="text" placeholder="Category" required list="category-suggestions"
                    className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 p-3 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base" 
                    onChange={e => setCategory(e.target.value)} 
                  />
                  <textarea 
                    placeholder="Description" required rows="3"
                    className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 p-3 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base resize-none" 
                    onChange={e => setDescription(e.target.value)} 
                  />
                  
                  {uploadType === 'file' ? (
                    <input 
                      type="file" accept="video/mp4" required 
                      className="bg-gray-800 border border-gray-700 text-gray-300 p-2 rounded focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700 text-sm" 
                      onChange={e => setFile(e.target.files[0])} 
                    />
                  ) : (
                    <input 
                      type="url" placeholder="https://www.youtube.com/watch?v=..." required 
                      className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 p-3 rounded focus:outline-none focus:border-red-500 text-sm md:text-base" 
                      onChange={e => setYoutubeLink(e.target.value)} 
                    />
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded font-medium transition text-sm md:text-base">Save Video</button>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded font-medium transition text-sm md:text-base">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingVideo && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setEditingVideo(null)}
            >
              <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-[95%] max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Edit Video Details</h2>
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                  <input 
                    placeholder="Title"
                    type="text" value={editForm.title} required
                    className="bg-gray-800 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                  />
                  <input 
                    placeholder="Category"
                    type="text" value={editForm.category} required list="category-suggestions"
                    className="bg-gray-800 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                  />
                  <textarea 
                    placeholder="Description"
                    value={editForm.description} required rows="4"
                    className="bg-gray-800 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base resize-none"
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                  />
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium transition text-sm md:text-base">Save Changes</button>
                    <button type="button" onClick={() => setEditingVideo(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded font-medium transition text-sm md:text-base">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orientation-Aware Preview Modal */}
        <AnimatePresence>
          {preview && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-md"
              onClick={() => setPreview(null)}
            >
              {/* Close Button Top Right */}
              <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
                <button 
                  className="text-white text-4xl md:text-5xl hover:text-gray-400 transition leading-none drop-shadow-md"
                  onClick={() => setPreview(null)}
                >
                  &times;
                </button>
              </div>

              {/* Dynamic Media Container adapts to Landscape or Portrait automatically */}
              <div 
                className="w-full max-w-6xl flex justify-center items-center relative z-40 h-[70vh] md:h-[80vh]" 
                onClick={e => e.stopPropagation()}
              >
                {preview.videoUrl.includes('youtube.com') || preview.videoUrl.includes('youtu.be') ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYouTubeID(preview.videoUrl)}?autoplay=1`}
                    allow="autoplay; fullscreen; picture-in-picture"
                    className="w-full max-w-5xl aspect-video max-h-full rounded-lg shadow-2xl bg-black"
                  />
                ) : (
                  <video 
                    src={`http://localhost:5000${preview.videoUrl}`} 
                    controls autoPlay playsInline
                    className="w-full h-full object-contain rounded-lg shadow-2xl bg-black" 
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}