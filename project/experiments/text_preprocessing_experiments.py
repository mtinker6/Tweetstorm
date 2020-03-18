#!/usr/bin/env python
# coding: utf-8

# # Text preprocessing experiments
# 
# In this notebook, we will load in the pickled tweets regarding the 2016 US election, and iteratively run experiments to keep track of improve the text preprocessing for sentiment analysis, word cloud and topic extraction.

# In[2]:


get_ipython().system('jupyter nbconvert --to script text_preprocessing_experiments.ipynb')


# In[2]:


import pandas as pd
import numpy as np
import os
import pickle
import re

from IPython.display import display
import matplotlib.pyplot as plt

pd.options.display.max_columns = None

from PIL import Image
from wordcloud import WordCloud, STOPWORDS, ImageColorGenerator
from textblob import TextBlob
from spacy.lang.en import English
from spacy.lang.en.stop_words import STOP_WORDS
import nltk
from nltk.tokenize import word_tokenize
import gensim
from gensim.models.ldamulticore import LdaMulticore, LdaModel
from gensim.test.utils import datapath

nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')
nlp = English()


# In[3]:


# load pickle files
first_debate_df = pd.read_pickle('first_debate_all.pkl')
second_debate_df = pd.read_pickle('second_debate_all.pkl')
third_debate_df = pd.read_pickle('third_debate_all.pkl')


# # 1. Helper Functions

# ## Text Preprocessing ##
# https://www.analyticsvidhya.com/blog/2019/08/how-to-remove-stopwords-text-normalization-nltk-spacy-gensim-python/

# In[17]:


# Define function to lemmatize each word with its POS tag
def lemmatize_with_postag(sentence):
    '''lemmatize each word of a setence based on its PoS tag'''

    sent = TextBlob(sentence)
    tag_dict = {
        "J": 'a'
        ,"N": 'n'
        ,"V": 'v'
        ,"R": 'r'}

    words_and_tags = [(w, tag_dict.get(pos[0], 'n')) for w, pos in sent.tags]    
    lemmatized_list = [wd.lemmatize(tag) for wd, tag in words_and_tags]
    return " ".join(lemmatized_list)


# In[56]:


def clean_tweets(tweets):
    '''clean tweets'''
    
    # lower case
    clean_tweets = tweets.apply(lambda tweet: tweet.lower())
    
    # remove stop words
    clean_tweets = clean_tweets.apply(lambda text: " ".join(token.lemma_ for token in nlp(text) if not token.is_stop))

    # remove tags and links
    clean_tweets = clean_tweets.apply(lambda tweet: ' '.join(re.sub("(@[a-z0-9]+)|(\w+:\/\/\S+)", "", tweet).split()))
    word_list = ['debate', 'http']
    clean_tweets = clean_tweets.apply(lambda tweet: ' '.join([word for word in tweet.split() if not any(w in word for w in word_list)]))
    
    # combine similar words together
    word_list = ['donald','trump', 'donaldtrump']
    clean_tweets = clean_tweets.apply(lambda tweet: ' '.join(['donaldtrump' if any(w in word for w in word_list) else word 
                                                              for word in tweet.split()]))
    word_list = ['hillary','clinton', 'hillaryclinton']
    clean_tweets = clean_tweets.apply(lambda tweet: ' '.join(['hillaryclinton' if any(w in word for w in word_list) else word 
                                                              for word in tweet.split()]))
    # remove retweet label
    clean_tweets = clean_tweets.apply(lambda tweet: re.sub("rt ", "", tweet))
    
    # lemmatize tweets
    clean_tweets = clean_tweets.apply(lambda tweet: lemmatize_with_postag(tweet))

    # remove non-alphanumeric characters
    clean_tweets = clean_tweets.apply(lambda tweet: ' '.join(re.sub("([^0-9a-z \t])", "", tweet).split()))

    return clean_tweets


# ## Sentiment Analysis

# In[57]:


def polarity_calc(text):
    '''determine polarity of text'''
    
    try:
        return TextBlob(text).sentiment.polarity
    except:
        return None


# In[58]:


def subjectivity_calc(text):
    '''determine subjectivity of text'''
    
    try:
        return TextBlob(text).sentiment.subjectivity
    except:
        return None


# In[59]:


