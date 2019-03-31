import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';

import { isAuthenticated, isMessageOwner } from './authorization';
import pubsub, { EVENTS } from "../subscription";

const toCursorHash = string => Buffer.from(string).toString('base64');

const fromCursorHash = hashedString => Buffer.from(hashedString, 'base64').toString('ascii');

export default {
    Query: {
        messages: async (parent, { cursor, limit = 100}, { models }) => {
            const cursorOptions = cursor
                ? {
                    where: {
                        createdAt: {
                            [Sequelize.Op.lt]: fromCursorHash(cursor),
                        },
                    },
                }
                : {};

            const messages = await models.Message.findAll({
                order: [['createdAt', 'DESC']],
                limit: limit + 1,
                ...cursorOptions,
            });

            const hasNaxtPage = messages.length > limit;
            const edges = hasNaxtPage ? messages.slice(0, -1): messages;
            const endCursor = hasNaxtPage ?
                                 toCursorHash(new Date(edges[edges.length - 1].createdAt.toString()).toISOString()) : '';
            return {
                edges,
                pageInfo: {
                    hasNaxtPage,
                    endCursor
                },
            };
        },
        message: async (parant, { id }, { models }) => await models.Message.findByPk(id),
    },

    Mutation: {
        createMessage: combineResolvers(
            isAuthenticated,
            async (parent, { text }, { me, models }) =>{
                const message = await models.Message.create({
                    text,
                    userId: me.id,
                });

                pubsub.publish(EVENTS.MESSAGE.CREATED, {
                    messageCreated: { message },
                });

                return message;
            },
        ),
        deleteMessage: combineResolvers(
            isAuthenticated,
            isMessageOwner,
            async (parant, { id }, { models }) => {
                return await models.Message.destroy({ where: { id } });
            },
        ),
    },
    
    Message: {
        user: async (message, args, { loaders }) => {
            return await loaders.user.load(message.userId);
        },
    },

    Subscription: {
        messageCreated: {
            subscribe: () => pubsub.asyncIterator(EVENTS.MESSAGE.CREATED),
        },
    },

};
