# -*- coding: utf-8 -*-
"""
Created on Sat Mar 28 09:02:14 2020

@author: ML
"""
def getGraphData(N = 50):
    
    # Import all data
    import pandas as pd
    all_datasets = ['first_debate','second_debate','third_debate','vp_debate','election_day'] 
    all_data_read = [i + '_all.pkl' for i in  all_datasets]
    all_data_write = [i + '_for_graph.pkl' for i in  all_datasets]

    # For each data set, find the most active N connections and delete everything else
    for i in range(len(all_data_read)):
        df = pd.read_pickle(all_data_read[i])
        df = df[df['retweeted_status_user_screen_name'].notnull()]
        df = df[df['user_screen_name'].notnull()]
        df = df[['user_screen_name','retweeted_status_user_screen_name']]
        df = df.rename(columns={"retweeted_status_user_screen_name": "Source", "user_screen_name": "Target"})
        df = df.reset_index(drop=True)

        # Some filtering to remove limited followers
        df_summary = df.groupby(['Source','Target']).size().to_frame(name = 'Count').reset_index().sort_values(by=['Source','Count'], ascending=False)
        df_summary = df_summary[df_summary['Count']>N].reset_index(drop=True)
        df = df.merge(df_summary, left_on=['Source','Target'], right_on=['Source','Target'])
        del df['Count']
        df['Date'] = all_datasets[i]
        df.to_pickle(all_data_write[i])
     
    # rbind the data sets together
    df1 = pd.read_pickle(all_data_write[0])
    df2 = pd.read_pickle(all_data_write[1])
    df3 = pd.read_pickle(all_data_write[2])
    df4 = pd.read_pickle(all_data_write[3])
    df5 = pd.read_pickle(all_data_write[4])
    df = df1.append(df2)
    df = df.append(df3)
    df = df.append(df4)
    df = df.append(df5)
    df.to_csv('for_graph.csv')
