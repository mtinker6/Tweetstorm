Description: This is the readme document pertaining to data extraction.
It comprises 3 files:

1. extract_twitter_tweets.py
In this file, the functions here are built for hydrating tweets, as 
per the instructions following https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/PDI7IN

2. combine_pickle_batch.py
As the size of tweets are large, we saved hydrated tweets into batches.
The function here will combine pickle batches for when we run experiments.

3. getGraphData.py
This function takes all tweets and builts a directed graph linking key users
(ie Hillary/Trump) during the debates.