def polarity_subjectivity(df):
    '''attach polarity and subjectivity to tweets'''
    
    df['polarity'] = df['tweet_clean'].apply(polarity_calc)
    df['subjectivity'] = df['tweet_clean'].apply(subjectivity_calc)
    
    return df


# In[60]:


def plot_polarity(df, ax):
    '''Plot histogram of polarity'''
    
    binwidth = 0.1
    ax.hist(
        df['polarity']
        ,color='skyblue'
        ,lw=1
        ,ec='gray'
        ,alpha=0.5
        ,bins=np.arange(min(df['polarity']),max(df['polarity']) + binwidth, binwidth))

    ax.title.set_text('Histogram of Polarity')
    ax.set_xlabel('Polarity')
    ax.set_ylabel('Count of tweets')


# In[61]:


def plot_subjectivity(df, ax):
    '''Plot histogram of subjectivity'''
    
    binwidth = 0.05
    ax.hist(
        df['subjectivity']
        ,color='skyblue'
        ,lw=1
        ,ec='gray'
        ,alpha=0.5
        ,bins=np.arange(min(df['subjectivity']),max(df['subjectivity']) + binwidth, binwidth))

    ax.title.set_text('Histogram of Subjectivity')
    ax.set_xlabel('Subjectivity')
    ax.set_ylabel('Count of tweets')


# ## Word Cloud for positive vs negative sentiments 
# 
# Note: Can consider lollipop plots etc. Word clouds is visually harder to break down.
# https://www.d3-graph-gallery.com/wordcloud

# In[62]:


def plot_word_cloud(df):
    '''Plot word cloud for positive and negative tweets'''
    
    positive_tweets = df[df['polarity']>0]
    negative_tweets = df[df['polarity']<0]

    positive_text = " ".join(tweet for tweet in positive_tweets['tweet_clean'])
    negative_text = " ".join(tweet for tweet in negative_tweets['tweet_clean'])

    positive_wordcloud = WordCloud(max_font_size=50, max_words=100, background_color="white", collocations=False).generate(positive_text)
    negative_wordcloud = WordCloud(max_font_size=50, max_words=100, background_color="white", collocations=False).generate(negative_text)

#     positive_wordcloud = WordCloud(max_font_size=50, max_words=100, background_color="white").generate(positive_text)
#     negative_wordcloud = WordCloud(max_font_size=50, max_words=100, background_color="white").generate(negative_text)

    fig, ax = plt.subplots(nrows=1, ncols=2, figsize=(20,6))
    ax[0].imshow(positive_wordcloud, interpolation="bilinear")
    ax[0].title.set_text('Positive Word Cloud')
    ax[0].axis("off")

    ax[1].imshow(negative_wordcloud, interpolation="bilinear")
    ax[1].title.set_text('Negative Word Cloud')
    ax[1].axis("off")
    fig.tight_layout()


# ## Topic Extraction
# 
# https://towardsdatascience.com/nlp-extracting-the-main-topics-from-your-dataset-using-lda-in-minutes-21486f5aa925
# 
# https://towardsdatascience.com/topic-modeling-and-latent-dirichlet-allocation-in-python-9bf156893c24

# In[72]:


def extract_topic_words(df):
    '''extract topic words'''
    
    processed_docs = df['tweet_clean'].map(word_tokenize) # tokenize each tweet
    dictionary = gensim.corpora.Dictionary(processed_docs) # create dictionary with count of each word
    dictionary.filter_extremes(no_below=15, no_above=0.5, keep_n=100000) # set criteria for tokens that are kept
    bow_corpus = [dictionary.doc2bow(doc) for doc in processed_docs] # create dictionary of word count for each tweet

    lda_model =  LdaMulticore(
        bow_corpus
        ,num_topics = 30
        ,id2word = dictionary                            
        ,passes = 10
        ,workers = 2
    )

    for idx, topic in lda_model.print_topics(-1):
        print('Topic: {} \nWords: {}'.format(idx, topic))
    
    return lda_model


# # 2. Run Experiments

# In[73]:


def run_experiment(data, sample_size):
    '''run experiments on sample of data'''
    
    # Extract sample subset of dataset
    df = data.copy().reset_index()
    df = df.iloc[np.random.randint(0, len(df), sample_size)]

    # 1. Preprocessing tweets
    df['tweet_clean'] = clean_tweets(df['full_text'])

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


# In[74]:


# run experiment, given data and sample size
run_experiment(first_debate_df, 10000)


# In[ ]:




