/**
* @license Apache-2.0
*
* Copyright (c) 2025 The Stdlib Authors.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

// FUNCTIONS //

/**
* Returns a label name.
*
* @private
* @param {Object} label - label data
* @returns {string} label name
*/
function labelName( label ) {
	return label.name;
}

/**
* Removes status labels from a list of label names.
*
* @private
* @param {Array<string>} labels - list of label names
* @returns {Array<string>} filtered list of label names
*/
function filterLabels( labels ) {
	var out;
	var v;
	var i;

	out = [];
	for ( i = 0; i < labels.length; i++ ) {
		v = labels[ i ];
		if ( v.toLowerCase().startsWith( 'status:' ) === false ) {
			out.push( v );
		}
	}
	return out;
}


// MAIN //

/**
* Ensures that only one status label is applied at any one time.
*
* @private
* @param {Object} github - pre-authenticated octokit rest client
* @param {Object} context - workflow run context
* @param {Object} core - core action functions
* @param {string} status - desired status label
* @returns {Promise} promise which returns query results upon resolving
*/
async function main( github, context, core, status ) {
	var issueNumber;
	var labels;
	var owner;
	var repo;

	// Retrieve issue context data:
	issueNumber = context.issue.number;
	owner = context.repo.owner;
	repo = context.repo.repo;

	// Retrieve the list of labels:
	labels = await github.rest.issues.listLabelsOnIssue({
		'owner': owner,
		'repo': repo,
		'issue_number': issueNumber
	});
	labels = labels.data.map( labelName );

	// Filter out existing status labels:
	labels = filterLabels( labels );

	// Re-add the desired status label:
	labels.push( status );

	// Set the list of labels:
	github.rest.issues.setLabels({
		'owner': owner,
		'repo': repo,
		'issue_number': issueNumber,
		'labels': labels
	});
}


// EXPORTS //

module.exports = main;
