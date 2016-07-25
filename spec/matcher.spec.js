/*global describe, it */
(function () {
    "use strict";

    describe( 'Matcher test', function () {

        var $head = $( "head" );

        describe( 'Identifying the `el` and its content. When the `el` is defined', function () {

            var tagFormatScenario = {
                    "a self-closing tag, using a closing slash": { isSelfClosing: true, selfClosingChar: "/" },
                    "a self-closing tag, omitting a closing slash": { isSelfClosing: true, selfClosingChar: "" },
                    "a tag which is opened and closed": { isSelfClosing: false }
                },

                tagNameScenario = {
                    "a single-letter tag": "p",
                    "a multi-letter tag": "section"
                },

                attributeScenario = {
                    "no attributes": {},
                    "attributes class, id, and others (values in single quotes)": {
                        singleQuotes: true,
                        attrs: { className: "fooClass barClass", id: "fooId", lang: "fr", contenteditable: "true" }
                    },
                    "attributes class, id, and others (values in double quotes)": {
                        singleQuotes: false,
                        attrs: { className: "fooClass barClass", id: "fooId", lang: "fr", contenteditable: "true" }
                    }
                },

                whitespaceScenario = {
                    "no redundant white space around and inside the tag": "",
                    "redundant whitespace around and inside the tag": "   ",
                    "redundant whitespace, including line breaks, around and inside the tag": "   \n    \n   "
                };


            withData( tagFormatScenario, function ( tagFormat ) {

                withData( tagNameScenario, function ( tagName ) {

                    withData( attributeScenario, function ( attributesSetup ) {

                        withData( whitespaceScenario, function ( extraSpace ) {

                            var $template, expected, view;

                            before( function () {

                                var isSelfClosing = tagFormat.isSelfClosing,
                                    selfClosingChar = tagFormat.selfClosingChar,

                                    attributes = attributesSetup.attrs || {},
                                    attributeQuote = attributesSetup.singleQuotes ? "'" : '"',
                                    customAttributes = _.omit( attributes, "className", "id" ),

                                    attributeString = _.reduce( attributes, function ( reduced, attrValue, attrName ) {
                                        var name = attrName === "className" ? "class" : attrName;
                                        return reduced + " " + extraSpace + name + extraSpace + "=" + extraSpace + attributeQuote + attrValue + attributeQuote;
                                    }, "" ),

                                    elStartTag = extraSpace + "<" + tagName + attributeString + extraSpace + ( isSelfClosing ? selfClosingChar + ">" : ">" ),
                                    elEndTag = isSelfClosing ? extraSpace : "</" + extraSpace + tagName + extraSpace + ">" + extraSpace,
                                    innerContent = isSelfClosing ? "" : extraSpace + createInnerContent( "{{", "}}", extraSpace ) + extraSpace,
                                    templateNodeInnerHtml = elStartTag + innerContent + elEndTag,

                                    templateId = _.uniqueId( "template_" );

                                $template = $( "<script />" )
                                    .attr( {
                                        id: templateId,
                                        type: "text/x-template",
                                        "data-el-definition": "inline"
                                    } )
                                    .text( templateNodeInnerHtml )
                                    .appendTo( $head );

                                expected = {
                                    tagName: tagName,
                                    className: attributes.className,
                                    attributes: _.size( customAttributes ) ? customAttributes : undefined,
                                    contenteditable: attributes.contenteditable,
                                    innerContent: innerContent
                                };

                                view = new Backbone.View( { template: "#" + templateId } );
                            } );

                            after( function () {
                                $template.remove();
                                Backbone.InlineTemplate.clearCache();
                            } );

                            it( 'it detects the el correctly', function () {
                                // Determined by checking the cache. Could also be determined by examining view.el.
                                var cached = view.inlineTemplate.getCachedTemplate();

                                expect( cached.tagName ).to.equal( expected.tagName );
                                expect( cached.className ).to.equal( expected.className );
                                expect( cached.attributes ).to.eql( expected.attributes );
                            } );

                            it( 'it detects the el content correctly', function () {
                                // Determined by checking the cache.
                                var cached = view.inlineTemplate.getCachedTemplate();
                                expect( cached.html ).to.equal( expected.innerContent );
                            } );

                        } );

                    } );

                } );

            } );

        } );

    } );

})();