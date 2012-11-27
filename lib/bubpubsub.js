/* ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 *	TITLE: BubPubSub - the bubbling PubSub system with a twist!
 *
 *	DESCRIPTION: 
 * -  this code is part of the VisualWeb Project by 
 *	-  LinkCloud ( http://www.mylinkcloud.com )
 *	-  ViSERiON UG (haftungsbeschraenkt) ( http://www.viserion.com )  
 *  -  K!Lab Gmbh ( http://www.klab-berlin.com )
 *  -  free for use, reuse, commercial use, forking, editing, whatever... 
 *
 *		PubSub systems are great and widely used today. However, we wanted something that emulates the event-bubbling architecture of DOM events.
 *		Next to publications being able to bubble, subscribers can also choose whether they would like to receive bubbled publications.
 *		Furthermore, the system has the ability to LOG publications and retrieve them later. This comes in handy when using asynchronously loaded code
 * 		or instantiation that needs to refer to old publications. 
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
 * AUTHORS: 
 *		 	Toni Wagner @itsatony
 *			Frederik Rudeck @polym0rph
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
 *	VERSION HISTORY:
 *		- v0.8.7 22.11.12
 *			- introduced silent option as a per-publication flag to avoice console logging
 *		- v0.8.6 22.11.12
 *			- bugFix
 *		- v0.8.5 19.11.12
 *			- bugFixes ..
 *		- v0.8.4 15.11.12
 *			- bugFixes ..
 *			- old parameters for subscribe will be deprecated announcement
 *		- v0.8.3 15.11.12
 *			- introduced autoUnsubscribe to subscribe options ! 
 *			- optional try-catch around subscribers
 *			- scope setting for subscribers
 *			- introduced limits for error and publication logs to 10000 items in order to limit memory usage.
 *		- v0.82 28.07.2012
 *			- bugfix in chain default and if check. 
 *		- v0.81 27.07.12
 *			- unsubscribe updated to do a better job of namespace (& memory) cleanup
 *		- v0.80 22.06.12
 *			- added the option to do chaining. this needs quite some field-testing ;)
 *			- added chainDelay config setting for chained publications to allow breathing-time for the cpu 
 *		- v0.71 15.06.12
 *			- made the code a bit more beautiful
 *			- introduced forceUniqueSubscriber to allow replacing subscriber methods by Id
 *			- replaced isFunction method by typeof test 
 *			- removed randomString method
 *			- switched from bad style == to good style === operators... 
 *			- changed licence
 *		- v0.70 21.03.12
 *			- renamed
 *			- fused client (jQuery) and server (nodeJS) versions
 *			- series of bugfixes
 *		- v0.60	29.10.11			
 *			- removed dependencies from jQuery. 
 *			- enabled using the same file for client- and nodeJS server-side implementation
 *			- added the reply function explicitely
 *
 *	URLs:
 *		- blogpost/homepage: <http://coffeelog.itsatony.com/bubPubSub>
 *		- github: <https://github.com/itsatony/bubPubSub>
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
aBubPubSub = function(id) {
	var myScope = this;
	this.VERSION = '0.8.7';
	this.id = 'bubPubSub_' + new Date().getTime();
	if (typeof id === 'string') this.id = id;
	this.defaults  = {
		bubble: true,
		persist: false,
		getBubbles: true,
		getPersists: false,
		chain: false,
		scope: myScope,
		debugging: 0,			// 0 = none,  1 = console.log all pubs and subs by topic and publisher id
		forceUniqueSubscriber: true,
		skipOverFailedSubscribers: true,
		chainDelay: 0,
		throwErrors: false,
		catchSubscriberErrors: false
	};
	this.errors = [];
	this.publicationChannels = {};
	this.publicationLog = [];
	this.publicationAnnouncements = [];
	return this;
};


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
 * 	settings - {object} has four attributes: scope, persist, bubble, silent, chain, chainDelay :
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
	var self = this;
	var config = { 
		scope: this.defaults.scope, 
		persist: this.defaults.persist, 
		bubble: this.defaults.bubble,
		chain: this.defaults.chain,
		chainDelay: this.defaults.chainDelay,
		silent: false
	};
	var chainedSubscribers = [];
	if (typeof settings === 'object') {
		if (typeof settings.scope === 'object') config.scope = settings.scope;
		if (typeof settings.persist === 'boolean') config.persist = settings.persist;
		if (typeof settings.bubble === 'boolean') config.bubble = settings.bubble;
		if (typeof settings.chain === 'boolean') config.chain = settings.chain;
		if (typeof settings.chainDelay === 'number') config.chainDelay = settings.chainDelay;
		if (typeof settings.silent === 'boolean') config.silent = settings.silent;
	};
	if (typeof onReply !== 'function') {
		onReply = false; //function(answer) { return false; };
	}
	topic = this.__stripSlashes(topic);
	data.originalTopic = topic;
	var timestamp = new Date().getTime();
	// let's hope this is unique ;) should be unique-enough at least...
	data.uniquePublicationId = 'pub_' + timestamp + '_' + Math.floor(Math.random()*100000);
	// debugging help
	if (this.defaults.debugging > 0 && config.silent === false) {
		console.log('[' + self.id + '] publication: #' + data.uniquePublicationId + ' (' + topic + ') | bubbling=' + config.bubble + ' | persistent=' + config.persist + ' | publisher=' + publisher);
	}
	// -- prepare all publication branches
	var topicTree = [ topic ];
	// support bubbling
	if (config.bubble === true) {
		var BranchPoint = topic.lastIndexOf('/');
		while (BranchPoint > -1) {
			var shortenedTopic = topic.substr(0,BranchPoint);
			if (shortenedTopic !== '') topicTree.push(shortenedTopic);
			BranchPoint = shortenedTopic.lastIndexOf('/');
		}			
	}
	// allow subscriptions to root
	topicTree.push('/'); 
	// -- fire all subscribers
	var subscribersFired = [];
	var topicCount = topicTree.length;
	for (var branch = 0; branch < topicCount; branch++) {
		for (var subId in this.publicationChannels[topicTree[branch]]) {
			var subscriber = this.publicationChannels[topicTree[branch]][subId];
			if (branch !== 0 && subscriber.getBubbles !== true) {
				continue; 
			} else {
				var subscriptionIdObject = {
					'topic': topicTree[branch],
					'id': subId
				};
				if (this.defaults.debugging > 0 && config.silent === false) {
					console.log('[' + self.id + '] subscription got #' + data.uniquePublicationId + '. (' + topicTree[branch] + ') from (' + data.originalTopic + ') | getBubbles=' + subscriber.getBubbles + ' | subscriber=' + subId);
				}
				// specific scope given by subscriber beats our default scope and the publishers scope.
				var subScope = (typeof subscriber.scope === 'object') ? subscriber.scope : config.scope;
				// chaining
				if (config.chain !== true) {
					if (self.defaults.catchSubscriberErrors === true) {
						// catching and reporting errors ... useful for debugging
						try {
							subscriber.callback.apply(subScope, [data, topicTree[branch], publisher, onReply, subscriptionIdObject ]);
						} catch(error) {
							if (self.defaults.debugging > 0 && config.silent === false) {
								console.log('[' + self.id + '] ERROR: callback error after subscription got #' + data.uniquePublicationId + ' @ (' + topicTree[branch] + ') from (' + data.originalTopic + ') | getBubbles=' + subscriber.getBubbles + ' | subscriber=' + subId);
								console.log(error);
								if (typeof error.stack !== 'undefined') console.log(error.stack);
								self.errors.push(error);
								if (self.errors.length > 10000) self.errors.pop();
							}
							if (self.defaults.throwErrors === true) throw error;
						}
					}	else {
						subscriber.callback.apply(subScope, [data, topicTree[branch], publisher, onReply, subscriptionIdObject ]);
					}
					subscriber.fired++;
					subscribersFired.push(subscriber.id);
					if (typeof subscriber.autoUnsubscribe === 'number' && subscriber.autoUnsubscribe <= subscriber.fired) {
						self.unsubscribe({id: subscriber.id, topic: subscriber.topic});
					}
				} else {
					// potentially check for a chainedCallback ...
					chainedSubscribers.push(
						{ 
							subscriber: subscriber.callback, 
							argumentArray: [data, topicTree[branch], publisher, onReply, subscriptionIdObject]
						}
					);
				}
			}
		}
	}
	// create publication object, save if needed and return
	var publication = { 
		'topic': topic, 
		'data': data, 
		'settings': settings, 
		'timestamp': new Date().getTime(), 
		'publisher': publisher,
		'subscribersFired': subscribersFired
	};
	if (config.persist === true) {
		this.publicationLog.push(publication);
		if (this.publicationLog.length > 10000) this.publicationLog.pop();
	}
	if (config.chain === true) {
		this.chainCallSubscribers(publication, config, chainedSubscribers);
	}
	return publication;
};

 
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
	var self = this;
	var myOptions = {
		getBubbles: this.defaults.getBubbles,
		getPersists: this.defaults.getPersists,
		forceUniqueSubscriber: this.defaults.forceUniqueSubscriber,
		autoUnsubscribe: false
	};
	var timestamp = new Date().getTime();
	if (typeof callback !== 'function') {
		callback = function() { return true; };
	}
	// LEGACY SUPPORT! before options, we had only getBubbles ... 
	if (typeof options === 'boolean') {
		console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! BAD / OLD SUBSCRIPTION PARAMETERS!! UPDATE THE FOLLOWING SUBSCRIPTION:');
		console.log('-----  legacy parameter support will be deprecated in 0.9 ---------------');
		console.log(arguments);
		throw new Error('PUBSUB ERROR');
		var getBubbles = options;
		options = {
			getBubbles: getBubbles
		};
	}
	if (typeof options === 'string') {
		console.log('!!!---!!!!!!!---!!!!!!!!---!!!!!!---!!!!!! BAD SUBSCRIPTION PARAMETERS!! UPDATE THE FOLLOWING SUBSCRIPTION:');
		console.log('-----  legacy parameter support will be deprecated in 0.9 ---------------');
		console.log(arguments);
		subscriberId = options;
		options = {};
	}
	if (typeof options === 'undefined') options = {};
	if (typeof options.forceUniqueSubscriber === 'boolean') {
		myOptions.forceUniqueSubscriber = options.forceUniqueSubscriber;
	}
	if (typeof options.getBubbles === 'boolean') {
		myOptions.getBubbles = options.getBubbles;
	}
	if (typeof options.autoUnsubscribe === 'boolean' || typeof options.autoUnsubscribe === 'number') {
		myOptions.autoUnsubscribe = options.autoUnsubscribe;
	}
	if (typeof topic !== 'string') {
		topic = '/';
	}
	topic = this.__stripSlashes(topic);
	if (topic === '') {
		topic = '/';
	}
	if (typeof this.publicationChannels[topic] === 'undefined') {
		this.publicationChannels[topic] = new Array();
	}
	if (typeof subscriberId !== 'string') {
		subscriberId = 'sub_' + timestamp + '_' + Math.floor(Math.random()*100000);
	}
	if (myOptions.forceUniqueSubscriber === true) {
		while (typeof this.publicationChannels[topic][subscriberId] !== 'undefined') {
			subscriberId += '_' + Math.floor(Math.random()*10000);
		}
	}
	this.publicationChannels[topic][subscriberId] = { 
		'callback': callback,
		'getBubbles': myOptions.getBubbles, 
		'getPersists': myOptions.getPersists,
		'autoUnsubscribe': myOptions.autoUnsubscribe,
		'id': subscriberId,
		'topic': topic,
		'fired': 0,
		'scope': (typeof options.scope === 'object') ? options.scope : self.defaults.scope
	};
	if (typeof options === 'object' && typeof options.scope === 'object') {
		this.publicationChannels[topic][subscriberId].scope = options.scope;
	}
	
	return { 'topic': topic, 'id': subscriberId }; 
};


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
	if (typeof subscriptionObject === 'undefined') return false;
	if (typeof subscriptionObject.topic === 'undefined') return false;
	if (typeof subscriptionObject.id === 'undefined') return false;
	if (
		typeof this.publicationChannels[subscriptionObject.topic] !== 'undefined' 
		&& 
		typeof this.publicationChannels[subscriptionObject.topic][subscriptionObject.id] !== 'undefined'
		) {
			delete this.publicationChannels[subscriptionObject.topic][subscriptionObject.id];
			// to cleanup the namespace for real here, we need to check whether the channel is empty, and if it is, we remove it.
			var length = 0;
			for (var i in this.publicationChannels[subscriptionObject.topic]) {
				length++;
				break;
			}
			if (length === 0) {
				delete this.publicationChannels[subscriptionObject.topic];
			}
			return true;
	}
	return false;
};


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
	if (typeof this.publicationAnnouncements[topic] === 'undefined') {
		this.publicationAnnouncements[topic] = new Array();
	}
	this.publicationAnnouncements[topic].push(myAnnouncement);
	return myAnnouncement;
};

	
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
	if (typeof getBubbles !== 'boolean') getBubbles = false;
	var matchingPublications = new Array();
	for (var i in this.publicationLog) {
		var hit = false;
		if (getBubbles) {
			hit = (this.publicationLog[i].topic.indexOf(myTopic) === 0); 
		} else {
			hit = (this.publicationLog[i].topic.indexOf(myTopic) === myTopic); 
		}
		if (hit) {
			matchingPublications.push(this.publicationLog[i]);
		}
	}
	return matchingPublications;
};


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
	if (typeof newDefaults !== 'undefined') {
		if (typeof newDefaults.scope === 'object') this.defaults.scope = newDefaults.scope;
		if (typeof newDefaults.persist === 'boolean') this.defaults.persist = newDefaults.persist;
		if (typeof newDefaults.bubble === 'boolean') this.defaults.bubble = newDefaults.bubble;
		if (typeof newDefaults.forceUniqueSubscriber === 'boolean') this.defaults.forceUniqueSubscriber = newDefaults.forceUniqueSubscriber;
		if (typeof newDefaults.debugging === 'number') this.defaults.debugging = newDefaults.debugging;
			
	};
	return this.defaults;
};


/* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.__stripSlashes
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
 >			var stripped = aBubPubSub.__stripSlashes('/news/cnn/'); 
 >				// stripped == 'news/cnn';
 *
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.__stripSlashes = function(topic) {		
	if (typeof topic !== 'string') return '';
	return topic.replace(new RegExp('^[/]+|[/]+$', 'g'), '');;
};



/* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.chainCallSubscribers
 *		used internally. this is a chaining function to call subscriber callbacks one after the other, not in parallel.
 *		
 *
 *	parameters:
 *		publication - {object} the publication object generated in .publish
 *		config - {object} the config object specific for this publication, generated in .publish
 *		subscribers - {array} the array contains a list of subscriber objects and the associated arguments they should be called with
 *
 *	returns:
 *		true - {boolean} this is just true....
 *
 * --------------------------------------------------------------------------- */

