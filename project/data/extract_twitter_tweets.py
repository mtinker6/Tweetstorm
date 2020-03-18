#!/usr/bin/env python
# coding: utf-8

# # Extract Twitter tweets - hydration + pickling

# In[1]:


get_ipython().system('jupyter nbconvert --to script extract_twitter_tweets.ipynb')


# In[ ]:


from twarc import Twarc
import json
import os as os
import math as math
import pandas as pd
from collections import defaultdict
import time

os.chdir(r'D:\Google Drive\Team_Project\03_Data_Partition')

# Set twitter keys here
consumer_key = '' 
consumer_secret = ''
access_token = ''
access_token_secret = ''
t = Twarc(consumer_key, consumer_secret, access_token, access_token_secret)


# In[64]:


def partition_data(batch_size, file, path):
    '''
    Partitions a data set into separate files with number of lines in each file determined by batch_size.
    Also returns the number of files created.
    '''
    
    os.chdir(path)

    batch_data = []
    batch_num = 0
    i = 0

    file_name = file + ".txt"
    for tweet in open(file_name,'r'):

        # once batch size reached, write out to file and start new file
        if i == batch_size:
            output_name = file + "_batch_" + str(batch_num) + ".txt"
            output_file = open(output_name, "w") 
            output_file.write("\n".join(batch_data)) 
            output_file.close()

            batch_num += 1
            batch_data = []
            i = 0

        # for each tweet, append to data
        batch_data.append(tweet.rstrip('\n'))
        i += 1

    print("   " + str(file_name) + " has been partitioned into " + str(batch_num) + " files.")
    
    return batch_num


# In[65]:


def data_to_dataframe(file, batch_print=10000, max_size=1000000):
    '''hydrate tweets and creates a dataframe from the tweets'''
    
    tweet_dict = defaultdict(list)

    skip_col = [
        'display_text_range'
        ,'entities'
        ,'user'
        ,'retweeted_status']
    
    i = 0
    
    iterator = t.hydrate(open(file))
    
    while True:
        try:           
            tweet = next(iterator)
            
            if i % batch_print == 0:
                print("      " + str(i) + ' tweets processed...')

            retweet = False
            for k in tweet:
                # for values that are not a dictionary, directly assign them
                if k not in skip_col:
                    tweet_dict[k].append(tweet[k])
                    
                elif k == 'user':
                    for user_k in tweet[k]:
                        tweet_dict[k + '_' + user_k].append(tweet[k][user_k])
                        
                elif k == 'retweeted_status':
                    retweet = True
                    tweet_dict[k + '_created_at'].append(tweet[k]['created_at'])
                    tweet_dict[k + '_id'].append(tweet[k]['id'])
                    tweet_dict[k + '_in_reply_to_status_id'].append(tweet[k]['in_reply_to_status_id'])
                    tweet_dict[k + '_in_reply_to_user_id'].append(tweet[k]['in_reply_to_user_id'])
                    tweet_dict[k + '_user_id'].append(tweet[k]['user']['id'])
                    tweet_dict[k + '_user_name'].append(tweet[k]['user']['name'])
                    tweet_dict[k + '_user_screen_name'].append(tweet[k]['user']['screen_name'])
                    tweet_dict[k + '_user_location'].append(tweet[k]['user']['location'])
                    tweet_dict[k + '_user_followers_count'].append(tweet[k]['user']['followers_count'])
                    tweet_dict[k + '_user_friends_count'].append(tweet[k]['user']['friends_count'])
                    tweet_dict[k + '_user_favourites_count'].append(tweet[k]['user']['favourites_count'])
                    tweet_dict[k + '_user_time_zone'].append(tweet[k]['user']['time_zone'])
                    tweet_dict[k + '_user_geo_enabled'].append(tweet[k]['user']['geo_enabled'])
                    tweet_dict[k + '_user_verified'].append(tweet[k]['user']['verified'])
                    tweet_dict[k + '_statuses_count'].append(tweet[k]['user']['statuses_count'])
                    tweet_dict[k + '_is_quote_status'].append(tweet[k]['is_quote_status'])
                    
            if retweet == False:
                k = 'retweeted_status'
                tweet_dict[k + '_created_at'].append(None)
                tweet_dict[k + '_id'].append(None)
                tweet_dict[k + '_in_reply_to_status_id'].append(None)
                tweet_dict[k + '_in_reply_to_user_id'].append(None)
                tweet_dict[k + '_user_id'].append(None)
                tweet_dict[k + '_user_name'].append(None)
                tweet_dict[k + '_user_screen_name'].append(None)
                tweet_dict[k + '_user_location'].append(None)
                tweet_dict[k + '_user_followers_count'].append(None)
                tweet_dict[k + '_user_friends_count'].append(None)
                tweet_dict[k + '_user_favourites_count'].append(None)
                tweet_dict[k + '_user_time_zone'].append(None)
                tweet_dict[k + '_user_geo_enabled'].append(None)
                tweet_dict[k + '_user_verified'].append(None)
                tweet_dict[k + '_statuses_count'].append(None)
                tweet_dict[k + '_is_quote_status'].append(None)
                    
            i += 1
            
            if i==max_size:
                print("      Hydration complete!")
                break
        
        except StopIteration:
            print("      Hydration complete!")
            break
            
    # remove keys that do not exist in every tweet
    tweet_dict_clean = tweet_dict.copy()
    removed_col = []
    for key in tweet_dict:
        if len(tweet_dict[key]) != len(tweet_dict['id']):
            removed_col.append(key)
            del tweet_dict_clean[key]

    print("The followings columns have been removed:")
    print(removed_col)
    
    return (tweet_dict, pd.DataFrame(dict(tweet_dict_clean)))


# In[66]:


def pickle_tweets(file_name, batch_size, batch_print, path):
    '''
    Wrapper to partition data set and then hydrate tweets in batches.
    '''
    
    print("Partitioning file ...")
    # partition file into separate files
    batch_num = partition_data(batch_size=batch_size, file=file_name, path=path)
    print("   " + str(batch_num) + " paritions created!")
    
    # loop through each file and hydrate tweets
    print("Hydrating tweets ...")
    for i in range(batch_num):
        print("   Batch " + str(i) + "...")
        file = file_name + '_batch_' + str(i) + '.txt' # assign file name
        tweet_dict, tweet_df = data_to_dataframe(file=file, batch_print=batch_print, max_size=batch_size) # hydrate tweets
        tweet_df.to_pickle(file_name + '_batch_' + str(i) + '.pkl') # pickle out file
        print("      Succesfully pickled batch " + str(i) + "!")


# In[70]:


get_ipython().run_cell_magic('time', '', 'path = r"D:\\Google Drive\\Team_Project\\03_Data_Partition"\nfile_name = \'third-debate\'\nbatch_size = 500000\nbatch_print = 100000\n\npickle_tweets(file_name, batch_size, batch_print, path)')


# In[ ]:




