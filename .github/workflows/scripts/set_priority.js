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

// VARIABLES //

var ISSUE_QUERY = `query( $issue_url:URI! ) {
	resource( url:$issue_url ) {
		... on Issue {
			projectItems( first: 100, includeArchived: true ) {
				nodes {
					id
					project {
						id
						title
						field( name: "Priority" ) {
							... on ProjectV2SingleSelectField {
								id
								name
								options {
									id
									name
								}
							}
						}
					}
				}
			}
		}
	}
}`;
var FIELD_MUTATION = `mutation( $project:ID!, $field:ID!, $item:ID!, $option:String! ) {
	updateProjectV2ItemFieldValue(
		input: {
			projectId: $project
			fieldId: $field
			itemId: $item
			value: {
				singleSelectOptionId: $option
			}
		}
	) {
		projectV2Item {
			id
		}
	}
}`;


// MAIN //

/**
* Updates the "Priority" project column for the current issue.
*
* @private
* @param {Object} github - pre-authenticated octokit rest client
* @param {Object} context - workflow run context
* @param {Object} core - core action functions
* @param {string} projectName - project name
* @param {string} priority - desired priority
* @returns {Promise} promise which returns query results upon resolving
*/
async function main( github, context, core, projectName, priority ) {
	var variables;
	var project;
	var result;
	var option;
	var owner;
	var field;
	var label;
	var date;
	var item;

	// Retrieve issue context data:
	owner = context.repo.owner;

	// Retrieve issue and project info:
	variables = {
	  'issue_url': context.payload.issue.html_url
	};
	result = await github.graphql( ISSUE_QUERY, variables );

	// Resolve the project item:
	item = result.resource.projectItems.nodes.filter( filterItems );
	if ( item.length === 0 ) {
		core.warning( 'Unable to update field. Issue does not belong to any projects. Skipping further processing...' );
		return;
	}
	item = item[ 0 ];

	// Resolve the associated project:
	project = item.project;

	// Resolve the field info:
	field = project.field;

	// Resolve the relevant field option:
	if ( priority.toLowerCase().startsWith( 'priority:' ) ) {
		priority = priority.replace( /^priority:\s*/i, '' );
	}
	option = field.options.filter( filterOptions );
	if ( option.length === 0 ) {
		core.warning( 'Unable to update field. Priority label does not have a corresponding field option. Skipping further processing...' );
		return;
	}
	option = option[ 0 ];

	// Update the field value:
	variables = {
		'project': project.id,
		'field': field.id,
		'item': item.id,
		'option': option.id
	};
	return await github.graphql( FIELD_MUTATION, variables );

	/**
	* Filters project items for those belonging to the specified project.
	*
	* @private
	* @param {Object} node - project item
	* @returns {boolean} boolean indicating whether an item belongs to the specified project
	*/
	function filterItems( node ) {
		return ( node.project.title === projectName );
	}

	/**
	* Filters field selection options.
	*
	* @private
	* @param {Object} option - option object
	* @param {string} option.name - option name
	* @returns {boolean} boolean indicating whether a option matches the desired priority
	*/
	function filterOptions( option ) {
		return ( option.name === priority );
	}
}


// EXPORTS //

module.exports = main;
