# -*- coding: utf-8 -*-
"""
Created on Sat Mar 28 09:02:14 2020

@author: ML
"""
def plot_word_cloud_Minhao(df):
    '''Plot word cloud for positive and negative tweets'''
    
    positive_tweets = df[df['polarity']>0]
    negative_tweets = df[df['polarity']<0]

    positive_text = " ".join(tweet for tweet in positive_tweets['tweet_clean'])
    negative_text = " ".join(tweet for tweet in negative_tweets['tweet_clean'])

    positive_wordcloud = WordCloud(max_font_size=50, max_words=100, background_color="white", collocations=False).generate(positive_text)
    negative_wordcloud = WordCloud(max_font_size=50, max_words=100, background_color="white", collocations=False).generate(negative_text)

    positive_word_importance = positive_wordcloud.words_
    negative_word_importance = negative_wordcloud.words_

    if (positive_word_importance['donaldtrump'] - negative_word_importance['donaldtrump']) > (positive_word_importance['hillaryclinton'] - negative_word_importance['hillaryclinton']):
        print("Donald Trump is preferred candidate overall.")
        preferred_candidate = "Donald Trump"
    else:
        print("Hillary Clinton is preferred candidate overall.")
        preferred_candidate = "Hillary Clinton"

    fig, ax = plt.subplots(nrows=1, ncols=2, figsize=(20,6))
    ax[0].imshow(positive_wordcloud, interpolation="bilinear")
    ax[0].title.set_text('Positive Word Cloud')
    ax[0].axis("off")

    ax[1].imshow(negative_wordcloud, interpolation="bilinear")
    ax[1].title.set_text('Negative Word Cloud')
    ax[1].axis("off")
    fig.tight_layout()
    return(preferred_candidate)
    
def extract_topic_words_Minhao(df):
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

def run_experiment_Minhao(data, sample_size):
    '''run experiments on sample of data'''
    
    # Extract sample subset of dataset
    df = data.copy().reset_index()
    df = df.iloc[np.random.randint(0, len(df), sample_size)]

    # 1. Preprocessing tweets
    df['tweet_clean'] = clean_tweets(df['full_text'])

    # 2. Sentiment Analysis
    df = polarity_subjectivity(df) # attach polarity and subjectivity
    mean_polarity = np.mean(df['polarity'])
    mean_subjectivity = np.mean(df['subjectivity'])
    fig, ax = plt.subplots(nrows=1, ncols=2, figsize=(20,6))
    plot_polarity(df, ax[0])
    plot_subjectivity(df, ax[1])
    fig.tight_layout()

    # 3. Word Cloud
    preferred_candidate = plot_word_cloud_Minhao(df)

    # 4. Topic Extraction
    lda_model = extract_topic_words_Minhao(df)
    return(lda_model, preferred_candidate, mean_polarity, mean_subjectivity)
    
def getStateLevelData():
    # run experiment, given data and sample size
    states_map = pd.read_csv('states_map.csv')
    all_datasets = ['first_debate','second_debate','third_debate','vp_debate','election_day'] 
    all_data_read = [i + '_all.pkl' for i in  all_datasets]
    all_data_write = [i + '_groupby_states.pkl' for i in  all_datasets]

    for i in range(len(all_data_read)):
        temp = pd.read_pickle(all_data_read[i])
        temp = temp.merge(states_map, left_on='user_location', right_on='user_location')
        temp = temp.dropna(subset=['State'])
        all_states = temp.groupby('State').count().reset_index()['State']
        full_dict = dict()
        for ind, val in all_states.iteritems():
            print(ind, val)
            temp_data = temp.loc[temp['State'] == val]
            lda_model, candidate, mean_polarity, mean_subjectivity = run_experiment_Minhao(temp_data, min(len(temp.index), 2000))
            temp_dict = dict()
            temp_dict['preferred_candidate']=candidate
            temp_dict['polarity']=mean_polarity
            temp_dict['subjectivity']=mean_subjectivity
            temp_dict['top_theme_1']=lda_model.print_topics(0)
            temp_dict['top_theme_2']=lda_model.print_topics(1)
            temp_dict['top_theme_3']=lda_model.print_topics(2)
            temp_dict['top_theme_4']=lda_model.print_topics(3)
            temp_dict['top_theme_5']=lda_model.print_topics(4)
        full_dict[val] = temp_dict
        db = pd.DataFrame.from_dict(full_dict).T.rename_axis('State').reset_index()
        db['Date'] = all_datasets[i]
        db.to_pickle(all_data_write[i])
    
