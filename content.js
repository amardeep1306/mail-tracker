
// // console.log("✅ Content script loaded!");

// // browser.storage.sync.get(['trackingEnabled', 'recipientEmail'])
// //   .then((result) => {
// //     if (!result.trackingEnabled) {
// //       console.log("❌ Tracking disabled.");
// //       return;
// //     }

// //     const recipientEmail = result.recipientEmail || '';
// //     if (!recipientEmail.includes('@')) {
// //       console.warn("❌ Invalid or missing recipient email.");
// //       return;
// //     }

// //     const serverHost = 'http://localhost:5000';
// //     let pixelInserted = false;

// //     function insertTrackingPixel() {
// //       const composeBox = document.querySelector('[aria-label="Message Body"]');  // ✅ Works reliably in Gmail

// //       if (composeBox && !pixelInserted && !composeBox.innerHTML.includes(`${serverHost}/track`)) {
// //         const mailId = Date.now();
// //         const pixelUrl = `${serverHost}/track?id=${mailId}`;

// //         const img = document.createElement('img');
// //         img.src = pixelUrl;
// //         img.width = 1;
// //         img.height = 1;
// //         img.style.display = 'none';

// //         composeBox.appendChild(img);
// //         pixelInserted = true;

// //         fetch(`${serverHost}/create_mail?id=${mailId}&email=${encodeURIComponent(recipientEmail)}`)
// //           .then(response => {
// //             if (!response.ok) throw new Error("Server error");
// //             console.log("✅ Mail created on server");
// //           })
// //           .catch(error => {
// //             console.error("❌ Error while saving mail:", error);
// //           });

// //         console.log("✅ Tracking pixel inserted with ID:", mailId);
// //       }
// //     }

// //     setInterval(insertTrackingPixel, 3000);
// //   })
// //   .catch((error) => {
// //     console.error("❌ Error accessing storage:", error);
// //   });
// (function() {
//   // Attach the send-button listener when compose windows appear.
//   function attachSendListener() {
//     console.log("✅ Content script loaded! 1");
//     // Select all Gmail "Send" buttons (aria-label begins with "Send")
//     var sendButtons = document.querySelectorAll('div[aria-label^="Send"]');
//     sendButtons.forEach(function(btn) {
//       if (!btn.hasAttribute('data-tracker-listener')) {
//         console.log("✅ Content script loaded! 2");
//         btn.setAttribute('data-tracker-listener', 'true');
//         btn.addEventListener('click', function() {
//           console.log("✅ Content script loaded! 3");
//           // Delay briefly to let Gmail populate the email content
//           setTimeout(function() {
//             // Locate the email fields in the compose window
//             var subjectElem = document.querySelector('input[name="subjectbox"]');
//             console.log("✅ Content script loaded! 4");
//             var toElem      = document.querySelector('textarea[name="to"]');
//             // The message body is a contenteditable div with aria-label "Message Body":contentReference[oaicite:6]{index=6}:contentReference[oaicite:7]{index=7}
//             var bodyElem    = document.querySelector('div[aria-label="Message Body"]');
//             // Create a unique ID (e.g. timestamp)
//             console.log("✅ Content script loaded! 5");
//             var uniqueId = Date.now();
//             // Inject the tracking pixel image at end of body content
//             if (bodyElem) {
//               var img = document.createElement('img');
//               img.src = 'http://localhost:5000/track?id=' + uniqueId;
//               bodyElem.appendChild(img);
//               console.log("✅ Content script loaded! 6");
//             }
//             // Extract email data
//             var subject = subjectElem ? subjectElem.value : '';
//             var to      = toElem      ? toElem.value      : '';
//             var content = bodyElem    ? bodyElem.innerHTML : '';
//             console.log("✅ Content script loaded! 7");
//             // Send data to the background script for storage
//             browser.runtime.sendMessage({
//               action: 'storeEmail',
//               subject: subject,
              
