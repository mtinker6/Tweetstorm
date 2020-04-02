#!/usr/bin/env python
# coding: utf-8

# # Emoji Analytics

# In this notebook, we will load in the pickled tweets regarding the 2016 US election, etract emojis and analyse them to see what information we can gain from the emojis.

# In[4]:


get_ipython().system('jupyter nbconvert --to script emoji_analytics.ipynb')


# In[2]:


from functions import *
import re


# We first load in the data for each event.

# In[3]:


# load pickle files
first_debate_df = pd.read_pickle('first_debate_all.pkl')
second_debate_df = pd.read_pickle('second_debate_all.pkl')
third_debate_df = pd.read_pickle('third_debate_all.pkl')
vp_debate_df = pd.read_pickle('vp_debate_all.pkl')
election_day_df = pd.read_pickle('election_day_all.pkl')


# ## Categorisation of emojis

# Many emojis are classified into 5 categories:
# - sadness
# - suprise
# - joy
# - disgust
# - uncertain

# In[ ]:


SADNESS_EMOJI = [
    '😔','😥','😩','😫','🤕','😦','😧','😓','😭','😒','😯','☹️','🙁','😢','😟','🤥','😞','😨','😰','🤒','😷','😿','😪','😌','👎'
]

SUPRISE_EMOJI = [
    '🤯','😂','😆','😛','😜','😝','🤓','😹','😅','😲','😮','🙀','😱','👻','👽','🤖','🤡','😈','😼'
]

JOY_EMOJI = [
    '😀','😁','😃','😄','😄','😉','😊','😎','😋','😙','😚','☺️','🙂','🤗','🤩','😘','🥰','😻','😍','😇','😸','😺','😄','😽','🥳','🤠','🤤','🤭','🤑','🙏','👍'
]

DISGUST_EMOJI = [
    '🥵','🥶','🤬','🤢','🤮','🤧','😤','😡','😖','😣','😠','😾','👿','💀','👹','👺','💩','🖕'
]

UNCERTAIN_EMOJI = [
    '😕','🤔','🤨','😐','😑','😶','🙄','😬','🤪','😵','😗','😏','🧐','🥴','😅','🙃','🥺','😳','😴','🤐','🤫','🤞'
]


# In[121]:


# store all the emojis in a list, and assign string names to each emoji
sadness_emoji_name = ['sadness_' + str(i) for i in range(len(SADNESS_EMOJI))]
suprise_emoji_name = ['suprise_' + str(i) for i in range(len(SUPRISE_EMOJI))]
joy_emoji_name = ['joy_' + str(i) for i in range(len(JOY_EMOJI))]
disgust_emoji_name = ['disgust_' + str(i) for i in range(len(DISGUST_EMOJI))]
uncertain_emoji_name = ['uncertain_' + str(i) for i in range(len(UNCERTAIN_EMOJI))]

emoji_name = sadness_emoji_name + suprise_emoji_name + joy_emoji_name + disgust_emoji_name + uncertain_emoji_name
emoji_symbol = SADNESS_EMOJI + SUPRISE_EMOJI + JOY_EMOJI + DISGUST_EMOJI + UNCERTAIN_EMOJI

# create emoji mapping
emoji_mapping = pd.DataFrame(zip(emoji_name, emoji_symbol))
emoji_mapping.columns = ['name','symbol']


# ## Summary of emoji analytics

# In[118]:


def emoji_analytics(df):
    '''summarise emojis used in tweets'''
    
    # create column for each emoji and indicator for if emoji in tweet
    for name, symbol in list(zip(emoji_name, emoji_symbol)):
        df[name] = df['full_text'].apply(lambda tweet: 1 if symbol in tweet else 0)
    
    # create dataframe with count of each emoji
    emoji_all_count = pd.DataFrame(df[emoji_name].sum()).reset_index()
    emoji_all_count.columns = ['name','count']
    emoji_all_count.sort_values(by='count', inplace=True, ascending=False)
    emoji_all_count = emoji_all_count.reset_index(drop=True)
    emoji_df = pd.merge(emoji_all_count, emoji_mapping, on='name', how='left')
    emoji_df['category'] = emoji_df['name'].apply(lambda x: re.sub("[^a-z]","",x))
    
    return (df, emoji_df)


# In[182]:


def hex_to_RGB(hex):
    ''' "#FFFFFF" -> [255,255,255] '''
    # Pass 16 to the integer function for change of base
    return [int(hex[i:i+2], 16) for i in range(1,6,2)]

def RGB_to_hex(RGB):
    ''' [255,255,255] -> "#FFFFFF" '''
    # Components need to be integers for hex to make sense
    RGB = [int(x) for x in RGB]
    return "#"+"".join(["0{0:x}".format(v) if v < 16 else
            "{0:x}".format(v) for v in RGB])

def color_dict(gradient):
    ''' Takes in a list of RGB sub-lists and returns dictionary of
    colors in RGB and hex form for use in a graphing function
    defined later on '''
    
    return {"hex":[RGB_to_hex(RGB) for RGB in gradient],
      "r":[RGB[0] for RGB in gradient],
      "g":[RGB[1] for RGB in gradient],
      "b":[RGB[2] for RGB in gradient]}

def linear_gradient(start_hex, finish_hex="#FFFFFF", n=10):
    '''returns a gradient list of (n) colors between
    two hex colors. start_hex and finish_hex
    should be the full six-digit color string,
    inlcuding the number sign ("#FFFFFF") '''
    
    # Starting and ending colors in RGB form
    s = hex_to_RGB(start_hex)
    f = hex_to_RGB(finish_hex)
    # Initilize a list of the output colors with the starting color
    RGB_list = [s]
    # Calcuate a color at each evenly spaced value of t from 1 to n
    for t in range(1, n):
        # Interpolate RGB vector for color at the current value of t
        curr_vector = [
          int(s[j] + (float(t)/(n-1))*(f[j]-s[j]))
          for j in range(3)
        ]
        # Add it to our list of output colors
        RGB_list.append(curr_vector)

    return color_dict(RGB_list)


# In[122]:


first_debate_emoji_df, first_debate_emoji_analytics = emoji_analytics(first_debate_df)
second_debate_emoji_df, second_debate_emoji_analytics = emoji_analytics(second_debate_df)
third_debate_emoji_df, third_debate_emoji_analytics = emoji_analytics(third_debate_df)
vp_debate_emoji_df, vp_debate_emoji_analytics = emoji_analytics(vp_debate_df)
election_day_emoji_df, election_day_emoji_analytics = emoji_analytics(election_day_df)


# In[218]:


def plot_hierarchical_pie_chart(df, title):
    
    # value for each emoji category
    sadness_list = list(df.loc[df['category']=='sadness','count'])
    suprise_list = list(df.loc[df['category']=='suprise','count'])
    joy_list = list(df.loc[df['category']=='joy','count'])
    disgust_list = list(df.loc[df['category']=='disgust','count'])
    uncertain_list = list(df.loc[df['category']=='uncertain','count'])

    # value of inner and outer rings based on emoji frequencies
    inner_val = [sum(sadness_list), sum(suprise_list), sum(joy_list), sum(disgust_list), sum(uncertain_list)]
    outer_val = sadness_list + suprise_list + joy_list + disgust_list + uncertain_list

    # colours for outer ring
    sadness_colours = linear_gradient(start_hex='#0066ff', n=len(sadness_list))['hex']
    suprise_colours = linear_gradient(start_hex='#ffcc00', n=len(suprise_list))['hex']
    joy_colours = linear_gradient(start_hex='#ff33cc', n=len(joy_list))['hex']
    disgust_colours = linear_gradient(start_hex='#009933', n=len(disgust_list))['hex']
    uncertain_colours = linear_gradient(start_hex='#3d3d5c', n=len(uncertain_list))['hex']

    # label for outer ring
    df = df.sort_values(by=['category','count'],ascending=False)
    df['label'] = df.apply(lambda row: row['symbol'] if row['count'] >100 else '', axis=1)

    sadness_label = list(df.loc[df['category']=='sadness','label'])
    suprise_label = list(df.loc[df['category']=='suprise','label'])
    joy_label = list(df.loc[df['category']=='joy','label'])
    disgust_label = list(df.loc[df['category']=='disgust','label'])
    uncertain_label = list(df.loc[df['category']=='uncertain','label'])
    
    # plot hierarchical pie chart
    fig, ax = plt.subplots()
    fig.set_size_inches(18.5, 10.5)
    size = 0.3

    outer_colors = np.array(sadness_colours + suprise_colours + joy_colours + disgust_colours + uncertain_colours)
    inner_colors = np.array(['#0066ff','#ffcc00','#ff33cc','#009933','#3d3d5c'])

    ax.pie(outer_val, labels=sadness_label + suprise_label + joy_label + disgust_label + uncertain_label, labeldistance=0.9
           ,radius=1, colors=outer_colors,
           wedgeprops=dict(width=size, edgecolor='w'))

    ax.pie(inner_val, labels=['sadness','suprise','joy','disgust','uncertain'], labeldistance=0.7
           ,radius=1-size, colors=inner_colors,
           wedgeprops=dict(width=size, edgecolor='w'))

    ax.set(aspect="equal", title=title)
    plt.show()


# In[219]:


plot_hierarchical_pie_chart(df=first_debate_emoji_analytics, title='First Debate')


# In[220]:


plot_hierarchical_pie_chart(df=second_debate_emoji_analytics, title='Second Debate')


# In[221]:


plot_hierarchical_pie_chart(df=third_debate_emoji_analytics, title='Third debate')


# In[222]:


plot_hierarchical_pie_chart(df=vp_debate_emoji_analytics, title='Vp debate')


# In[223]:


plot_hierarchical_pie_chart(election_day_emoji_analytics, title='Election day')


# In[227]:


first_debate_emoji_analytics.to_csv('first_debate_emoji_analytics.csv')
second_debate_emoji_analytics.to_csv('second_debate_emoji_analytics.csv')
third_debate_emoji_analytics.to_csv('third_debate_emoji_analytics.csv')
vp_debate_emoji_analytics.to_csv('vp_debate_emoji_analytics.csv')
election_day_emoji_analytics.to_csv('election_day_emoji_analytics.csv')


# In[ ]:




