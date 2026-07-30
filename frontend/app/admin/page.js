"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Parser } from 'json2csv';
import toast from 'react-hot-toast';
import { FiLogOut, FiDownload, FiUpload, FiMusic, FiGlobe, FiSettings, FiX, FiPlus } from 'react-icons/fi';

function getYouTubeID(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.substring(1);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/") || u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
    }
  } catch { return null; }
  return null;
}

const API_URL = 'https://portfolio.ibcstudio.com/api';

export default function AdminDashboard() {
  const [mediaItems, setMediaItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterMainCategory, setFilterMainCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [preview, setPreview] = useState(null);
  const router = useRouter();

  // Connected Database States
  const [categoriesDb, setCategoriesDb] = useState({});
  const [languagesDb, setLanguagesDb] = useState([]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('categories'); // 'categories' or 'languages'
  
  // Media Form State
  const [activeTab, setActiveTab] = useState('Video'); 
  const [uploadType, setUploadType] = useState('file');
  const [file, setFile] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubCategories, setSelectedSubCategories] = useState([]); 
  const [language, setLanguage] = useState('');

  // Category Manager State
  const [manageMainCat, setManageMainCat] = useState('');
  const [newSubCat, setNewSubCat] = useState('');
  const [newMainCat, setNewMainCat] = useState('');

  // Language Manager State
  const [newLangName, setNewLangName] = useState('');
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangFlag, setNewLangFlag] = useState('');

  const [selectedItems, setSelectedItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', subCategories: [], description: '', language: '' });

  const fileInputRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || 'bypass-token';
    return { 'Authorization': `Bearer ${token}` };
  };

  useEffect(() => {
    // AUTHENTICATION BYPASSED: Automatically set bypass-token if none exists instead of redirecting
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', 'bypass-token');
    }
    fetchMedia();
    fetchCategories();
    fetchLanguages();
  }, [page, search, filterMainCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setCategoriesDb(data);
      if (Object.keys(data).length > 0 && !manageMainCat) {
        setManageMainCat(Object.keys(data)[0]);
      }
    } catch (error) {
      toast.error(`Categories failed to load: ${error.message}`);
    }
  };

  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_URL}/languages`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load languages');
      const data = await res.json();
      setLanguagesDb(data);
    } catch (error) {
      toast.error('Failed to load languages');
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${API_URL}/videos?page=${page}&search=${search}&mainCategory=${filterMainCategory}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to load media');
      const data = await res.json();
      setMediaItems(data.items || data.videos || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) { 
      toast.error('Failed to load media.'); 
      setMediaItems([]); 
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedSubCategories.length === 0) return toast.error('Please select at least one subcategory.');
    
    const loadingToast = toast.loading('Adding media...');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('mainCategory', activeTab);
    
    selectedSubCategories.forEach(sc => formData.append('subCategory', sc));
    if (activeTab === 'Audio') formData.append('language', language);
    
    if (activeTab === 'Digital') {
      formData.append('link', linkInput);
    } else if (uploadType === 'file' && file) {
      formData.append('file', file);
    } else if (uploadType === 'link' && linkInput) {
      formData.append('link', linkInput);
    } else {
      toast.error('Please provide a file or link.', { id: loadingToast });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/videos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload failed');
      }

      toast.success('Asset added successfully!', { id: loadingToast });
      fetchMedia();
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) { toast.error(error.message, { id: loadingToast }); }
  };

  const resetForm = () => {
    setTitle(''); setSelectedSubCategories([]); setDescription(''); setLanguage('');
    setFile(null); setLinkInput(''); setUploadType('file');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await fetch(`${API_URL}/videos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      toast.success('Deleted successfully.');
      fetchMedia();
    } catch (error) { toast.error('Failed to delete.'); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedItems.length} items?`)) return;
    const loadingToast = toast.loading('Deleting...');
    try {
      await fetch(`${API_URL}/videos/bulk-delete`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedItems })
      });
      setSelectedItems([]);
      toast.success(`${selectedItems.length} items deleted.`, { id: loadingToast });
      fetchMedia();
    } catch (error) { toast.error('Bulk delete failed.', { id: loadingToast }); }
  };

  const handleToggleVisibility = async (item) => {
    const newStatus = !item.isPublic;
    setMediaItems(prev => prev.map(v => v._id === item._id ? { ...v, isPublic: newStatus } : v));
    try {
      await fetch(`${API_URL}/videos/${item._id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newStatus }) 
      });
      toast.success(`Marked as ${newStatus ? 'Visible' : 'Hidden'}.`);
    } catch (error) {
      setMediaItems(prev => prev.map(v => v._id === item._id ? { ...v, isPublic: !newStatus } : v));
      toast.error('Failed to update visibility.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editForm.subCategories.length === 0) return toast.error('Select at least one subcategory.');
    
    const loadingToast = toast.loading('Saving changes...');
    try {
      const res = await fetch(`${API_URL}/videos/${editingItem._id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          subCategory: editForm.subCategories,
          language: editForm.language
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error occurred');
      }

      setEditingItem(null);
      toast.success('Updated successfully.', { id: loadingToast });
      fetchMedia();
    } catch (error) { 
      toast.error(`Failed to update: ${error.message}`, { id: loadingToast }); 
    }
  };

  const exportCSV = () => {
    try {
      let fields = ['Title', 'SubCategory', 'Description', 'Link', 'Date'];
      if (filterMainCategory === 'Audio' || filterMainCategory === 'All') fields.splice(4, 0, 'Language');
      if (filterMainCategory === 'All') fields.splice(1, 0, 'MainCategory');

      const csvData = mediaItems.map(v => ({
        Title: v.title,
        MainCategory: v.mainCategory,
        SubCategory: Array.isArray(v.subCategory) ? v.subCategory.join(', ') : v.subCategory,
        Description: v.description,
        Language: v.language || '',
        Link: v.mediaUrl,
        Date: v.createdAt
      }));

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(csvData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IBC_Media_${filterMainCategory}.csv`;
      a.click();
      toast.success('CSV Exported.');
    } catch (error) { toast.error('Failed to generate CSV.'); }
  };

  // --- CATEGORY & LANGUAGE MANAGERS ---
  const handleAddMainCategory = async () => {
    if (!newMainCat.trim()) return;
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMainCat })
      });
      if (!res.ok) throw new Error('Failed to add category');
      setCategoriesDb(prev => ({ ...prev, [newMainCat]: [] }));
      setManageMainCat(newMainCat); 
      setNewMainCat('');
      toast.success('Main Category added');
    } catch (err) { toast.error(`Failed: ${err.message}`); }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCat.trim() || !manageMainCat) return;
    try {
      const res = await fetch(`${API_URL}/categories/${manageMainCat}/subcategories`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ subCategory: newSubCat })
      });
      if (!res.ok) throw new Error('Failed to add');
      setCategoriesDb(prev => ({
        ...prev,
        [manageMainCat]: [...new Set([...(prev[manageMainCat] || []), newSubCat])]
      }));
      setNewSubCat('');
    } catch (err) { toast.error(`Failed: ${err.message}`); }
  };

  const handleDeleteSubCategory = async (subCatToRemove) => {
    try {
      const res = await fetch(`${API_URL}/categories/${manageMainCat}/subcategories/${subCatToRemove}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete');
      setCategoriesDb(prev => ({
        ...prev,
        [manageMainCat]: prev[manageMainCat].filter(sc => sc !== subCatToRemove)
      }));
    } catch (err) { toast.error(`Failed: ${err.message}`); }
  };

  const handleAddLanguage = async (e) => {
    e.preventDefault();
    if (!newLangName || !newLangCode) return toast.error('Name and code are required');
    try {
      const res = await fetch(`${API_URL}/languages`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLangName, code: newLangCode, flagIcon: newLangFlag })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add language');
      }
      toast.success('Language added');
      setNewLangName(''); setNewLangCode(''); setNewLangFlag('');
      fetchLanguages();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteLanguage = async (id) => {
    try {
      const res = await fetch(`${API_URL}/languages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Language deleted');
      fetchLanguages();
    } catch (err) { toast.error(err.message); }
  };

  const renderThumbnail = (item) => {
    if (item.mainCategory === 'Photography') return <img src={item.mediaUrl} className="w-full h-full object-cover opacity-80" alt="Thumb" />;
    if (item.mainCategory === 'Audio') return <div className="flex flex-col items-center justify-center h-full bg-purple-900/50"><FiMusic size={24} className="mb-1 text-purple-400"/><span className="text-[10px] text-gray-400">{item.language || 'Audio'}</span></div>;
    if (item.mainCategory === 'Digital') return <div className="flex flex-col items-center justify-center h-full bg-blue-900/50"><FiGlobe size={24} className="mb-1 text-blue-400"/><span className="text-[10px] text-gray-400">Web Link</span></div>;
    
    const ytID = getYouTubeID(item.mediaUrl);
    if (ytID) {
      return (
        <>
          <img src={`https://i.ytimg.com/vi/${ytID}/hqdefault.jpg`} className="w-full h-full object-cover opacity-70" alt="YT"/>
          <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs pl-0.5 opacity-90">▶</div></div>
        </>
      );
    }
    return <video src={item.mediaUrl} className="w-full h-full object-cover opacity-70 pointer-events-none" muted playsInline />;
  };

  return (
    <div className="min-h-screen animated-bg text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-white">IBC Studio Content</h1>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setIsCategoryModalOpen(true)} className="bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded shadow-lg text-sm md:text-base font-medium flex items-center gap-2">
              <FiSettings /> Categories & Languages
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded shadow-lg text-sm md:text-base font-medium">
              + Add Media
            </button>
            <button onClick={() => { localStorage.removeItem('token'); router.push('/admin/login'); }} className="p-2.5 bg-gray-800 rounded-full text-red-500 hover:text-red-400 border border-gray-700 transition" title="Logout">
              <FiLogOut size={22} />
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-4 md:p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
              <select 
                className="bg-gray-800 border border-gray-700 text-white p-2.5 rounded focus:outline-none focus:border-blue-500 text-sm md:text-base"
                value={filterMainCategory}
                onChange={e => { setFilterMainCategory(e.target.value); setPage(1); }}
              >
                <option value="All">All Media</option>
                {Object.keys(categoriesDb).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <div className="relative w-full sm:max-w-xs">
                <input type="text" placeholder="Search title or tags..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-gray-800 border border-gray-700 text-white p-2.5 pr-10 rounded w-full focus:outline-none focus:border-blue-500 text-sm" />
                {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">&times;</button>}
              </div>

              <AnimatePresence>
                {selectedItems.length > 0 && (
                  <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded font-medium text-sm">
                    Delete ({selectedItems.length})
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex gap-2">
              <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={async (e) => {
                const f = e.target.files[0]; if (!f) return;
                const fd = new FormData(); 
                fd.append('file', f);
                fd.append('defaultMainCategory', filterMainCategory === 'All' ? 'Video' : filterMainCategory);
                
                const loading = toast.loading('Importing...');
                try {
                  const res = await fetch(`${API_URL}/videos/bulk-import`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: fd });
                  if (res.ok) { toast.success('Import complete', { id: loading }); fetchMedia(); }
                } catch { toast.error('Import failed', { id: loading }); }
              }} />
              <button onClick={() => fileInputRef.current.click()} className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded transition" title={`Import CSV`}><FiUpload size={20} /></button>
              <button onClick={exportCSV} className="p-2.5 bg-green-600 hover:bg-green-500 text-white rounded transition" title={`Export CSV`}><FiDownload size={20} /></button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-800/50">
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3 w-12 text-center">
                    <input type="checkbox" className="cursor-pointer" checked={(mediaItems?.length > 0) && (selectedItems?.length === mediaItems?.length)} onChange={e => setSelectedItems(e.target.checked ? mediaItems.map(v => v._id) : [])} />
                  </th>
                  <th className="p-3 font-medium">Asset</th>
                  <th className="p-3 font-medium whitespace-nowrap">Title</th>
                  {filterMainCategory === 'All' && <th className="p-3 font-medium whitespace-nowrap">Format</th>}
                  <th className="p-3 font-medium whitespace-nowrap">Subcategories / Tags</th>
                  <th className="p-3 font-medium text-center whitespace-nowrap">Visibility</th>
                  <th className="p-3 font-medium whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mediaItems?.map(item => {
                  const subCatsArray = Array.isArray(item.subCategory) ? item.subCategory : [item.subCategory];
                  return (
                    <tr key={item._id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                      <td className="p-3 text-center"><input type="checkbox" className="cursor-pointer" checked={selectedItems.includes(item._id)} onChange={e => setSelectedItems(prev => e.target.checked ? [...prev, item._id] : prev.filter(id => id !== item._id))} /></td>
                      <td className="p-3 w-32">
                        <div className="w-24 h-14 bg-black rounded overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-blue-500 transition" onClick={() => setPreview(item)}>
                          {renderThumbnail(item)}
                        </div>
                      </td>
                      <td className="p-3 text-sm font-medium max-w-[200px] truncate">{item.title}</td>
                      {filterMainCategory === 'All' && <td className="p-3 text-sm text-gray-300 whitespace-nowrap">{item.mainCategory}</td>}
                      <td className="p-3 text-sm text-gray-400">
                        <div className="flex flex-wrap gap-1">
                          {subCatsArray.map(tag => tag && (
                            <span key={tag} className="bg-gray-800 text-xs px-2 py-0.5 rounded border border-gray-700">{tag}</span>
                          ))}
                          {item.language && <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-0.5 rounded border border-purple-800">{item.language}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => handleToggleVisibility(item)} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${item.isPublic ? 'bg-blue-600' : 'bg-orange-500'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-3 text-sm">
                          <button onClick={() => { setEditingItem(item); setEditForm({ title: item.title, subCategories: subCatsArray, description: item.description, language: item.language || '' }); }} className="text-yellow-500 hover:text-yellow-400 font-medium">Edit</button>
                          <button onClick={() => setPreview(item)} className="text-blue-400 hover:text-blue-300 font-medium">Preview</button>
                          <button onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-300 font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center mt-6 gap-3 text-sm md:text-base">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50 transition">Prev</button>
            <span className="px-3 font-medium">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50 transition">Next</button>
          </div>
        </div>

        {/* --- CATEGORIES & LANGUAGES MANAGEMENT MODAL --- */}
        <AnimatePresence>
          {isCategoryModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)}>
              <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-[95%] max-w-4xl flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                
                {/* Modal Sub-Tabs Navigation */}
                <div className="flex border-b border-gray-800 pb-3 gap-4">
                  <button onClick={() => setSettingsTab('categories')} className={`px-4 py-2 font-bold rounded transition ${settingsTab === 'categories' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                    Manage Categories
                  </button>
                  <button onClick={() => setSettingsTab('languages')} className={`px-4 py-2 font-bold rounded transition ${settingsTab === 'languages' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                    Manage Languages
                  </button>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="ml-auto text-gray-400 hover:text-white"><FiX size={24}/></button>
                </div>

                {settingsTab === 'categories' ? (
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 border-r border-gray-800 pr-0 md:pr-8">
                      <h2 className="text-lg font-bold text-white mb-4">Main Categories</h2>
                      <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="New Main Category" value={newMainCat} onChange={e => setNewMainCat(e.target.value)} className="bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm w-full focus:outline-none focus:border-blue-500" />
                        <button onClick={handleAddMainCategory} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-500"><FiPlus /></button>
                      </div>
                      <ul className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-2">
                        {Object.keys(categoriesDb).map(mainCat => (
                          <li key={mainCat} onClick={() => setManageMainCat(mainCat)} className={`cursor-pointer p-3 rounded border transition ${manageMainCat === mainCat ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                            {mainCat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-white mb-4">Subcategories for <span className="text-blue-400">{manageMainCat || '...'}</span></h2>
                      <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="New Subcategory tag" value={newSubCat} onChange={e => setNewSubCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubCategory()} className="bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm w-full focus:outline-none focus:border-blue-500" disabled={!manageMainCat} />
                        <button onClick={handleAddSubCategory} className="bg-green-600 text-white px-3 rounded hover:bg-green-500" disabled={!manageMainCat}><FiPlus /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-[35vh] overflow-y-auto content-start">
                        {manageMainCat && categoriesDb[manageMainCat]?.map(subCat => (
                          <div key={subCat} className="bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm">
                            {subCat}
                            <button onClick={() => handleDeleteSubCategory(subCat)} className="text-red-400 hover:text-red-300 ml-1"><FiX /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <form onSubmit={handleAddLanguage} className="flex flex-col sm:flex-row gap-3">
                      <input type="text" placeholder="Language Name (e.g. French)" value={newLangName} onChange={e => setNewLangName(e.target.value)} className="bg-gray-800 border border-gray-700 text-white p-2.5 rounded text-sm flex-1" required />
                      <input type="text" placeholder="Code (e.g. fr)" value={newLangCode} onChange={e => setNewLangCode(e.target.value)} className="bg-gray-800 border border-gray-700 text-white p-2.5 rounded text-sm w-32" required />
                      <input type="url" placeholder="Flag Icon Link (URL)" value={newLangFlag} onChange={e => setNewLangFlag(e.target.value)} className="bg-gray-800 border border-gray-700 text-white p-2.5 rounded text-sm flex-1" />
                      <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded font-medium text-sm">Add Language</button>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto">
                      {languagesDb.map(lang => (
                        <div key={lang._id} className="bg-gray-800 border border-gray-700 p-3 rounded flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {lang.flagIcon ? <img src={lang.flagIcon} alt="" className="w-6 h-4 object-cover rounded shadow" /> : <span className="text-xs uppercase bg-gray-700 px-1.5 py-0.5 rounded">{lang.code}</span>}
                            <div>
                              <p className="font-semibold text-sm">{lang.name}</p>
                              <span className="text-xs text-gray-400 uppercase">{lang.code}</span>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteLanguage(lang._id)} className="text-red-400 hover:text-red-300 p-1"><FiX size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- DYNAMIC MULTIMEDIA ADD MODAL --- */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-2xl w-[95%] max-w-lg overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Add Media Asset</h2>
                
                <div className="flex overflow-x-auto gap-2 pb-2 mb-4 hide-scrollbar border-b border-gray-800">
                  {Object.keys(categoriesDb).map(cat => (
                    <button key={cat} type="button" onClick={() => { setActiveTab(cat); setUploadType('file'); setLinkInput(''); setSelectedSubCategories([]); }} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === cat ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                      {cat}
                    </button>
                  ))}
                </div>

                {activeTab !== 'Digital' && (
                  <div className="flex gap-2 mb-4">
                    <button type="button" onClick={() => setUploadType('file')} className={`flex-1 py-1.5 rounded text-sm font-medium ${uploadType === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>Upload File</button>
                    <button type="button" onClick={() => setUploadType('link')} className={`flex-1 py-1.5 rounded text-sm font-medium ${uploadType === 'link' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'}`}>External Link</button>
                  </div>
                )}

                <form onSubmit={handleUpload} className="flex flex-col gap-4">
                  <input type="text" placeholder="Title" required className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm" onChange={e => setTitle(e.target.value)} />
                  
                  <div className="flex flex-col gap-2">
                    <select 
                      className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !selectedSubCategories.includes(val)) setSelectedSubCategories(prev => [...prev, val]);
                        e.target.value = ""; 
                      }}
                    >
                      <option value="">+ Select Subcategories (Tags)</option>
                      {categoriesDb[activeTab]?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    
                    {selectedSubCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 bg-gray-800/50 rounded border border-gray-700/50">
                        {selectedSubCategories.map(sc => (
                          <span key={sc} className="bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            {sc} <FiX className="cursor-pointer hover:text-red-300" onClick={() => setSelectedSubCategories(prev => prev.filter(x => x !== sc))} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* DYNAMIC LANGUAGE DROPDOWN FETCHED FROM DATABASE */}
                  {activeTab === 'Audio' && (
                    <select className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm" onChange={e => setLanguage(e.target.value)} value={language}>
                      <option value="">Select Language (Optional)</option>
                      {languagesDb.map(lang => <option key={lang._id} value={lang.name}>{lang.name} ({lang.code.toUpperCase()})</option>)}
                    </select>
                  )}

                  <textarea placeholder="Description" required rows="3" className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm resize-none" onChange={e => setDescription(e.target.value)} />
                  
                  {activeTab === 'Digital' ? (
                    <input type="url" placeholder="Website / App URL" required className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm border-l-4 border-l-blue-500" onChange={e => setLinkInput(e.target.value)} />
                  ) : uploadType === 'file' ? (
                    <input type="file" required onChange={e => setFile(e.target.files[0])} 
                      accept={ activeTab === 'Photography' ? 'image/jpeg, image/png, image/webp' : activeTab === 'Audio' ? 'audio/mp3, audio/wav, audio/mpeg' : 'video/mp4, video/avi' }
                      className="bg-gray-800 border border-gray-700 text-gray-300 p-2 rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white" 
                    />
                  ) : (
                    <input type="url" placeholder="Paste external link (YouTube, Drive, etc.)" required className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm border-l-4 border-l-red-500" onChange={e => setLinkInput(e.target.value)} />
                  )}

                  <div className="flex gap-3 mt-2">
                    <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-3 rounded font-medium text-sm">Save Asset</button>
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded font-medium text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- EDIT MODAL --- */}
        <AnimatePresence>
          {editingItem && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setEditingItem(null)}>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg w-[95%] max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-6">Edit Asset Details</h2>
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                  <input placeholder="Title" type="text" value={editForm.title} required className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm" onChange={e => setEditForm({...editForm, title: e.target.value})} />
                  
                  <div className="flex flex-col gap-2">
                    <select 
                      className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !editForm.subCategories.includes(val)) {
                          setEditForm({ ...editForm, subCategories: [...editForm.subCategories, val] });
                        }
                        e.target.value = ""; 
                      }}
                    >
                      <option value="">+ Add Subcategory Tag</option>
                      {categoriesDb[editingItem.mainCategory]?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {editForm.subCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 bg-gray-800/50 rounded border border-gray-700/50">
                        {editForm.subCategories.map(sc => (
                          <span key={sc} className="bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            {sc} <FiX className="cursor-pointer hover:text-red-300" onClick={() => setEditForm({ ...editForm, subCategories: editForm.subCategories.filter(x => x !== sc) })} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {editingItem.mainCategory === 'Audio' && (
                    <select className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm" onChange={e => setEditForm({...editForm, language: e.target.value})} value={editForm.language}>
                      <option value="">Select Language (Optional)</option>
                      {languagesDb.map(lang => <option key={lang._id} value={lang.name}>{lang.name}</option>)}
                    </select>
                  )}
                  
                  <textarea placeholder="Description" value={editForm.description} required rows="4" className="bg-gray-800 border border-gray-700 text-white p-3 rounded text-sm resize-none" onChange={e => setEditForm({...editForm, description: e.target.value})} />
                  <div className="flex gap-3 mt-2">
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded">Save</button>
                    <button type="button" onClick={() => setEditingItem(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- UNIVERSAL MEDIA PREVIEW MODAL --- */}
        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[70] flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-md" onClick={() => setPreview(null)}>
              <button className="absolute top-6 right-8 text-white text-5xl hover:text-gray-400 transition" onClick={() => setPreview(null)}>&times;</button>
              
              <div className="w-full max-w-5xl flex flex-col items-center justify-center h-[80vh]" onClick={e => e.stopPropagation()}>
                {preview.mainCategory === 'Photography' ? (
                  <img src={preview.mediaUrl} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Preview"/>
                ) : preview.mainCategory === 'Audio' ? (
                  <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md flex flex-col items-center shadow-2xl border border-purple-500/30">
                    <FiMusic size={64} className="text-purple-400 mb-6" />
                    <h3 className="text-2xl font-bold mb-2 text-center">{preview.title}</h3>
                    <p className="text-gray-400 mb-8">{preview.language || 'Audio Track'}</p>
                    <audio src={preview.mediaUrl} controls autoPlay className="w-full" />
                  </div>
                ) : preview.mainCategory === 'Digital' ? (
                  <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-lg flex flex-col items-center shadow-2xl border border-blue-500/30">
                    <FiGlobe size={64} className="text-blue-400 mb-6" />
                    <h3 className="text-2xl font-bold mb-4 text-center">{preview.title}</h3>
                    <p className="text-gray-400 mb-8 text-center">{preview.description}</p>
                    <a href={preview.mediaUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-500 transition font-bold shadow-lg">
                      Visit Destination
                    </a>
                  </div>
                ) : getYouTubeID(preview.mediaUrl) ? (
                  <iframe className="w-full h-full rounded-xl bg-black shadow-2xl" src={`https://www.youtube-nocookie.com/embed/${getYouTubeID(preview.mediaUrl)}?autoplay=1&playsinline=1`} allowFullScreen />
                ) : (
                  <video src={preview.mediaUrl} controls autoPlay playsInline className="w-full h-full object-contain rounded-xl bg-black shadow-2xl" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}