# -*- coding: utf-8 -*-
"""
Builds cricket-gamedata.json and cricket-players.json in the same schema
as the Box2Box football data (gamedata.json / player.json), using player
squad data sourced from Wikipedia team pages (2026 current squads) plus a
small set of fact-checked retired legends (sourced via web search).
"""
import json

NATION_FIX = {
    "Cricket West Indies": "West Indies",
    "Barbados": "West Indies",
    "Guyana": "West Indies",
    "Trinidad": "West Indies",
    "Jamaica": "West Indies",
    "Trinidad and Tobago": "West Indies",
}

NATIONS = [
    ("India", 100),
    ("Australia", 90),
    ("England", 88),
    ("South Africa", 80),
    ("West Indies", 78),
    ("New Zealand", 78),
    ("Sri Lanka", 70),
    ("Afghanistan", 55),
    ("Bangladesh", 45),
    ("Zimbabwe", 40),
]

FRANCHISES = [
    ("Mumbai Indians", "MI", 100),
    ("Chennai Super Kings", "CSK", 95),
    ("Royal Challengers Bengaluru", "RCB", 90),
    ("Kolkata Knight Riders", "KKR", 85),
    ("Delhi Capitals", "DC", 55),
    ("Punjab Kings", "PBKS", 55),
    ("Rajasthan Royals", "RR", 70),
    ("Sunrisers Hyderabad", "SRH", 65),
    ("Gujarat Titans", "GT", 75),
    ("Lucknow Super Giants", "LSG", 50),
]

# raw (name, nationality) pulled from each Wikipedia "Current squad" table
SQUADS = {
"Mumbai Indians": [
("Rohit Sharma","India"),("Suryakumar Yadav","India"),("Tilak Varma","India"),
("Danish Malewar","India"),("Quinton de Kock","South Africa"),("Ryan Rickelton","South Africa"),
("Robin Minz","India"),("Mitchell Santner","New Zealand"),("Shardul Thakur","India"),
("Hardik Pandya","India"),("Corbin Bosch","South Africa"),("Sherfane Rutherford","Guyana"),
("Will Jacks","England"),("Mayank Rawat","India"),("Naman Dhir","India"),
("Atharva Ankolekar","India"),("Raj Angad Bawa","India"),("Trent Boult","New Zealand"),
("Deepak Chahar","India"),("Jasprit Bumrah","India"),("Ashwani Kumar","India"),
("Mohammed Salahuddin Izhar","India"),("Raghu Sharma","India"),("Mayank Markande","India"),
("Allah Mohammad Ghazanfar","Afghanistan"),
],
"Chennai Super Kings": [
("Ruturaj Gaikwad","India"),("Matthew Short","Australia"),("Sarfaraz Khan","India"),
("Dewald Brevis","South Africa"),("Ayush Mhatre","India"),("MS Dhoni","India"),
("Sanju Samson","India"),("Urvil Patel","India"),("Kartik Sharma","India"),
("Akeal Hosein","West Indies"),("Shivam Dube","India"),("Aman Hakim Khan","India"),
("Ramakrishna Ghosh","India"),("Dian Forrester","South Africa"),("Anshul Kamboj","India"),
("Macneil Noronha","India"),("Shreyas Gopal","India"),("Rahul Chahar","India"),
("Noor Ahmad","Afghanistan"),("Matt Henry","New Zealand"),("Akash Madhwal","India"),
("Jamie Overton","England"),("Nathan Ellis","Australia"),("Spencer Johnson","Australia"),
("Mukesh Choudhary","India"),("Kuldip Yadav","India"),("Khaleel Ahmed","India"),
("Gurjapneet Singh","India"),("Zak Foulkes","New Zealand"),("Prashant Veer","India"),
],
"Royal Challengers Bengaluru": [
("Rajat Patidar","India"),("Virat Kohli","India"),("Devdutt Padikkal","India"),
("Vihaan Malhotra","India"),("Phil Salt","England"),("Jitesh Sharma","India"),
("Jordan Cox","England"),("Krunal Pandya","India"),("Tim David","Australia"),
("Satvik Deswal","India"),("Jacob Bethell","England"),
],
"Kolkata Knight Riders": [
("Rinku Singh","India"),("Manish Pandey","India"),("Rahul Tripathi","India"),
("Angkrish Raghuvanshi","India"),("Finn Allen","New Zealand"),("Tim Seifert","New Zealand"),
("Tejasvi Singh Dahiya","India"),("Luvnith Sisodia","India"),("Sunil Narine","West Indies"),
("Anukul Roy","India"),("Ramandeep Singh","India"),("Rovman Powell","West Indies"),
("Cameron Green","Australia"),("Rachin Ravindra","New Zealand"),("Sarthak Ranjan","India"),
("Daksh Kamra","India"),("Vaibhav Arora","India"),("Umran Malik","India"),
("Blessing Muzarabani","Zimbabwe"),("Navdeep Saini","India"),("Kartik Tyagi","India"),
("Saurabh Dubey","India"),("Varun Chakravarthy","India"),("Prashant Solanki","India"),
],
"Delhi Capitals": [
("David Miller","South Africa"),("Karun Nair","India"),("Nitish Rana","India"),
("Ben Duckett","England"),("Pathum Nissanka","Sri Lanka"),("Prithvi Shaw","India"),
("Sameer Rizvi","India"),("Sahil Parakh","India"),("KL Rahul","India"),
("Tristan Stubbs","South Africa"),("Rishabh Pant","India"),("Abishek Porel","India"),
("Axar Patel","India"),("Ajay Mandal","India"),("Auqib Nabi","Afghanistan"),
("Ashutosh Sharma","India"),("Tripurana Vijay","India"),("Madhav Tiwari","India"),
("Rehan Ahmed","England"),("Mitchell Starc","Australia"),("T Natarajan","India"),
("Dushmantha Chameera","Sri Lanka"),("Mukesh Kumar","India"),("Kyle Jamieson","New Zealand"),
("Lungi Ngidi","South Africa"),("Vipraj Nigam","India"),
],
"Punjab Kings": [
("Shreyas Iyer","India"),("Pyla Avinash","India"),("Nehal Wadhera","India"),
("Priyansh Arya","India"),("Harnoor Singh","India"),("Musheer Khan","India"),
("Vishnu Vinod","India"),("Prabhsimran Singh","India"),("Marcus Stoinis","Australia"),
("Shashank Singh","India"),("Azmatullah Omarzai","Afghanistan"),("Marco Jansen","South Africa"),
("Mitchell Owen","Australia"),("Suryansh Shedge","India"),("Cooper Connolly","Australia"),
("Lockie Ferguson","New Zealand"),("Ben Dwarshuis","Australia"),("Vijaykumar Vyshak","India"),
("Yash Thakur","India"),("Xavier Bartlett","Australia"),("Arshdeep Singh","India"),
("Yuzvendra Chahal","India"),("Praveen Dubey","India"),("Harpreet Brar","India"),
("Vishal Nishad","India"),
],
"Rajasthan Royals": [
("Shubham Dubey","India"),("Shimron Hetmyer","West Indies"),("Yashasvi Jaiswal","India"),
("Vaibhav Sooryavanshi","India"),("Aman Rao Parela","India"),("Dhruv Jurel","India"),
("Ravi Inder Singh","India"),("Lhuan-dre Pretorius","South Africa"),("Ravindra Jadeja","India"),
("Yudhvir Singh","India"),("Dasun Shanaka","Sri Lanka"),("Riyan Parag","India"),
("Donovan Ferreira","South Africa"),("Adam Milne","New Zealand"),("Sandeep Sharma","India"),
("Jofra Archer","England"),("Tushar Deshpande","India"),("Nandre Burger","South Africa"),
("Kuldeep Sen","India"),("Sushant Mishra","India"),("Brijesh Sharma","India"),
("Kwena Maphaka","South Africa"),("Ravi Bishnoi","India"),("Vignesh Puthur","India"),
],
"Sunrisers Hyderabad": [
("Travis Head","Australia"),("Aniket Verma","India"),("Smaran Ravichandran","India"),
("Heinrich Klaasen","South Africa"),("Ishan Kishan","India"),("Salil Arora","India"),
("Abhishek Sharma","India"),("Nitish Kumar Reddy","India"),("Shivam Mavi","India"),
("RS Ambrish","India"),("Shivang Kumar","India"),("Harsh Dubey","India"),
("Liam Livingstone","England"),("Brydon Carse","England"),("Kamindu Mendis","Sri Lanka"),
("Jack Edwards","Australia"),("Pat Cummins","Australia"),("Dilshan Madushanka","Sri Lanka"),
("Gerald Coetzee","South Africa"),("Harshal Patel","India"),("Jaydev Unadkat","India"),
("Eshan Malinga","Sri Lanka"),("Praful Hinge","India"),("Onkar Tarmale","India"),
("Sakib Hussain","India"),("Zeeshan Ansari","India"),("Amit Kumar","India"),
("Krains Fuletra","India"),
],
"Gujarat Titans": [
("Shubman Gill","India"),("Rahul Tewatia","India"),("Shahrukh Khan","India"),
("Sai Sudharsan","India"),("Jos Buttler","England"),("Tom Banton","England"),
("Anuj Rawat","India"),("Atharv Sheladia","India"),("Jayant Yadav","India"),
("Jason Holder","Barbados"),("Glenn Phillips","New Zealand"),("Rashid Khan","Afghanistan"),
("Washington Sundar","India"),("Manav Suthar","India"),("Nishant Sindhu","India"),
("Ishant Sharma","India"),("Mohammed Siraj","India"),("Kagiso Rabada","South Africa"),
("Luke Wood","England"),("Prasidh Krishna","India"),("Prithvi Raj Yarra","India"),
("Gurnoor Brar","India"),("Ashok Sharma","India"),("Sai Kishore","India"),
],
"Lucknow Super Giants": [
("Aiden Markram","South Africa"),("Himmat Singh","India"),("Akshat Raghuwanshi","India"),
("Josh Inglis","Australia"),("Nicholas Pooran","Cricket West Indies"),("Matthew Breetzke","South Africa"),
("Mukul Choudhary","India"),("Mitchell Marsh","Australia"),("Shahbaz Ahmed","India"),
("Wanindu Hasaranga","Sri Lanka"),("Arjun Tendulkar","India"),("Ayush Badoni","India"),
("Abdul Samad","India"),("Arshin Kulkarni","India"),("Mohammed Shami","India"),
("Anrich Nortje","South Africa"),("Avesh Khan","India"),("Mohsin Khan","India"),
("Prince Yadav","India"),("Akash Singh","India"),("Mayank Yadav","India"),
("Naman Tiwari","India"),("Manimaran Siddharth","India"),("Digvesh Rathi","India"),
("Kuldeep Yadav","India"),
],
}

