#!/usr/bin/env python
# coding: utf-8

# # Functions
# This notebook contains functions that are used throughout the project. These are categorised into various purposes, as per the sub headings below.

# In[14]:


get_ipython().system(' jupyter nbconvert --to script functions.ipynb')


# In[15]:


import pandas as pd
import numpy as np
import os
import pickle
import re

from IPython.display import display
import matplotlib.pyplot as plt


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

# from functions import lemmatize_with_postag, clean_tweets, polarity_calc, subjectivity_calc, polarity_subjectivity, plot_polarity, plot_subjectivity, plot_word_cloud, extract_topic_words

pd.options.display.max_columns = None


# ## Text preprocessing

# In[16]:


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


# In[17]:


def clean_tweets(tweets):
    '''clean tweets'''
    
    nlp = English()
    
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

# In[18]:


def polarity_calc(text):
    '''determine polarity of text'''
    
    try:
        return TextBlob(text).sentiment.polarity
    except:
        return None


# In[19]:


def subjectivity_calc(text):
    '''determine subjectivity of text'''
    
    try:
        return TextBlob(text).sentiment.subjectivity
    except:
        return None


# In[20]:


def polarity_subjectivity(df):
    '''attach polarity and subjectivity to tweets'''
    
    df['polarity'] = df['tweet_clean'].apply(polarity_calc)
    df['subjectivity'] = df['tweet_clean'].apply(subjectivity_calc)
    
    return df


# In[21]:


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


# In[22]:


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


# ## Word Cloud

# In[23]:


def plot_word_cloud(df):
    '''Plot word cloud for positive and negative tweets. It also returns the preferred candidate, based on which candidate is talked about more in positive and negative tweets.'''
    
    positive_tweets = df[df['polarity']>0]
    negative_tweets = df[df['polarity']<0]

    positive_text = " ".join(tweet for tweet in positive_tweets['tweet_clean'])
    negative_text = " ".join(tweet for tweet in negative_tweets['tweet_clean'])

    positive_wordcloud = WordCloud(max_font_size=50, max_words=100, background_color="white", collocations=False).generate(positive_text)
    negative_wordcloud = WordCloud(max_font_size=50, max_words=100, background_color="white", collocations=False).generate(negative_text)

    fig, ax = plt.subplots(nrows=1, ncols=2, figsize=(20,6))
    ax[0].imshow(positive_wordcloud, interpolation="bilinear")
    ax[0].title.set_text('Positive Word Cloud')
    ax[0].axis("off")

    ax[1].imshow(negative_wordcloud, interpolation="bilinear")
    ax[1].title.set_text('Negative Word Cloud')
    ax[1].axis("off")
    fig.tight_layout()
    
    positive_word_importance = positive_wordcloud.words_
    negative_word_importance = negative_wordcloud.words_

    if (positive_word_importance['donaldtrump'] - negative_word_importance['donaldtrump']) > (positive_word_importance['hillaryclinton'] - negative_word_importance['hillaryclinton']):
        print("Donald Trump is preferred candidate overall.")
        preferred_candidate = "Donald Trump"
    else:
        print("Hillary Clinton is preferred candidate overall.")
        preferred_candidate = "Hillary Clinton"
        
    return preferred_candidate


# ## Topic Extraction

# In[26]:


def clean_tweets(tweets):
    '''clean tweets'''
    
    nlp = English()
    
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


# In[25]:


def extract_topic_words(df):
    '''extract topic words'''
    
    processed_docs = df['tweet_clean'].map(word_tokenize) # tokenize each tweet
    dictionary = gensim.corpora.Dictionary(processed_docs) # create dictionary with count of each word
    dictionary.filter_extremes(no_below=100, no_above=0.5, keep_n=1000) # set criteria for tokens that are kept
    bow_corpus = [dictionary.doc2bow(doc) for doc in processed_docs] # create dictionary of word count for each tweet

    lda_model =  LdaMulticore(
        bow_corpus
        ,num_topics = 3
        ,id2word = dictionary                            
        ,passes = 10
        ,workers = 2
    )

    for idx, topic in lda_model.print_topics(-1):
        print('Topic: {} \nWords: {}'.format(idx, topic))
    
    return lda_model


# In[ ]:




