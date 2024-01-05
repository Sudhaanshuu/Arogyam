// /*
// * Green Coders Hackathon Project 
// * C.V. Raman Global University, Bhubaneswar, Odisha, India
// * 
// * Copyright 2024 Sudhanshu Kumar 
// * 
// * Licensed under the Apache License, Version 2.0 (the "License");
// * you may not use this file except in compliance with the License.
// * You may obtain a copy of the License at
// * 
// *    http://www.apache.org/licenses/LICENSE-2.0
// * 
// * Unless required by applicable law or agreed to in writing, software
// * distributed under the License is distributed on an "AS IS" BASIS,
// * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// * See the License for the specific language governing permissions and
// * limitations under the License.
// */

//
const form = document.querySelector('form');
const nameInput = document.getElementById('meetingName');
const idInput = document.getElementById('meetingId');
const dateInput = document.getElementById('meetingDate');
const timeInput = document.getElementById('meetingTime');

form.addEventListener('submit', e => {

    const name = nameInput.value;
    const id = idInput.value;
    const date = dateInput.value;
    const time = timeInput.value;

    if (!name || !id || !date || !time) {
        alert('Enter details');
        return;
    }

    const meetings = document.querySelector('.meetings-container');

    const meeting = document.createElement('div');
    meeting.classList.add('meeting-item');

    meeting.innerHTML = `
    <strong>${name}</strong>
    <p>ID: ${id}</p>
    <p>${date} at ${time}</p>
  `;

    const joinButton = document.createElement('button');
    joinButton.textContent = 'Join Meeting';

    joinButton.addEventListener('click', () => {
        window.location.href = 'lobby.html';
    });

    meeting.appendChild(joinButton);

    meetings.appendChild(meeting);

    form.reset();

    e.preventDefault();
});