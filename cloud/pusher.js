exports.push = function(userId, message) {
    Parse.Cloud.useMasterKey();
    // retrieve the oneSignal id associated with the user
    var query = new Parse.Query(Parse.User);
    query.equalTo("objectId", userId);
    query.find({
        success: function(user) {
            console.log(user[0].get("oneSignalId"));
            // send the push to the user
            Parse.Cloud.httpRequest({
                url: 'https://onesignal.com/api/v1/notifications',
                headers: {
                    'content-type' : 'application/json',
                    'Authorization' : 'Basic OGIxMjU4NmQtMmRjYi00M2ZhLWFmNGItOWNkZTY0NjRjYTQx'
                },
                method: 'POST',
                body: {
                    app_id: '41ccc57f-7fde-4089-a76d-34b100359ed4',
                    contents: {en: message},
                    include_player_ids: [user[0].get("oneSignalId")]
                }
            }).then(function(httpResponse) {
                console.log(httpResponse.status + httpResponse.text);
            }, function(httpResponse) {
                console.log(httpResponse.status);
            });
        }, function(error) {
            console.log(error);
        }
    });
}

exports.pushToSegments = function(segmentArray, message) {
    Parse.Cloud.useMasterKey();
    Parse.Cloud.httpRequest({
        url: 'https://onesignal.com/api/v1/notifications',
                headers: {
                    'content-type' : 'application/json',
                    'Authorization' : 'Basic OGIxMjU4NmQtMmRjYi00M2ZhLWFmNGItOWNkZTY0NjRjYTQx'
                },
                method: 'POST',
                body: {
                    app_id: '41ccc57f-7fde-4089-a76d-34b100359ed4',
                    contents: {en: message},
                    include_segments: segmentArray 
                }
            }).then(function(httpResponse) {
                console.log(httpResponse.status + httpResponse.text);
            }, function(httpResponse) {
                console.log(httpResponse.status);
    });
}

