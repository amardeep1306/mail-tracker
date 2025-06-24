(function () {
    const DEBUG = true;
    const SERVER_URL = 'http://127.0.0.1:5000'; // Flask backend
    const TRACKING_DELAY = 1000;
    const MAX_RETRIES = 3;
    let retryCount = 0;

    function log(...args) {
        if (DEBUG) console.log('%c[MailTracker]', 'color: green; font-weight: bold;', ...args);
    }

    function error(...args) {
        console.error('%c[MailTracker]', 'color: red; font-weight: bold;', ...args);
    }

    // ===== Step 1: Detect Compose Window =====
    function findComposeWindow() {
        const selectors = [
            '[role="dialog"][aria-label^="New Message"]',
            '[role="dialog"][aria-label^="Compose"]',
            '.nH.Hd',  // classic
            '.aYF'     // new
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
                log('Compose window found:', sel);
                return el;
            }
        }
        error('Compose window NOT found');
        return null;
    }

    // ===== Step 2: Detect Email Body =====
    function findEmailBody() {
        const compose = findComposeWindow();
        if (!compose) return null;

        const selectors = [
            '[aria-label="Message Body"]',
            '[role="textbox"]',
            'div[contenteditable="true"]',
            '.editable'
        ];

        for (const sel of selectors) {
            const el = compose.querySelector(sel);
            if (el) {
                log('Email body found with selector:', sel);
                return el;
            }
        }
        error('Email body NOT found');
        return null;
    }

    // ===== Step 3: Detect Send Button =====
    function findSendButton() {
        const compose = findComposeWindow();
        if (!compose) return null;

        const selectors = [
            'div[role="button"][aria-label*="Send"]',
            'div[data-tooltip*="Send"]',
            '.T-I.J-J5-Ji.aoO.T-I-atl.L3'
        ];

        for (const sel of selectors) {
            const btn = compose.querySelector(sel);
            if (btn && btn.offsetParent !== null) {
                log('Send button found with selector:', sel);
                return btn;
            }
        }
        error('Send button NOT found');
        return null;
    }

    // ===== Step 4: Get Subject and Recipient =====
   

    async function getEmailDetails() {
    const compose = findComposeWindow();
    if (!compose) return {};

    const subject = compose.querySelector('[name="subjectbox"]')?.value || 'No Subject';

    // Fetch recipient email from extension storage (like in first script)
    const { recipientEmail } = await browser.storage.sync.get('recipientEmail');
    const recipient = recipientEmail || 'unknown@example.com';

    return { subject, recipient };
}



    // ===== Step 5: Insert Pixel =====
    function insertTrackingPixel(url) {
        const body = findEmailBody();
        if (!body) return false;

        // Remove existing
        body.querySelectorAll(`img[src^="${SERVER_URL}/track"]`).forEach(e => e.remove());

        const div = document.createElement('div');
        div.innerHTML = `
            <div style="
                width: 120px;
                height: 120px;
                background: red;
                color: white;
                font-weight: bold;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 2px dashed black;
                margin: 10px;
                position: relative;
            ">
                TRACKING PIXEL
                <img src="${url}" width="1" height="1" style="position: absolute; opacity: 0;">
            </div>
        `;

        body.appendChild(div.cloneNode(true));
        log('Tracking pixel inserted:', url);
        return true;
    }

    // ===== Step 6: Send Data to Background Script =====
    async function trackEmail() {
        const { subject, recipient } = await getEmailDetails();
        const id = `track-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const trackingUrl = `${SERVER_URL}/track?id=${id}`;
        const bodyContent = findEmailBody()?.innerText || '';

        if (!insertTrackingPixel(trackingUrl)) {
            error('Pixel insertion failed');
            return;
        }

        const message = {
            action: 'storeEmail',
            subject,
            to: recipient,
            content: bodyContent,
            id,
            trackingUrl
        };

        log('Sending message to background:', message);

        const res = await browser.runtime.sendMessage(message).catch(e => {
            error('Error sending to background:', e);
            return { success: false };
        });

        if (res?.success) {
            log('Tracking success for', id);
        } else {
            error('Tracking failed:', res?.error);
        }
    }

    // ===== Step 7: Set Up Listener =====
    function setupListener() {
        const btn = findSendButton();
        if (!btn) {
            if (retryCount++ < MAX_RETRIES) {
                log(`Retrying to find send button (${retryCount})...`);
                return setTimeout(setupListener, 1000);
            }
            return error('Send button not found after retries');
        }

        if (btn._mailTrackerAttached) return;
        btn._mailTrackerAttached = true;

        btn.addEventListener('click', () => {
            log('Send button clicked, initiating tracking...');
            setTimeout(trackEmail, TRACKING_DELAY);
        });

        log('Send button listener attached');
    }

    // ===== Step 8: Observe DOM for Compose Window =====
    const observer = new MutationObserver(() => {
        const compose = findComposeWindow();
        if (compose) setupListener();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial Trigger
    window.addEventListener('load', () => {
        log('MailTracker script loaded');
        setupListener();
    });
})();
