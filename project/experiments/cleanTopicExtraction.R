# To get clean up the topics and applying a mapping systematically.
# Approach is:
# Step 1. Create a mapping from parameters to theme.
# Step 2. Map back parameters to themes.

setwd("E:/Google Drive/01_Studies/2020 Sem 1 Spring/Gatech_CSE_6242_DVA/Team_Project/Test")
require(data.table)
library(stringi)
db <- fread('group_by_state.csv')

# Step 1. Create a mapping from parameters to theme.
WordsList <- list()
for (i in 1:nrow(db)){
  print(i)
  topic_1 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_1[i]), "\\s+")[[1]]
  topic_1 <- topic_1[2:length(topic_1)]
  topic_2 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_2[i]), "\\s+")[[1]]
  topic_2 <- topic_2[2:length(topic_2)]
  topic_3 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_3[i]), "\\s+")[[1]]
  topic_3 <- topic_3[2:length(topic_3)]
  topic_4 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_4[i]), "\\s+")[[1]]
  topic_4 <- topic_4[2:length(topic_4)]
  topic_5 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_5[i]), "\\s+")[[1]]
  topic_5 <- topic_5[2:length(topic_5)]
  all_topics <- c(topic_1,topic_2,topic_3,topic_4,topic_5)
  WordsList[[i]] <- data.table(Words=all_topics)
}
WordsList <- rbindlist(WordsList)
View(WordsList[,.N,Words])
fwrite(WordsList[,.N,Words],"Theme_Mapping.csv")

# Step 2. Map back parameters to themes.
Theme_map <- fread("Theme_Mapping.csv")
theme_list <- list()
for (i in 1:nrow(db)){
  print(i)
  topic_1 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_1[i]), "\\s+")[[1]]
  topic_1 <- topic_1[2:length(topic_1)]
  topic_2 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_2[i]), "\\s+")[[1]]
  topic_2 <- topic_2[2:length(topic_2)]
  topic_3 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_3[i]), "\\s+")[[1]]
  topic_3 <- topic_3[2:length(topic_3)]
  topic_4 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_4[i]), "\\s+")[[1]]
  topic_4 <- topic_4[2:length(topic_4)]
  topic_5 <- strsplit(gsub("[^[:alpha:] ]", "", db$top_theme_5[i]), "\\s+")[[1]]
  topic_5 <- topic_5[2:length(topic_5)]
  all_topics <- c(topic_1,topic_2,topic_3,topic_4,topic_5)
  temp <- data.table(Words=all_topics)
  temp <- merge(temp, Theme_map[,c("Words","Theme")], by="Words", all.x=T)
  temp <- temp[Theme!="NULL"]
  temp <- temp[,.N,Theme]
  setorder(temp, -N)
  theme_list[[i]] <- data.table(Date = db[i]$Date
                                , State = db[i]$State
                                , Theme_1 = temp[1]$Theme
                                , Theme_2 = temp[2]$Theme
                                , Theme_3 = temp[3]$Theme)
}
theme_list <- rbindlist(theme_list)
db <- merge(db,
            theme_list,
            by=c("Date","State"),
            all.x = T)
db[,top_theme_1:=NULL][,top_theme_2:=NULL][,top_theme_3:=NULL][,top_theme_4:=NULL][,top_theme_5:=NULL]
fwrite(db, 'group_by_state_final.csv')
