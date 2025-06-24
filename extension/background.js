// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60000;
const API_ENDPOINT = 'http://localhost:5000/store';
const PERSISTENCE_KEY = 'pending_requests';

class MailTrackerBackground {
    constructor() {
        this.failedRequests = new Map();
        this.retryInterval = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            // Load any pending requests from storage
            const loadedRequests = await browser.storage.local.get(PERSISTENCE_KEY);
            if (loadedRequests[PERSISTENCE_KEY]) {
                loadedRequests[PERSISTENCE_KEY].forEach(({id, request, retries}) => {
                    this.failedRequests.set(id, {request, retries});
                });
            }

            // Setup retry interval
            this.retryInterval = setInterval(() => {
                if (this.failedRequests.size > 0) {
                    console.log(`Retrying ${this.failedRequests.size} failed requests...`);
                    this.retryFailedRequests();
                }
            }, RETRY_DELAY_MS);

            // Setup message listener
            browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

            this.initialized = true;
            console.log('Background script initialized');
        } catch (error) {
            console.error('Background script initialization failed:', error);
        }
    }

    async handleMessage(request, sender) {
        try {
            if (request.action === 'storeEmail') {
                console.log('Processing email:', request.id);
                
                if (!request.id || !request.to || !request.trackingUrl) {
                    throw new Error('Invalid email tracking data');
                }
                
                if (!request.timestamp) {
                    request.timestamp = new Date().toISOString();
                }
                
                const response = await this.sendTrackingData(request);
                
                await browser.storage.local.set({
                    [`tracking:${request.id}`]: {
                        url: request.trackingUrl,
                        subject: request.subject || 'No Subject',
                        to: request.to,
                        timestamp: request.timestamp,
                        status: 'sent'
                    }
                });
                
                return { success: true, id: request.id };
            }
            return { success: false, error: 'Unknown action' };
        } catch (error) {
            console.error('Message handler error:', error);
            
            this.failedRequests.set(request.id, {
                request,
                retries: 0
            });
            await this.savePendingRequests();
            
            return { 
                success: false, 
                error: error.message,
                retryScheduled: true
            };
        }
    }

    async sendTrackingData(request, retryCount = 0) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const payload = {
                subject: request.subject,
                to: request.to,
                content: request.content,
                id: request.id,
                trackingUrl: request.trackingUrl,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Extension-Version': '1.1.0'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeout);
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying request ${request.id} (attempt ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS / 3));
                return this.sendTrackingData(request, retryCount + 1);
            }
            throw error;
        }
    }

    async savePendingRequests() {
        const serializable = Array.from(this.failedRequests.entries()).map(
            ([id, {request, retries}]) => ({id, request, retries})
        );
        await browser.storage.local.set({[PERSISTENCE_KEY]: serializable});
    }

    async retryFailedRequests() {
        for (const [id, { request, retries }] of this.failedRequests) {
            try {
                await this.sendTrackingData(request);
                this.failedRequests.delete(id);
                console.log(`Successfully retried request ${id}`);
                
                await browser.storage.local.set({
                    [`tracking:${id}`]: {
                        url: request.trackingUrl,
                        subject: request.subject,
                        to: request.to,
                        timestamp: new Date().toISOString(),
                        status: 'sent'
                    }
                });
            } catch (error) {
                if (retries >= MAX_RETRIES) {
                    console.error(`Max retries reached for request ${id}`);
                    this.failedRequests.delete(id);
                } else {
                    this.failedRequests.set(id, { request, retries: retries + 1 });
                    console.log(`Retry ${retries + 1} failed for request ${id}`);
                }
            }
        }
        
        await this.savePendingRequests();
    }

    cleanup() {
        if (this.retryInterval) {
            clearInterval(this.retryInterval);
        }
        this.savePendingRequests();
    }
}

// Initialize
const mailTracker = new MailTrackerBackground();
mailTracker.initialize();

// Cleanup on suspend
browser.runtime.onSuspend.addListener(() => {
    mailTracker.cleanup();
});