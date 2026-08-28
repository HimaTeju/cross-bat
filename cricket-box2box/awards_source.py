# -*- coding: utf-8 -*-
"""
Hand-verified IPL season awards, 2008-2026 (Orange Cap, Purple Cap, and the
"Most Valuable Player" award - called "Player of the Tournament" 2008-2012,
then reworked into a BCCI points-based "MVP" award from 2013 onward).

Sourced by cross-checking several independent stats/news aggregators via web
search (Wikipedia, ESPNcricinfo, and most cricket news sites are unreachable
from this environment's network egress, so no single canonical page could be
fetched directly - every season here was corroborated across 2+ independent
results before being recorded).

Each entry is (player, team-as-reported, stat line[, note]). A `note` flags
a specific discrepancy spotted between sources rather than silently
resolving it - those need a human check in the admin review UI before the
record is trusted.

CHAMPIONS is kept for reference/display only; it is NOT turned into a
per-player "IPL Champion" category in this pass. Doing that correctly needs
full title-winning squads per season (not just the eventual XI), and the
only accurate source for that is Cricsheet ball-by-ball data - which is
109MB, gitignored, and not reachable from this environment either
(cricsheet.org returns 403 through the egress proxy). Hand-curating 19
seasons of full squads from web search would carry exactly the kind of
transcription-error risk this whole staging/review workflow exists to catch,
so it's left for a follow-up once Cricsheet access (or another authoritative
squad source) is available.
"""

CHAMPIONS = {
    2008: "Rajasthan Royals",
    2009: "Deccan Chargers",
    2010: "Chennai Super Kings",
    2011: "Chennai Super Kings",
    2012: "Kolkata Knight Riders",
    2013: "Mumbai Indians",
    2014: "Kolkata Knight Riders",
    2015: "Mumbai Indians",
    2016: "Sunrisers Hyderabad",
    2017: "Mumbai Indians",
    2018: "Chennai Super Kings",
    2019: "Mumbai Indians",
    2020: "Mumbai Indians",
    2021: "Chennai Super Kings",
    2022: "Gujarat Titans",
    2023: "Chennai Super Kings",
    2024: "Kolkata Knight Riders",
    2025: "Royal Challengers Bengaluru",
    2026: "Royal Challengers Bengaluru",
}

# season -> (player, team, stat line)
ORANGE_CAP = {
    2008: ("Shaun Marsh", "Kings XI Punjab", "616 runs"),
    2009: ("Matthew Hayden", "Chennai Super Kings", "572 runs"),
    2010: ("Sachin Tendulkar", "Mumbai Indians", "618 runs"),
    2011: ("Chris Gayle", "Royal Challengers Bangalore", "608 runs"),
    2012: ("Chris Gayle", "Royal Challengers Bangalore", "733 runs"),
    2013: ("Michael Hussey", "Chennai Super Kings", "733 runs"),
    2014: ("Robin Uthappa", "Kolkata Knight Riders", "660 runs"),
    2015: ("David Warner", "Sunrisers Hyderabad", "562 runs"),
    2016: ("Virat Kohli", "Royal Challengers Bangalore", "973 runs"),
    2017: ("David Warner", "Sunrisers Hyderabad", "641 runs"),
    2018: ("Kane Williamson", "Sunrisers Hyderabad", "735 runs"),
    2019: ("David Warner", "Sunrisers Hyderabad", "692 runs"),
    2020: ("KL Rahul", "Kings XI Punjab", "670 runs"),
    2021: ("Ruturaj Gaikwad", "Chennai Super Kings", "635 runs"),
    2022: ("Jos Buttler", "Rajasthan Royals", "863 runs"),
    2023: ("Shubman Gill", "Gujarat Titans", "890 runs"),
    2024: ("Virat Kohli", "Royal Challengers Bengaluru", "741 runs"),
    2025: ("Sai Sudharsan", "Gujarat Titans", "759 runs"),
    2026: ("Vaibhav Sooryavanshi", "Rajasthan Royals", "776 runs"),
}

