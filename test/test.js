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
		//console.log(myBubPubSub);
		
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
	
	it("should check publish method", function(done){
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
 		//console.log(myPublisher);
 		done();
	});
	
	it("should unsubscribe", function(done){
		var path = '/politics/europe';
		var subscriptionName = 'myLittleListener';
		
		var mySubscription = myBubPubSub.subscribe(
 			path, 
 			function(data) { 
 				//console.log(data.originalTopic); 
 			},  
 			{ getBubbles: true, getPersists: false }, 
 			subscriptionName
 		);
 		
 		should.exist(myBubPubSub.publicationChannels[path]);
 		var unsub = myBubPubSub.unsubscribe(mySubscription);
 		
 		myBubPubSub.publicationChannels.should.not.be.arguments;
 		done();
	});
	
	/**
	 * just checks if method returns true another test should check if the "fired parameter"
	 * is getting bigger
	 */
	it(" should test if method wasPublishedOnTopic returns true", function(done){
		var path = '/politics/europe';
		var publishedPath = '/politics';
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
 		//console.log(myBubPubSub);
 		//console.log('##########################################');
 		var matchingPubs = myBubPubSub.wasPublishedOnTopic(publishedPath, true);
 		//console.log(matchingPubs);
 		matchingPubs[0].topic.should.equal(path);
 		matchingPubs[0].data.content.should.equal(content);
 		matchingPubs[0].data.originalTopic.should.equal(path);
 		matchingPubs[0].settings.bubble.should.equal(true);
 		matchingPubs[0].settings.persist.should.equal(true);
 		matchingPubs[0].publisher.should.equal(publisherName);
 		matchingPubs[0].subscribersFired.should.be.empty;
 		done();
	});
	
	it(" should test the method chainCallSubscribers", function(done){
		var publication = { topic: '/politics/europe',
  							data: 
   							{ content: 'this is wonderfool',
     						  originalTopic: '/politics/europe',
     						  uniquePublicationId: 'pub_1353948822809_88533' },
  							  settings: { bubble: true, persist: true },
  							  timestamp: 1353948822809,
  							  publisher: 'myTestPublisher',
  							  subscribersFired: [] 
  						   };
  						
  		var config = { scope: 
   						{ VERSION: '0.8.7',
    					  id: 'bubpubsubId',
     					  defaults: 
      					  { bubble: true,
        				    persist: false,
        				    getBubbles: true,
        				    getPersists: false,
        				    chain: false,
        					scope: [],
        					debugging: 0,
        					forceUniqueSubscriber: true,
        					skipOverFailedSubscribers: true,
        					chainDelay: 0,	
        					throwErrors: false,
        					catchSubscriberErrors: false },
     					errors: [],
     					publicationChannels: {},
     					publicationLog: [],
     					publicationAnnouncements: [] },
  					persist: true,
  					bubble: true,
  					chain: false,
  					chainDelay: 0,
  					silent: false };


		
		(myBubPubSub.chainCallSubscribers(publication, config, [])).should.equal(true);
		done();
	});
	
	
	it("should check if the hole workflow is working", function(done){
		var mySubscriberHub = myBubPubSub.subscribe(
			'/a/b/c',
			function(pubData, originalTopic, publisher){
				//console.log("hier hört hin","/reply"+pubData.originalTopic+"/done");
				myBubPubSub.publish(
					"/reply"+pubData.originalTopic+"/done", 
					{},
					{	bubble : true, persist:false },
					publisherName
				);
			},
			{ getBubbles : true},
			subscriberId
		);
		
		
		
		var pubSub = '/a/b/c';
		var subscriberId, mySubscriber;
		var publisherName = 'myTestPublisher';
		var j = 0;
		
		/**
		 * publishes und subscribes 10 times.
		 */
		for(var i = 0; i < 10; i++){
				var subscriberId = 'sub_' + i;		
				var self = this;
				self[mySubscriber+i] = myBubPubSub.subscribe(
					'/reply' + pubSub +'/done',
					function(pubData, originalTopic, publisher){
						//console.log("!!!!!!!!!!!!!!!!!!!!!!!Subscriber Funktion wird aufgerufen!!!!!!!!!!!!!!!!!!!!!!!!!!!");
						myBubPubSub.unsubscribe(self[mySubscriber+i]);
						j--;				
					},
					{ getBubbles : true},
					subscriberId
				);
				
				var published = myBubPubSub.publish(
					pubSub, 
					{},
					{	bubble : true, persist:false },
					publisherName
				);
				j++;
				//console.log(j);
				published.subscribersFired.length.should.equal(1);
		}
		/**
		 * checks if all elements are unsubscribed
		 */	
		j.should.equal(0);
		done();
	});
});