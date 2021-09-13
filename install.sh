#! /usr/bin/env bash 

# git clone app
cd ~/
git clone https://github.com/joshatoutthink/time-to-harvest.git
cd time-to-harvest

#install dependencies
npm install

# ask for userid
echo "harvest user id" 
read -r 
echo $REPLY

# set up .env
printf %s "ACCOUNT_ID=$1 \n USER_ID=$REPLY \n HARVEST_TOKEN=$2" > .env

# generate plist
cp ./com.joshkennedy.TimeToHarvest.plist ~/Library/LaunchAgents/

# start process
launchctl load ~/Library/LaunchAgents/com.joshkennedy.TimeToHarvest.plist
