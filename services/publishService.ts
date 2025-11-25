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
    publishEvents: async (events: Event[], settings: AppSettings, globalAssets: Asset[]): Promise<void> => {
        // 1. Deep copy events to avoid mutating local state during processing
        const eventsToPublish = JSON.parse(JSON.stringify(events)) as Event[];

        // 2. Process Images
        // We need to find any "blob:" URLs or Base64 strings and convert them to server paths
        // We'll look at 'imageUrl' on events and 'url' on assets
        
        // Helper to find the Blob for a given URL
        const findBlobForUrl = async (url: string): Promise<Blob | null> => {
            // If it's a blob URL, we can likely fetch it directly
            if (url.startsWith('blob:')) {
                try {
                    const r = await fetch(url);
                    return await r.blob();
                } catch (e) {
                    console.warn("Could not fetch blob:", url);
                    return null;
                }
            }
            // If we had the globalAssets array passed in, we could also look up by ID
            return null;
        };

        for (const event of eventsToPublish) {
            // A. Handle Main Cover Image
            if (event.imageUrl && (event.imageUrl.startsWith('blob:') || event.imageUrl.startsWith('data:'))) {
                console.log(`Uploading cover for ${event.title}...`);
                let blob: Blob | null = null;

                if (event.imageUrl.startsWith('data:')) {
                    // Convert Base64 to Blob
                    const res = await fetch(event.imageUrl);
                    blob = await res.blob();
                } else {
                    blob = await findBlobForUrl(event.imageUrl);
                }

                if (blob) {
                    const serverUrl = await PublishService.uploadImage(blob);
                    event.imageUrl = serverUrl; // Update to server path
                }
            }

            // B. Handle Event Assets
            for (const asset of event.assets) {
                if (asset.url && (asset.url.startsWith('blob:') || asset.url.startsWith('data:'))) {
                    console.log(`Uploading asset ${asset.name}...`);
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
    }
};
