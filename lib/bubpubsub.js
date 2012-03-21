/* ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 *	TITLE: BubPubSub - the bubbling PubSub system with a twist!
 *
 *	DESCRIPTION: 
 * -  this code is part of the VisualWeb Project by 
 *	-  LinkCloud ( http://www.linkcloud.org )
 *	-  ViSERiON UG (haftungsbeschraenkt) ( http://www.viserion.com )  
 * -  K!Lab Gmbh ( http://www.klab-berlin.com )
 * -  if released, we license it under MIT license. 
 *
 *		PubSub systems are great and widely used today. However, we wanted something that emulates the event-bubbling architecture of DOM events.
 *		Next to publications being able to bubble, subscribers can also choose whether they would like to receive bubbled publications.
 *		Furthermore, the system has the ability to LOG publications and retrieve them later. This comes in handy when using asynchronously loaded code
 * 	or instantiation that needs to refer to old publications. 
 *
 *		We created this little thing for use in our framework project. We use it on the serverside with node.js and on the client as well .
 *		We will release and update both versions for community use and happy forking. The code is certainly not brilliant or crazy fast, but we tried to
 *		have it well-annotated and easy to understand (and extend).
 *		We're very happy to learn about ideas, improvements, bugs (and fixes!) .. to get in contact with us, please use twitter ( @itsatony )
 *
 *
 *	BASED ON:
 *		various sources .. the pubsub idea ... 
 *
 *	FILE (in VisualWeb): 
 *		/public/lib/bubpubsub.js
 *
 * AUTHOR: 
 *		 Toni Wagner @itsatony
 * 		
 * DEPENDENCIES:
 *		- dependencies were removed ... this is totally independent now .
 *		- it should integrate into NodeJS on the server-side or any browser-side with javascript enabled.
 *
 *	TESTS: 
 *	(start code)
 *		bubpubsub.announce('/dialogs', {something}, {scope: document, persist:true,bubble:false},'DialogPlugin');
 *		bubpubsub.subscribe('/aaa', function(data) { alert(data.test); }, true);
 *		bubpubsub.publish('aaa/bbb', {test:1}, {scope: {local:true}, persist:true,bubble:true}, publisher);
 *		bubpubsub.publish('aaa', {test:2}, {scope: {local:true}, persist:false,bubble:true}, publisher);
 *		bubpubsub.publish('aaa/bbb', {test:3}, {scope: document, persist:true,bubble:false}, publisher);
 * (end)
 *
 *	VERSION:
 *		- v0.70 21.03.11
 *			- renamed
 *			- fused client (jQuery) and server (nodeJS) versions
 *			- series of bugfixes
 *		- v0.60	29.10.11			
 *			- removed dependencies from jQuery. 
 *			- enabled using the same file for client- and nodeJS server-side implementation
 *			- added the reply function explicitely
 *
 *	URLs:
 *		- blogpost: <http://coffeelog.itsatony.com/?p=187>
 *		- github: <https://github.com/itsatony/aBubPubSub>
 *
 * ---------------------------------------------------------------------------- */ 



/* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	class: aBubPubSub
 * 	you should not create your own instances of this... 
 *		- (client-sided) upon loading of the js file bubPubSub will be available to you globally 
 *		- (server-side) require it with nodeJS
 *
 *	returns:
 *		this - {object} itself.
 *
 *	example:
 *			> aBubPubSub.publish('/politics/europe', { content: 'this is wonderfool' },  { bubble:true, persist:true }, 'myTestPublisher');
 *
 * --------------------------------------------------------------------------- */ 