# second snapshot (2022 season) to capture player movement between franchises,
# sourced from each team's "20XX <Team> season" Wikipedia page
SQUADS_2022 = {
"Mumbai Indians": [
("Rohit Sharma","India"),("Tim David","Australia"),("Tilak Varma","India"),
("Anmolpreet Singh","India"),("Rahul Buddhi","India"),("Suryakumar Yadav","India"),
("Sanjay Yadav","India"),("Ramandeep Singh","India"),("Dewald Brevis","South Africa"),
("Kieron Pollard","West Indies"),("Daniel Sams","Australia"),("Fabian Allen","West Indies"),
("Tristan Stubbs","South Africa"),("Ishan Kishan","India"),("Aryan Juyal","India"),
("Riley Meredith","Australia"),("Basil Thampi","India"),("Tymal Mills","England"),
("Jaydev Unadkat","India"),("Jasprit Bumrah","India"),("Jofra Archer","England"),
("Arjun Tendulkar","India"),("Arshad Khan","India"),("Mayank Markande","India"),
("Kumar Kartikeya","India"),("Hrithik Shokeen","India"),("Murugan Ashwin","India"),
],
"Chennai Super Kings": [
("Ambati Rayudu","India"),("Chezhian Harinishanth","India"),("Subhranshu Senapati","India"),
("Ruturaj Gaikwad","India"),("Devon Conway","New Zealand"),("Ravindra Jadeja","India"),
("Moeen Ali","England"),("Shivam Dube","India"),("Dwaine Pretorius","South Africa"),
("Dwayne Bravo","Trinidad and Tobago"),("Mitchell Santner","New Zealand"),("Rajvardhan Hangargekar","India"),
("Narayan Jagadeesan","India"),("MS Dhoni","India"),("Robin Uthappa","India"),
("Bhagath Varma","India"),("Prashant Solanki","India"),("Maheesh Theekshana","Sri Lanka"),
("Adam Milne","New Zealand"),("KM Asif","India"),("Mukesh Choudhary","India"),
("Chris Jordan","England"),("Tushar Deshpande","India"),("Deepak Chahar","India"),
("Simarjeet Singh","India"),("Matheesha Pathirana","Sri Lanka"),
],
"Royal Challengers Bengaluru": [
("Faf du Plessis","South Africa"),("Virat Kohli","India"),("Suyash Prabhudessai","India"),
("Rajat Patidar","India"),("Finn Allen","New Zealand"),("Mahipal Lomror","India"),
("Shahbaz Ahmed","India"),("Glenn Maxwell","Australia"),("Wanindu Hasaranga","Sri Lanka"),
("Sherfane Rutherford","West Indies"),("Aneeshwar Gautam","India"),("Dinesh Karthik","India"),
("Anuj Rawat","India"),("Luvnith Sisodia","India"),("Karn Sharma","India"),
("Siddarth Kaul","India"),("Harshal Patel","India"),("Akash Deep","India"),
("David Willey","England"),("Josh Hazlewood","Australia"),("Mohammed Siraj","India"),
("Jason Behrendorff","Australia"),("Chama Milind","India"),
],
"Kolkata Knight Riders": [
("Ajinkya Rahane","India"),("Aaron Finch","Australia"),("Abhijeet Tomar","India"),
("Rinku Singh","India"),("Shreyas Iyer","India"),("Alex Hales","England"),
("Pratham Singh","India"),("Baba Indrajith","India"),("Paras Sharma","India"),
("Anukul Roy","India"),("Mohammad Nabi","Afghanistan"),("Andre Russell","West Indies"),
("Aman Hakim Khan","India"),("Venkatesh Iyer","India"),("Nitish Rana","India"),
("Chamika Karunaratne","Sri Lanka"),("Sheldon Jackson","India"),("Sam Billings","England"),
("Varun Chakravarthy","India"),("Sunil Narine","West Indies"),("Ramesh Kumar","India"),
("Rasikh Salam","India"),("Umesh Yadav","India"),("Harshit Rana","India"),
("Shivam Mavi","India"),("Pat Cummins","Australia"),("Tim Southee","New Zealand"),
],
"Delhi Capitals": [
("Rishabh Pant","India"),("Mandeep Singh","India"),("Ripal Patel","India"),
("David Warner","Australia"),("Rovman Powell","West Indies"),("Sarfaraz Khan","India"),
("Prithvi Shaw","India"),("Yash Dhull","India"),("Mitchell Marsh","Australia"),
("Lalit Yadav","India"),("Axar Patel","India"),("Ashwin Hebbar","India"),
("K. S. Bharat","India"),("Tim Seifert","New Zealand"),("Anrich Nortje","South Africa"),
("Kamlesh Nagarkoti","India"),("Shardul Thakur","India"),("Chetan Sakariya","India"),
("Khaleel Ahmed","India"),("Mustafizur Rahman","Bangladesh"),("Lungi Ngidi","South Africa"),
("Kuldeep Yadav","India"),("Praveen Dubey","India"),("Vicky Ostwal","India"),
],
"Punjab Kings": [
("Mayank Agarwal","India"),("Atharva Taide","India"),("Shahrukh Khan","India"),
("Shikhar Dhawan","India"),("Bhanuka Rajapaksa","Sri Lanka"),("Raj Bawa","India"),
("Benny Howell","England"),("Odean Smith","Jamaica"),("Rishi Dhawan","India"),
("Liam Livingstone","England"),("Writtick Chatterjee","India"),("Prerak Mankad","India"),
("Jonny Bairstow","England"),("Prabhsimran Singh","India"),("Jitesh Sharma","India"),
("Ansh Patel","India"),("Rahul Chahar","India"),("Harpreet Brar","India"),
("Arshdeep Singh","India"),("Baltej Singh","India"),("Vaibhav Arora","India"),
("Kagiso Rabada","South Africa"),("Ishan Porel","India"),("Sandeep Sharma","India"),
("Nathan Ellis","Australia"),
],
"Rajasthan Royals": [
("Shubham Garhwal","India"),("Yashasvi Jaiswal","India"),("Devdutt Padikkal","India"),
("Daryl Mitchell","New Zealand"),("Karun Nair","India"),("Rassie van der Dussen","South Africa"),
("Shimron Hetmyer","West Indies"),("Riyan Parag","India"),("Jimmy Neesham","New Zealand"),
("Corbin Bosch","South Africa"),("Dhruv Jurel","India"),("Jos Buttler","England"),
("Yuzvendra Chahal","India"),("Tejas Baroka","India"),("K.C. Cariappa","India"),
("Ravichandran Ashwin","India"),("Nathan Coulter-Nile","Australia"),("Anunay Singh","India"),
("Kuldip Yadav","India"),("Trent Boult","New Zealand"),("Kuldeep Sen","India"),
("Prasidh Krishna","India"),("Obed McCoy","West Indies"),("Navdeep Saini","India"),
],
"Sunrisers Hyderabad": [
("Priyam Garg","India"),("Kane Williamson","New Zealand"),("Rahul Tripathi","India"),
("Ravikumar Samarth","India"),("Aiden Markram","South Africa"),("Abdul Samad","India"),
("Abhishek Sharma","India"),("Washington Sundar","India"),("Shashank Singh","India"),
("Shreyas Gopal","India"),("Romario Shepherd","Guyana"),("Marco Jansen","South Africa"),
("Sean Abbott","Australia"),("Glenn Phillips","New Zealand"),("Vishnu Vinod","India"),
("Nicholas Pooran","Trinidad and Tobago"),("Kartik Tyagi","India"),("Bhuvneshwar Kumar","India"),
("Umran Malik","India"),("Jagadeesha Suchith","India"),("Saurabh Dubey","India"),
("Sushant Mishra","India"),("T Natarajan","India"),("Fazalhaq Farooqi","Afghanistan"),
],
"Gujarat Titans": [
("Hardik Pandya","India"),("Shubman Gill","India"),("David Miller","South Africa"),
("Gurkeerat Singh","India"),("Sai Sudharsan","India"),("Jason Roy","England"),
("Rahul Tewatia","India"),("Abhinav Sadarangani","India"),("Vijay Shankar","India"),
("Dominic Drakes","West Indies"),("Wriddhiman Saha","India"),("Matthew Wade","Australia"),
("Rahmanullah Gurbaz","Afghanistan"),("Sai Kishore","India"),("Noor Ahmad","Afghanistan"),
("Rashid Khan","Afghanistan"),("Jayant Yadav","India"),("Darshan Nalkande","India"),
("Alzarri Joseph","West Indies"),("Mohammed Shami","India"),("Pradeep Sangwan","India"),
("Lockie Ferguson","New Zealand"),("Varun Aaron","India"),("Yash Dayal","India"),
],
"Lucknow Super Giants": [
("KL Rahul","India"),("Ayush Badoni","India"),("Manan Vohra","India"),
("Manish Pandey","India"),("Evin Lewis","Trinidad and Tobago"),("Krishnappa Gowtham","India"),
("Marcus Stoinis","Australia"),("Krunal Pandya","India"),("Karan Sharma","India"),
("Deepak Hooda","India"),("Kyle Mayers","West Indies"),("Jason Holder","Barbados"),
("Quinton de Kock","South Africa"),("Ravi Bishnoi","India"),("Shahbaz Nadeem","India"),
("Dushmantha Chameera","Sri Lanka"),("Mayank Yadav","India"),("Ankit Rajpoot","India"),
("Mohsin Khan","India"),("Avesh Khan","India"),("Andrew Tye","Australia"),
("Mark Wood","England"),
],
}

# fact-checked retired legends: name -> (nationality, [franchise names in current branding])
LEGENDS = {
    "AB de Villiers": ("South Africa", ["Delhi Capitals", "Royal Challengers Bengaluru"]),
    "Chris Gayle": ("West Indies", ["Kolkata Knight Riders", "Royal Challengers Bengaluru", "Punjab Kings"]),
    "Sachin Tendulkar": ("India", ["Mumbai Indians"]),
    "Yuvraj Singh": ("India", ["Punjab Kings", "Royal Challengers Bengaluru", "Delhi Capitals", "Sunrisers Hyderabad", "Mumbai Indians"]),
    "Virender Sehwag": ("India", ["Delhi Capitals", "Punjab Kings"]),
    "Gautam Gambhir": ("India", ["Delhi Capitals", "Kolkata Knight Riders"]),
    "Andre Russell": ("West Indies", ["Delhi Capitals", "Kolkata Knight Riders"]),
    "Kieron Pollard": ("West Indies", ["Mumbai Indians"]),
    "David Warner": ("Australia", ["Delhi Capitals", "Sunrisers Hyderabad"]),
    "Glenn Maxwell": ("Australia", ["Delhi Capitals", "Mumbai Indians", "Punjab Kings", "Royal Challengers Bengaluru"]),
}