aBubPubSub.prototype.chainCallSubscribers = function(publication, config, subscribers) {
	var self = this;
	// take out the FIRST element
	var nextChainObject = subscribers.shift();
	// now prepare calling ourselves again with the shortened subscribers array
	var chainCall = function() {
		self.chainCallSubscribers(publication, config, subscribers);
	};
	// we are done - super!
	if (typeof nextChainObject === 'undefined' || nextChainObject === null) {		
		return true;
	}
	// only bother with calling if the subscriber explicitely supplied a chainable callback
	if (typeof nextChainObject.subscriber.chainedCallback === 'function') {
		try {	
			// get the original subscribers callback arguments and extend them with our 'nextCall' function
			var args	= nextChainObject.argumentArray;
			args.push(chainCall);
			// fire away and hope!
			if (config.chainDelay === 0) {
				nextChainObject.subscriber.callback.apply(
					self.config.scope, 
					args
				);
			} else {
				publication.chainTimeout = setTimeout(
					function() {
						nextChainObject.subscriber.callback.apply(
							self.config.scope, 
							args
						);
					},
					config.chainDelay
				);
			}
		} catch (err) {
			if (this.defaults.debugging > 0) {
				console.log('[aBubPubSub] ERROR: callback threw an error detailed below while subscription@(' + topicTree[branch] + ') | getBubbles=' + subscriber.getBubbles + ' | subscriber=' + subId);
				console.log(error);
				if (typeof error.stack !== 'undefined') console.log(error.stack);
				self.errors.push(error);
				if (self.errors.length > 10000) self.errors.pop();
			}
			// now if there was an error in a callback, should we cancel bubbling, or just go on?
			// a config setting obviously... settable for every publication ...
			if (config.skipOverFailedSubscribers === true) {
				chainCall();
			}
		}
	} else {
		chainCall();
	}
	return true;
};


