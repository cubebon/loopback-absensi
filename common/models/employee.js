'use strict';

module.exports = function (Employee) {
    Employee.disableRemoteMethodByName('createChangeStream');
    Employee.disableRemoteMethodByName('count');
    Employee.disableRemoteMethodByName('exists');
    Employee.disableRemoteMethodByName('patchOrCreate');
    Employee.disableRemoteMethodByName('replaceOrCreate');
    Employee.disableRemoteMethodByName('findOne');
    Employee.disableRemoteMethodByName('destroyById');
    Employee.disableRemoteMethodByName('deleteById');
    Employee.disableRemoteMethodByName('replaceById');

    Employee.validatesUniquenessOf('email', { message: 'Email already exists' });

    Employee.observe('before save', function hashPassword(ctx, next) {
        if (!ctx.isNewInstance) {
            return next();
        }

        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const plainPassword = ctx.instance.password;

        bcrypt.hash(plainPassword, saltRounds, function (err, hash) {
            if (err) {
                return next(err);
            }

            ctx.instance.password = hash;
            next();
        });
    });

    Employee.remoteMethod('login', {
        accepts: [
            { arg: 'email', type: 'string', required: true },
            { arg: 'password', type: 'string', required: true },
        ],
        returns: { arg: 'accessToken', type: 'object', root: true },
        http: { verb: 'post', path: '/login' },
    });

    Employee.login = function (email, password, cb) {
        Employee.findOne({ where: { email } }, function (err, employee) {
            if (err) {
                return cb(err);
            }

            if (!employee) {
                const error = new Error('Email not found');
                error.statusCode = 401;
                error.code = 'EMAIL_NOT_FOUND';
                return cb(error);
            }

            const bcrypt = require('bcrypt');
            const plainPassword = password;

            bcrypt.compare(plainPassword, employee.password, function (err, result) {
                if (err) {
                    return cb(err);
                }

                if (!result) {
                    const error = new Error('Incorrect password');
                    error.statusCode = 401;
                    error.code = 'INCORRECT_PASSWORD';
                    return cb(error);
                }

                const AccessToken = Employee.app.models.AccessToken;

                AccessToken.create({ userId: employee.id }, function (err, accessToken) {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, accessToken);
                });
            });
        });
    };

    
};