DROP_NAMES = {"Yash Raj Punk"}  # garbled extraction, excluded for accuracy

def build():
    nation_id = {name: 100 + i for i, (name, _) in enumerate(NATIONS)}
    franchise_id = {name: 200 + i for i, (name, _, _) in enumerate(FRANCHISES)}

    categories = []
    for name, rep in NATIONS:
        categories.append({
            "id": nation_id[name], "name": name, "reputation": rep,
            "type": 1, "description": name, "displayName": name,
        })
    for name, disp, rep in FRANCHISES:
        categories.append({
            "id": franchise_id[name], "name": name, "reputation": rep,
            "type": 2, "description": name, "displayName": disp,
        })

    players = {}  # name -> set of category ids

    def add(name, nation_raw, franchise_names):
        if name in DROP_NAMES:
            return
        nation = NATION_FIX.get(nation_raw, nation_raw)
        if nation not in nation_id:
            print("WARN unknown nation:", nation, "for", name)
            return
        v = players.setdefault(name, set())
        v.add(nation_id[nation])
        for f in franchise_names:
            if f not in franchise_id:
                print("WARN unknown franchise:", f, "for", name)
                continue
            v.add(franchise_id[f])

    for franchise, roster in SQUADS.items():
        for name, nation in roster:
            add(name, nation, [franchise])

    for franchise, roster in SQUADS_2022.items():
        for name, nation in roster:
            add(name, nation, [franchise])

    for name, (nation, franchises) in LEGENDS.items():
        add(name, nation, franchises)

    # difficulty thresholds (scaled down for this smaller dataset)
    difficulty = {
        "minimumComboAnswers": 3,
        "maximumComboAnswers": 80,
        "minimumComboReputation": 0,
        "maximumComboReputation": 999,
        "ignoreExcludedCategories": False,
        "includedCategories": [],
        "excludedCategories": [],
    }

    all_ids = [c["id"] for c in categories]
    rep_by_id = {c["id"]: c["reputation"] for c in categories}
    answer_count = {}
    for a in all_ids:
        for b in all_ids:
            if a == b:
                continue
            cnt = sum(1 for v in players.values() if a in v and b in v)
            if cnt > 0:
                answer_count[(a, b)] = cnt

    playable = {str(cid): [] for cid in all_ids}
    for (a, b), cnt in answer_count.items():
        rep_sum = rep_by_id[a] + rep_by_id[b]
        if (difficulty["minimumComboAnswers"] <= cnt <= difficulty["maximumComboAnswers"]
                and difficulty["minimumComboReputation"] <= rep_sum <= difficulty["maximumComboReputation"]):
            playable[str(a)].append(b)

    playable = {k: v for k, v in playable.items() if v}

    gamedata = {
        "gameData": {
            "lastUpdated": "22 Aug 2026",
            "game": "cricket1",
            "difficulty": difficulty,
            "categories": categories,
            "playableCombos": playable,
        }
    }

    players_out = {
        "players": [
            {"n": name, "v": sorted(v)} for name, v in sorted(players.items())
        ]
    }

    with open("cricket-gamedata.json", "w", encoding="utf-8") as f:
        json.dump(gamedata, f, indent=2, ensure_ascii=False)
    with open("cricket-players.json", "w", encoding="utf-8") as f:
        json.dump(players_out, f, indent=2, ensure_ascii=False)

    print("players:", len(players))
    print("categories:", len(categories))
    print("playable category-rows:", len(playable))
    total_pairs = sum(len(v) for v in playable.values()) // 2
    print("playable pairs (undirected):", total_pairs)

if __name__ == "__main__":
    build()