/* --------------------------------------------------------------------------
 * --------------------------------------------------------------------------
 *	method: aBubPubSub.prototype.converse
 *		an efficient means to send a publication and handle the answer.
 *
 *	parameters:
 *		publication - {object} give the 
 *			- topic - {string} the publication topic
 *			- data - {object} the dataObject to be sent out
 *			- options - {object} the publication options
 *			- sender - {string||object} who is sending 
 *		subscription - {object} 
 *			- autoUnsubscribe - {boolean||number} optional. defaults to 1. after how many calls - if at all - should be unsubscribed?
 *			- callback - {function} the subscription handler function
 *			- scope - {object} optional. defaults to the bubPubSub object. in which scope should the callback be executed?
 *
 *	returns:
 *		stripped - {string} the slash-stripped topic.
 *
 *	example:
 *
 >			var stripped = aBubPubSub.__stripSlashes('/news/cnn/'); 
 >				// stripped == 'news/cnn';
 *
 * --------------------------------------------------------------------------- */
aBubPubSub.prototype.converse = function(publication, subscription) {
	var self = this;
	var thisConversation = {};
	var timestamp = new Date().getTime();
	thisConversation.id = 'bpsCon' + timestamp + '_' + Math.round(Math.random()*100000);
	// check and fill up parameters for subscribe
	if (typeof subscription.autoUnsubscribe !== 'boolean') subscription.autoUnsubscribe = 1;
	if (typeof subscription.callback !== 'function') subscription.autoUnsubscribe = 1;
	if (typeof subscription.scope !== 'object') {
		if (typeof arguments.callee !== 'undefined') subscription.scope = arguments.callee;
		if (typeof window === 'object') subscription.scope = window;
		else if (typeof process === 'object') subscription.scope = process;
		else subscription.scope = thisConversation;
	}
	// check and fill up parameters for publish
	if (typeof publication.topic !== 'string') publication.topic = '/';
	if (typeof publication.data !== 'object') publication.data = {};
	if (typeof publication.options !== 'object') publication.options = {};
	if (typeof publication.sender === 'undefined') publication.sender = thisConversation.id;
	// create safe branches and topics
	thisConversation.pubId = 'pub' + timestamp + '_' + Math.round(Math.random()*100000);
	if (typeof subscription.topic !== 'string') subscription.topic = publication.topic + '/done';
	// subscribe
	thisConversation.subscription = self.subscribe(
		subscription.topic,
		function(data, currentTopic, publisher, onReply, subscriptionIdObject) {
			thisConversation.state = 'received';
			subscription.callback.apply(subscription.scope, [data, currentTopic, publisher, onReply, subscriptionIdObject]);
			thisConversation.state = 'returned';
			return; 
		},
		{
			scope: subscription.scope,
			autoUnsubscribe: subscription.autoUnsubscribe			
		},
		thisConversation.id
	);
	thisConversation.state = 'subscribed';
	//publish
	thisConversation.publication = self.publish(
		publication.topic,
		publication.data,
		publication.options,
		publication.sender
	);
	thisConversation.state = 'published';
	return thisConversation;
};

/* ----------------------------------------------------------------------------
 * -------------- register aBubPubSub with the system   -----------------------
 * --------------------------------------------------------------------------- 
 */

function wrapped_bubPubSub() {
	var thisBubPubSub = new aBubPubSub();
	return thisBubPubSub;
};

;( function() {
	// if we are in nodeJS ... 
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			module.exports = aBubPubSub;
		}
	} else {
		// Exported as a string, for Closure Compiler "advanced" mode.
		// Establish the root object, 'window'`' in the browser, or 'global' on the server.
		var root = this;
		var bubPubSub = new aBubPubSub();
		root['bubPubSub'] = bubPubSub;
	}	
} ) ();

;