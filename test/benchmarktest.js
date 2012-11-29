var Benchmark = require('benchmark');
var Bub = require("../lib/bubpubsub");
var SpeedBubPub = require("../lib/bubpubsubspeedup");
// var myBubPubSub = new Bub();
// var mySpeedBubPub = new SpeedBubPub();
var tmp = true;
var suite = new Benchmark.Suite('BubPubSubBenchmark');

// add tests
suite.add('Stable\t\tSubscribe\t', function() {
	var myBubPubSub = new Bub();
	myBubPubSub.subscribe('/politics/europe', function(currentBranch, publisher, reply) {
		reply('this is a stupid example');
	}, {
		getBubbles : true,
		getPersists : false
	}, 'myLittleListener');
	myBubPubSub = null;
}).add('SpeedUp\tSubscribe\t', function() {
	var mySpeedBubPub = new SpeedBubPub();
	mySpeedBubPub.subscribe('/politics/europe', function(currentBranch, publisher, reply) {
		reply('this is a stupid example');
	}, {
		getBubbles : true,
		getPersists : false
	}, 'myLittleListener');
	mySpeedBubPub = null;
}).add('Stable\t\tPublish\t\t', function() {
	var myBubPubSub = new Bub();

	myBubPubSub.publish('/politics/europe', {
		content : 'this is wonderfool',
	}, {
		bubble : true,
		persist : true
	}, 'myTestPublisher');

	myBubPubSub = null;
}).add('SpeedUp\tPublish\t\t', function() {
	var mySpeedBubPub = new SpeedBubPub();

	mySpeedBubPub.publish('/politics/europe', {
		content : 'this is wonderfool',
	}, {
		bubble : true,
		persist : true
	}, 'myTestPublisher');

	mySpeedBubPub = null;
}).add('Stable\t\tsetDefaults\t', function() {
	var myBubPubSub = new Bub();
	var defaults = {
		scope : this,
		persist : true,
		bubble : true,
		forceUniqueSubscriber : true,
		debugging : 1
	};

	myBubPubSub.setDefaults(defaults);
	myBubPubSub = null;
	defaults = null;
}).add('SpeedUp\tsetDefaults\t', function() {
	var mySpeedBubPub = new SpeedBubPub();
	var defaults = {
		scope : this,
		persist : true,
		bubble : true,
		forceUniqueSubscriber : true,
		debugging : 1
	};

	mySpeedBubPub.setDefaults(defaults);
	mySpeedBubPub = null;
	defaults = null;
}).add('Stable\t\t__stripSlashes\t', function() {
	var myBubPubSub = new Bub();
	var newS = myBubPubSub.__stripSlashes("/test/test/");

	myBubPubSub = null;
}).add('SpeedUp\t__stripSlashes\t', function() {
	var mySpeedBubPub = new SpeedBubPub();
	var newS = mySpeedBubPub.__stripSlashes("/test/test/");

	myBubPubSub = null;
}).add('Stable\t\tConverse\t', function() {
	var myBubPubSub = new Bub();
	var path = '/politics/europe';
	var content = 'this is wonderfool';
	var publisherName = 'myTestPublisher';
	var myPublisher = myBubPubSub.publish(path, {
		content : content,
	}, {
		bubble : true,
		persist : true
	}, publisherName);

	var path = '/politics/europe';
	var subscriberName = 'myLittleListener';
	var mySubscription = myBubPubSub.subscribe("/reply" + path, function(currentBranch, publisher, reply) {
		// console.log(data.originalTopic);
		reply('this is a stupid example');
	}, {
		getBubbles : true,
		getPersists : true
	}, subscriberName);

	myBubPubSub.converse(myPublisher, mySubscription);
	path = null;
	content = null;
	publisherName = null;
	myPublisher = null;
	subscriberName = null;
	mySubscription = null;
	myBubPubSub = null;
}).add('SpeedUp\tConverse\t', function() {
	var mySpeedBubPub = new SpeedBubPub();
	var path = '/politics/europe';
	var content = 'this is wonderfool';
	var publisherName = 'myTestPublisher';
	var myPublisher = mySpeedBubPub.publish(path, {
		content : content,
	}, {
		bubble : true,
		persist : true
	}, publisherName);

	path = '/politics/europe';
	var subscriberName = 'myLittleListener';
	var mySubscription = mySpeedBubPub.subscribe("/reply" + path, function(currentBranch, publisher, reply) {
		// console.log(data.originalTopic);
		reply('this is a stupid example');
	}, {
		getBubbles : true,
		getPersists : true
	}, subscriberName);

	mySpeedBubPub.converse(myPublisher, mySubscription);
	path = null;
	content = null;
	publisherName = null;
	myPublisher = null;
	subscriberName = null;
	mySubscription = null;
	mySpeedBubPub = null;
}).add('Stable\t\tUnsubscribe\t', function() {
	var myBubPubSub = new Bub();
	var path = '/politics/europe';
	var subscriptionName = 'myLittleListener';

	var mySubscription = myBubPubSub.subscribe(path, function(data) {
		//console.log(data.originalTopic);
	}, {
		getBubbles : true,
		getPersists : false
	}, subscriptionName);

	myBubPubSub.unsubscribe(mySubscription);
	myBubPubSub = null;
	path = null;
	subscriptionName = null;
	mySubscription = null;
	mySecondSubscription = null;
}).add('SpeedUp\tUnsubscribe\t', function() {
	var mySpeedBubPub = new SpeedBubPub();
	var path = '/politics/europe';
	var subscriptionName = 'myLittleListener';

	var mySubscription = mySpeedBubPub.subscribe(path, function(data) {
		//console.log(data.originalTopic);
	}, {
		getBubbles : true,
		getPersists : false
	}, subscriptionName);

	var unsub = mySpeedBubPub.unsubscribe(mySubscription);
	path = null;
	subscriptionName = null;
	mySubscription = null;
	mySecondSubscription = null;
	mySpeedBubPub = null;
}).add('Stable\t\twasPublishedOnTopic\t', function() {
	var myBubPubSub = new Bub();
	var myPublisher = myBubPubSub.publish('/politics/europe', {
		content : 'this is wonderfool',
	}, {
		bubble : true,
		persist : true
	}, 'myTestPublisher');

	myBubPubSub.wasPublishedOnTopic(myPublisher.topic, true);

	myPublisher = null;
	myBubPubSub = null;
}).add('SpeedUp\twasPublishedOnTopic\t', function() {
	var mySpeedBubPub = new SpeedBubPub();
	var myPublisher = mySpeedBubPub.publish('/politics/europe', {
		content : 'this is wonderfool',
	}, {
		bubble : true,
		persist : true
	}, 'myTestPublisher');

	mySpeedBubPub.wasPublishedOnTopic(myPublisher.topic, true);

	myPublisher = null;
	mySpeedBubPub = null;
}).add('Stable\t\tchainCallSubscribers\t', function() {
	var myBubPubSub = new Bub();
	var publication = {
		topic : '/politics/europe',
		data : {
			content : 'this is wonderfool',
			originalTopic : '/politics/europe',
			uniquePublicationId : 'pub_1353948822809_88533'
		},
		settings : {
			bubble : true,
			persist : true
		},
		timestamp : 1353948822809,
		publisher : 'myTestPublisher',
		subscribersFired : []
	};

	var config = {
		scope : {
			VERSION : '0.8.7',
			id : 'bubpubsubId',
			defaults : {
				bubble : true,
				persist : false,
				getBubbles : true,
				getPersists : false,
				chain : false,
				scope : [],
				debugging : 0,
				forceUniqueSubscriber : true,
				skipOverFailedSubscribers : true,
				chainDelay : 0,
				throwErrors : false,
				catchSubscriberErrors : false
			},
			errors : [],
			publicationChannels : {},
			publicationLog : [],
			publicationAnnouncements : []
		},
		persist : true,
		bubble : true,
		chain : false,
		chainDelay : 0,
		silent : false
	};

	myBubPubSub.chainCallSubscribers(publication, config, []);
	publication = null;
	config = null;
	myBubPubSub = null;
}).add('SpeedUp\tchainCallSubscribers\t', function() {
	var mySpeedBubPub = new SpeedBubPub();
	var publication = {
		topic : '/politics/europe',
		data : {
			content : 'this is wonderfool',
			originalTopic : '/politics/europe',
			uniquePublicationId : 'pub_1353948822809_88533'
		},
		settings : {
			bubble : true,
			persist : true
		},
		timestamp : 1353948822809,
		publisher : 'myTestPublisher',
		subscribersFired : []
	};

	var config = {
		scope : {
			VERSION : '0.8.7',
			id : 'bubpubsubId',
			defaults : {
				bubble : true,
				persist : false,
				getBubbles : true,
				getPersists : false,
				chain : false,
				scope : [],
				debugging : 0,
				forceUniqueSubscriber : true,
				skipOverFailedSubscribers : true,
				chainDelay : 0,
				throwErrors : false,
				catchSubscriberErrors : false
			},
			errors : [],
			publicationChannels : {},
			publicationLog : [],
			publicationAnnouncements : []
		},
		persist : true,
		bubble : true,
		chain : false,
		chainDelay : 0,
		silent : false
	};

	mySpeedBubPub.chainCallSubscribers(publication, config, []);
	publication = null;
	config = null;
	mySpeedBubPub = null;
}).add('Stable\t\tholeWorkflow\t', function() {
	var myBubPubSub = new Bub();
	var pubSub = '/a/b/c';
	var subscriberId;
	var publisherName = 'myTestPublisher';
	var mySubscriber = 'mySub';
	var j = 0;

	var mySubscriberHub = myBubPubSub.subscribe('/a/b/c', function(pubData, originalTopic, publisher) {
		myBubPubSub.publish(
		/**
		 * needs to be /reply/ because of strip function
		 */"/reply/" + pubData.originalTopic + "/done", {}, {
			bubble : true,
			persist : false
		}, publisherName);
	}, {
		getBubbles : true
	}, subscriberId);

	/**
	 * publishes und subscribes 10 times.
	 */
	for (var i = 0; i < 10; i++) {
		var subscriberId = 'sub_' + i;
		var self = this;
		self[mySubscriber + i] = myBubPubSub.subscribe('/reply' + pubSub + '/done', function(pubData, originalTopic, publisher) {
			myBubPubSub.unsubscribe(self[mySubscriber + i]);
			j--;
		}, {
			getBubbles : true
		}, subscriberId);

		var published = myBubPubSub.publish(pubSub, {}, {
			bubble : true,
			persist : false
		}, publisherName);
		j++;
	}

	pubSub = null;
	subscriberId = null;
	mySubscriber = null;
	publisherName = null;
	j = null;
	myBubPubSub = null;
}).add('SpeedUp\tholeWorkflow\t', function() {
	var mySpeedBubPub = new SpeedBubPub();
	var pubSub = '/a/b/c';
	var subscriberId;
	var publisherName = 'myTestPublisher';
	var mySubscriber = 'mySub';
	var j = 0;

	var mySubscriberHub = mySpeedBubPub.subscribe('/a/b/c', function(pubData, originalTopic, publisher) {
		mySpeedBubPub.publish(
		/**
		 * needs to be /reply/ because of strip function
		 */"/reply/" + pubData.originalTopic + "/done", {}, {
			bubble : true,
			persist : false
		}, publisherName);
	}, {
		getBubbles : true
	}, subscriberId);

	/**
	 * publishes und subscribes 10 times.
	 */
	for (var i = 0; i < 10; i++) {
		var subscriberId = 'sub_' + i;
		var self = this;
		self[mySubscriber + i] = mySpeedBubPub.subscribe('/reply' + pubSub + '/done', function(pubData, originalTopic, publisher) {
			mySpeedBubPub.unsubscribe(self[mySubscriber + i]);
			j--;
		}, {
			getBubbles : true
		}, subscriberId);

		var published = mySpeedBubPub.publish(pubSub, {}, {
			bubble : true,
			persist : false
		}, publisherName);
		j++;
	}

	pubSub = null;
	subscriberId = null;
	mySubscriber = null;
	publisherName = null;
	j = null;
	mySpeedBubPub = null;
})
// add listeners
.on('cycle', function(event) {
	console.log('\t', String(event.target));
	if(!tmp)
	{
	  console.log('\n');
	  tmp = true;
	}else tmp = false;
}).on('complete', function() {
	console.log('\nFastest is ' + this.filter('fastest').pluck('name') + '\n');
})
// run async
.run({
	'async' : true
});

/*.add('Stable\t\t', function () {
 var myBubPubSub = new Bub();

 myBubPubSub = null;
 }).add('Stable\t', function () {
 var mySpeedBubPub = new SpeedBubPub();

 mySpeedBubPub = null;
 })*/