function handleTagInput(event, bookmarkId) {
    // Check if comma was pressed
    if (event.key === ',') {
        const input = event.target;
        const tagText = input.value.trim().replace(',', '');  // Remove the comma and extra spaces

        if (tagText) {
            // Add the tag to the display
            const tagDisplay = document.getElementById(`tags-${bookmarkId}`);
            const newTag = document.createElement('span');
            newTag.className = 'inline-block bg-blue-100 text-blue-700 p-1 mr-2 rounded';
            newTag.textContent = tagText;

            // Add 'x' button to remove tag
            const removeBtn = document.createElement('span');
            removeBtn.className = 'cursor-pointer text-xs text-red-500 remove-tag-btn'; // Add a class for all "X" buttons
            removeBtn.textContent = ' x';
            removeBtn.setAttribute('data-tag-text', tagText); // Set data attribute for tag text
            removeBtn.setAttribute('data-bookmark-id', bookmarkId); // Set data attribute for bookmarkId

            // Attach click event listener to the "X" button
            removeBtn.addEventListener('click', function() {
                // Optionally, add server call here to remove the tag
                removeTag(bookmarkId, tagText, this.parentNode); // Pass the correct bookmarkId and tagText
            });

            newTag.appendChild(removeBtn);

            tagDisplay.appendChild(newTag);

            // Clear the input
            input.value = '';

            // Call to server to add the tag
            fetch(`/add_tag?bookmarkId=${bookmarkId}&tagText=${encodeURIComponent(tagText)}`)
                .then(response => response.json())
                .then(data => {
                    console.log('Tag added:', data);
                    // Handle response
                })
                .catch(error => {
                    console.error('Error adding tag:', error);
                    // Handle error
                });
        }
    }
}

function removeTag(bookmarkId, tagText, element) {

    const actualBookmarkId = element.getAttribute('data-bookmark-id') || bookmarkId;
    // Call to server to remove the tag from the data table
    fetch(`/remove_tag?bookmarkId=${actualBookmarkId}&tagText=${encodeURIComponent(tagText)}`)
            .then(response => response.json())
        .then(data => {
            console.log('Tag removed from data table:', data);

            // Remove the tag element from the display
            element.parentNode.remove();

            // Optionally, call a function to re-fetch and display bookmarks after removal
            fetchAndDisplayBookmarks('');
        })
        .catch(error => {
            console.error('Error removing tag:', error);
        });
}

function fetchAndDisplayBookmarks(tag) {
    fetch(`/filter_bookmarks?tag=${encodeURIComponent(tag)}`)
        .then(response => response.json())
        .then(bookmarks => {
            const tableBody = document.querySelector('tbody');
            tableBody.innerHTML = '';
            bookmarks.forEach(bookmark => {
                const row = document.createElement('tr');
                row.className = 'bg-white border-b';
                const tagsContainer = document.createElement('div');
                tagsContainer.id = `tags-${bookmark.id}`;
                const tagInputContainer = document.createElement('div'); // Container for the input field

                if (bookmark.tags) {
                    bookmark.tags.split(',').forEach(tagText => {
                        const tagElement = createTagElement(tagText.trim(), bookmark.id);
                        tagsContainer.appendChild(tagElement);
                    });
                }

                // Create and append the input field for adding new tags
                const tagInputField = document.createElement('input');
                tagInputField.type = 'text';
                tagInputField.className = 'tag-input p-1 border rounded';
                tagInputField.placeholder = 'Add tags';
                tagInputField.addEventListener('keyup', (event) => handleTagInput(event, bookmark.id));
                tagInputContainer.appendChild(tagInputField);

                // Append the tags and the input field to the tags container
                const combinedTagsContainer = document.createElement('div');
                combinedTagsContainer.appendChild(tagsContainer);
                combinedTagsContainer.appendChild(tagInputContainer);

                row.innerHTML = `
                    <td class="px-4 py-2">${bookmark.url}</td>
                    <td class="px-4 py-2"></td>
                    <td class="px-4 py-2">${bookmark.date}</td>
                `;
                row.children[1].appendChild(combinedTagsContainer); // Add tags and input field to the second cell
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching filtered bookmarks:', error));
}



function createTagElement(tagText, bookmarkId) {
    console.log("Creating tag element for Bookmark ID:", bookmarkId); // Debugging line

    const tagContainer = document.createElement('div');
    tagContainer.className = 'inline-block bg-blue-100 text-blue-700 p-1 mr-2 rounded';

    const tagTextElement = document.createElement('span');
    tagTextElement.textContent = tagText;

    const removeBtn = document.createElement('span');
    removeBtn.className = 'cursor-pointer text-xs text-red-500 remove-tag-btn';
    removeBtn.textContent = ' x';
    removeBtn.dataset.bookmarkId = bookmarkId; // Set the bookmarkId data attribute

    removeBtn.addEventListener('click', function() {
        // Retrieve the bookmarkId from the button's dataset
        const actualBookmarkId = this.dataset.bookmarkId;
        console.log("Removing tag for Bookmark ID:", actualBookmarkId); // Debugging line
        removeTag(actualBookmarkId, tagText, this); // Pass the actualBookmarkId from the button
    });

    tagContainer.appendChild(tagTextElement);
    tagContainer.appendChild(removeBtn);
    return tagContainer;
}



// Debounce function to delay execution
function debounce(func, timeout = 500){
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

// Function to handle input and trigger filtering
function handleTagSearch() {
    const searchValue = document.getElementById('tagSearch').value;
    fetchAndDisplayBookmarks(searchValue);
}

// Attach the debounced event to the input field
document.getElementById('tagSearch').addEventListener('keyup', debounce(handleTagSearch));
