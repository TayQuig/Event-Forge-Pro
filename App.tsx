
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Settings as SettingsIcon, Ticket, Layers, Plus, Globe, HardDrive } from 'lucide-react';
import { Event, Asset, AppSettings } from './types';
import { Dashboard } from './components/Dashboard';
import { EventEditor } from './components/EventEditor';
import { PublicView } from './components/PublicView';
import { AssetManager } from './components/AssetManager';
import { Settings } from './components/Settings';
import { LocalDB } from './services/localDb';
import { PublishService } from './services/publishService';

// Mock Initial Data (Used only for seeding if no data exists anywhere)
const SEED_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Tech Horizon Summit 2024',
    description: 'An immersive dive into the future of AI and robotics. Join industry leaders for a weekend of innovation.',
    date: '2024-11-15T09:00',
    location: 'Moscone Center, SF',
    capacity: 500,
    bookings: 342,
    price: 299,
    imageUrl: 'https://picsum.photos/800/400?random=1',
    status: 'published',
    tags: ['Technology', 'AI', 'Networking'],
    agenda: [
      { time: '09:00', title: 'Registration & Breakfast', description: 'Check-in and networking.' },
      { time: '10:00', title: 'Keynote: The Age of Agents', description: 'Opening remarks by CEO.' }
    ],
    assets: []
  },
  {
    id: '2',
    title: 'Midnight Jazz Gala',
    description: 'A night of smooth jazz, fine dining, and charity fundraising.',
    date: '2024-12-05T19:00',
    location: 'The Grand Ballroom',
    capacity: 200,
    bookings: 45,
    price: 150,
    imageUrl: 'https://picsum.photos/800/400?random=2',
    status: 'draft',
    tags: ['Music', 'Gala', 'Charity'],
    agenda: [],
    assets: []
  }
];

