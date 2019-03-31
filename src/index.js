import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { ApolloServer, AuthenticationError } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import http from 'http';
import DataLoader from 'dataloader';

import resolvers from './resolvers';
import schema from './schema';
import models, { sequelize } from './models';
import loaders from './loaders';

const app = express();

app.use(cors());

const getMe = async req => {
    const token = req.headers['x-token'];
    if(token){
        try{
            const user = await jwt.verify(token, process.env.JWT_SECRET);
            return user;
        }catch (e) {
            throw new AuthenticationError(
                'Your session expired. Sign in again.',
            );
        }
    }
}


// // this will caching users data
// const userLoader =  new DataLoader(keys => loaders.user.batchUsers(keys, models));

const server = new ApolloServer({
    introspection: true,
    playground: true,
    typeDefs: schema,
    resolvers,
    formatError: error => {
        // remove the internal sequelize error message
        // leave only the important validation error
        const message = error.message
          .replace('SequelizeValidationError: ', '')
          .replace('Validation error: ', '');
    
        return {
          ...error,
          message,
        };
    },
    context: async ({ req, connection }) => {
        if(connection){
            return {
                models,
                loaders: {
                    user: new DataLoader(keys =>
                        loaders.user.batchUsers(keys, models),
                    ),
                },
            };
        }

        if(req){
            const me = await getMe(req);
            return {
                models,
                me: await getMe(req),
                secret: process.env.JWT_SECRET,
                loaders: {
                    user: new DataLoader( keys =>
                        loaders.user.batchUsers(keys, models),
                    ),
                },
            };
        }
    },
});

server.applyMiddleware({app, path: '/graphql'});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const isTest  = process.env.TEST_DATABASE ? true : false;
const isProduction = !!process.env.DATABASE_URL;

const port = process.env.PORT || 4040;

sequelize.sync({ force: isTest || isProduction }).then(async () => {
    if (isTest || isProduction) {
        await createUsersWithMessages(new Date());
    }

    httpServer.listen({ port }, () => {
        console.log(`Apollo Server running on http://localhost:${port}/graphql`);
    });
});



const createUsersWithMessages = async date => {
    await models.User.create(
      {
        id:'1',
        username: 'mos1',
        email: 'mos1@hotmail.com',
        password: '1234567',
        role: 'ADMIN',
        messages: [
          {
            text: 'Published the Road to learn React',
            createAt: date.setSeconds(date.getSeconds() + 1),
          },
        ],
      },
      {
        include: [models.Message],
      },
    );
  
    await models.User.create(
      {
        id:'2',
        username: 'mos2',
        email: 'mos2@hotmail.com',
        password: '1234567',
        messages: [
          {
            text: 'Happy to release ...',
            createAt: date.setSeconds(date.getSeconds() + 1),
          },
          {
            text: 'Published a complete ...',
            createAt: date.setSeconds(date.getSeconds() + 1),
          },
        ],
      },
      {
        include: [models.Message],
      },
    );
  };