aBubPubSub = function() {
	var myScope = this;
	this.VERSION = '0.70';
	
	this.defaults  = {
		bubble: true,
		persist: false,
		getBubbles: true,
		scope: myScope,
		debugging: 0			// 0 = none,  1 = console.log all pubs and subs by topic and publisher id
	}	
	this.publicationChannels = {}
	this.publicationLog = new Array();
	this.publicationAnnouncements = new Array();
	return this;
}


 /* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.publish
 *		Publish some data on a named topic. 
 *
 * parameters:
 *		topic - {string}
 *			The channel to publish on. if no / are given, 'root' will be assumed.
 * 	data - {array}
 *			The data to publish. Each array item is converted into an ordered
 *			argument on the subscribed functions. 
 *			a single attribute is added to the given data: originalTopic  (it stores the complete topic, giving access to the full Topic for Subscribers of lower (bubbled) branches)
 * 	settings - {object} has four attributes: scope, persist, bubble :
 *	
 * (start code)
 *			- scope {object} defaults to *this*;
 * 			if you want a different scope in the callbacks, just supply it here
 *			- persist {boolean} defaults to *false*;   
 * 			if true the publication will be saved in the this.publicationLog object (with a timestamp attached)
 *			- bubble {object} defaults to *false*;	
 *  			if *true*, a topic will bubble up it's branch (*ATTENTION!* while being executed in sequence the bubbling does NOT WAIT for one level of execution before the next is triggered!): 
 *					'/politics/europe/internet/myOpinion'  would activate callbacks for 
 *					[1] '/politics/europe/internet/myOpinion',
 *					[2] then '/politics/europe/internet',
 *					[3] then '/politics/europe', 
 *					[4] then '/politics',
 *					[5] and '/'
 * (end)
 *
 *		publisher - {object||string} 
 *			the identifier or object you want to expose to all subscribers.
 *		onReply - {function} this will be called if a listener uses sendReply(answer). defaults to { return false; }
 *		
 *	returns: 
 *		result - {object} with 5 attributes: topic, data, settings, timestamp, publisher :
 * (start code)
 *			{
 *				'topic' : {string} topic, 
 *				'data' : {object} data, 
 *				'settings' : {object} settings, 
 *				'timestamp': {date} new Date().getTime(), 
 *				'publisher' : {string||object} publisher 
 *			}
 * (end)
 *		
 *	example:
 * (start code)
   		aBubPubSub.publish(
 			'/politics/europe', 
 			{ 
 				content: 'this is wonderfool',  
			},
			{ 
				bubble:true, 
				persist:true 
			}, 
			'myTestPublisher'
 		);
 * (end)
 *
 * --------------------------------------------------------------------------- */
 
