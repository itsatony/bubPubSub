
# bubPubSub

bubPubSub (VisualWeb's PubSub) is a publish/subscribe system for communication between objects/modules of your code. 
It's rather similar to common pubSub systems, but closer related to the event system of nodeJS or the browser. USP's are

* (optional) BUBBLING along a topic-tree 
 
* (optional) PERSISTENCE of publications for later retrieval/reference

It is developed, used and sponsored by myLinkCloud (http://www.mylinkcloud.com), meinUnterricht (http://www.meinUnterricht.de), K.lab (http://www.klab-berlin.com), and ViSERiON (http://www.viserion.com) .

## compatibility

    bubPubSub works on both ends, the client and the server (nodeJS).

## Installation with nodeJS

	  $ npm install bubpubsub

## Test (server-side)

	cd to node_modules/bubpubsub
	make

## VERSION HISTORY:
 
	- v0.8.5 19.11.12
		- bugFixes ..
	- v0.8.4 15.11.12
		- bugFixes ..
		- old parameters for subscribe will be deprecated announcement
	- v0.8.3 15.11.12
		- introduced autoUnsubscribe to subscribe options ! 
		- optional try-catch around subscribers
		- scope setting for subscribers
		- introduced limits for error and publication logs to 10000 items in order to limit memory usage.
	- v0.82 28.07.2012
		- bugfix in chain default and if check. 
	- v0.81 27.07.12
		- unsubscribe updated to do a better job of namespace (& memory) cleanup
	- v0.80 22.06.12
		- added the option to do chaining. this needs quite some field-testing ;)
		- added chainDelay config setting for chained publications to allow breathing-time for the cpu 
	- v0.71 15.06.12
		- made the code a bit more beautiful
		- introduced forceUniqueSubscriber to allow replacing subscriber methods by Id
		- replaced isFunction method by typeof test 
		- removed randomString method
		- switched from bad style == to good style === operators... 
		- changed licence
	- v0.70 21.03.12
		- renamed
		- fused client (jQuery) and server (nodeJS) versions
		- series of bugfixes
	- v0.60	29.10.11			
		- removed dependencies from jQuery. 
		- enabled using the same file for client- and nodeJS server-side implementation
		- added the reply function explicitely

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
	
