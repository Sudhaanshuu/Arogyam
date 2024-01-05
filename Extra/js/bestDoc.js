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
function showDoctors() {

    let city = document.getElementById("city").value;

    let text = "";

    switch (city.toLowerCase()) {

        case "delhi":

            text = `
          <h4>Delhi</h4> 
          <p>Dr. Sanjay Gupta</p>
          <p>Dr. Pankaj Mathur</p>  
          <p>Dr. Anjali Dutta</p>`;

            break;

        case "mumbai":

            text = `
          <h4>Mumbai</h4>
          <p>Dr. Rohan Shah</p>
          <p>Dr. Anuja Joshi</p>
          <p>Dr. Sriram Iyer</p>`;

            break;
        case "puri":

            text = `
          <h4>Puri</h4>
          <p>Dr. Rohan Shah</p>
          <p>Dr. Anuja Joshi</p>
          <p>Dr. Sriram Iyer</p>`;

            break;

        default:

            const doctors = [
                "Dr. Jennifer Collins, MD",
                "Dr. Arthur Lubitz, MD",
                "Dr. Norman Greeley, MD",
                "Dr. Shradha Agarwal, MD",
                "Dr. Sebastian Lighvani, MD",
                "Diem Truong, LAc, MSTOM",
                "Monique Rivera, LAc",
                "Ronald Pratt, LAc, DiplAc, MA, MSAc",
                "Daniel Camburn, LAc",
                "Deborah Barbiere, LAc, MSTOM, PsyD",
                "Miguel Maya, MSTOM, LAc",
                "Elizabeth Healy, LAc",
                "Irina Logman, LAc, DACM",
                "Han Jun, LAc",
                "Michiko Yoshifuji, DiplAc, LAc",
                "Maiko Hattori, LAc",
                "Diem Truong, LAc, MSTOM",
                "Jennifer Beltrani, LAc",
                "Dr. Jimo (Timothy) Kang, LAc, PhD",
                "Dr. Jimo (Timothy) Kang, LAc, PhD",
                "Dr. Brandon Cooper, DC, LAc, DiplAc",
                "Timothy Klemt, LAc, DACM",
                "Ji Sung Kim, LAc",
                "Kirsten Manges, LAc",
                "Jing Jiang, LAc",
                "Diem Truong, LAc, MSTOM",
                "Kirsten Manges, LAc",
                "Jing Jiang, LAc",
                "Dr. Ai Lee, PhD",
                "Erin Lee, LAc, DACM",
                "Jonathan Simon, LAc",
                "Tammy Huang, MSTOM, LAc",
                "Dong Hwan Lee, LAc",
                "Jodi Gentili, LAc",
                "Boris Bernadsky, LAc, LMT",
                "Xinyu (Allison) Cheng, LAc",
                "Qian Li, LAc",
                "Anna Hajosi, LAc, MSAc",
                "Deborah Valentin, LAc, MS",
                "Ki Yin Cheng, LAc",
                "Qi Yu, LAc",
                "Dr. Brandon Cooper, DC, LAc, DiplAc",
                "Lisa Sumption, LAc",
                "Youngsoo Oh, PT",
                "Enensaauas Rastrygina, DAc, LAc, LMT",
                "Diem Truong, LAc, MSTOM",
                "Samantha Hewwing, LAc, DACM",
                "Flora Luyando, LAc",
                "Yuji Kim, LAc",
                "Zhiwen Zhong, LAc, DACM, MSTCM",
                "Lida Ahmady, LAc",
                "Maya Kron, LAc",
                "Yoko Kuo, LAc",
                "Heeock Lee, LAc",
                "Itorye Silver, LAc",
                "Julie Cho, DAOM, LAc, MSTOM",
                "Frank Muscara, LAc, DACM",
                "Yang Yang Zucco, LAc",
                "Kelsey Tangel, DACM",
                "Joelle Ludwig, LAc",
                "Joannie Campuzano, LAc",
                "Joyce Lilly, DAc, LAc",
                "Li Ting Lin, LAc",
                "Philip Trigiani, LAc, DAc",
                "Connie Qian, LAc",
                "Diem Truong, LAc, MSTOM",
                "Douglas Freeman, LAc, MS",
                "Amy Woodstock, LAc",
                "Giovanna Silva, LAc, MSOM",
                "Dr. Yu Cheng Chen, PhD, DC, LAc",
                "Marina Doktorman, LAc",
                "Xue (Snow) Xia, LAc",
                "Dr. Aran Degenhardt, MD, CAc",
                "Jane Gibbons, LAc",
                "Li Ting Lin, LAc",
                "Russell Stram, PT",
                "Lisa Sumption, LAc",
                "Dr. Stephen Coleman, MD, LAc",
                "April Nieves, LAc",
                "Amy Woodstock, LAc",
                "Anna Piva, LAc, DACM",
                "Dumisani Kambi-Shamba, LAc, MSTOM",
                "Jonathan Simon, LAc",
                "Marjorie (Margie) Navarro, LAc",
                "Xaoling Shang, LAc, MSTOM",
                "Diem Truong, LAc, MSTOM",
                "Jacqueline Fazzalari, LAc",
                "Marc Gian, LAc",
                "Dr. Oliver Grover, DC, LAc, MS",
                "Christopher Trahan, LAc",
                "Dr. Yi Yi Wu, LAc, PhD",
                "Howard Tso, LAc",
                "Jeffrey Chen, LAc",
                "Darren Louie, LAc, MSTOM",
                "Dr. Aran Degenhardt, MD, CAc",
                "Boris Bernadsky, LAc, LMT",
                "Xaoling Shang, LAc, MSTOM",
                "Aliona Kats, LAc, LMT",
                "SongLinh Lu, LAc",
                "Zvi Goldberg, LAc",
                "Melissa Little, LAc",
                "Andrea Vannelli, DAc, DiplAc, LAc",
                "Andrea Vannelli, DAc, DiplAc, LAc",
                "Siras Ramos, LAc",
                "Annalisa Brown, LAc",
                "Diem Truong, LAc, MSTOM",
                "Natalie Francis, LAc",
                "Pamela Yap, LAc, MSTOM",
                "Brian Chang, DAc, DiplAc, LAc",
                "Dr. Sara Scrivano, DC, LAc",
                "Youngsoo Oh, PT",
                "Hyoung Gyo Kim, LAc",
                "Siraj Venjara, LAc, MSTOM",
                "Dr. Steven Moalemi, MD",
                "Hiroe Yamani, LAc",
                "Dr. Lev Kalika, DC",
                "Dr. David Hong, DC",
                "Dr. Steven Moalemi, MD",
                "Dr. Steven Moalemi, MD",
                "Dr. Kelly Bay, DC, CDN, CNS",
                "Keping Du, LAc",
                "Joelle Ludwig, LAc",
                "Joanne Hsieh, LAc",
                "Dr. Stephen Coleman, MD, LAc",
                "Brian Kelly, LAc",
                "Diem Truong, LAc, MSTOM",
                "Ok Jean Keh, LAc",
                "Dr. Jose Colon, MD",
                "Siraj Venjara, LAc, MSTOM",
                "Joanne Hsieh, LAc",
                "Dr. Sebastian Lighvani, MD"
            ];

            let randomDocs = [];
            for (let i = 0; i < 3; i++) {
                randomDocs.push(doctors[Math.floor(Math.random() * doctors.length)]);
            }

            text = `<p>${city}</p>
                <p>${randomDocs.join("</p><p>")}</p>`;
    }

    document.getElementById("doctorsList").innerHTML = text;

    setTimeout(() => {
        document.getElementById("doctorsList")
            .classList.add("animate");
    });

}