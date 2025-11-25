
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, AppSettings } from '../types';
import { Calendar, MapPin, Clock, Ticket, ArrowRight, Share2, CheckCircle, CalendarPlus, X, Facebook, Twitter, Linkedin, Mail, Link as LinkIcon } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../utils/calendar';

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
        <div className="min-h-screen bg-cream text-dark font-sans">
            {/* Public Navigation */}
            <nav className="bg-white border-b border-accent/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="font-bold text-2xl text-brand tracking-tight">EventForge</div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm text-grayText hover:text-brand font-medium">Organizer Login</Link>
                    </div>
                </div>
            </nav>

            {/* Hero / List */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-extrabold text-brand mb-2">Upcoming Events</h1>
                <p className="text-lg text-grayText mb-12">Discover and book unique experiences.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.length === 0 ? (
                        <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-accent/20 shadow-sm">
                            <p className="text-gray-400">No public events listed at the moment.</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <Link key={event.id} to={`/public/${event.id}`} className="group bg-white rounded-2xl overflow-hidden border border-accent/20 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="h-48 overflow-hidden bg-gray-200 relative">
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-brand shadow-sm">
                                        ${event.price}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-brand text-sm font-semibold mb-2 uppercase tracking-wide">
                                        {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                    <h3 className="text-xl font-bold text-dark mb-2 line-clamp-2 group-hover:text-brand transition-colors">{event.title}</h3>
                                    <div className="flex items-center text-grayText text-sm mb-4">
                                        <MapPin className="w-4 h-4 mr-1" /> {event.location}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {event.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const EventDetailPage: React.FC<{ event: Event, settings: AppSettings }> = ({ event, settings }) => {
    const [bookingState, setBookingState] = useState<'idle' | 'checkout' | 'processing' | 'success'>('idle');
    const [showShare, setShowShare] = useState(false);

    const handleCheckout = () => {
        setBookingState('checkout');
    };
    
    const confirmPayment = () => {
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
        <div className="min-h-screen bg-cream text-dark">
            <div className="relative h-[50vh] bg-dark">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-wrap gap-2 mb-4">
                             {event.tags.map(tag => (
                                <span key={tag} className="bg-brand text-white px-3 py-1 rounded-full text-sm font-medium">{tag}</span>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">{event.title}</h1>
                        <div className="flex flex-col md:flex-row md:items-center gap-6 text-gray-300 text-lg">
                            <div className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {event.location}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-brand">About this Event</h2>
                        <p className="text-grayText leading-relaxed whitespace-pre-wrap text-lg">{event.description}</p>
                    </section>

                    {event.agenda.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-6 text-brand">Agenda</h2>
                            <div className="space-y-4">
                                {event.agenda.map((item, i) => (
                                    <div key={i} className="flex gap-6 p-4 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-accent/20">
                                        <div className="w-24 flex-shrink-0 font-bold text-accent text-right">{item.time}</div>
                                        <div>
                                            <h4 className="font-bold text-dark text-lg">{item.title}</h4>
                                            <p className="text-grayText mt-1">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-xl shadow-brand/5 border border-accent/20 p-6 sticky top-24">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-grayText font-medium">Price per person</span>
                            <span className="text-3xl font-bold text-brand">${event.price}</span>
                        </div>
                        
                        {bookingState === 'success' ? (
                            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300 border border-emerald-100">
                                <CheckCircle className="w-12 h-12 mb-2 text-emerald-600" />
                                <h3 className="font-bold text-lg">You're Booked!</h3>
                                <p className="text-sm">Check your email for the ticket.</p>
                            </div>
                        ) : bookingState === 'checkout' ? (
                             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                    <h3 className="font-bold text-dark">Checkout</h3>
                                    <button onClick={() => setBookingState('idle')}><X className="w-4 h-4 text-gray-400" /></button>
                                </div>
                                
                                {settings.paymentProvider === 'none' && (
                                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded">No payment provider configured by organizer.</p>
                                )}

                                {(settings.paymentProvider === 'stripe' || settings.paymentProvider === 'square') && (
                                    <div className="space-y-3">
                                        <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Card Number" />
                                        <div className="flex gap-2">
                                            <input className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm" placeholder="MM/YY" />
                                            <input className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm" placeholder="CVC" />
                                        </div>
                                        <button onClick={confirmPayment} className="w-full bg-brand text-white py-2 rounded font-bold hover:bg-brand-900 transition">Pay ${event.price}</button>
                                    </div>
                                )}

                                {(settings.paymentProvider === 'paypal' || settings.paymentProvider === 'venmo') && (
                                    <div className="text-center space-y-3">
                                        <p className="text-sm text-grayText">Pay to: <span className="font-mono bg-gray-100 px-1 rounded">{settings.paymentConfig.email}</span></p>
                                        <button onClick={confirmPayment} className="w-full bg-[#00457C] text-white py-2 rounded font-bold hover:opacity-90 transition">
                                            Pay with {settings.paymentProvider === 'paypal' ? 'PayPal' : 'Venmo'}
                                        </button>
                                    </div>
                                )}

                                {settings.paymentProvider === 'crypto' && (
                                    <div className="text-center space-y-3">
                                        <p className="text-xs text-grayText">Send {event.price} USD equivalent to:</p>
                                        <div className="bg-gray-100 p-2 rounded text-xs break-all font-mono text-dark select-all">
                                            {settings.paymentConfig.walletAddress || '0x000...'}
                                        </div>
                                        <button onClick={confirmPayment} className="w-full bg-orange-500 text-white py-2 rounded font-bold hover:bg-orange-600 transition">
                                            I Have Sent Payment
                                        </button>
                                    </div>
                                )}
                             </div>
                        ) : (
                            <button 
                                onClick={handleCheckout}
                                className="w-full bg-brand hover:bg-brand-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Get Tickets <ArrowRight className="w-5 h-5" />
                            </button>
                        )}

                        <div className="mt-6 space-y-3 pt-6 border-t border-gray-100">
                             <a 
                                href={calendarUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 text-brand hover:text-brand-900 bg-brand/5 hover:bg-brand/10 py-3 rounded-lg text-sm font-medium transition-colors"
                             >
                                <CalendarPlus className="w-4 h-4" /> Add to Calendar
                             </a>

                            <div className="flex justify-between text-sm text-grayText pt-2">
                                <span>Capacity</span>
                                <span className="font-medium">{event.capacity} spots</span>
                            </div>
                             <div className="flex justify-between text-sm text-grayText">
                                <span>Remaining</span>
                                <span className="font-medium">{event.capacity - event.bookings} spots</span>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setShowShare(!showShare)}
                                className="w-full mt-4 flex items-center justify-center gap-2 text-gray-400 hover:text-dark text-sm font-medium transition-colors"
                            >
                                <Share2 className="w-4 h-4" /> Share Event
                            </button>

                            {/* Share Modal/Dropdown */}
                            {showShare && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-4 gap-2 mb-3">
                                        {shareLinks.map((link) => (
                                            <a 
                                                key={link.name} 
                                                href={link.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors group text-gray-500 ${link.color}`}
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
        </div>
    );
};
