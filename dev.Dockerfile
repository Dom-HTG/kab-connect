#-----------DEVELOPMENT DOCKERFILE-----------#

#------------- BUILD STAGE -------------#

FROM node:22-alpine as builder

WORKDIR /app

# copy and install dependencies.
COPY package*.json ./
RUN npm install

# copy application source code.
COPY . .

ENV NODE_ENV=development

EXPOSE 8081

CMD ["npm","run" ,"start:dev"]