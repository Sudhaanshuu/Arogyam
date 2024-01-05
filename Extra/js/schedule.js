// Get form elements
const form = document.querySelector('form');
const nameInput = document.getElementById('meetingName');
const idInput = document.getElementById('meetingId');
const dateInput = document.getElementById('meetingDate');
const timeInput = document.getElementById('meetingTime');

// Handle submit
form.addEventListener('submit', e => {

    // Get values
    const name = nameInput.value;
    const id = idInput.value;
    const date = dateInput.value;
    const time = timeInput.value;

    // Validate 
    if (!name || !id || !date || !time) {
        alert('Enter details');
        return;
    }

    // Add meeting element
    const meetings = document.querySelector('.meetings-container');

    const meeting = document.createElement('div');
    meeting.classList.add('meeting-item');

    // Add meeting details   
    meeting.innerHTML = `
    <strong>${name}</strong>
    <p>ID: ${id}</p>
    <p>${date} at ${time}</p>
  `;

    // Create join button
    const joinButton = document.createElement('button');
    joinButton.textContent = 'Join Meeting';

    // Make button link to lobby
    joinButton.addEventListener('click', () => {
        window.location.href = 'lobby.html';
    });

    // Add button to meeting   
    meeting.appendChild(joinButton);

    meetings.appendChild(meeting);

    // Clear form
    form.reset();

    e.preventDefault();
});