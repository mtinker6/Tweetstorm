#!/usr/bin/env python
# coding: utf-8

# # Combining the pickle files
# 
# In this notebook, we will combine the pickled batch files into one and output a single pickled file with all the data.

# In[1]:


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


# In[2]:


def get_data_list(path = r"..\03_Data_Partition\pickled data"):
    '''Load all pickled data in provided directory into dictionary'''
    
    # unpickle all datasets
    directory = os.fsencode(path)

    first_debate_list = {}
    second_debate_list = {}
    third_debate_list = {}

    for file in os.listdir(directory):
        filename = os.fsdecode(file)

        if "first-debate" in filename:
            first_debate_list[re.sub(".pkl","",filename)] = pickle.load(open(path + "\\" + filename, 'rb'))

        if "second-debate" in filename:
            second_debate_list[re.sub(".pkl","",filename)] = pickle.load(open(path + "\\" + filename, 'rb'))

        if "third-debate" in filename:
            third_debate_list[re.sub(".pkl","",filename)] = pickle.load(open(path + "\\" + filename, 'rb'))
            
    return (first_debate_list, second_debate_list, third_debate_list)


# In[3]:


def combine_data(batch_dict):
    '''Combine all dataframes in dictionary into one dataframe'''
    
    # combine unpickled datasets into single dataframe
    first = True
    for df in batch_dict:
        if first == True:
            common_columns = set(batch_dict[df].columns)
            first = False
        else:
            common_columns = common_columns.intersection(set(batch_dict[df].columns))

    data = pd.DataFrame()
    for df in batch_dict:
        data = pd.concat([data, batch_dict[df][list(common_columns)]], axis=0)
        
    return data


# In[4]:


def extract_full_data(path = r"..\03_Data_Partition\pickled data"):
    # load each of the pickled batches into dataframes
    first_debate_list, second_debate_list, third_debate_list = get_data_list(path)

    # combine all the dataframes into one for each event
    first_debate_df = combine_data(first_debate_list)
    second_debate_df = combine_data(second_debate_list)
    third_debate_df = combine_data(third_debate_list)

    # export as pickles files so do not need to load again
    first_debate_df.to_pickle('first_debate_all.pkl')
    second_debate_df.to_pickle('second_debate_all.pkl')
    third_debate_df.to_pickle('third_debate_all.pkl')


# In[ ]:


# write out pkl file for each data set
extract_full_data()


# In[1]:


# # load pickle files
# first_debate_df = pd.read_pickle('first_debate_all.pkl')
# second_debate_df = pd.read_pickle('second_debate_all.pkl')
# third_debate_df = pd.read_pickle('third_debate_all.pkl')


# In[ ]:




