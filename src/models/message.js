const message = (sequelize, DataTypes) => {
    const Message = sequelize.define('message', {
      text: {
        type: DataTypes.STRING,
        validate: { 
            notEmpty: {
                args: true,
                msg: 'Not allow emply text',
            },
        },
      },
    });
  
    Message.associate = models => {
      Message.belongsTo(models.User);
    };
  
    return Message;
  };
  
export default message;
