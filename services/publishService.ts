import { Event, AppSettings, Asset } from '../types';

// Detect environment: Prod (relative path) vs Dev (localhost:3001)
const isDev = import.meta.env.DEV;
const API_URL = isDev ? 'http://localhost:3001/api' : '/api';
const ADMIN_SECRET = 'secret'; // In a real app, this would be user-input or env var

export const PublishService = {
    
    // Helper: Upload a single file
    uploadImage: async (file: Blob | File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ADMIN_SECRET}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        return data.url; // Returns relative path e.g. "/uploads/image-123.jpg"
    },

    // Main Publish Function
    // Returns the array of events as they were saved on the server (including new Stripe IDs)
    publishEvents: async (events: Event[], settings: AppSettings, globalAssets: Asset[]): Promise<Event[]> => {
        // 1. Deep copy events to avoid mutating local state during processing
        const eventsToPublish = JSON.parse(JSON.stringify(events)) as Event[];

        // 2. Process Images
        const findBlobForUrl = async (url: string): Promise<Blob | null> => {
            if (url.startsWith('blob:')) {
                try {
                    const r = await fetch(url);
                    return await r.blob();
                } catch (e) {
                    console.warn("Could not fetch blob:", url);
                    return null;
                }
            }
            return null;
        };

        for (const event of eventsToPublish) {
            // A. Handle Main Cover Image
            if (event.imageUrl && (event.imageUrl.startsWith('blob:') || event.imageUrl.startsWith('data:'))) {
                console.log(`Uploading cover for ${event.title}...`);
                let blob: Blob | null = null;

                if (event.imageUrl.startsWith('data:')) {
                    const res = await fetch(event.imageUrl);
                    blob = await res.blob();
                } else {
                    blob = await findBlobForUrl(event.imageUrl);
                }

                if (blob) {
                    const serverUrl = await PublishService.uploadImage(blob);
                    event.imageUrl = serverUrl;
                }
            }

            // B. Handle Event Assets
            for (const asset of event.assets) {
                if (asset.url && (asset.url.startsWith('blob:') || asset.url.startsWith('data:'))) {
                    const blob = await findBlobForUrl(asset.url);
                    if (blob) {
                        const serverUrl = await PublishService.uploadImage(blob);
                        asset.url = serverUrl;
                    }
                }
            }
        }

        // 3. Send JSON Payload
        const response = await fetch(`${API_URL}/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_SECRET}`
            },
            body: JSON.stringify({ 
                events: eventsToPublish,
                settings: settings 
            })
        });

        if (!response.ok) {
            throw new Error('Failed to publish events manifest');
        }

        const result = await response.json();
        // The server might return the events array with added Stripe IDs
        if (result.events) {
            return result.events;
        }
        return eventsToPublish;
    },

    // Helper to start Checkout
    createCheckoutSession: async (priceId: string, eventId: string): Promise<string> => {
        const response = await fetch(`${API_URL}/checkout`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ priceId, eventId })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.url;
    }
};
