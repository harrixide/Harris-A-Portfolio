Harris Portfolio Recommender Integration

Files included

index.html
script.js
style.css
recommender/index.html
recommender/recommender.css
recommender/recommender.js
recommender/songs.json
recommender/recommendations.json

Before publishing

Replace these placeholder files with the real generated files:

music_dataset/website_export/songs.json
music_dataset/website_export/recommendations.json

Copy them into:

recommender/songs.json
recommender/recommendations.json

Important

The main portfolio View Recommender button opens recommender/index.html in a new tab.
The embedded View Demo button still works independently.
The JavaScript now only attaches demo behavior to button.demo-btn elements with data-demo-src, so external links and other buttons are not affected.

Local testing

Opening the HTML by double-clicking may block fetch requests in some browsers. Run a local server from the project folder:

python3 -m http.server 8000

Then visit:

http://localhost:8000
