
import React, { useRef, useState } from 'react';
import { Save, Palette, Globe, ShieldCheck, CreditCard, Download, Upload, AlertTriangle, FileJson, Code, Copy, Check } from 'lucide-react';
import { AppSettings, PaymentProvider, Event } from '../types';
import { LocalDB } from '../services/localDb';

interface SettingsProps {
    settings: AppSettings;
    onUpdateSettings: (settings: AppSettings) => void;
    events?: Event[];
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, events }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [copied, setCopied] = useState(false);

    const handleChange = (key: keyof AppSettings, value: any) => {
        onUpdateSettings({ ...settings, [key]: value });
    };

    const handlePaymentConfigChange = (key: string, value: string) => {
        onUpdateSettings({
            ...settings,
            paymentConfig: { ...settings.paymentConfig, [key]: value }
        });
    };

    // Backup: Full backup for restoring local state
    const handleDownloadBackup = async () => {
        const json = await LocalDB.createBackup();
        downloadJson(json, `eventforge-backup-${new Date().toISOString().slice(0,10)}.json`);
    };

    // Publish: Export public-ready JSON for the website
    const handlePublishWebData = () => {
        const publicData = {
            events: events || [],
            settings: settings
        };
        const json = JSON.stringify(publicData, null, 2);
        downloadJson(json, 'events.json');
        alert("File 'events.json' generated!\n\nUpload this file to your web server (next to index.html) to update your public visitor site.");
    };

    const downloadJson = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            const success = await LocalDB.restoreBackup(content);
            if (success) {
                alert('Backup restored successfully! Please refresh the page.');
                window.location.reload();
            } else {
                alert('Failed to restore backup. Invalid file format.');
            }
        };
        reader.readAsText(file);
    };

    const getEmbedCode = () => {
        const url = window.location.href.split('#')[0] + '#/public';
        return `<iframe 
  src="${url}" 
  width="100%" 
  height="800" 
  style="border:none; border-radius: 12px; background-color: ${settings.brandColor}05;" 
  title="Upcoming Events">
</iframe>`;
    };

    const copyEmbedCode = () => {
        navigator.clipboard.writeText(getEmbedCode());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-cream">
             <header className="mb-8 border-b border-accent/20 pb-6">
                <h2 className="text-3xl font-bold text-brand mb-2">Settings</h2>
                <p className="text-grayText">Customize your integration, payments, and visual identity.</p>
            </header>

            <div className="max-w-3xl space-y-8 pb-10">
                
                {/* Branding Section */}
                <section className="bg-white rounded-xl border border-accent/20 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-accent" /> Branding
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-grayText mb-2">Brand Color</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="color" 
                                    value={settings.brandColor}
                                    onChange={(e) => handleChange('brandColor', e.target.value)}
                                    className="h-12 w-24 bg-transparent cursor-pointer rounded-lg border border-gray-200 p-1"
                                />
                                <div className="flex-1">
                                    <p className="text-dark text-sm mb-1">Primary Theme Color</p>
                                    <p className="text-grayText text-xs">This color will be applied to your public event pages.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Publish to Web */}
                <section className="bg-brand/5 rounded-xl border border-brand/20 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-brand mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5" /> Publish to Website
                    </h3>
                    <p className="text-sm text-grayText mb-4">
                        To make your events visible to visitors on your actual website, you must generate a data file and upload it to your host.
                    </p>
                    <button 
                        onClick={handlePublishWebData}
                        className="w-full md:w-auto px-6 py-3 bg-brand hover:bg-brand-600 text-white rounded-lg font-bold shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2"
                    >
                        <FileJson className="w-5 h-5" /> Generate events.json
                    </button>
                    <p className="text-xs text-gray-400 mt-2 italic">
                        Upload the downloaded <strong>events.json</strong> file to the same folder as your <strong>index.html</strong> on your web server.
                    </p>
                </section>

                {/* Integration / Embed Section */}
                <section className="bg-white rounded-xl border border-accent/20 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
                        <Code className="w-5 h-5 text-purple-600" /> Website Integration
                    </h3>
                    <p className="text-sm text-grayText mb-4">
                        Host this app on a subdomain (e.g., <code>events.yoursite.com</code>), then copy the code below to embed the calendar into your main website.
                    </p>
                    
                    <div className="relative bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto border border-gray-700">
                        <pre>{getEmbedCode()}</pre>
                        <button 
                            onClick={copyEmbedCode}
                            className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors"
                            title="Copy to Clipboard"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </section>

                {/* Payment Integration */}
                <section className="bg-white rounded-xl border border-accent/20 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-brand" /> Payment Integration
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        {['stripe', 'paypal', 'square', 'crypto', 'venmo'].map((provider) => (
                            <button
                                key={provider}
                                onClick={() => handleChange('paymentProvider', provider as PaymentProvider)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-xs font-medium ${
                                    settings.paymentProvider === provider 
                                    ? 'border-brand bg-brand/5 text-brand' 
                                    : 'border-gray-200 text-gray-400 hover:border-brand/30 hover:bg-white'
                                }`}
                            >
                                {provider.charAt(0).toUpperCase() + provider.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        {settings.paymentProvider === 'none' && <p className="text-sm text-gray-500">Select a provider above to configure.</p>}
                        
                        {(settings.paymentProvider === 'stripe' || settings.paymentProvider === 'square') && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-dark mb-1">Public API Key</label>
                                    <input 
                                        type="text" 
                                        value={settings.paymentConfig.apiKey || ''}
                                        onChange={(e) => handlePaymentConfigChange('apiKey', e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-dark focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                                        placeholder={`pk_test_...`}
                                    />
                                </div>
                            </div>
                        )}

                        {(settings.paymentProvider === 'paypal' || settings.paymentProvider === 'venmo') && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-dark mb-1">Account Email / Username</label>
                                    <input 
                                        type="text" 
                                        value={settings.paymentConfig.email || ''}
                                        onChange={(e) => handlePaymentConfigChange('email', e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-dark focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>
                        )}

                        {settings.paymentProvider === 'crypto' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-dark mb-1">Wallet Address</label>
                                    <input 
                                        type="text" 
                                        value={settings.paymentConfig.walletAddress || ''}
                                        onChange={(e) => handlePaymentConfigChange('walletAddress', e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-dark focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                                        placeholder="0x..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Data Management Section */}
                <section className="bg-white rounded-xl border border-accent/20 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
                        <Save className="w-5 h-5 text-blue-600" /> Local Data Management
                    </h3>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
                         <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                         <p className="text-sm text-amber-800">
                             <strong>Backup:</strong> This app stores data in your browser. If you clear cache or change computers, data will be lost. Export backups regularly.
                         </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <button 
                            onClick={handleDownloadBackup}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-dark py-3 rounded-lg font-medium transition-colors border border-gray-200"
                        >
                            <Download className="w-4 h-4" /> Export Backup
                        </button>
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-dark py-3 rounded-lg font-medium transition-colors border border-gray-200"
                        >
                            <Upload className="w-4 h-4" /> Restore Backup
                        </button>
                        <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef} 
                            onChange={handleRestoreBackup}
                            className="hidden" 
                        />
                    </div>
                </section>

                {/* License Section */}
                <section className="bg-white rounded-xl border border-accent/20 p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" /> License
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <div>
                            <p className="text-emerald-800 font-bold">EventForge Pro Perpetual</p>
                            <p className="text-emerald-600 text-xs mt-1">License Key: EF-PRO-88X2-9901</p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase">Active</span>
                    </div>
                </section>
            </div>
        </div>
    );
}
