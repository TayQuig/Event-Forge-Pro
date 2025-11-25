
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Event, Asset } from '../types';
import { generateEventDescription, generateEventImage, generateEventAgenda, generateEventTags, suggestOptimalDate } from '../services/geminiService';
import { Sparkles, Calendar as CalIcon, Image as ImageIcon, List, Tag, Save, ArrowLeft, Loader2, Wand2, Eye, Globe, CheckCircle } from 'lucide-react';

interface EventEditorProps {
    initialEvent?: Event;
    onSave: (event: Event) => void;
    assets: Asset[];
    onAddAsset: (asset: Asset) => void;
    onPublish?: (event: Event) => Promise<void>;
}

export const EventEditor: React.FC<EventEditorProps> = ({ initialEvent, onSave, assets, onAddAsset, onPublish }) => {
    const navigate = useNavigate();
    const [loadingAI, setLoadingAI] = useState<string | null>(null);
    const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
    
    const [formData, setFormData] = useState<Event>(initialEvent || {
        id: Math.random().toString(36).substr(2, 9),
        title: '',
        description: '',
        date: '',
        location: '',
        capacity: 100,
        bookings: 0,
        price: 0,
        imageUrl: '',
        status: 'draft',
        tags: [],
        agenda: [],
        assets: []
    });

    // Helper Inputs for AI
    const [aiDescriptionInput, setAiDescriptionInput] = useState({ vibe: 'Professional and energetic', details: 'Networking, innovation, free food' });
    const [aiScheduleInput, setAiScheduleInput] = useState({ season: 'Fall', type: 'Tech Conference' });

    // 1. AI Description Handler
    const handleAiDescription = async () => {
        if (!formData.title) { alert("Please enter a title first."); return; }
        setLoadingAI('desc');
        try {
            const desc = await generateEventDescription(formData.title, aiDescriptionInput.vibe, aiDescriptionInput.details);
            setFormData(prev => ({ ...prev, description: desc }));
        } finally { setLoadingAI(null); }
    };

    // 2. AI Image Handler
    const handleAiImage = async () => {
        if (!formData.title) { alert("Please enter a title first."); return; }
        setLoadingAI('image');
        try {
            const base64Image = await generateEventImage(formData.title + " " + aiDescriptionInput.vibe);
            setFormData(prev => ({ ...prev, imageUrl: base64Image }));
            
            // Also add to global assets for DAW feel
            onAddAsset({
                id: Math.random().toString(36),
                type: 'image',
                name: `generated-${formData.title.slice(0,10)}.png`,
                url: base64Image
            });
        } catch (e) {
            alert("Failed to generate image. Try again.");
        } finally { setLoadingAI(null); }
    };

    // 3. AI Agenda Handler
    const handleAiAgenda = async () => {
        if (!formData.title) { alert("Please enter a title first."); return; }
        setLoadingAI('agenda');
        try {
            const agenda = await generateEventAgenda(formData.title, 6); // Default 6 hours
            setFormData(prev => ({ ...prev, agenda }));
        } finally { setLoadingAI(null); }
    };

    // 4. AI Tags Handler
    const handleAiTags = async () => {
        if (!formData.description) { alert("Please generate a description first."); return; }
        setLoadingAI('tags');
        try {
            const tags = await generateEventTags(formData.description);
            setFormData(prev => ({ ...prev, tags }));
        } finally { setLoadingAI(null); }
    };

    // 5. AI Scheduling Assistant
    const handleAiScheduleAdvice = async () => {
        setLoadingAI('schedule');
        try {
            const advice = await suggestOptimalDate(aiScheduleInput.type, aiScheduleInput.season);
            alert(`AI Suggestion: ${advice}`);
        } finally { setLoadingAI(null); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        navigate('/');
    };

    const handlePublishClick = async () => {
        if (!onPublish) return;
        setPublishStatus('publishing');
        
        // Auto-set status to published if it's draft
        const eventToPublish = { ...formData, status: 'published' as const };
        setFormData(eventToPublish);

        try {
            await onPublish(eventToPublish);
            setPublishStatus('success');
            setTimeout(() => setPublishStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setPublishStatus('error');
            setTimeout(() => setPublishStatus('idle'), 3000);
        }
    };

    return (
        <div className="h-full flex flex-col bg-cream text-dark overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-accent/20 bg-white/50 backdrop-blur z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-dark transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-semibold text-brand">{initialEvent ? 'Edit Event' : 'Create New Event'}</h2>
                    
                    {/* Status Dropdown */}
                    <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className="text-xs bg-white border border-gray-300 rounded px-2 py-1 ml-2 text-gray-600 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="past">Past</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-3">
                    {initialEvent && (
                        <Link 
                            to={`/public/${formData.id}`} 
                            target="_blank"
                            className="flex items-center gap-2 text-brand hover:text-brand-900 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:bg-brand/5"
                        >
                            <Eye className="w-4 h-4" /> Preview
                        </Link>
                    )}
                    
                    {onPublish && (
                        <button 
                            onClick={handlePublishClick}
                            disabled={publishStatus === 'publishing'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
                                publishStatus === 'success' ? 'bg-emerald-500 text-white' :
                                publishStatus === 'error' ? 'bg-red-500 text-white' :
                                'bg-white border border-brand/20 text-brand hover:bg-brand/5'
                            }`}
                        >
                            {publishStatus === 'publishing' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                             publishStatus === 'success' ? <CheckCircle className="w-4 h-4" /> :
                             <Globe className="w-4 h-4" />}
                            {publishStatus === 'publishing' ? 'Publishing...' : 
                             publishStatus === 'success' ? 'Published!' :
                             publishStatus === 'error' ? 'Failed' :
                             'Publish Live'}
                        </button>
                    )}

                    <button onClick={handleSubmit} className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-lg shadow-brand/20">
                        <Save className="w-4 h-4" /> Save
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Basic Info Section */}
                        <section className="bg-white p-6 rounded-xl border border-accent/20 shadow-sm">
                            <h3 className="text-lg font-medium text-dark mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-brand" /> Event Details
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-grayText mb-1">Event Title</label>
                                    <input 
                                        type="text" 
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-dark focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. Global Tech Summit"
                                    />
                                </div>

                                {/* AI Description Tool */}
                                <div className="p-4 bg-brand/5 rounded-lg border border-brand/20 relative group">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-sm font-medium text-brand flex items-center gap-2">
                                            <Wand2 className="w-3.5 h-3.5" /> AI Writer
                                        </label>
                                        <button 
                                            onClick={handleAiDescription}
                                            disabled={loadingAI === 'desc'}
                                            className="text-xs bg-brand hover:bg-brand-600 text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition"
                                        >
                                            {loadingAI === 'desc' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            Generate
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <input 
                                            placeholder="Vibe (e.g. Energetic)" 
                                            className="bg-white border border-brand/20 rounded px-3 py-2 text-sm text-dark placeholder-gray-400"
                                            value={aiDescriptionInput.vibe}
                                            onChange={e => setAiDescriptionInput({...aiDescriptionInput, vibe: e.target.value})}
                                        />
                                        <input 
                                            placeholder="Key details..." 
                                            className="bg-white border border-brand/20 rounded px-3 py-2 text-sm text-dark placeholder-gray-400"
                                            value={aiDescriptionInput.details}
                                            onChange={e => setAiDescriptionInput({...aiDescriptionInput, details: e.target.value})}
                                        />
                                    </div>
                                    <textarea 
                                        rows={6}
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-white border border-brand/20 rounded-lg px-4 py-3 text-dark focus:ring-2 focus:ring-brand outline-none"
                                        placeholder="Event description goes here..."
                                    />
                                </div>
                            </div>
                        </section>

                         {/* Agenda Section */}
                         <section className="bg-white p-6 rounded-xl border border-accent/20 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-dark flex items-center gap-2">
                                    <List className="w-4 h-4 text-accent" /> Agenda
                                </h3>
                                <button 
                                    onClick={handleAiAgenda}
                                    disabled={loadingAI === 'agenda'}
                                    className="text-xs text-accent hover:text-accent-dark flex items-center gap-1 border border-accent/30 px-3 py-1.5 rounded hover:bg-accent/10 transition"
                                >
                                    {loadingAI === 'agenda' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    Auto-Build Agenda
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.agenda.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg">
                                        No agenda items yet. Use AI to generate one.
                                    </div>
                                ) : (
                                    formData.agenda.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded border border-gray-100 items-start">
                                            <span className="font-mono text-brand text-sm whitespace-nowrap bg-brand/10 px-2 py-1 rounded">{item.time}</span>
                                            <div>
                                                <div className="font-medium text-dark text-sm">{item.title}</div>
                                                <div className="text-grayText text-xs mt-0.5">{item.description}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">

                         {/* Image & Assets */}
                         <section className="bg-white p-6 rounded-xl border border-accent/20 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-dark flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-emerald-500" /> Visuals
                                </h3>
                                <button 
                                    onClick={handleAiImage}
                                    disabled={loadingAI === 'image'}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 border border-emerald-500/30 px-3 py-1.5 rounded hover:bg-emerald-50 transition"
                                >
                                    {loadingAI === 'image' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    Generate
                                </button>
                            </div>
                            <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                                {formData.imageUrl ? (
                                    <img src={formData.imageUrl} alt="Event" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <span className="text-gray-400 text-xs">No Cover Image</span>
                                    </div>
                                )}
                                {loadingAI === 'image' && (
                                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm">
                                        <div className="text-center">
                                            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                                            <span className="text-emerald-600 text-xs font-medium">Creating Art...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="text" 
                                placeholder="Or paste image URL..."
                                value={formData.imageUrl}
                                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                                className="w-full mt-3 bg-white border border-gray-300 rounded px-3 py-2 text-xs text-dark"
                            />
                            <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                                Note: Use public image URLs (e.g., hosted on Imgur or your server) if you plan to publish this event to the web, so visitors can see them. Local AI images may not display for visitors unless manually uploaded.
                            </p>
                        </section>

                        {/* Date & Capacity */}
                        <section className="bg-white p-6 rounded-xl border border-accent/20 shadow-sm">
                             <h3 className="text-lg font-medium text-dark mb-4 flex items-center gap-2">
                                <CalIcon className="w-4 h-4 text-blue-500" /> Logistics
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold text-blue-700 uppercase">Smart Schedule</span>
                                        <button onClick={handleAiScheduleAdvice} className="text-blue-500 hover:text-blue-700"><Sparkles className="w-3 h-3" /></button>
                                    </div>
                                    <p className="text-xs text-blue-900/70">Get AI advice on the best date.</p>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase font-semibold text-grayText mb-1">Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-dark text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase font-semibold text-grayText mb-1">Capacity</label>
                                        <input 
                                            type="number" 
                                            value={formData.capacity}
                                            onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-dark text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase font-semibold text-grayText mb-1">Price ($)</label>
                                        <input 
                                            type="number" 
                                            value={formData.price}
                                            onChange={e => setFormData({...formData, price: parseInt(e.target.value)})}
                                            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-dark text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                         {/* Tags & SEO */}
                         <section className="bg-white p-6 rounded-xl border border-accent/20 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-dark flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-accent" /> Tags
                                </h3>
                                <button 
                                    onClick={handleAiTags}
                                    disabled={loadingAI === 'tags'}
                                    className="text-xs text-accent hover:text-accent-dark flex items-center gap-1"
                                >
                                    {loadingAI === 'tags' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    Auto-Tag
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag, i) => (
                                    <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{tag}</span>
                                ))}
                                {formData.tags.length === 0 && <span className="text-xs text-gray-400">No tags generated.</span>}
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};
