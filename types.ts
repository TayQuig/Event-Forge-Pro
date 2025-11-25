
export interface AgendaItem {
    time: string;
    title: string;
    description: string;
}

export interface Asset {
    id: string;
    type: 'image' | 'video' | 'audio' | 'document';
    name: string;
    url: string; // For remote URLs or Blob Object URLs
    size?: string;
    blob?: Blob; // For local storage
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string; // ISO String
    location: string;
    capacity: number;
    bookings: number;
    price: number;
    imageUrl: string;
    status: 'draft' | 'published' | 'past';
    tags: string[];
    agenda: AgendaItem[];
    assets: Asset[]; // Local assets specific to this event
}

export type PaymentProvider = 'stripe' | 'square' | 'paypal' | 'venmo' | 'crypto' | 'none';

export interface AppSettings {
    id: string; // usually 'global'
    brandColor: string;
    paymentProvider: PaymentProvider;
    paymentConfig: {
        apiKey?: string; // Stripe/Square Public Key
        email?: string; // PayPal/Venmo Email
        walletAddress?: string; // Crypto Wallet
        currency?: string;
    };
}

export interface GeminiGenConfig {
    temperature?: number;
    topK?: number;
    topP?: number;
}
