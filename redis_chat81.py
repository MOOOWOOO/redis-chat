import flask
from flask import request
import redis
import time
import json

'''
# 使用 gunicorn 启动
gunicorn --worker-class=gevent -t 9999 redischat:app
# 开启 debug 输出
gunicorn --log-level debug --worker-class=gevent -t 999 redis_chat81:app
# 把 gunicorn 输出写入到 gunicorn.log 文件中
gunicorn --log-level debug --access-logfile gunicorn.log --worker-class=gevent -t 999 redis_chat81:app
'''

# 连接上本机的 redis 服务器
# 所以要先打开 redis 服务器
red = redis.Redis(host='localhost', port=6379, db=0)
print('redis', red)

app = flask.Flask(__name__)
app.secret_key = 'key'

# 发布聊天广播的 redis 频道
chat_channel = ['public', 'private', 'protected']


def stream(channel='public'):
    '''
    监听 redis 广播并 sse 到客户端
    '''
    print('in stream, channel ', channel)
    global chat_channel
    # 对每一个用户 创建一个[发布订阅]对象
    pubsub = red.pubsub()
    # 订阅广播频道
    print(channel in chat_channel)
    if channel in chat_channel:
        print('channel in chat_channel')
        pass
    else:
        print('no channel')
        channel = 'public'

    print('subscribe channel')
    pubsub.subscribe(channel)
    # 监听订阅的广播
    print('listen')
    for message in pubsub.listen():
        print(message)
        if message['type'] == 'message':
            data = message['data'].decode('utf-8')
            # 用 sse 返回给前端
            yield 'data: {}\n\n'.format(data)


@app.route('/subscribe/<string:channel>')
def subscribe(channel='public'):
    return flask.Response(stream(channel), mimetype="text/event-stream")


@app.route('/')
def index_view():
    return flask.render_template('index.html')


def current_time():
    return int(time.time())


@app.route('/<string:channel>/chat/add', methods=['POST'])
def chat_add(channel='public'):
    msg = request.get_json()
    name = msg.get('name', '')
    if name == '':
        name = '<匿名>'
    content = msg.get('content', '')
    r = {
        'name': name,
        'content': content,
        'created_time': current_time()
    }
    message = json.dumps(r, ensure_ascii=False)
    print('debug\nmessge: {}\nchannel: {}'.format(message, channel))
    # 用 redis 发布消息
    if channel in chat_channel:
        red.publish(channel, message)
    else:
        # auto add a new channel or warn user ?
        pass
    return 'OK'


@app.route('/channel-list/')
def channel_list():
    return json.dumps({'channels': chat_channel})


if __name__ == '__main__':
    config = dict(
        debug=True,
    )
    app.run(**config)
