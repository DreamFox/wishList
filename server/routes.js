/**
 * Main application routes
 */

'use strict';

var models = require("./models");
var Gift = models.Gift;
var Info = models.Info;
require("express-mongoose");

module.exports = function(app) {

    app.route('/gift')
        .get(function (req, res) {
            res.send(Gift.find());
        })
        .post(function (req, res) {
            res.send(Gift.create({
                label : req.param('label'),
                checked : req.param('checked')
            }));
        })
        .put(function (req, res) {
            res.send(Gift.update({
                checked: !req.param('checked')
            }, {
                checked: !!req.param('checked')
            }, {
                multi: true
            }));
        })
        .delete(function (req, res) {
            res.send(Gift.remove({
                checked: req.param('checked') == 'true' ?
                    true : false
            }));
        });
    app.route('/gift/:id')
        .put(function (req, res) {
            res.send(Gift.update({
                _id: req.param('id')
            }, {
                $set: {
                    label: req.param('label'),
                    link: req.param('link'),
                    donor: req.param('donor'),
                    userId: req.param('userId'),
                    checked: req.param('checked')
                }
            }));
        })
        .delete(function (req, res) {
            res.send(Gift.remove({
                _id: req.param('id')
            }));
        });
    app.route('/info')
        .get(function (req, res) {

        });
    app.route('/info/:user')
        .get(function (req ,res) {Info.find({
                user: new RegExp('dreamfox', 'i')
            }, function (err, infos) {
                if (infos.length > 0) {
                    res.json(200, infos[0])
                } else {
                    res.json(200, {});
                }
            });
        })
        .put(function (req, res) {
            Info.find({
                user: new RegExp('dreamfox', 'i')
            }, function (err, info) {
                console.log(info);
                if (err || !info.length) {
                    res.send(Info.create({
                        user: 'dreamfox',
                        name: req.param('name'),
                        address: req.param('address'),
                        phone: req.param('phone')
                    }));
                    return;
                }
                console.log('update', req.param('_id'), req.param('name'));
                res.send(Info.update({
                    _id: req.param('_id')
                }, {
                    $set: {
                        name: req.param('name'),
                        address: req.param('address'),
                        phone: req.param('phone')
                    }
                }));
            });
        });

};