//               to: to,
//               content: content,
//               id: uniqueId
//             });
//             console.log("✅ Content script loaded! 8");
//           }, 1000);
//         });
//       }
//     });
//   }

//   // Observe the DOM for changes (new compose windows) and attach listeners
//   var observer = new MutationObserver(function() {
//     attachSendListener();
//     console.log("✅ Content script loaded! 9");
//   });
//   observer.observe(document.body, { childList: true, subtree: true });
// })();
// console.log("✅ Content script loaded! 10 final");
// (function () {
//   function attachSendListener() {
//     console.log("✅ Content script loaded! 1");

//     var sendButtons = document.querySelectorAll('div[aria-label^="Send"], div[data-tooltip*="Send"]');
//     sendButtons.forEach(function (btn) {
//       if (!btn.hasAttribute('data-tracker-listener')) {
//         btn.setAttribute('data-tracker-listener', 'true');
//         console.log("✅ Listener attached to Send button");

//         btn.addEventListener('click', function () {
//           setTimeout(function () {
//             console.log("📨 Send button clicked");

//             var subjectElem = document.querySelector('input[name="subjectbox"]');
//             var toElem = document.querySelector('textarea[name="to"]');
//             var bodyElem = document.querySelector('div[aria-label="Message Body"]');

//             if (!bodyElem) {
//               console.warn("❌ Message body not found");
//               return;
//             }

//             const uniqueId = Date.now();

//             // Inject tracking pixel
//             var img = document.createElement('img');
//             img.src = 'https://mail-tracker-production-7e26.up.railway.app/track?id=' + uniqueId;
//             img.width = 1;
//             img.height = 1;
//             img.style.display = 'none';
            
//             bodyElem.appendChild(img);
//             console.log("✅ Tracking pixel inserted with ID:", uniqueId);

//             const subject = subjectElem ? subjectElem.value : '';
//             const to = toElem ? toElem.value : 'to';
//             const content = bodyElem.innerHTML;

//             console.log("📤 Sending email data to background.js");
//             browser.runtime.sendMessage({
//               action: 'storeEmail',
//               subject: subject,
//               to: to,
//               content: content,
//               id: uniqueId
//             });

//           }, 1000); // Delay to let Gmail finalize message
//         });
//       }
//     });
//   }

//   // Observe the Gmail DOM continuously for new compose windows
//   var observer = new MutationObserver(function () {
//     attachSendListener();
//   });
//   observer.observe(document.body, { childList: true, subtree: true });

//   console.log("✅ Content script fully initialized!");
// })();
(function () {
  function attachSendListener() {
    console.log("✅ Content script loaded! 1");

    var sendButtons = document.querySelectorAll('div[aria-label^="Send"], div[data-tooltip*="Send"]');
    sendButtons.forEach(function (btn) {
      if (!btn.hasAttribute('data-tracker-listener')) {
        btn.setAttribute('data-tracker-listener', 'true');
        console.log("✅ Listener attached to Send button");

        btn.addEventListener('click', function () {
          setTimeout(function () {
            console.log("📨 Send button clicked");

            var subjectElem = document.querySelector('input[name="subjectbox"]');
            var bodyElem = document.querySelector('div[aria-label="Message Body"]');

            if (!bodyElem) {
              console.warn("❌ Message body not found");
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
            console.log("✅ Tracking pixel inserted with ID:", uniqueId);

            const subject = subjectElem ? subjectElem.value : '';
            const content = bodyElem.innerHTML;

            // ✅ NOW get recipient email from storage
            browser.storage.sync.get("recipientEmail").then((result) => {
              const to = result.recipientEmail || '';
              console.log("📧 Email from popup:", to);

              if (!to || !to.includes('@')) {
                console.warn("⚠️ Invalid or missing recipient email");
                return;
              }

              // Send to background.js
              console.log("📤 Sending email data to background.js");
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

  console.log("✅ Content script fully initialized!");
})();
