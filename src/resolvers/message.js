import { combineResolvers } from 'graphql-resolvers';
import { isAuthenticated, isMessageOwner } from './authorization';

export default {
    Query: {
        messages: async (parent, {offset = 0, limit = 100}, { models }) => {
            console.log(parent);
            return await models.Message.findAll({
                order: [['createdAt', 'DESC']],
                offset,
                limit,
            });
        },
        message: async (parant, { id }, { models }) => await models.Message.findByPk(id),
    },

    Mutation: {
        createMessage: combineResolvers(
            isAuthenticated,
            async (parent, { text }, { me, models }) =>{
                return await models.Message.create({
                    text,
                    userId: me.id,
                });
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
        user: async (message, args, { models }) => await models.User.findByPk(message.userId),
    },

};
