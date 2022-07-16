FROM mcr.microsoft.com/playwright:v1.22.0-focal

# RUN apt-get update

RUN mkdir /home/app
WORKDIR /home/app

COPY . ./

RUN yarn install

EXPOSE 3000
EXPOSE 27017
CMD [ "yarn", "run", "serve" ]