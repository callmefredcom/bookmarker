function handleTagInput(event, bookmarkId) {
    // Check if comma was pressed
    if (event.key === ',') {
        const input = event.target;
        const tagText = input.value.trim().replace(',', '');  // Remove the comma and extra spaces

        if (tagText) {
            // Add the tag to the display for both table and card views
            const tagsDisplays = document.querySelectorAll(`#tags-${bookmarkId}`);
            tagsDisplays.forEach(tagDisplay => {
                const newTag = createTagElement(tagText, bookmarkId);
                tagDisplay.appendChild(newTag);
            });

            // Clear the input
            input.value = '';

            // Call to server to add the tag
            fetch(`/add_tag?bookmarkId=${bookmarkId}&tagText=${encodeURIComponent(tagText)}`)
                .then(response => response.json())
                .then(data => {
                    console.log('Tag added:', data);
                    // Optionally, refresh the bookmarks to show the new tag
                    fetchAndDisplayBookmarks(''); // or use the current search value
                })
                .catch(error => {
                    console.error('Error adding tag:', error);
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
            const cardsContainer = document.querySelector('#cardsContainer');
            tableBody.innerHTML = '';
            cardsContainer.innerHTML = ''; // Clear previous content

            bookmarks.forEach(bookmark => {
                // Ensure tags is an array or split it from a string
                let tagsArray = Array.isArray(bookmark.tags) ? bookmark.tags : (bookmark.tags ? bookmark.tags.split(',') : []);

                // Create elements for both table and card views
                const row = createTableRow(bookmark, tagsArray);
                const card = createCard(bookmark, tagsArray);

                // Append new elements to their respective containers
                tableBody.appendChild(row);
                cardsContainer.appendChild(card);
            });
        })
        .catch(error => console.error('Error fetching filtered bookmarks:', error));
}



function createTableRow(bookmark, tagsArray) {
    let row = document.createElement('tr');
    row.className = 'bg-white border-b';

    // Create and append the delete icon cell
    const deleteIconCell = document.createElement('td');
    deleteIconCell.className = 'px-4 py-2';
    deleteIconCell.innerHTML = `<span class="cursor-pointer delete-icon" onclick="confirmDeletion(${bookmark.id})">🗑️</span>`;
    row.appendChild(deleteIconCell);

    // Create and append the URL cell
    const urlCell = document.createElement('td');
    urlCell.className = 'px-4 py-2';
    urlCell.innerHTML = `<a href="${bookmark.url}" target="_blank" class="text-blue-500 hover:text-blue-700">${bookmark.url}</a>`;
    row.appendChild(urlCell);

  // Create and append the tags cell
  const tagsCell = document.createElement('td');
  tagsCell.className = 'px-4 py-2';
  const tagsContainer = document.createElement('div');
  tagsContainer.id = `tags-${bookmark.id}`;
  tagsArray.forEach(tagText => {
      const tagElement = createTagElement(tagText.trim(), bookmark.id);
      tagsContainer.appendChild(tagElement);
  });
  const tagInputField = document.createElement('input');
  tagInputField.type = 'text';
  tagInputField.className = 'tag-input p-1 border rounded';
  tagInputField.placeholder = 'Add tags';
  tagInputField.addEventListener('keyup', (event) => handleTagInput(event, bookmark.id));
  tagsContainer.appendChild(tagInputField);
  tagsCell.appendChild(tagsContainer);
  row.appendChild(tagsCell);

    // Create and append the date cell
    const dateCell = document.createElement('td');
    dateCell.className = 'px-4 py-2';
    dateCell.textContent = bookmark.date;
    row.appendChild(dateCell);

    return row;
}


function createCard(bookmark, tagsArray) {
    let card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-lg shadow mb-4 sm:hidden';

    // Create the top part of the card with the URL and delete icon
    const topPart = document.createElement('div');
    topPart.className = 'flex items-center justify-between mb-3';
    const urlLink = document.createElement('a');
    urlLink.setAttribute('href', bookmark.url);
    urlLink.setAttribute('target', '_blank');
    urlLink.className = 'text-blue-500 hover:text-blue-700';
    urlLink.textContent = bookmark.url;
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'cursor-pointer delete-icon';
    deleteIcon.innerHTML = '🗑️';
    deleteIcon.onclick = function() { confirmDeletion(bookmark.id); };
    topPart.appendChild(urlLink);
    topPart.appendChild(deleteIcon);

    // Create the container for tags and input field
    const cardContent = document.createElement('div');
    cardContent.className = 'mb-2';
    const tagsContainer = document.createElement('div');
    tagsContainer.id = `tags-${bookmark.id}`;
    tagsContainer.className = 'flex flex-wrap';
    tagsArray.forEach(tagText => {
        const tagElement = createTagElement(tagText.trim(), bookmark.id);
        tagsContainer.appendChild(tagElement);
    });

    const tagInputField = document.createElement('input');
    tagInputField.type = 'text';
    tagInputField.className = 'tag-input p-1 border rounded w-full mt-2'; // Add the mt-2 class for top margin
    tagInputField.placeholder = 'Add tags';
    tagInputField.addEventListener('keyup', (event) => handleTagInput(event, bookmark.id));
    tagsContainer.appendChild(tagInputField);
    cardContent.appendChild(tagsContainer);

    
    // Assemble the card
    card.appendChild(topPart);
    card.appendChild(cardContent);
    
    return card;
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

function confirmDeletion(bookmarkId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/delete_bookmark?bookmarkId=${bookmarkId}`, {
                method: 'DELETE', // Use DELETE method
            })
            .then(response => {
                // Check if the response was okay
                if (!response.ok) {
                    throw new Error(`Network response was not ok, status: ${response.status}`);
                }
                // Read the response as text first to check if it is valid JSON
                return response.text();
            })
            .then(text => {
                try {
                    // Try to parse it as JSON
                    const data = JSON.parse(text);
                    console.log('Bookmark deleted:', data);
                    Swal.fire(
                        'Deleted!',
                        'Your bookmark has been deleted.',
                        'success'
                    );
                    // Refresh the page or remove the row from the table
                    location.reload(); // Simplest approach
                } catch (err) {
                    // If it's not valid JSON, throw an error
                    throw new Error(`Response was not valid JSON: ${text}`);
                }
            })
            .catch(error => {
                // Handle any errors from the fetch or parsing
                console.error('Error deleting bookmark:', error);
                Swal.fire(
                    'Error!',
                    'There was an error deleting the bookmark.',
                    'error'
                );
            });
        }
    });
}

