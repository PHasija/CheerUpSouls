/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var AssistantV1 = require('watson-developer-cloud/assistant/v1'); // watson sdk
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1'); // discovery sdk

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper

var assistant = new AssistantV1({
  version: '2018-07-10'
});

// Endpoint to be call from the client side
app.post('/api/message', function (req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the assistant service
  assistant.message(payload, function (err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }

    // This is a fix for now, as since Assistant version 2018-07-10,
    // output text can now be in output.generic.text
    if (data.output.text.length === 0) {
      if (data.output.generic !== undefined) {
        if (data.output.generic[0].text !== undefined) {
          data.output.text = data.output.generic[0].text;
        } else if (data.output.generic[0].title !== undefined) {
          data.output.text = data.output.generic[0].title;
        }
      }
    }

    return res.json(updateMessage(payload, data));
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Assistant service
 * @param  {Object} response The response from the Assistant service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  var passage=null;
  
  if (!response.output) {
    response.output = {};
  } else if(response.intents[0] !=undefined && response.intents[0].intent=="OrganisationRelated") {
    console.log("Intent Matched");
    console.log("User Input is : " + input.input.text);
    var temp;

  var discovery = new DiscoveryV1({
    username: process.env.DISCOVERY_USERNAME,
    password: process.env.DISCOVERY_PASSWORD,
    url: process.env.DISCOVERY_URL,
    version_date: '2018-08-20'
  });
  
  var params = {
      'query': input.input.text,
      'environment_id': process.env.DISCOVERY_ENVIRONMENT_ID,
      'collection_id': process.env.DISCOVERY_COLLECTION_ID,
      'configuration_id': process.env.DISCOVERY_CONFIGURATION_ID,
      'passages': true, //if you want to enable passages,
      'passages_characters': 600,
       return: 'text, title'
    //'highlight': true //if you want to enable highlight
  
  }
  console.log("Reached before Query Method,Making query to discovery");
  
  discovery.query(params, (error, data) => {
      if (error) {
        next(error);
      } else {
        passage = data.passages[0].passage_text;
        //console.log(JSON.stringify(data, null, 1));
        console.log(passage);
        temp=true;
      }
  });
  while(temp === undefined) {
    require('deasync').sleep(300);
  }
    //var responseText = callDiscoveryService();
    console.log("Response Text After Method Call: "+ passage);
    response.output.text = passage + "<br><br>"+ "Is There anything else I can help you with ?";
    return response;
  }
  else {
    console.log("Intent not Matched");
    return response;
  }

  /*if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }*/
  response.output.text = responseText;
  return response;
}

/*function callDiscoveryService(){

  var temp;

  var discovery = new DiscoveryV1({
    username: process.env.DISCOVERY_USERNAME,
    password: process.env.DISCOVERY_PASSWORD,
    url: process.env.DISCOVERY_URL,
    version_date: '2018-08-20'
  });
  
  var params = {
      'query': input.input.text,
      'environment_id': process.env.DISCOVERY_ENVIRONMENT_ID,
      'collection_id': process.env.DISCOVERY_COLLECTION_ID,
      'configuration_id': process.env.DISCOVERY_CONFIGURATION_ID,
      'passages': true, //if you want to enable passages,
      'passages_characters': 600,
       return: 'text, title'
    //'highlight': true //if you want to enable highlight
  
  }
  console.log("Reached before Query Method,Making query to discovery");
  var passage;
  discovery.query(params, (error, data) => {
      if (error) {
        next(error);
      } else {
        var passage = data.passages[0].passage_text;
        //console.log(JSON.stringify(data, null, 1));
        console.log(passage);
        temp=true;
      }
  });
  while(temp === undefined) {
    require('deasync').runLoopOnce();
  }
  return passage;
}*/

module.exports = app;