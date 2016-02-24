Parse.serverURL = "http://localhost:1337/parse";

var pusher = require('./pusher');

Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});

Parse.Cloud.define('question_like', function(req, res) {

    Parse.Cloud.useMasterKey();
    
    var likerId = req.params.likerId;
    var likedQuestionId = req.params.likedQuestionId;

    var questionLike = Parse.Object.extend("questionLike");
    
    var qLike = new questionLike();

    qLike.set("likerId", likerId);
    qLike.set("likedQuestionId", likedQuestionId);

    qLike.save(null).then(function() {
        res.success("success");
        console.log("q id: " + likedQuestionId + "\n" + "likerId id: " + likerId);
        
        
        var questionObject = Parse.Object.extend("question");
        var query = new Parse.Query(questionObject);
       
        query.get(likedQuestionId, {
            success: function(qObj) {
                qObj.increment("likes");
                qObj.save(null).then(function() {
                    //res.success("success");
                    var notifObject = Parse.Object.extend("notification");
                    var notifObj = new notifObject();
                    notifObj.set("unseen", true);
                    notifObj.set("userId", qObj.get("askerId"));
                    notifObj.set("notificationType", "like");
                    notifObj.set("performerName", req.user.get("name"));
                    notifObj.set("targetType", "question");
                    notifObj.set("targetId", likedQuestionId);
                    notifObj.set("likerId", req.user.id);

                    notifObj.save(null).then(function() {
                       // send a push to the user
                       var message = '';
                       message += req.user.get('name') + " ";
                       message += 'از';
                       message += ' ' + 'سوال';
                       message += ' ' + 'شما';
                       message += ' ' + 'خوشش اومد';
                       pusher.push(qObj.get("askerId"), message);

                       // increment the user's likes count
                       qObj.get("user").increment("likesCount");
                       qObj.save().then(function() {
                          
                       }, function(error) {
                           console.log(error);
                       });
                    }, function(error) {
                        console.log(error);
                    });
                }, function(error) {
                    console.log(error);
                    res.error(error.message);
                });
            },
            error: function(error) {
                console.log(error.message);
                res.error(error.message);
            }
        });
        
    }, function(error) {
        console.log(error.message);
        res.error("error " + error.message);
    });


});

Parse.Cloud.define('answer_like', function(req, res) {

    Parse.Cloud.useMasterKey();
    
    var likerId = req.params.likerId;
    var likedAnswerId = req.params.likedAnswerId;
    var likedQuestionId = req.params.likedQuestionId;

    var answerLike = Parse.Object.extend("answerLike");
    
    var aLike = new answerLike();

    aLike.set("likerId", likerId);
    aLike.set("likedAnswerId", likedAnswerId);

    aLike.save(null).then(function() {
        res.success("success");
        console.log("a id: " + likedAnswerId + "\n" + "likerId id: " + likerId);
        
        
        var answerObject = Parse.Object.extend("answer");
        var query = new Parse.Query(answerObject);
       
        query.get(likedAnswerId, {
            success: function(aObj) {
                aObj.increment("likes");
                aObj.save(null).then(function() {
                    var notifObject = Parse.Object.extend("notification");
                    var notifObj = new notifObject();
                    notifObj.set("unseen", true);
                    notifObj.set("userId", aObj.get("answererId"));
                    notifObj.set("notificationType", "like");
                    notifObj.set("performerName", req.user.get("name"));
                    notifObj.set("targetType", "answer");
                    notifObj.set("targetId", likedQuestionId);
                    notifObj.set("likerId", req.user.id);

                    notifObj.save(null).then(function() {
                       // send a push to the user
                       var message = '';
                       message += req.user.get('name') + " ";
                       message += 'از';
                       message += ' ' + 'پاسخ';
                       message += ' ' + 'شما';
                       message += ' ' + 'خوشش اومد';
                       pusher.push(qObj.get("answererId"), message);
                       qObj.get("user").increment("likesCount");
                       qObj.save().then(function() {
                           
                       }, function(error) {
                           console.log(error);
                       });
                    }, function(error) {
                        console.log(error);
                    });
                }, function(error) {
                    console.log(error);
                    res.error(error.message);
                });
            },
            error: function(error) {
                console.log(error.message);
                res.error(error.message);
            }
        });
        
    }, function(error) {
        console.log(error.message);
        res.error("error " + error.message);
    });


});