# season -> (player, team, stat line[, note])
PURPLE_CAP = {
    2008: ("Sohail Tanvir", "Rajasthan Royals", "22 wickets"),
    2009: (
        "RP Singh",
        "Deccan Chargers",
        "23 wickets",
        "some aggregator sources list this as 'Delhi Capitals', but that "
        "name/brand didn't exist until 2019 (was 'Delhi Daredevils' in "
        "2009) - most sources agree RP Singh played for Deccan Chargers "
        "in 2009, so that's recorded here; flagged for a human check.",
    ),
    2010: (
        "Pragyan Ojha",
        "Deccan Chargers",
        "21 wickets",
        "same discrepancy as the 2009 entry above - some sources list "
        "'Delhi Capitals' for this season, but most agree Ojha was at "
        "Deccan Chargers in 2010; flagged for a human check.",
    ),
    2011: ("Lasith Malinga", "Mumbai Indians", "28 wickets"),
    2012: ("Morne Morkel", "Delhi Daredevils", "25 wickets"),
    2013: ("Dwayne Bravo", "Chennai Super Kings", "32 wickets"),
    2014: ("Mohit Sharma", "Chennai Super Kings", "23 wickets"),
    2015: ("Dwayne Bravo", "Chennai Super Kings", "26 wickets"),
    2016: ("Bhuvneshwar Kumar", "Sunrisers Hyderabad", "23 wickets"),
    2017: ("Bhuvneshwar Kumar", "Sunrisers Hyderabad", "26 wickets"),
    2018: ("Andrew Tye", "Kings XI Punjab", "24 wickets"),
    2019: ("Imran Tahir", "Chennai Super Kings", "26 wickets"),
    2020: ("Kagiso Rabada", "Delhi Capitals", "30 wickets"),
    2021: ("Harshal Patel", "Royal Challengers Bangalore", "32 wickets"),
    2022: ("Yuzvendra Chahal", "Rajasthan Royals", "27 wickets"),
    2023: ("Mohammed Shami", "Gujarat Titans", "28 wickets"),
    2024: ("Harshal Patel", "Punjab Kings", "24 wickets"),
    2025: ("Prasidh Krishna", "Gujarat Titans", "25 wickets"),
    2026: ("Kagiso Rabada", "Gujarat Titans", "29 wickets"),
}

# season -> (player, team, note)
# "Player of the Tournament" 2008-2012; "Most Valuable Player" 2013 onward.
MVP = {
    2008: ("Shane Watson", "Rajasthan Royals", "Player of the Tournament"),
    2009: ("Adam Gilchrist", "Deccan Chargers", "Player of the Tournament"),
    2010: ("Sachin Tendulkar", "Mumbai Indians", "Player of the Tournament"),
    2011: ("Chris Gayle", "Royal Challengers Bangalore", "Player of the Tournament"),
    2012: ("Sunil Narine", "Kolkata Knight Riders", "Player of the Tournament"),
    2013: ("Shane Watson", "Rajasthan Royals", "MVP"),
    2014: ("Glenn Maxwell", "Kings XI Punjab", "MVP"),
    2015: ("Andre Russell", "Kolkata Knight Riders", "MVP"),
    2016: ("Virat Kohli", "Royal Challengers Bangalore", "MVP"),
    2017: ("Ben Stokes", "Rising Pune Supergiant", "MVP"),
    2018: ("Sunil Narine", "Kolkata Knight Riders", "MVP"),
    2019: ("Andre Russell", "Kolkata Knight Riders", "MVP"),
    2020: ("Jofra Archer", "Rajasthan Royals", "MVP"),
    2021: ("Harshal Patel", "Royal Challengers Bangalore", "MVP"),
    2022: ("Jos Buttler", "Rajasthan Royals", "MVP"),
    2023: ("Shubman Gill", "Gujarat Titans", "MVP"),
    2024: ("Sunil Narine", "Kolkata Knight Riders", "MVP"),
    2025: ("Suryakumar Yadav", "Mumbai Indians", "MVP"),
    2026: ("Vaibhav Sooryavanshi", "Rajasthan Royals", "MVP"),
}
