/*
 * Green Coders Hackathon Project 
 * C.V. Raman Global University, Bhubaneswar, Odisha, India
 * 
 * Copyright 2024 Sudhanshu Kumar 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let form = document.getElementById('lobby__form')

let displayName = sessionStorage.getItem('display_name')
if (displayName) {
    form.name.value = displayName
}

form.addEventListener('submit', (e) => {
    e.preventDefault()

    sessionStorage.setItem('display_name', e.target.name.value)

    let inviteCode = e.target.room.value
    if (!inviteCode) {
        inviteCode = String(Math.floor(Math.random() * 10000))
    }
    window.location = `room.html?room=${inviteCode}`
})