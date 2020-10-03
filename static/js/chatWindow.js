var globalSocket = undefined;
var username = "";

function setUpResponses(socket) {

	socket.on('connect', function() {
		//console.log(username + ' joined chat..');
		socket.emit('new_user', {userName : username});
	});

	socket.on('disconnect_user', function(chatMembers, cb) {
		//console.log('Hi All..! '+chatMembers['byeUser']+' left the chat.');
		var msgBody = document.createElement("p");
		msgBody.style="color: BLACK; text-align:CENTER;";
		msgBody.innerHTML= chatMembers['byeUser']+" left the chat..!";
		document.getElementById('message_holder').appendChild(msgBody);
		document.getElementById('members').innerHTML = "<b>Members : </b>"+chatMembers['members'].toString();
		cb();
	});

	socket.on('new_user_response', function(response, cb) {
		var members = response['members']
		var status = response['status']
		if (status == 'OK') {
			//console.log('new_user_response for user: '+username);
			document.getElementById("msg1").remove();
			var msgBody = document.createElement("p");
			msgBody.style="color: BLACK; text-align:CENTER;";
			msgBody.innerHTML="You joined the chat..!";
			document.getElementById('message_holder').appendChild(msgBody);
			document.getElementById('username').disabled = true;
			document.getElementById('join_leave').innerHTML = "Leave Chat";
			document.getElementById('typeArea').disabled = false;
			document.getElementById('members').innerHTML = "<b>Members : </b>"+members.toString();

			socket.emit('new_user_broadcast', {userName : username});
		} else {
			// This is to prevent duplicate users 
			socket.disconnect();
			socket = null;
			globalSocket.disconnect();
			globalSocket = null;
			//console.log('new_user_response for Duplicate User');
			if (status == 'NO') {
				customAlert("Sorry.! This username already exists. Think of another cool name for yourself!");
			} else if (status == 'IL') {
				customAlert("The Server got request from Invalid user. Disconnecting..");
			} else {
				customAlert("Some Unknown error occurred.");
			}
			cb();
		}
	});

	socket.on('new_user_broadcast', function(chatMembers) {
		var msg1 = document.getElementById("msg1");
		if (msg1) {
			msg1.remove();
		}
		var msgBody = document.createElement("p");
		msgBody.style="color: BLACK; text-align:CENTER;";
		msgBody.innerHTML= chatMembers['newUser']+" joined the chat..!";
		document.getElementById('message_holder').appendChild(msgBody);
		document.getElementById('members').innerHTML = "<b>Members : </b>"+chatMembers['members'].toString();
		//console.log('Hi All..! '+chatMembers['newUser']+' joined us.');
	});

	socket.on('new_message_broadcast', function(messageAndUname) {
		var msg1 = document.getElementById("msg1");
		if (msg1) {
			msg1.remove();
		}
		//console.log(messageAndUname);
		var msgBody = document.createElement("p");
		msgBody.style="color: DARKBLUE; text-align:LEFT; overflow-wrap: break-word; word-wrap: break-word; padding-right:20%;";
		msgBody.innerHTML= "<b>"+messageAndUname['userName']+": </b>"+messageAndUname['messageText'];
		document.getElementById('message_holder').appendChild(msgBody);
	});

}

function joinChat() {
	username = document.getElementById('username').value
	if (username.trim().length == 0){
		alert("Username required");
		return;
	}
	username = username.toLowerCase().split(' '); 
  	for (var i = 0; i < username.length; i++) {
  		username[i] = username[i].charAt(0).toUpperCase() + username[i].slice(1);
  	} 
	username = username.join('');
	document.getElementById('username').value = username;

	if (globalSocket == null) {
		globalSocket = io.connect('http://'+document.domain + ':' + location.port);
		setUpResponses(globalSocket)
	}
	
	if (document.getElementById("join_leave").innerHTML == 'Leave Chat') {
		//console.log(username+' left the chat.');
		globalSocket.emit('disconnect_user', {userName : username});
		globalSocket.disconnect();
		globalSocket = null;
		var msgBody = document.createElement("p");
		msgBody.style="color: BLACK; text-align:CENTER;";
		msgBody.innerHTML="You left the chat..!";
		document.getElementById('message_holder').appendChild(msgBody);
		document.getElementById('join_leave').disabled = true;
		document.getElementById('typeArea').disabled = true;
		document.getElementById('send_message').disabled = true;
	}
}

function sendMessage() {
	var messageBox = document.getElementById('typeArea');
	var messageText = messageBox.value.trim();
	window.event.Handled = true; 
	messageBox.value = '';
	var msgBody = document.createElement("p");
	msgBody.style="color: DARKGREEN; text-align:RIGHT; overflow-wrap: break-word; word-wrap: break-word; padding-left:20%;";
	msgBody.innerHTML= "<b>You: </b>"+messageText;
	document.getElementById('message_holder').appendChild(msgBody);
	globalSocket.emit('new_message_broadcast', {userName : username,
										messageText : messageText});
}

function customAlert(message) {
	var modal = document.getElementById('myModal');
	modal.style.display = "block";
	var modalSpan = document.getElementsByClassName('close')[0];
	modalSpan.onclick = function() {
		modal.style.display = "none";
	}
	window.onclick = function(event) {
		if (event.target == modal) {
			modal.style.display = "none";
		}
	}
	document.getElementById('modalMessage').innerHTML = message.toString();
}
