
(function () {
  function attachSendListener() {
    console.log(" Content script loaded! 1");

    var sendButtons = document.querySelectorAll('div[aria-label^="Send"], div[data-tooltip*="Send"]');
    sendButtons.forEach(function (btn) {
      if (!btn.hasAttribute('data-tracker-listener')) {
        btn.setAttribute('data-tracker-listener', 'true');
        console.log(" Listener attached to Send button");

        btn.addEventListener('click', function () {
          setTimeout(function () {
            console.log(" Send button clicked");

            var subjectElem = document.querySelector('input[name="subjectbox"]');
            var bodyElem = document.querySelector('div[aria-label="Message Body"]');

            if (!bodyElem) {
              console.warn(" Message body not found");
              return;
            }

            const uniqueId = Date.now();

            // Inject tracking pixel
            var img = document.createElement('img');
            img.src = 'https://mail-tracker-production-7e26.up.railway.app/track?id=' + uniqueId;
            img.width = 50;
            img.height = 50;
            img.style.display = 'inline-block';
            img.style.border = '2px solid red';
            img.style.backgroundColor = 'yellow';
            bodyElem.appendChild(img);
            console.log(img.src)
            console.log(" Tracking pixel inserted with ID:", uniqueId);

            const subject = subjectElem ? subjectElem.value : '';
            const content = bodyElem.innerHTML;

            //  NOW get recipient email from storage
            browser.storage.sync.get("recipientEmail").then((result) => {
              const to = result.recipientEmail || '';
              console.log(" Email from popup:", to);

              if (!to || !to.includes('@')) {
                console.warn(" Invalid or missing recipient email");
                return;
              }

              // Send to background.js
              console.log(" Sending email data to background.js");
              browser.runtime.sendMessage({
                action: 'storeEmail',
                subject: subject,
                to: to,
                content: content,
                id: uniqueId
              });
            });

          }, 1000); // wait for Gmail to populate content
        });
      }
    });
  }

  var observer = new MutationObserver(function () {
    attachSendListener();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  console.log(" Content script fully initialized!");
})();
