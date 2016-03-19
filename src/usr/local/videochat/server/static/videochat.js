var call_sign = 'NOCALL';
var version = '0.1';
$(function() {
    $('#submit-call-sign').on('click', function(e) {
        e.preventDefault();
        if ($('#call-sign').val().length == 0) return;
        call_sign = $('#call-sign').val().toUpperCase();
        Cookies.set('videochat_call_sign', call_sign);
        $('#call-sign-container').addClass('hidden');
        $('#video-chat-container').removeClass('hidden');
        show_spinner();
        init();
    });
    var cookie_call_sign = Cookies.get('videochat_call_sign');
    if (cookie_call_sign == undefined) {
        $('#call-sign-container').removeClass('hidden');
        hide_spinner();
    } else {
        $('#call-sign-container').addClass('hidden');
        $('#video-chat-container').removeClass('hidden');
        call_sign = cookie_call_sign;
        init();
    }
    $(window).resize(function() {
        console.log('resize');
        set_resolution();
    });
    $('#logout').on('click', function(e) {
        e.preventDefault();
        Cookies.remove('videochat_call_sign');
        window.location = '/';
    });
    $('#hangup').on('click', function(e) {
        e.preventDefault();
        easyrtc.hangupAll();
        $('#remote-call-sign').html('');
    });
    $('#copyright').html('Video Chat v' + version + ' Copyright &copy; ' + new Date().getFullYear() + ' <a href="http://www.trevorsbench.com">Trevor Paskett - K7FPV</a>');
});

function init() {
    set_resolution();
    /*
    easyrtc.setOnError(function(errEvent) {
        console.log(errEvent.errorText);
    });

    easyrtc.setUsername(call_sign);
    easyrtc.setRoomOccupantListener(loggedInListener);
    easyrtc.easyApp("VideoChat", "self", ["caller"], function(myId) {
        console.log("My easyrtcid is " + myId);
    });        
*/
    easyrtc.setUsername(call_sign);
    easyrtc.setStreamAcceptor(function(callerEasyrtcid, stream) {
        var video = document.getElementById('caller');
        easyrtc.setVideoObjectSrc(video, stream);
    });
    easyrtc.setOnStreamClosed(function(callerEasyrtcid) {
        easyrtc.setVideoObjectSrc(document.getElementById('caller'), "");
    });
    easyrtc.setRoomOccupantListener(logged_in_listener);
    var connectSuccess = function(myId) {
        console.log("My easyrtcid is " + myId);
        ohSnap('Connected to server', 'green', {
            time: '30000'
        });
        hide_spinner();
    }
    var connectFailure = function(errmesg) {
        console.log(errmesg);
        ohSnap('Error: ' + errmesg, 'red', {
            time: '30000'
        });
        hide_spinner();
    }
    easyrtc.initMediaSource(function() { // success callback
        var selfVideo = document.getElementById("self");
        easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
        easyrtc.connect("VideoChat", connectSuccess, connectFailure);
    }, connectFailure);
}

function set_resolution() {
    var width = $('#caller').width();
    var height = $('#caller').height();
    var self_width = width * 0.3;
    var self_height = height * 0.3;
    $('#self').width(self_width);
    $('#self').height(self_height);
    var self_top_pos = height - self_height;
    var self_left_pos = width - self_width;
    $("#self-container").css({
        top: self_top_pos,
        left: self_left_pos
    });
}

function logged_in_listener(roomName, otherPeers) {
    var html = '';
    console.log(otherPeers);
    for (var i in otherPeers) {
        console.log(otherPeers[i]);
        console.log(otherPeers[i].easyrtcid);
        console.log(otherPeers[i].username);
        var date = new Date(0);
        var epoch = otherPeers[i].roomJoinTime.toString();
        date.setUTCSeconds(epoch.substring(0,10));
        html += '<li class="list-group-item" data-id="' + otherPeers[i].easyrtcid + '">' + otherPeers[i].username + '<span class="pull-right">' + format_date(date) + '</span></li>';
    }
    $('#users-list').html(html);
    $('.list-group-item').on('click', function(e) {
        e.preventDefault();
        perform_call($(this));
    });
}

function perform_call(elem) {
    console.log(elem);
    console.log(elem.attr('data-id'));
    easyrtc.hangupAll();
    var easyrtcid = elem.attr('data-id');
    easyrtc.call(easyrtcid, function(easyrtcid) {
        console.log("completed call to " + easyrtcid);
    }, function(errorMessage) {
        console.log("err:" + errorMessage);
        ohSnap('Error: ' + errorMessage, 'red', {
            time: '30000'
        });
    }, function(accepted, bywho) {
        console.log((accepted ? "accepted" : "rejected") + " by " + bywho);
        if (accepted) {
            ohSnap('Call accepted by ' + easyrtc.idToName(bywho), 'green', {
                time: '30000'
            });
            $('#remote-call-sign').html(easyrtc.idToName(bywho));
        } else {
            ohSnap('Call rejected by ' + easyrtc.idToName(bywho), 'red', {
                time: '30000'
            });
        }
    });
}

function format_date(date) {
    var string;
    var year = String(date.getFullYear());
    string = (date.getMonth() + 1) + '/' + date.getDate() + '/' + year.slice(-2);
    string += ' ';
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    string += hours + ':' + minutes + ' ' + ampm;
    return string;
}

function hide_spinner() {
    $('#content-loading-spinner').dequeue();
    $('#content-loading-spinner').hide();
    $('#content-overlay').dequeue();
    $('#content-overlay').hide();
}

function show_spinner() {
    $('#content-loading-spinner').show();
    $('#content-overlay').show();
}