/*global describe, it */
(function () {
    "use strict";

    describe( 'Matcher test', function () {

        var $template, expected, view,
            $head = $( "head" );

        describe( 'Identifying the `el` and its content. When the `el` is defined', function () {

            var tagFormatScenario = {
                    "with a self-closing tag, using a closing slash": { isSelfClosing: true, selfClosingChar: "/" },
                    "with a self-closing tag, omitting a closing slash": { isSelfClosing: true, selfClosingChar: "" },
                    "with a tag which is opened and closed": { isSelfClosing: false }
                },

                tagNameScenario = {
                    "with a single-letter tag": "p",
                    "with a multi-letter tag": "section"
                },

                attributeScenario = {
                    "without attributes": {},
                    "with attributes class, id, and others (values in single quotes)": {
                        quoteStyle: "'",
                        attrs: { className: "fooClass barClass", id: "fooId", lang: "fr", contenteditable: "true" }
                    },
                    "with attributes class, id, and others (values in double quotes)": {
                        quoteStyle: '"',
                        attrs: { className: "fooClass barClass", id: "fooId", lang: "fr", contenteditable: "true" }
                    },
                    "with attributes class, id, and others (values without quotes)": {
                        quoteStyle: "",
                        attrs: { className: "fooClass", id: "fooId", lang: "fr", contenteditable: "true" }
                    }
                },

                whitespaceScenario = {
                    "without redundant white space around and inside the tag": "",
                    "with redundant whitespace around and inside the tag": "   ",
                    "with redundant whitespace, including newlines, around and inside the tag": "   \n    \n   "
                };


            withData( tagFormatScenario, function ( tagFormat ) {

                withData( tagNameScenario, function ( tagName ) {

                    withData( attributeScenario, function ( attributesSetup ) {

                        withData( whitespaceScenario, function ( extraSpace ) {

                            beforeEach( function () {

                                var isSelfClosing = tagFormat.isSelfClosing,

                                    elDefinition = {
                                        tagName: tagName,
                                        attributes: attributesSetup.attrs
                                    },

                                    elFormatting = {
                                        isSelfClosing: isSelfClosing,
                                        selfClosingChar: tagFormat.selfClosingChar,
                                        quoteStyle: attributesSetup.quoteStyle,
                                        extraSpace: extraSpace
                                    },

                                    elContent = isSelfClosing ? "" : extraSpace + createInnerContent( "{{", "}}", extraSpace ) + extraSpace,

                                    inlineTemplate = createInlineTemplate( elDefinition, elContent, elFormatting ),
                                    templateId = _.uniqueId( "template_" );

                                $template = createTemplateNode( templateId, inlineTemplate.html.fullContent, { "data-el-definition": "inline" } )
                                    .appendTo( $head );

                                expected = {
                                    tagName: tagName,
                                    className: inlineTemplate.el.className,
                                    id: inlineTemplate.el.id,
                                    attributes: inlineTemplate.el.attributes,
                                    elContent: elContent
                                };

                                view = new Backbone.View( { template: "#" + templateId } );
                            } );

                            afterEach( function () {
                                $template.remove();
                                Backbone.InlineTemplate.clearCache();
                            } );

                            it( 'the `el` is detected correctly', function () {
                                // Determined by checking the cache. Could also be determined by examining view.el.
                                var cached = view.inlineTemplate.getCachedTemplate();

                                expect( cached.tagName ).to.equal( expected.tagName );
                                expect( cached.className ).to.equal( expected.className );
                                expect( cached.id ).to.equal( expected.id );
                                expect( cached.attributes ).to.eql( expected.attributes );
                            } );

                            it( 'the `el` content is detected correctly', function () {
                                // Determined by checking the cache.
                                var cached = view.inlineTemplate.getCachedTemplate();
                                expect( cached.html ).to.equal( expected.elContent );
                            } );

                        } );

                    } );

                } );

            } );

        } );

    } );

})();