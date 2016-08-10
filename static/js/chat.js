var log = function () {
    console.log(arguments);
};

var chatItemTemplate = function (chat) {
    var name = chat.name;
    var content = chat.content;
    var time = chat.created_time;
    var t = `
        <div class="chat-item burstStart read burstFinal">
            <div class="chat-item__container">
                <div class="chat-item__aside">
                    <div class="chat-item__avatar">
                        <span class="widget">
                            <div class="trpDisplayPicture avatar-s">
                                <img src="https://avatars0.githubusercontent.com/u/7235381?v=3&amp;s=30"  height="30" width="30" class="avatar__image" alt="">
                            </div>
                        </span>
                    </div>
                </div>
                <div class="chat-item__actions js-chat-item-actions">
                    <i class="chat-item__icon icon-check chat-item__icon--read chat-item__icon--read-by-some js-chat-item-readby"></i>
                    <i class="chat-item__icon icon-ellipsis"></i>
                </div>
                <div class="chat-item__content">
                    <div class="chat-item__details">
                        <div class="chat-item__from js-chat-item-from">${name}</div>
                        <a class="chat-item__time js-chat-time" href="#">
                            <time data-time="${time}"></time>
                        </a>
                    </div>
                    <div class="chat-item__text js-chat-item-text">${content}</div>
                </div>
            </div>
        </div>`;
    return t;
};

var insertChatItem = function (chat) {
    var chats = $('#id-div-chats');
    var t = chatItemTemplate(chat);
    chats.append(t);
};

var chatResponse = function (r) {
    var chat = JSON.parse(r);
    insertChatItem(chat);
};

var subscribe = function (channel) {
    var sse = new EventSource("/subscribe/" + channel);
    sse.onmessage = function (e) {
        log(e, e.data);
        chatResponse(e.data);
    };
};

var sendMessage = function (channel) {
    log(channel);
    var name = $('#id-input-name').val();
    var content = $('#id-input-content').val();
    var message = {
        name: name,
        content: content
    };

    var request = {
        url: "/" + channel + '/chat/add',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(message),
        success: function (r) {
            log('success', r);
        },
        error: function (err) {
            log('error', err);
        }
    };
    $.ajax(request);
};

var switchChannel = function (channel) {
    $("#id-div-chats").html("");
    subscribe(channel);
    $('body').data('channel', channel)
};

var renderChannelList = function (channels) {
    var htmls = '';
    $.each(channels, function (key, val) {
        var item = val;
        htmls += `<li class="pure-menu-item">
                              <a href="#" class="pure-menu-link" data-channel="${item}">${item}</a>
                          </li>`;
    });
    var list = $("#id-channel-list");
    list.append(htmls);
};

var queryChannelList = function (callback) {
    var request = {
        url: '/channel-list/',
        type: 'get',
        contentType: 'application/json',
        success: function (r) {
            jr = JSON.parse(r);
            callback(jr['channels']);
        },
        error: function (err) {
            log('channel list error: ', err)
        }
    };
    $.ajax(request);
};

var initChannelList = function () {
    queryChannelList(renderChannelList);
};

var bindActions = function () {
    $('#id-button-send').on('click', function () {
        sendMessage($("body").data("channel"));
    });
    $("#id-channel-list").on("click", "a", function (e) {
        var self = e.target;
        switchChannel($(self).data("channel"));
    })
};

// long time ago
var longTimeAgo = function () {
    var timeAgo = function (time, ago) {
        return Math.round(time) + ago;
    };

    $('time').each(function (i, e) {
        var past = parseInt(e.dataset.time);
        var now = Math.round(new Date().getTime() / 1000);
        var seconds = now - past;
        var ago = seconds / 60;
        // log('time ago', e, past, now, ago);
        var oneHour = 60;
        var oneDay = oneHour * 24;
        // var oneWeek = oneDay * 7;
        var oneMonth = oneDay * 30;
        var oneYear = oneMonth * 12;
        var s = '';
        if (seconds < 60) {
            s = timeAgo(seconds, ' 秒前')
        } else if (ago < oneHour) {
            s = timeAgo(ago, ' 分钟前');
        } else if (ago < oneDay) {
            s = timeAgo(ago / oneHour, ' 小时前');
        } else if (ago < oneMonth) {
            s = timeAgo(ago / oneDay, ' 天前');
        } else if (ago < oneYear) {
            s = timeAgo(ago / oneMonth, ' 月前');
        }
        $(e).text(s);
    });
};

var __main = function () {
    initChannelList();
    subscribe($("body").data("channel"));
    bindActions();
    setInterval(function () {
        longTimeAgo();
    }, 5000);
};

$(document).ready(function () {
    __main();
});