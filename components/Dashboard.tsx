
import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { Edit2, Trash2, Eye, Calendar, Users, DollarSign, BarChart3, ExternalLink } from 'lucide-react';

interface DashboardProps {
    events: Event[];
    onDelete: (id: string) => void;
    isVisitor?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ events, onDelete, isVisitor }) => {
    const totalRevenue = events.reduce((acc, curr) => acc + (curr.bookings * curr.price), 0);
    const totalAttendees = events.reduce((acc, curr) => acc + curr.bookings, 0);

    if (isVisitor) {
        return (
            <div className="p-8 h-full bg-cream flex items-center justify-center flex-col text-center">
                <h2 className="text-2xl font-bold text-brand mb-2">Visitor Mode</h2>
                <p className="text-grayText mb-4">You are viewing the site using the published 'events.json'.</p>
                <Link to="/public" className="bg-brand text-white px-6 py-2 rounded-lg">Go to Public Site</Link>
            </div>
        )
    }

    return (
        <div className="p-8 h-full overflow-y-auto bg-cream">
            <header className="mb-8 flex justify-between items-end border-b border-accent/20 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-brand mb-2">Dashboard</h2>
                    <p className="text-grayText">Manage your events and monitor performance.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-xl border border-accent/20 flex items-center gap-3 shadow-sm">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-grayText uppercase font-semibold">Revenue</p>
                            <p className="text-xl font-bold text-dark">${totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-accent/20 flex items-center gap-3 shadow-sm">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Users className="w-6 h-6 text-brand" />
                        </div>
                        <div>
                            <p className="text-xs text-grayText uppercase font-semibold">Bookings</p>
                            <p className="text-xl font-bold text-dark">{totalAttendees}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Events Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map(event => (
                    <div key={event.id} className="group bg-white rounded-xl border border-accent/20 overflow-hidden hover:border-brand/50 transition-all duration-300 shadow-sm hover:shadow-lg">
                        <Link to={`/edit/${event.id}`}>
                            <div className="h-40 bg-gray-200 relative overflow-hidden cursor-pointer">
                                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide backdrop-blur-sm shadow-sm ${
                                        event.status === 'published' ? 'bg-emerald-100/90 text-emerald-700' : 
                                        event.status === 'draft' ? 'bg-amber-100/90 text-amber-700' :
                                        'bg-gray-100/90 text-gray-600'
                                    }`}>
                                        {event.status}
                                    </span>
                                </div>
                            </div>
                        </Link>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <Link to={`/edit/${event.id}`} className="hover:text-brand transition-colors">
                                    <h3 className="text-lg font-bold text-dark line-clamp-1">{event.title}</h3>
                                </Link>
                            </div>
                            <div className="flex items-center text-grayText text-sm mb-4 gap-4">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(event.date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.bookings}/{event.capacity}</span>
                            </div>
                            
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                <Link to={`/edit/${event.id}`} className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-dark border border-gray-200 py-2 rounded-lg text-sm font-medium transition-colors">
                                    <Edit2 className="w-4 h-4" /> Edit
                                </Link>
                                <button onClick={() => onDelete(event.id)} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <Link to={`/public/${event.id}`} target="_blank" className="px-3 py-2 bg-brand text-white rounded-lg transition-colors hover:bg-brand-600 shadow-sm shadow-brand/20" title="View Public Page">
                                    <Eye className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Add New Card */}
                <Link to="/new" className="flex flex-col items-center justify-center h-[340px] bg-white/50 border-2 border-dashed border-accent/30 rounded-xl hover:border-brand/50 hover:bg-white transition-all group cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-accent/10 group-hover:bg-brand/10 flex items-center justify-center mb-4 transition-colors">
                        <div className="text-accent group-hover:text-brand text-4xl font-light">+</div>
                    </div>
                    <p className="text-grayText font-medium group-hover:text-brand">Create New Event</p>
                </Link>
            </div>
        </div>
    );
};
