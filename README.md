
# bubPubSub

bubPubSub (VisualWeb's PubSub) is a publish/subscribe system for communication between objects/modules of your code. It's rather similar to the event system of node, however with two additions:

-- (optional) BUBBLING along a topic-tree 
 
-- (optional) PERSISTANCE of publications for later retrieval/reference

It contains utilitiary functions that were copied (and adapted) from the jQuery (http://www.jquery.com) library. 

It is developed, used and sponsored by K.lab (http://www.klab-berlin.com), LinkCloud (http://www.linkcloud.org) and ViSERiON (http://www.viserion.com) .

## compatibility

    bubPubSub works on both the client (e.g. with jQuery - or without it) and the server (nodeJS).

## Installation with nodeJS

	  $ npm install bubpubsub

## Test (server-side)

	cd to node_modules/bubpubsub
	make

## Usage

	there is a detailed description of all functions in the source-code ... 

## examples (more in the source JS)

		// SUBSCRIPTION TO a deep branch WITHOUT PICKING UP BUBBLES 
 		var myEuropeSubscription = aBubPubSub.subscribe(
 			'/politics/europe', 
 			function(data, currentBranch, publisher, replyCall, subscriptionIdObject) { 
 				console.log('original publication branch: ' + data.originalTopic);  
				console.log('i subscribed to : ' + currentBranch);  
 				replyCall('I am [' + myEuropeSubscription.id + '] and I am only interested in european politics');
 			}, 
 			{ getBubbles: false } 
 			'myEuropeSubscriber'
 		);
	   
	   // SUBSCRIPTION TO ROOT WITH BUBBLING
	    var myRootSubscription = aBubPubSub.subscribe(
 			'/', 
 			function(data, currentBranch, publisher, replyCall, subscriptionIdObject) { 
 				console.log('original publication branch: ' + data.originalTopic);  
				console.log('i subscribed to : ' + currentBranch);  
 				replyCall('I am [' + myRootSubscription.id + '] and I pick up any publication');
 			}, 
 			{ getBubbles: true } 
 			'myRootSubscriber'
 		);

   		// PUBLISH WITH PERSISTANCE AND BUBBLING
		aBubPubSub.publish(
 			'/politics/europe/germany/pipa', 
 			{ 
 				content: 'this is wonderfool',  
			},
			{ 
				bubble:true, 
				persist:true 
			}, 
			'myTestPublisher1',
			function(replyCallParametersOfYourChoice) {
				console.dir(replyCallParametersOfYourChoice);
				return true;
			}
 		);
		
		// PUBLISH WITH PERSISTANCE AND BUBBLING
		aBubPubSub.publish(
 			'/politics/europe/germany/pipa/legislation', 
 			{ 
 				content: 'this can not be picked up by the nonBubbler or the persistence check (below)',  
			},
			{ 
				bubble:true, 
				persist:false 
			}, 
			'myTestPublisher2',
			function(replyCallParametersOfYourChoice) {
				console.dir(replyCallParametersOfYourChoice);
				return true;
			}
 		);
		
		
		// PERSISTANCE
		var persistentPublicationObjectArrayOnPolitics = aBubPubSub.wasPublishedOnTopic('/politics', true);
	
		// UNSUBSCRIBE
		aBubPubSub.unsubscribe(myRootSubscription);
	