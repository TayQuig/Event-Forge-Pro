
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, AppSettings } from '../types';
import { Calendar, MapPin, Clock, Ticket, ArrowRight, Share2, CheckCircle, CalendarPlus, X, Facebook, Twitter, Linkedin, Mail, Link as LinkIcon, Loader2 } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../utils/calendar';
import { PublishService } from '../services/publishService';

interface PublicViewProps {
    events: Event[];
    detailMode?: boolean;
    settings: AppSettings;
}

export const PublicView: React.FC<PublicViewProps> = ({ events, detailMode = false, settings }) => {
    const { id } = useParams();

    if (detailMode && id) {
        const event = events.find(e => e.id === id);
        if (!event) return <div className="min-h-screen flex items-center justify-center text-grayText bg-cream">Event not found</div>;
        return <EventDetailPage event={event} settings={settings} />;
    }

    return (
        <div className="min-h-screen font-sans text-dark" style={{ backgroundColor: settings.brandColor ? `${settings.brandColor}05` : '#FFFBF5' }}>
            {/* Hero / List */}
            <div className="max-w-[1440px] mx-auto px-[66px] py-20">
                <div className="text-center mb-16">
                    <h1 className="text-[48px] md:text-[63px] font-bold leading-tight mb-6 text-brand">Upcoming Events</h1>
                    <p className="text-[18px] text-grayText max-w-2xl mx-auto">Discover transformative energy healing services that restore balance, reduce stress, and promote optimal mental health.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
                    {events.length === 0 ? (
                        <div className="col-span-3 text-center py-20 bg-white rounded-[20px] shadow-container border border-gray-100">
                            <p className="text-grayText text-lg">No public events listed at the moment.</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <Link key={event.id} to={`/public/${event.id}`} className="group relative bg-white/90 backdrop-blur-sm rounded-[20px] overflow-hidden shadow-card hover:shadow-hover hover:-translate-y-2 transition-all duration-500 border border-white/50">
                                <div className="h-64 overflow-hidden relative">
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-sm font-bold shadow-sm text-brand">
                                        ${event.price}
                                    </div>
                                </div>
                                <div className="p-[30px]">
                                    <p className="text-brand font-medium mb-2 uppercase tracking-wider text-sm">
                                        {new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                                    </p>
                                    <h3 className="text-[24px] font-bold text-dark mb-3 line-clamp-2 leading-tight group-hover:text-brand transition-colors">{event.title}</h3>
                                    <div className="flex items-center text-grayText text-sm mb-6">
                                        <MapPin className="w-4 h-4 mr-2 text-brand" /> {event.location}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {event.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-xs bg-brand/5 text-brand px-3 py-1 rounded-full font-medium">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
            
            <div className="py-8 text-center border-t border-brand/5 mt-12">
                <p className="text-sm text-grayText">Powered by <span className="font-bold text-brand">EventForge</span></p>
            </div>
        </div>
    );
};

const EventDetailPage: React.FC<{ event: Event, settings: AppSettings }> = ({ event, settings }) => {
    const [bookingState, setBookingState] = useState<'idle' | 'checkout' | 'redirecting' | 'processing' | 'success'>('idle');
    const [showShare, setShowShare] = useState(false);

    // Check for success/cancel params in URL from Stripe redirect
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) setBookingState('success');
        // if (params.get('canceled')) setBookingState('idle');
    }, []);

    const handleStripeCheckout = async () => {
        if (!event.stripePriceId) {
            alert("Booking not configured for this event (No Price ID).");
            return;
        }
        setBookingState('redirecting');
        try {
            const url = await PublishService.createCheckoutSession(event.stripePriceId, event.id);
            window.location.href = url;
        } catch (e) {
            console.error(e);
            alert("Failed to start checkout.");
            setBookingState('idle');
        }
    };
    
    const handleManualCheckout = () => {
        setBookingState('checkout');
    };
    
    const confirmManualPayment = () => {
        setBookingState('processing');
        setTimeout(() => setBookingState('success'), 2000);
    };

    const calendarUrl = generateGoogleCalendarUrl(event);
    const eventUrl = window.location.href;

    const shareLinks = [
        { name: 'X / Twitter', icon: Twitter, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(eventUrl)}`, color: 'hover:bg-black hover:text-white' },
        { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, color: 'hover:bg-blue-600 hover:text-white' },
        { name: 'LinkedIn', icon: Linkedin, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`, color: 'hover:bg-blue-700 hover:text-white' },
        { name: 'Email', icon: Mail, url: `mailto:?subject=Join me at ${event.title}&body=Check out this event: ${eventUrl}`, color: 'hover:bg-gray-600 hover:text-white' },
    ];

    const copyToClipboard = () => {
        navigator.clipboard.writeText(eventUrl);
        alert('Link copied to clipboard!');
        setShowShare(false);
    };

    return (
        <div className="min-h-screen text-gray-900 font-sans" style={{ backgroundColor: settings.brandColor ? `${settings.brandColor}05` : '#fff' }}>
            <div className="relative h-[60vh] lg:h-[70vh] overflow-hidden">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-brand/20 via-transparent to-black/90" />
                <div className="absolute bottom-0 left-0 w-full p-[30px] md:p-[66px]">
                    <div className="max-w-[1440px] mx-auto">
                        <div className="flex flex-wrap gap-3 mb-6">
                             {event.tags.map(tag => (
                                <span key={tag} className="bg-white/20 backdrop-blur text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/30">{tag}</span>
                            ))}
                        </div>
                        <h1 className="text-[48px] md:text-[64px] font-bold text-white mb-6 leading-[1.1] max-w-4xl">{event.title}</h1>
                        <div className="flex flex-col md:flex-row md:items-center gap-8 text-white/90 text-lg font-medium">
                            <div className="flex items-center gap-3"><Calendar className="w-6 h-6 text-accent-cyan" /> {new Date(event.date).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}</div>
                            <div className="flex items-center gap-3"><Clock className="w-6 h-6 text-accent-cyan" /> {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            <div className="flex items-center gap-3"><MapPin className="w-6 h-6 text-accent-cyan" /> {event.location}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-[30px] md:px-[66px] py-20 grid grid-cols-1 lg:grid-cols-12 gap-[50px]">
                <div className="lg:col-span-8 space-y-12">
                    <section className="prose prose-lg text-grayText max-w-none">
                        <h2 className="text-[32px] font-bold mb-6 text-dark">About this Event</h2>
                        <p className="text-[18px] leading-relaxed whitespace-pre-wrap">{event.description}</p>
                    </section>

                    {event.agenda.length > 0 && (
                        <section>
                            <h2 className="text-[32px] font-bold mb-8 text-dark">Event Schedule</h2>
                            <div className="space-y-4">
                                {event.agenda.map((item, i) => (
                                    <div key={i} className="flex gap-6 p-6 rounded-[20px] bg-white shadow-soft hover:shadow-hover transition-all border border-brand/5 group">
                                        <div className="w-24 flex-shrink-0 font-bold text-right text-brand text-lg pt-1">{item.time}</div>
                                        <div className="border-l-2 border-brand/10 pl-6 group-hover:border-brand transition-colors">
                                            <h4 className="font-bold text-dark text-xl mb-2">{item.title}</h4>
                                            <p className="text-grayText">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-white rounded-[20px] shadow-card border border-brand/10 p-8 sticky top-8">
                        <div className="flex justify-between items-end mb-8 pb-8 border-b border-gray-100">
                            <div>
                                <p className="text-grayText text-sm font-medium uppercase tracking-wider mb-1">Registration</p>
                                <p className="text-sm text-brand font-medium">Limited Availability</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[40px] font-bold text-brand leading-none">${event.price}</span>
                                <span className="text-grayText text-sm block">per person</span>
                            </div>
                        </div>
                        
                        {bookingState === 'success' ? (
                            <div className="bg-emerald-50 text-emerald-800 p-6 rounded-[20px] flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 border border-emerald-100">
                                <CheckCircle className="w-16 h-16 mb-4 text-emerald-600" />
                                <h3 className="font-bold text-xl mb-2">You're Booked!</h3>
                                <p className="text-emerald-700">A confirmation has been sent to your email.</p>
                            </div>
                        ) : bookingState === 'checkout' ? (
                             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <h3 className="font-bold text-dark text-lg">Complete Booking</h3>
                                    <button onClick={() => setBookingState('idle')}><X className="w-5 h-5 text-gray-400 hover:text-dark transition" /></button>
                                </div>
                                <button onClick={confirmManualPayment} className="w-full bg-brand text-white py-3 rounded-pill font-medium hover:bg-brand-900 transition shadow-lg shadow-brand/20">Confirm Registration</button>
                             </div>
                        ) : (
                            <button 
                                onClick={event.stripePriceId ? handleStripeCheckout : handleManualCheckout}
                                disabled={bookingState === 'redirecting'}
                                className="w-full bg-brand hover:bg-brand-900 text-white py-4 rounded-pill font-medium text-lg shadow-lg shadow-brand/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-wait"
                            >
                                {bookingState === 'redirecting' ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Book Your Spot <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        )}

                        <div className="mt-8 space-y-4">
                             <a 
                                href={calendarUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 text-brand hover:text-white bg-brand/5 hover:bg-brand py-3 rounded-pill text-sm font-medium transition-colors border border-brand/10"
                             >
                                <CalendarPlus className="w-4 h-4" /> Add to Calendar
                             </a>

                            <div className="bg-cream rounded-xl p-4 flex justify-between text-sm text-grayText mt-4">
                                <span>Remaining Spots</span>
                                <span className="font-bold text-brand">{event.capacity - event.bookings} of {event.capacity}</span>
                            </div>
                        </div>
                        
                        <div className="relative mt-6 pt-6 border-t border-gray-100">
                            <button 
                                onClick={() => setShowShare(!showShare)}
                                className="w-full flex items-center justify-center gap-2 text-grayText hover:text-brand text-sm font-medium transition-colors group"
                            >
                                <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Share this Event
                            </button>

                            {showShare && (
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-hover border border-gray-100 p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-4 gap-2 mb-3">
                                        {shareLinks.map((link) => (
                                            <a 
                                                key={link.name} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors group text-gray-400 hover:${link.color ? link.color.replace('hover:', '') : 'text-brand'}`}
                                                title={link.name}
                                            >
                                                <link.icon className="w-5 h-5 mb-1" />
                                            </a>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={copyToClipboard}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-xs font-medium text-dark transition-colors"
                                    >
                                        <LinkIcon className="w-3 h-3" /> Copy Link
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-12 text-center bg-white border-t border-gray-100">
                <p className="text-sm text-grayText">Powered by <span className="font-bold text-brand">EventForge</span></p>
            </div>
        </div>
    );
};
