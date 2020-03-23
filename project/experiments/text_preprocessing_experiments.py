#!/usr/bin/env python
# coding: utf-8

# # Text preprocessing experiments
# 
# In this notebook, we will load in the pickled tweets regarding the 2016 US election, and iteratively run experiments to keep track of improve the text preprocessing for sentiment analysis, word cloud and topic extraction.

# In[1]:


get_ipython().system('jupyter nbconvert --to script text_preprocessing_experiments.ipynb')


# In[5]:


from functions import *


# We first read in all the pickled tweets into dataframes.

# In[3]:


# load pickle files
first_debate_df = pd.read_pickle('first_debate_all.pkl')
# second_debate_df = pd.read_pickle('second_debate_all.pkl')
# third_debate_df = pd.read_pickle('third_debate_all.pkl')


# We then run experiments on a subset of the data (to rapidly experiment and optimise the text preprocessing).

# In[6]:


def run_experiment(data, sample_size):
    '''run experiments on sample of data'''
    
    # Extract sample subset of dataset
    df = data.copy().reset_index()
    df = df.iloc[np.random.randint(0, len(df), sample_size)]

    # 1. Preprocessing tweets
    df['tweet_clean'] = clean_tweets(tweets=df['full_text'])

    # 2. Sentiment Analysis
    df = polarity_subjectivity(df) # attach polarity and subjectivity
    fig, ax = plt.subplots(nrows=1, ncols=2, figsize=(20,6))
    plot_polarity(df, ax[0])
    plot_subjectivity(df, ax[1])
    fig.tight_layout()

    # 3. Word Cloud
    plot_word_cloud(df)

    # 4. Topic Extraction
    lda_model = extract_topic_words(df)


# In[7]:


# run experiment, given data and sample size
run_experiment(first_debate_df, 1000)


# In[ ]:




