Description: This is the readme document pertaining to running our 
experiments. It comprises 6 files:

1. getStateLevelData.py
This function runs the final experiment code across each debate event and
state, to extract sentiments/preferred candidate/key themes at a event-state
level.

2. cleanTopicExtraction.R
This function extracts coefficients of the LDA used in our topic extraction,
and maps the key words to specific themes (ie foreign policy/racial issues).

3. functions.py
This script contains functions used by all the other scripts. Comonly used or
common functions across different scripts are included here.

4. text_preprocessing_experiments.py
This script runs experiments on the tweets, including preprocessing of tweets,
sentiemtn analysis, plotting a word cloud as well as topic extraction.

5. topic_theme_experiments.py
This script runs experiments on tweets to optimise the topic extraction using LDA.
The topics are extract for all 5 events.

6. emoji_analytics.py
This script extracts emojis from tweets, and then builds a hierarchical pie chart
based on the frequency of the emojis in tweets.