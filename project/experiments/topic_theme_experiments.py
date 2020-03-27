#!/usr/bin/env python
# coding: utf-8

# # Topic theme experiments
# 
# In this notebook, we will load in the pickled tweets regarding the 2016 US election, and iteratively run experiments to improve the top themes being extracted.

# In[1]:


get_ipython().system('jupyter nbconvert --to script topic_theme_experiments.ipynb')


# In[2]:


from functions import *


# We first read in all the pickled tweets into dataframes.

# In[67]:


# load pickle files
first_debate_df = pd.read_pickle('first_debate_all.pkl')
second_debate_df = pd.read_pickle('second_debate_all.pkl')
third_debate_df = pd.read_pickle('third_debate_all.pkl')
vp_debate_df = pd.read_pickle('vp_debate_all.pkl')
election_day_df = pd.read_pickle('election_day_all.pkl')


# We then run experiments on a subset of the data (to rapidly experiment and optimise the text preprocessing).

# In[101]:


def extract_topic_words(df):
    '''extract topic words'''
    
    processed_docs = df['tweet_clean'].map(word_tokenize) # tokenize each tweet
    dictionary = gensim.corpora.Dictionary(processed_docs) # create dictionary with count of each word
    dictionary.filter_extremes(no_below=100, no_above=0.4, keep_n=1000) # set criteria for tokens that are kept
    bow_corpus = [dictionary.doc2bow(doc) for doc in processed_docs] # create dictionary of word count for each tweet

    lda_model =  LdaMulticore(
        bow_corpus
        ,num_topics = 5
        ,id2word = dictionary                            
        ,passes = 1
        ,workers = 2
        ,random_state = 0
    )

    for idx, topic in lda_model.print_topics(-1):
        print('Topic: {} \nWords: {}'.format(idx, topic))
    
    return lda_model


# In[133]:


def get_topics(data, sample_size):
    '''run experiments on sample of data'''
    
    # Extract sample subset of dataset
    df = data.copy().reset_index()
    df = df.iloc[np.random.randint(0, len(df), sample_size)]

    # Preprocessing tweets
    df['tweet_clean'] = clean_tweets(tweets=df['full_text'])
    
    word_list = ['debate','http','go','get','de','nbc4dc','imwithher','look','maga','lester','holt','way','miss','american','amp','say','want','told','need','make','let','thing'
                ,'talk','tell','watch','donaldtrump','hillaryclinton','think','like','sma','alicia','piggy','machado'
                ,'u','4','2','bigleaguetruth','come','poll','time','thank','tweet','twitter'
                ,'electionnight','vote','bill','america','tonight','know','por','con','los','voting','cnn','kaine','penny','mike','para','shewon','candidate','pence','tim','hrc'
                ,'today','vice','election','day']
    df['tweet_clean'] = df['tweet_clean'].apply(lambda tweet: ' '.join([word for word in tweet.split() if (not any(w in word for w in word_list)) and (len(word)>=3)]))
    
    # Topic Extraction
    lda_model = extract_topic_words(df)


# In[134]:


# run experiment, given data and sample size
get_topics(first_debate_df, 10000)


# In[135]:


# run experiment, given data and sample size
get_topics(second_debate_df, 10000)


# In[136]:


# run experiment, given data and sample size
get_topics(third_debate_df, 10000)


# In[137]:


# run experiment, given data and sample size
get_topics(vp_debate_df, 10000)


# In[138]:


# run experiment, given data and sample size
get_topics(election_day_df, 10000)


# In[ ]:




