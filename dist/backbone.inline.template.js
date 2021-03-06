// Backbone.Inline.Template, v1.0.1
// Copyright (c) 2016 Michael Heim, Zeilenwechsel.de
// Distributed under MIT license
// http://github.com/hashchange/backbone.inline.template

;( function ( root, factory ) {
    "use strict";

    // UMD for a Backbone plugin. Supports AMD, Node.js, CommonJS and globals.
    //
    // - Code lives in the Backbone namespace.
    // - The module does not export a meaningful value.
    // - The module does not create a global.

    var supportsExports = typeof exports === "object" && exports && !exports.nodeType && typeof module === "object" && module && !module.nodeType;

    // AMD:
    // - Some AMD build optimizers like r.js check for condition patterns like the AMD check below, so keep it as is.
    // - Check for `exports` after `define` in case a build optimizer adds an `exports` object.
    // - The AMD spec requires the dependencies to be an array **literal** of module IDs. Don't use a variable there,
    //   or optimizers may fail.
    if ( typeof define === "function" && typeof define.amd === "object" && define.amd ) {

        // AMD module
        define( [ "exports", "underscore", "backbone", "backbone.declarative.views" ], factory );

    } else if ( supportsExports ) {

        // Node module, CommonJS module
        factory( exports, require( "underscore" ), require( "backbone" ), require( "backbone.declarative.views" ) );

    } else  {

        // Global (browser or Rhino)
        factory( {}, _, Backbone );

    }

}( this, function ( exports, _, Backbone ) {
    "use strict";

    var $ = Backbone.$,
        $document = $( document ),
        pluginNamespace = Backbone.InlineTemplate = {
            hasInlineEl: _hasInlineEl,
            updateTemplateSource: false,
            version: "1.0.1"
        },

        rxLeadingComments = /^(\s*<!--[\s\S]*?-->)+/,
        rxTrailingComments = /(<!--[\s\S]*?-->\s*)+$/,
        rxOutermostHtmlTagWithContent = /(<\s*[a-zA-Z][\s\S]*?>)([\s\S]*)(<\s*\/\s*[a-zA-Z]+\s*>)/,
        rxSelfClosingHtmlTag = /<\s*[a-zA-Z][\s\S]*?\/?\s*>/,

        bbdvLoadTemplate = Backbone.DeclarativeViews.defaults.loadTemplate;

    //
    // Initialization
    // --------------

    Backbone.DeclarativeViews.plugins.registerDataAttribute( "el-definition" );
    Backbone.DeclarativeViews.plugins.registerDataAttribute( "bbit-internal-template-status" );
    Backbone.DeclarativeViews.plugins.registerCacheAlias( pluginNamespace, "inlineTemplate" );
    Backbone.DeclarativeViews.plugins.enforceTemplateLoading();

    //
    // Template loader
    //----------------

    Backbone.DeclarativeViews.defaults.loadTemplate = function ( templateProperty ) {
        var parsedTemplateData, $resultTemplate,

            // Check Backbone.InlineTemplate.custom.hasInlineEl first, even though it is undocumented, to catch
            // accidental assignments.
            hasInlineEl = pluginNamespace.custom.hasInlineEl || pluginNamespace.hasInlineEl || _hasInlineEl,
            updateTemplateContainer = pluginNamespace.updateTemplateSource,

            $inputTemplate = bbdvLoadTemplate( templateProperty );

        if ( _isMarkedAsUpdated( $inputTemplate ) || !hasInlineEl( $inputTemplate ) ) {

            // No inline el definition. Just return the template as is.
            $resultTemplate = $inputTemplate;

        } else {

            // Parse the template data.
            //
            // NB Errors are not handled here and bubble up further. Try-catch is just used to enhance the error message
            // for easier debugging.
            try {

                parsedTemplateData = _parseTemplateHtml( $inputTemplate.html() );

            } catch ( err ) {
                err.message += '\nThe template was requested for template property "' + templateProperty + '"';
                throw err;
            }

            if ( updateTemplateContainer ) {
                // For updating the template container, it has to be a node in the DOM. Throw an error if it has been
                // passed in as a raw HTML string.
                if ( !existsInDOM( templateProperty )  ) throw new Backbone.DeclarativeViews.TemplateError( "Backbone.Inline.Template: Can't update the template container because it doesn't exist in the DOM. The template property must be a valid selector (and not, for instance, a raw HTML string). Instead, we got \"" + templateProperty + '"' );

                $resultTemplate = $inputTemplate;

                // The template is updated and the inline `el` removed. Set a flag on the template to make sure the
                // template is never processed again as having an inline `el`.
                _markAsUpdated( $resultTemplate );
            } else {
                // No updating of the input template. Create a new template node which will stay out of the DOM, but is
                // passed to the cache.
                $resultTemplate = $( "<script />" ).attr( "type", "text/x-template" );
            }

            _mapElementToDataAttributes( parsedTemplateData.$elSample, $resultTemplate );
            $resultTemplate.empty().text( parsedTemplateData.templateContent );

        }

        return  $resultTemplate;
    };

    /**
     * Checks if a template is marked as having an inline `el`. Is also exposed as Backbone.InlineTemplate.hasInlineEl().
     *
     * By default, a template is recognized as having an inline `el` when the container has the following data attribute:
     * `data-el-definition: "inline"`.
     *
     * The check can be changed by overriding Backbone.InlineTemplate.hasInlineEl with a custom function. In order to
     * treat all templates as having an inline `el`, for instance, the custom function just has to return true:
     *
     *     Backbone.InlineTemplate.hasInlineEl = function () { return true; };
     *
     * @param   {jQuery}   $templateContainer  the template node (usually a <script> or a <template> tag)
     * @returns {boolean}
     */
    function _hasInlineEl ( $templateContainer ) {
        return $templateContainer.data( "el-definition" ) === "inline";
    }

    /**
     * Marks a template as updated and no longer having an inline `el`. Henceforth, the template node is treated like an
     * ordinary, non-inline template.
     *
     * ## Rationale:
     *
     * A template is updated when the `updateTemplateSource` option is set. After the update, the `el` markup has been
     * removed from the template content, and only the inner HTML of the `el` is still present in the template.
     *
     * Therefore, the template must not be processed again for having an inline `el`, even though it is still marked as
     * such. (The inline `el` marker - e.g. data-el-definition: "inline" - is still present.) Repeated processing would
     * garble the remaining template content.
     *
     * That is prevented by setting a second flag in a data attribute which is considered internal. A template which is
     * marked as updated, with that flag, is not processed and updated again.
     *
     * ## jQuery data cache:
     *
     * The jQuery data cache doesn't have to be updated here. That happens automatically while the template is checked
     * for data attributes in Backbone.Declarative.Views.
     *
     * @param {jQuery} $templateContainer
     */
    function _markAsUpdated ( $templateContainer ) {
        $templateContainer.attr( "data-bbit-internal-template-status", "updated" );
    }

    /**
     * Checks if a template is marked as having been updated.
     *
     * @param   {jQuery}  $templateContainer
     * @returns {boolean}
     */
    function _isMarkedAsUpdated ( $templateContainer ) {
        return $templateContainer.data( "bbit-internal-template-status" ) === "updated";
    }

    /**
     * Takes the raw text content of the template tag, extracts the inline `el` as well as its content, turns the `el`
     * string into a sample node and, finally, returns the $el sample and the inner content in a hash.
     *
     * @param   {string}              templateText
     * @returns {ParsedTemplateData}
     */
    function _parseTemplateHtml ( templateText ) {

        var elDefinition, $elSample, templateContent = "",
            normalizedTemplateText = templateText.replace( rxLeadingComments, "" ).replace( rxTrailingComments, "" ),
            matches = rxOutermostHtmlTagWithContent.exec( normalizedTemplateText ) || rxSelfClosingHtmlTag.exec( normalizedTemplateText );

        if ( !matches ) throw new Backbone.DeclarativeViews.TemplateError( 'Backbone.Inline.Template: Failed to parse template with inline `el` definition. No matching content found.\nTemplate text is "' + templateText + '"' );

        if ( matches[3] ) {
            // Applied regex for outermost HTML tag with content, capturing 3 groups
            elDefinition = matches[1] + matches[3];
            templateContent = matches[2];
        } else {
            // Applied regex for self-closing `el` tag without template content, not capturing any groups.
            elDefinition = matches[0];
        }

        try {
            $elSample = $( elDefinition );
        } catch ( err ) {
            throw new Backbone.DeclarativeViews.TemplateError( 'Backbone.Inline.Template: Failed to parse template with inline `el` definition. Extracted `el` could not be turned into a sample node.\nExtracted `el` definition string is "' + elDefinition + '", full template text is "' + templateText + '"' );
        }

        return {
            templateContent: templateContent,
            $elSample: $elSample
        };
    }

    /**
     * Takes an element node and maps its defining characteristics - tag name, classes, id, other attributes - to data
     * attributes on another node, in the format used by Backbone.Declarative.Views.
     *
     * In other words, it transforms an actual `el` sample node into a set of descriptive data attributes on a template.
     *
     * @param {jQuery} $sourceNode  the `el` sample node
     * @param {jQuery} $target      the template node
     */
    function _mapElementToDataAttributes ( $sourceNode, $target ) {

        var sourceProps = {
            tagName: $sourceNode.prop("tagName").toLowerCase(),
            className: $.trim( $sourceNode.attr( "class" ) ),
            id: $.trim( $sourceNode.attr( "id" ) ),
            otherAttributes: {}
        };

        _.each( $sourceNode[0].attributes, function ( attrNode ) {
            var name = attrNode.nodeName,
                value = attrNode.nodeValue,
                include = value !== undefined && name !== "class" && name !== "id";

            if ( include ) sourceProps.otherAttributes[attrNode.nodeName] = value;
        } );

        if ( sourceProps.tagName !== "div" ) $target.attr( "data-tag-name", sourceProps.tagName );
        if ( sourceProps.className ) $target.attr( "data-class-name", sourceProps.className );
        if ( sourceProps.id ) $target.attr( "data-id", sourceProps.id );
        if ( _.size( sourceProps.otherAttributes ) ) $target.attr( "data-attributes", JSON.stringify( sourceProps.otherAttributes ) );

    }

    //
    // Generic helpers
    // ---------------

    /**
     * Checks if an entity can be passed to jQuery successfully and be resolved to a node which exists in the DOM.
     *
     * Can be used to verify
     * - that a string is a selector, and that it selects at least one existing element
     * - that a node is part of the document
     *
     * Returns false if passed e.g. a raw HTML string, or invalid data, or a detached node.
     *
     * @param   {*} testedEntity  can be pretty much anything, usually a string (selector) or a node
     * @returns {boolean}
     */
    function existsInDOM ( testedEntity ) {
        try {
            return $document.find( testedEntity ).length !== 0;
        } catch ( err ) {
            return false;
        }
    }


    // Module return value
    // -------------------
    //
    // A return value may be necessary for AMD to detect that the module is loaded. It ony exists for that reason and is
    // purely symbolic. Don't use it in client code. The functionality of this module lives in the Backbone namespace.
    exports.info = "Backbone.Inline.Template has loaded. Don't use the exported value of the module. Its functionality is available inside the Backbone namespace.";


    //
    // Custom types
    // ------------
    //
    // For easier documentation and type inference.

    /**
     * @name  ParsedTemplateData
     * @type  {Object}
     *
     * @property {jQuery} $elSample
     * @property {string} templateContent
     */

} ) );