const App: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [globalAssets, setGlobalAssets] = useState<Asset[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
      id: 'global',
      brandColor: '#0205b7',
      paymentProvider: 'none',
      paymentConfig: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVisitorMode, setIsVisitorMode] = useState(false);

  // Initialize Data: Hybrid Strategy (LocalDB vs JSON)
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check LocalDB (Admin/Creator context)
        let loadedEvents = await LocalDB.getAllEvents();
        let loadedSettings = await LocalDB.getSettings();
        let loadedAssets = await LocalDB.getAllAssets();
        
        const hasLocalData = loadedEvents.length > 0 || loadedSettings !== undefined;

        if (hasLocalData) {
            // We are the Admin
            console.log("Loading from LocalDB (Admin Mode)");
            if (loadedSettings) setSettings(loadedSettings);
        } else {
            // 2. LocalDB is empty. Try fetching 'events.json' (Visitor context)
            console.log("LocalDB empty. Checking for published events.json...");
            try {
                const response = await fetch('./events.json');
                if (response.ok) {
                    const data = await response.json();
                    loadedEvents = data.events || [];
                    if (data.settings) setSettings(data.settings);
                    setIsVisitorMode(true);
                    console.log("Loaded from events.json (Visitor Mode)");
                } else {
                    throw new Error("No events.json");
                }
            } catch (e) {
                // 3. No LocalDB and no JSON. First time setup -> Seed Data
                console.log("No data found. Seeding initial data...");
                await LocalDB.seedData(SEED_EVENTS, [
                    { id: 'a1', type: 'image', name: 'logo-white.png', url: 'https://picsum.photos/100/100?random=10' },
                ]);
                loadedEvents = await LocalDB.getAllEvents();
                loadedAssets = await LocalDB.getAllAssets();
                loadedSettings = await LocalDB.getSettings();
                if (loadedSettings) setSettings(loadedSettings);
            }
        }

        // Recreate ObjectURLs for blobs (Only relevant for Admin/LocalDB)
        const processedAssets = loadedAssets.map(a => {
            if (a.blob) {
                return { ...a, url: URL.createObjectURL(a.blob) };
            }
            return a;
        });

        setEvents(loadedEvents);
        setGlobalAssets(processedAssets);
      } catch (err) {
          console.error("Initialization failed:", err);
      } finally {
          setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleCreateEvent = async (newEvent: Event) => {
    if (isVisitorMode) return;
    await LocalDB.saveEvent(newEvent);
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleUpdateEvent = async (updatedEvent: Event) => {
    if (isVisitorMode) return;
    await LocalDB.saveEvent(updatedEvent);
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleDeleteEvent = async (id: string) => {
    if (isVisitorMode) return;
    await LocalDB.deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleAddAsset = async (asset: Asset, fileBlob?: Blob) => {
    if (isVisitorMode) return;
    await LocalDB.saveAsset(asset, fileBlob);
    const displayAsset = fileBlob ? { ...asset, url: URL.createObjectURL(fileBlob) } : asset;
    setGlobalAssets(prev => [displayAsset, ...prev]);
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
      if (isVisitorMode) return;
      await LocalDB.saveSettings(newSettings);
      setSettings(newSettings);
  };

  const handlePublish = async (currentEvent?: Event) => {
    if (isVisitorMode) return;
    try {
        let eventsToPublish = [...events];
        // If we are currently editing an event, ensure we publish its latest version
        // regardless of React state update timing.
        if (currentEvent) {
             await LocalDB.saveEvent(currentEvent); // Ensure saved locally
             const index = eventsToPublish.findIndex(e => e.id === currentEvent.id);
             if (index >= 0) {
                 eventsToPublish[index] = currentEvent;
             } else {
                 eventsToPublish.unshift(currentEvent);
             }
             // Update local state to match
             setEvents(eventsToPublish);
        }

        await PublishService.publishEvents(eventsToPublish, settings, globalAssets).then(async (publishedEvents) => {
            // If server returned updated events (with Stripe IDs), sync them back to LocalDB
            if (publishedEvents && publishedEvents.length > 0) {
                // We need to update local state and IndexedDB with the new IDs
                // so subsequent publishes update the same Stripe Product instead of creating new ones.
                console.log("Syncing published events back to local DB...", publishedEvents);
                
                for (const remoteEvent of publishedEvents) {
                    await LocalDB.saveEvent(remoteEvent);
                }
                setEvents(publishedEvents);
            }
        });
    } catch (e) {
        console.error("Publishing failed:", e);
        throw e;
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-cream flex items-center justify-center text-dark flex-col gap-4">
              <HardDrive className="w-10 h-10 animate-pulse text-brand" />
              <p>Loading EventForge...</p>
          </div>
      )
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex bg-cream text-dark font-sans selection:bg-accent/30" style={{
          '--primary-blue': settings.brandColor,
          '--brand-rgb': hexToRgb(settings.brandColor)
      } as React.CSSProperties}>
        <Routes>
          {/* Public Facing Routes */}
          <Route path="/public" element={<PublicView events={events.filter(e => e.status === 'published')} settings={settings} />} />
          <Route path="/public/:id" element={<PublicView events={events} detailMode settings={settings} />} />

          {/* Admin Dashboard Routes - Only accessible if not purely visitor mode (simplified check) */}
          <Route path="/*" element={
            <AdminLayout isVisitor={isVisitorMode}>
              <Routes>
                <Route path="/" element={<Dashboard events={events} onDelete={handleDeleteEvent} isVisitor={isVisitorMode} />} />
                <Route path="/new" element={
                  <EventEditor 
                    onSave={handleCreateEvent} 
                    assets={globalAssets}
                    onAddAsset={handleAddAsset}
                    onPublish={handlePublish}
                  />
                } />
                <Route path="/edit/:id" element={
                  <EventEditorWrapper 
                    events={events} 
                    onSave={handleUpdateEvent} 
                    assets={globalAssets}
                    onAddAsset={handleAddAsset}
                    onPublish={handlePublish}
                  />
                } />
                <Route path="/assets" element={
                  <AssetManager 
                    assets={globalAssets} 
                    onAddAsset={handleAddAsset} 
                  />
                } />
                <Route path="/settings" element={
                  <Settings 
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    events={events} // Pass events for export
                  />
                } />
              </Routes>
            </AdminLayout>
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};

// Helper for CSS vars
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '2, 5, 183';
}

const EventEditorWrapper: React.FC<{
  events: Event[], 
  onSave: (e: Event) => void,
  assets: Asset[],
  onAddAsset: (a: Asset, b?: Blob) => void,
  onPublish: (e?: Event) => Promise<void>
}> = ({ events, onSave, assets, onAddAsset, onPublish }) => {
  const params = useLocation(); 
  const id = params.pathname.split('/').pop(); 
  const event = events.find(e => e.id === id);

  if (!event) return <div>Event not found</div>;
  return <EventEditor initialEvent={event} onSave={onSave} assets={assets} onAddAsset={onAddAsset} onPublish={onPublish} />;
}

const AdminLayout: React.FC<{ children: React.ReactNode, isVisitor: boolean }> = ({ children, isVisitor }) => {
  const location = useLocation();
  
  const navItems = [
    { icon: Layout, label: 'Dashboard', path: '/' },
    { icon: Layers, label: 'Assets Library', path: '/assets' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-accent/20 flex flex-col flex-shrink-0 shadow-sm z-20">
        <div className="p-6 flex items-center space-x-2 border-b border-gray-100">
          <div className="w-8 h-8 bg-brand rounded-md flex items-center justify-center shadow-lg shadow-brand/20">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-dark">EventForge</h1>
            <span className="text-xs text-brand font-bold bg-brand/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Pro</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                location.pathname === item.path
                  ? 'bg-brand/5 text-brand border border-brand/20 font-semibold'
                  : 'text-grayText hover:bg-gray-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-brand' : 'text-gray-400 group-hover:text-dark'}`} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
          
          {!isVisitor && (
              <div className="pt-6 mt-6 border-t border-gray-100">
                 <div className="px-3 mb-2">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Actions</h3>
                 </div>
                 <Link to="/new" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-grayText hover:bg-gray-100 hover:text-brand transition-colors">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium text-sm">New Event</span>
                 </Link>
                 <Link to="/public" target="_blank" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-grayText hover:bg-gray-100 hover:text-emerald-600 transition-colors">
                    <Globe className="w-5 h-5" />
                    <span className="font-medium text-sm">View Public Site</span>
                 </Link>
              </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
              {isVisitor ? 'VI' : 'LO'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-dark truncate">{isVisitor ? 'Visitor Mode' : 'Local Owner'}</p>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isVisitor ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                <p className="text-xs text-emerald-600 truncate">{isVisitor ? 'Read Only' : 'Database Active'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-cream min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default App;
