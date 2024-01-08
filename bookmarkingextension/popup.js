console.log("Popup script loaded and running");

document.addEventListener('DOMContentLoaded', function() {
    var bookmarkBtn = document.getElementById('bookmarkBtn');
    bookmarkBtn.addEventListener('click', function() {
        // Get the current tab
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            let tab = tabs[0];

            // Ensure the tab URL is valid for bookmarking.
            if (!tab.url.startsWith("http") && !tab.url.startsWith("https")) {
                console.log("Not a valid URL to bookmark:", tab.url);
                updateMessage("Not a valid URL to bookmark.", "red");
                return;
            }

            // Prepare the data for the POST request.
            var data = JSON.stringify({
                url: tab.url,
                date: new Date().toISOString()
            });

            // Perform the fetch request to the Flask server.
            fetch('http://localhost:5000/bookmark', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                return response.json();
            })
            .then(data => {
                updateMessage("Page bookmarked successfully!", "green");
            })
            .catch((error) => {
                console.error('Error:', error);
                updateMessage("Failed to bookmark the page.", "red");
            });
        });
    }, false);

    function updateMessage(text, color) {
        var messageDiv = document.getElementById('message');
        messageDiv.textContent = text;
        messageDiv.style.color = color;
    }
}, false);