aBubPubSub.prototype.publish = function(topic, data, settings, publisher, onReply) {
	var config = { scope: this.defaults.scope, persist: this.defaults.persist, bubble: this.defaults.bubble	};
	if (typeof settings != 'undefined') {
		if (typeof settings.scope == 'object') config.scope = settings.scope;
		if (typeof settings.persist == 'boolean') config.persist = settings.persist;
		if (typeof settings.bubble == 'boolean') config.bubble = settings.bubble;
	};
	if (typeof onReply == 'undefined' || !this.isFunction(onReply)) {
		onReply = function(answer) { return false; };
	}
	topic = this.stripSlashes(topic);
	data.originalTopic = topic;
	data.uniquePublicationId = 'aBubPubSub_'+this.randomString();
	if (this.defaults.debugging == 1) {
		console.log('[aBubPubSub] publication: ('+topic+') | bubbling='+config.bubble+' | persistent='+config.persist+' | publisher='+publisher);
	}
	var topicTree = [ topic ];
	if (config.bubble) {
		var BranchPoint = topic.lastIndexOf('/');
		while (BranchPoint>-1) {
			var shortenedTopic = topic.substr(0,BranchPoint);
			if (shortenedTopic != '') topicTree.push(shortenedTopic);
			BranchPoint = shortenedTopic.lastIndexOf('/');
		}			
	}
	topicTree.push('/'); //allow subscriptions to root
	for (var branch in topicTree) {
		for (var receiver in this.publicationChannels[topicTree[branch]]) {
			if (branch != 0 && this.publicationChannels[topicTree[branch]][receiver].getBubbles == false) {
				continue; 
			} else {
				try {
					var subscriptionIdObject = {
						'topic': topicTree[branch],
						'id':receiver
					};
					if (this.defaults.debugging == 1) {
						console.log('[aBubPubSub] subscription. ('+topicTree[branch]+') | getBubbles='+this.publicationChannels[topicTree[branch]][receiver].getBubbles+' | subscriber='+receiver);
					}
					this.publicationChannels[topicTree[branch]][receiver].callback.apply(config.scope, [data, topicTree[branch], publisher, onReply, subscriptionIdObject ]);
				} catch(error) {
					if (this.defaults.debugging == 1) {
						console.log('[aBubPubSub] ERROR: callback threw an error detailed below while subscription@('+topicTree[branch]+') | getBubbles='+this.publicationChannels[topicTree[branch]][receiver].getBubbles+' | subscriber='+receiver);
						console.dir(error);
					}
				}
				
			}
		}
	}
	var publication = { 'topic':topic, 'data': data, 'settings': settings, 'timestamp': new Date().getTime(), 'publisher': publisher };
	if (config.persist) this.publicationLog.push(publication);
	return publication;
}

 
 /* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.subscribe
 *		Subscribe to publication on certain topics/channels. 
 *
 * parameters:
 *		topic - {string}
 *			The channel to listen to. if no / are given, 'root' will be assumed.
 * 	callback - {function}
 *			a definition of what to do with the data passed on by the publication
 *		options - {object}
 *			getBubbles - {boolean} should the callback also be executed for all publications that were sent via subbranches of the given topic?
 *			getPersists - {boolean} **NOT WORKING YET** should the callback also be executed for all already published, but persitent publications (getBubbles setting will apply here too)?
 *		subscriberId - {string}
 * 		the name/id of the subscriber (potentially for later reference, ... ) . if not passed, this will be a randomString
 *
 *	returns: 
 *		result - {object} with 2 attributes: topic and id :
 *
 * (start code)
 *			- 'topic' : {string} topic, 
 *			- ''id' : {string} subscriberId
 * (end)
 *			
 *	example:
 * (start code)
 *		var mySubscription = aBubPubSub.subscribe(
 *			'/politics/europe', 
 *			function(currentBranch, publisher, reply) { 
 *				console.log(data.originalTopic);  
 *				reply('this is a stupid example');
 *			}, 
 *			{ getBubbles: true, getPersists: false } 
 *			'myLittleListener'
 *		);
 * (end)
 *
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.subscribe = function(topic, callback, options, subscriberId) {		
	var myOptions = {
		getBubbles: this.defaults.getBubbles,
		getPersists: this.defaults.getPersists
	}
	if (this.isFunction(callback) == false) callback = function() { return true; };
	// LEGACY SUPPORT! before options, we had only getBubbles ... 
	if (typeof options == 'boolean') {
		myOptions.getBubbles = options;
	}
	if (topic == '') topic = '/';
	if (topic != '/') topic = this.stripSlashes(topic);
	if (typeof this.publicationChannels[topic] == 'undefined') {
		this.publicationChannels[topic] = new Array();
	}
	if (typeof subscriberId != 'string') subscriberId='subscriber_'+Math.floor(Math.random()*1000000);
	while (typeof this.publicationChannels[topic][subscriberId] != 'undefined') subscriberId = 'subscriber_'+Math.floor(Math.random()*10000);
	this.publicationChannels[topic][subscriberId] = { 'callback': callback, 'getBubbles': myOptions.getBubbles, 'getPersists': myOptions.getPersists, 'id': subscriberId };
	return { 'topic': topic, 'id': subscriberId }; 
}


/* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.unsubscribe
 *		Remove a subscription. 
 *
 *	parameters:
 *		topic - {string} 
 *			The channel to unsubscribe from.
 *		subscriberId - {string}
 *			 the id of the subscriber that should be removed.
 *
 *	returns:
 *		result - {boolean} 
 *			was the subscription found and successfully removed?
 *
 *	example:
 * (start code)
 *		var mySubscription = aBubPubSub.subscribe(
 *			'/politics/europe', 
 *			function(data) { 
 *				console.log(data.originalTopic); 
 *			},  
 *			true, 
 *			'myLittleListener'
 *		);
 *		aBubPubSub.unsubscribe('/politics/europe', mySubscription.id);
 * (end)
 *
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.unsubscribe = function(subscriptionObject) {
	if (typeof subscriptionObject == 'undefined') return false;
	if (typeof subscriptionObject.topic == 'undefined') return false;
	if (typeof subscriptionObject.id == 'undefined') return false;
		
	if (typeof this.publicationChannels[subscriptionObject.topic] != 'undefined' && typeof this.publicationChannels[subscriptionObject.topic][subscriptionObject.id]) {
		delete this.publicationChannels[subscriptionObject.topic][subscriptionObject.id];
		return true;
	}
	return false;
}


 /* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.announce
 *		Announce what you will (possible) publish at some point.
 *		this is just for 'cosmetic' purposes and maybe debugging. it simply allows modules to announce their publications and stores these announcements.
 *		hence, if you want to add another module to a project you don't need to read the source to know what's being published, but just check the announcements array.
 *
 *
 * parameters:
 *		topic - {string}
 *			The channel to publish on. if no / are given, 'root' will be assumed.
 * 	data - {array}
 *			The data to publish. Each array item is converted into an ordered	argument on the subscribed functions. 
 *			One attribute is added to the given data: originalTopic  (it stores the complete topic, giving access to the full Topic for Subscribers of lower (bubbled) branches)
 * 	settings - {object} has four attributes: scope, persist, bubble :
 *	
 * (start code)
 *			- scope {object} defaults to *this*;
 * 			if you want a different scope in the callbacks, just supply it here
 *			- persist {boolean} defaults to *false*;   
 * 			if true the publication will be saved in the this.publicationLog object (with a timestamp attached)
 *			- bubble {object} defaults to *false*;	
 *  			if *true*, a topic will bubble up it's branch (*ATTENTION!* while being executed in sequence the bubbling does NOT WAIT for one level of execution before the next is triggered!): 
 *					'/politics/europe/internet/myOpinion'  would activate callbacks for 
 *					[1] '/politics/europe/internet/myOpinion',
 *					[2] then '/politics/europe/internet',
 *					[3] then '/politics/europe', 
 *					[4] then '/politics',
 *					[5] and '/'
 * (end)
 *
 *		publisher - {object||string} 
 *			the identifier or object you want to expose to all subscribers.
 *		onReply - {function} this will be called if a listener uses sendReply(answer). defaults to { return false; }
 *		
 *	returns: 
 *		result - {object} with 5 attributes: topic, data, settings, timestamp, publisher :
 * (start code)
 *			{
 *				'topic' : {string} topic, 
 *				'data' : {object} data, 
 *				'settings' : {object} settings, 
 *				'timestamp': {date} new Date().getTime(), 
 *				'publisher' : {string||object} publisher 
 *			}
 * (end)
 *		
 *	example:
 * (start code)
 *		aBubPubSub.publish(
 *			'/politics/europe', 
 *			{ 
 *				content: 'this is wonderfool',  
 *				{ 
 *					bubble:true, 
 *					persist:true 
 *				}, 
 *				'myTestPublisher'
 *		);
 * (end)
 *
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.announce = function(topic, data, settings, publisher) {
	var myAnnouncement = {
		'topic':topic,
		'data':data, 
		'settings':settings,
		'timestamp': new Date().getTime(), 
		'publisher': publisher
	}
	if (typeof this.publicationAnnouncements[topic] == 'undefined') {
		this.publicationAnnouncements[topic] = new Array();
	}
	this.publicationAnnouncements[topic].push(myAnnouncement);
	return myAnnouncement;
}

	
 /* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.wasPublishedOnTopic
 *		sometimes one might want to know whether publications have been sent out in the past (asynchronously loaded script parts, newly instanced stuff, etc.)
 *		if publications were sent with the 'persist:true' setting, they are saved in this.publicationLog .
 *		wasPublishedOnTopic goes through this log and returns an array of publications matching the given topic.
 *
 * parameters:
 *		myTopic - {string}
 *			The topic to look for in the publicationLog.
 * 	getBubbles - {boolean}
 *			should also publications on subtopics be returned?
 *		
 *	returns: 
 *		result - {array} of publication objects with 5 attributes:
 *			- 'topic' : {string} topic, 
 *			- 'data' : {object||string||boolean||anything} data, 
 *			- 'settings' : {object} settings, 
 *			- 'timestamp' : {date} new Date().getTime(), 
 *			- 'publisher' : {string||object} publisher 
 *		
 *	example:
 *
 > aBubPubSub.wasPublishedOnTopic('/politics', true);
 *
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.wasPublishedOnTopic = function(myTopic, getBubbles) {
	if (typeof getBubbles != "boolean") getBubbles = false;
	var matchingPublications = new Array();
	for (var i in this.publicationLog) {
		var hit = false;
		if (getBubbles) {
			hit = (this.publicationLog[i].topic.indexOf(myTopic) == 0); 
		} else {
			hit = (this.publicationLog[i].topic.indexOf(myTopic) == myTopic); 
		}
		if (hit) {
			matchingPublications.push(this.publicationLog[i]);
		}
	}
	return matchingPublications;
}


 /* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.wasPublishedOnTopic
 *		sometimes one might want to know whether publications have been sent out in the past (asynchronously loaded script parts, newly instanced stuff, etc.)
 *		if publications were sent with the 'persist:true' setting, they are saved in this.publicationLog .
 *		wasPublishedOnTopic goes through this log and returns an array of publications matching the given topic.
 *
 * parameters:
 *		newDefaults - {object}
 *			- scope {object} defaults to *this*
 * 			if you want a different scope in the callbacks, just supply it here
 *			- persist {boolean} defaults to *false*   
 * 			if true the publication will be saved in the this.publicationLog object (with a timestamp attached)
 *			- bubble {object} defaults to *false*	
 *  			if true a topic will bubble up it's branch: 
 *					/politics/europe/internet/myOpinion  would activate callbacks for 
 *					first '/politics/europe/internet/myOpinion',
 *					then '/politics/europe/internet',
 *					then '/politics/europe', 
 *					then '/politics',
 *					and '/'
 *		
 *	returns: 
 *		this.defaults - {object} with three attributes: scope, persist, bubble:
 * (start code)
 *			- 'scope' : {object} which scope should be applied to callbacks by default? 
 *			- 'persist' : {boolean} should publications be logged by default?
 *			- 'bubble' : {object} should publications be bubbling by default?
 *	(end)
 * 
 *	example:
 |		aBubPubSub.setDefaults({ scope: this, persist: true, bubble: false });
 *
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.setDefaults = function(newDefaults) {
	if (typeof newDefaults != 'undefined') {
		if (typeof newDefaults.scope == 'object') this.defaults.scope = newDefaults.scope;
		if (typeof newDefaults.persist == 'boolean') this.defaults.persist = newDefaults.persist;
		if (typeof newDefaults.bubble == 'boolean') this.defaults.bubble = newDefaults.bubble;
	};
	return this.defaults;
}


/* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.stripSlashes
 *		used internally. a simply utility function to strip slashes from both ends of the topic string....
 *
 *	parameters:
 *		topic - {string} the topic to strip of starting and trailing slashes
 *
 *	returns:
 *		stripped - {string} the slash-stripped topic.
 *
 *	example:
 *
 >			var stripped = aBubPubSub.stripSlashes('/news/cnn/'); 
 >				// stripped == 'news/cnn';
 *
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.stripSlashes = function(topic) {		
	if (typeof topic != 'string') return '';
	var stripped = topic.replace(new RegExp('^[/]+', 'g'), '');
	stripped = topic.replace(new RegExp('[/]+$', 'g'), '');
	return stripped;
}


/* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.isFunction
 *		- got this from: http://dbj.org/dbj/?p=286
 *		- very basic check if something is a variable
 *	
 *	parameters:
 *		f - {anything} the variable you want to test for being a function
 *	
 *	returns:
 *		result - {boolean} is this a function?.
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.isFunction = function (f) {
	try {  
		return /^\s*\bfunction\b/.test(f) ;
	} catch (err) {   
		return false ;
	}
}


/* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.randomString
 *		very basic generation of a random randomString
 *	
 *	parameters:
 *		len - {number} defaults to 16. the length of the returned random {string}.
 *	
 *	returns:
 *		randomString - {string} the randomString that was just generated.
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.randomString = function (len) {
	if (typeof len != 'number' || len < 1) len = 16;
	var randomString = '';
	var ridchars = new Array("1","2","3","4","5","6","7","8","9","0","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","-","_");
	for (var i=0;i<len;i++) {
		randomString += ridchars[Math.floor(Math.random()*ridchars.length)];
	}
	return randomString;
}


/* ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * --------------------------------------------------------------- register aBubPubSub with the system   -------------------------------------------------------------------
 * ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- 
 */

 function wrapped_bubPubSub() {
	var thisBubPubSub = new aBubPubSub();
	return thisBubPubSub;
}

;( function() {
	

	// if we are in nodeJS ... 
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			module.exports = aBubPubSub;
		}
	} else {
		// Exported as a string, for Closure Compiler "advanced" mode.
		// Establish the root object, `window` in the browser, or `global` on the server.
		var root = this;
		var bubPubSub = new aBubPubSub();
		root['bubPubSub'] = bubPubSub;
	}	
} ) ();












