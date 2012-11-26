var bub = require("../lib/bubpubsub");
var should = require('should');

describe('BubPubSub', function() {
	var myBubPubSub = null;
	var bubSubId = "bubpubsubId";
	/**
	 *Stuff before running tests
	 */
	beforeEach(function(done) {
		
		/**
		 *Test aEscalator constructor
		 */
		myBubPubSub = new bub(bubSubId);
		should.exist(myBubPubSub);
		
		done();
	});
	
	it("should check the default constructor attributes", function(done){
		console.log(myBubPubSub);
		
		myBubPubSub.VERSION.should.equal('0.8.7');
		myBubPubSub.id.should.equal(bubSubId);
		
		myBubPubSub.defaults.bubble.should.be.a("boolean");
		myBubPubSub.defaults.persist.should.be.a("boolean");
		myBubPubSub.defaults.getBubbles.should.be.a("boolean");
		myBubPubSub.defaults.getPersists.should.be.a("boolean");
		myBubPubSub.defaults.chain.should.be.a("boolean");
		
		/**
		 * checks if scope: Circular -> id = same id like befor.
		 */
		myBubPubSub.defaults.scope.id.should.equal(bubSubId);
		
		myBubPubSub.defaults.debugging.should.be.a("number");
		myBubPubSub.defaults.forceUniqueSubscriber.should.be.a("boolean");
		myBubPubSub.defaults.skipOverFailedSubscribers.should.be.a("boolean");
		myBubPubSub.defaults.chainDelay.should.be.a("number");
		myBubPubSub.defaults.throwErrors.should.be.a("boolean");
		myBubPubSub.defaults.catchSubscriberErrors.should.be.a("boolean");
		
		/**
		 * checks if the array is empty
		 */
		myBubPubSub.errors.should.have.length(0);
		myBubPubSub.publicationChannels.should.be.a('object');
		myBubPubSub.publicationLog.should.have.length(0);
		myBubPubSub.publicationAnnouncements.should.have.length(0);

		done();
	});
	
	it("should check the subscriber first time", function(done){
		var path = '/politics/europe';
		var subscriberName = 'myLittleListener';
		var mySubscription = myBubPubSub.subscribe(
 			path, 
 			function(currentBranch, publisher, reply) { 
 				console.log(data.originalTopic);  
 				reply('this is a stupid example');
 			}, 
 			{ getBubbles: true, getPersists: false },
 			subscriberName
 		);
 		
 		should.exist(myBubPubSub.publicationChannels[path][subscriberName]);
 		myBubPubSub.publicationChannels[path][subscriberName].getBubbles.should.equal(true);
 		myBubPubSub.publicationChannels[path][subscriberName].getPersists.should.equal(false);
 		myBubPubSub.publicationChannels[path][subscriberName].autoUnsubscribe.should.equal(false);
 		myBubPubSub.publicationChannels[path][subscriberName].id.should.equal(subscriberName);
 		myBubPubSub.publicationChannels[path][subscriberName].fired.should.equal(0);
 		
 		//console.log(myBubPubSub.publicationChannels[path][subscriberName]);
 		done();
	});
	
	it("should check publish methode", function(done){
		var regexForId = /pub_*/;
		
		var path = '/politics/europe';
		var content = 'this is wonderfool';
		var publisherName = 'myTestPublisher';
		var myPublisher = myBubPubSub.publish(
 			path, 
 			{ 
 				content: content,  
			},
			{ 
				bubble:true, 
				persist:true 
			}, 
			publisherName
 		);
 		
 		should.exist(myBubPubSub);
 		myPublisher.topic.should.equal(path);
 		myPublisher.data.content.should.equal(content);
 		/**
 		 * TODO sollte nur beim ersten mal Funktioniere... myPublisher.data.originalTopic.should.equal(path); path ist die falsche Übergabe
 		 */
 		myPublisher.data.originalTopic.should.equal(path);
 		(regexForId.test(myPublisher.data.uniquePublicationId)).should.equal(true);
 		myPublisher.settings.bubble.should.be.a('boolean');
 		myPublisher.settings.persist.should.be.a('boolean');
 		myPublisher.publisher.should.equal(publisherName);
 		console.log(myPublisher);
 		done();
	});
});