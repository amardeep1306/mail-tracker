
console.log("✅ Content script loaded!");

browser.storage.sync.get(['trackingEnabled', 'recipientEmail'])
  .then((result) => {
    if (!result.trackingEnabled) {
      console.log("❌ Tracking disabled.");
      return;
    }

    const recipientEmail = result.recipientEmail || '';
    if (!recipientEmail.includes('@')) {
      console.warn("❌ Invalid or missing recipient email.");
      return;
    }

    const serverHost = 'http://localhost:5000';
    let pixelInserted = false;

    function insertTrackingPixel() {
      const composeBox = document.querySelector('[aria-label="Message Body"]');  // ✅ Works reliably in Gmail

      if (composeBox && !pixelInserted && !composeBox.innerHTML.includes(`${serverHost}/track`)) {
        const mailId = Date.now();
        const pixelUrl = `${serverHost}/track?id=${mailId}`;

        const img = document.createElement('img');
        img.src = pixelUrl;
        img.width = 1;
        img.height = 1;
        img.style.display = 'none';

        composeBox.appendChild(img);
        pixelInserted = true;

        fetch(`${serverHost}/create_mail?id=${mailId}&email=${encodeURIComponent(recipientEmail)}`)
          .then(response => {
            if (!response.ok) throw new Error("Server error");
            console.log("✅ Mail created on server");
          })
          .catch(error => {
            console.error("❌ Error while saving mail:", error);
          });

        console.log("✅ Tracking pixel inserted with ID:", mailId);
      }
    }

    setInterval(insertTrackingPixel, 3000);
  })
  .catch((error) => {
    console.error("❌ Error accessing storage:", error);
  });