Parse.Cloud.define('choose_best_answer', function(req, res) {
    Parse.Cloud.useMasterKey();

    var askerId = req.params.askerId;
    var questionId = req.params.questionId;
    var answerId = req.params.answerId;
    var performerName = req.params.performerName;

    console.log(askerId + ' ' + questionId + ' ' + answerId + ' ' + performerName);
    // make sure the question belongs to the asker
    var questionObj = Parse.Object.extend("question");
    var query = new Parse.Query(questionObj);
    query.equalTo("askerId", askerId);
    query.equalTo("objectId", questionId);
    query.find({
        success: function(qObj) {
            // update the question best answer specific fields
            qObj[0].set('hasBestAnswer', true);
            qObj[0].set('bestAnswerId', answerId);
            qObj[0].save(null).then(function(updatedObj) {
                res.success(answerId);
                // update the answer
                var query = new Parse.Query(Parse.Object.extend('answer'));
                query.get(answerId, {
                    success: function(aObj) {
                        aObj.set('isBestAnswer', true);
                        aObj.save(null).then(function(updatedObj) {
                            // update the user
                            var query = new Parse.Query(Parse.Object.extend(Parse.User));
                            query.equalTo('objectId', aObj.get('answererId'));
                            query.find({
                                success: function(user){
                                    user[0].increment('bestAnswerCount');
                                    user[0].save(null).then(function() {
                                        // create a notification object
                                        var notifObject = Parse.Object.extend("notification");
                                        var notifObj = new notifObject();
                                        notifObj.set("unseen", true);
                                        notifObj.set("userId", user[0].id);
                                        notifObj.set('notificationType', 'bestAnswer');
                                        notifObj.set('performerName', performerName);
                                        notifObj.set('targetType', 'answer');
                                        notifObj.set('targetId', answerId);
                                        notifObj.set('performerId', askerId);
                                        notifObj.set('questionId', questionId);
                                        notifObj.save().then(function(nObj) {
                                           // send a push to the user
                                           console.log("Passed");
                                           var message = '';
                                           message += performerName + ' ';
                                           message += 'پاسخ شما را به عنوان بهترین پاسخ انتخاب کرد' + ' ';
                                           pusher.push(user[0].id, message);
                                           user[0].increment('bestAnswersCount');
                                           user[0].save().then(function() {
                                               
                                           }, function(error) {
                                               console.log(error);
                                           });
                                        }, function(error) {
                                            console.log(error);
                                        });
                                    }, function(error) {
                                        console.log(error);
                                    });
                                },
                                error: function(error) {
                                    console.log(error);
                                }
                            })
                        }, function(error) {
                            console.log(error);
                        });

                    }, error: function(error) {
                        console.log(error);
                    }
                })
            }, function(error){
                console.log(error);
                res.error(error);
            })
            
        }, error: function(error) {
            console.log(error);
            res.error(error);
        }
    })
});

Parse.Cloud.define('new_answer', function(req, res) {
    Parse.Cloud.useMasterKey();

    var text = req.params.text;
    var valid = req.params.valid;
    var likes = req.params.likes;
    var answererId = req.params.answererId;
    var answererName = req.params.answererName;
    var questionId = req.params.questionId;

    var answerObject = Parse.Object.extend('answer');
    var answerObj = new answerObject();

    answerObj.set("text", text);
    answerObj.set('valid', valid);
    answerObj.set('likes', likes);
    answerObj.set('answererId', answererId);
    answerObj.set('answererName', answererName);
    answerObj.set('questionId', questionId);
    
    answerObj.save(null).then(function() {
        res.success("answer saved");
        var query = new Parse.Query(Parse.Object.extend("question"));
        query.get(questionId, {
            success: function(qObj) {
                // notify the user
                
                var notifObject = Parse.Object.extend('notification');
                var notifObj = new notifObject(); 
                notifObj.set("unseen", true);
                notifObj.set("userId", qObj.get('user').id);
                notifObj.set("notificationType", "answer");
                notifObj.set("performerName", answererName);
                notifObj.set("targetType", "question");
                notifObj.set("targetId", questionId);
                notifObj.set("performerId", answererId);
               
               notifObj.save(null).then(function() {
                   console.log("passed");
                   // send a push to the user
                   var message = '';
                   message += answererName + ' ';
                   message += 'به سوال شما پاسخ داد';
                   pusher.push(qObj.get('user').id, message);
                }, function(error) {
                    console.log(error);
                });
            }, error: function(error) {
                console.log(error);
            }
        });
    }, function(error) {
        console.log(error);
        res.error(error);
    });
});

Parse.Cloud.define('new_report', function(req, res) {
    Parse.Cloud.useMasterKey();

    var targetId = req.params.targetId;
    var targetType = req.params.targetType;
    var reporterId = req.params.reporterId;

    // check an existing report like this

    var query = new Parse.Query(Parse.Object.extend('report'));
    query.equalTo("targetId", targetId);
    query.find({
        success: function(reports) {
            if(reports.length > 0) {
            // increment the reportCount
            reports[0].increment('reportCount');
            reports[0].save(null).then(function() {
                res.success("reportIncremented");
                // notify the operators
                var message = "there is a new report";
                pusher.pushToSegments(['operators'], message);
            }, function(error) {
                console.log(error);
                res.error(error);
            });

            } else {
                
                // create a new such object
            var reportObject = Parse.Object.extend('report');
            var reportObj = new reportObject();

            reportObj.set("unchecked", true);
            reportObj.set("targetId", targetId);
            reportObj.set("targetType", targetType);
            reportObj.set("reporterId", reporterId);

            reportObj.save(null).then(function() {
                res.success("reportSaved");
        
                // notify the operator
                var message = "there is a new report";
                pusher.pushToSegments(['operators'], message);
        
            }, function(error) {
                console.log(error);
                res.error(error);
            });

            }
        },
        error: function(error) {
            console.log(error);
             

        }
    });
    
});
