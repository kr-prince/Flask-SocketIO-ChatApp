import os
import argparse
from flask import Flask, render_template
from flask_socketio import SocketIO, emit, send, disconnect

# initialize Flask and SocketIO
app = Flask(__name__)
socketio = SocketIO(app)

# Record of active members in the chat
MEMBERS = []

def parseCommandLineArgs():
	# initialize parser for global config
	parser = argparse.ArgumentParser() 
	# adding arguments and defaults
	parser.add_argument("-d", "--debug", help = "Debug mode", default=False)
	parser.add_argument("-i", "--hostIp", help = "Host address", default='0.0.0.0')
	# Read arguments from command line and return
	args = parser.parse_args()
	return args

def lastUpdateTime(folder):
	# This function returns the latest last updated timestamp of all the static files 
	return str(max(os.path.getmtime(os.path.join(root_path, file)) \
		for root_path, dirs, files in os.walk(folder) \
			for file in files))


@app.route('/')
def index():
	# Serve the initial landing page. This comes from flask
	return render_template('chatWindow.html', last_updated=lastUpdateTime('static/'))


# 'connect','disconnect','message' and 'json' are special events
# all others are custom events
@socketio.on('new_user')
def new_user(userName):
	# This receives new user request from client and returns 
	# the whole chat group
	if userName['userName'] not in MEMBERS:
		MEMBERS.append(userName['userName'])
		if DEBUGMODE:
			print(userName['userName'] + " joined chat..")
		emit('new_user_response', {'members':MEMBERS, 'status':'OK'})
	else:
		if DEBUGMODE:
			print("Duplicate User detected..")
		emit('new_user_response', {'members':[], 'status':'NO'}, callback=disconnect)


@socketio.on('new_user_broadcast')
def new_user_broadcast(userName):
	# We have to let everyone know that a new user joined
	if userName['userName'] in MEMBERS:
		emit('new_user_broadcast', {'members' : MEMBERS, 'newUser' : userName['userName']},
				include_self=False, broadcast=True)
	else:
		# This part means we got broadcast request from user who is not added
		if DEBUGMODE:
			print("Illegal broadcast detected. Disconnecting..")
		emit('new_user_response', {'members':[], 'status':'IL'}, callback=disconnect)


@socketio.on('new_message_broadcast')
def new_message_broadcast(messageAndUname):
	# We have to let everyone know that a new message was received
	if messageAndUname['userName'] in MEMBERS:
		if DEBUGMODE:
			print("User: {} Message: {}".format(messageAndUname['userName'], 
						messageAndUname['messageText']))
		emit('new_message_broadcast', messageAndUname,include_self=False, 
							broadcast=True)
	else:
		# This part means we got broadcast request from user who is not added
		if DEBUGMODE:
			print("Illegal broadcast detected. Disconnecting..")
		emit('new_user_response', {'members':[], 'status':'IL'}, callback=disconnect)


@socketio.on('disconnect_user')
def disconnect_user(userName):
	# We have to let everyone know that a user has left chat
	if userName['userName'] in MEMBERS:
		MEMBERS.remove(userName['userName'])
	def can_disconnect():
		if DEBUGMODE:
			print(userName['userName']+" has left chat..!")
		disconnect()
	emit('disconnect_user', {'members' : MEMBERS, 'byeUser' : userName['userName']},
			include_self=False, broadcast=True, callback=can_disconnect)



if __name__ == '__main__':
	args = parseCommandLineArgs()
	global DEBUGMODE
	DEBUGMODE = args.debug
	socketio.run(app, host=args.hostIp, debug=DEBUGMODE)
