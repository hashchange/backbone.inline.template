/*global describe, it */
(function () {
    "use strict";

    describe( 'Template selection', function () {

        var expected, view,
            $head = $( "head" );

        afterEach( function () {
            expected = view = undefined;
            Backbone.InlineTemplate.clearCache();
        } );

        var templateIds, elDataAttributes, elDefinition, inlineTemplateA, inlineTemplateB, $templates;

        beforeEach( function () {
            var elContentA = createInnerContent( "{{", "}}" ),
                elContentB = createInnerContent( "<%= ", " %>"),

                noElDefinition = {
                    tagName: undefined,
                    className: undefined,
                    id: undefined,
                    attributes: undefined
                };

            elDefinition = {
                tagName: "p",
                className: "fooClass barClass",
                id: "fooId",
                attributes: { lang: "fr", contenteditable: "true" }
            };

            elDataAttributes = propertiesToDataAttributes( elDefinition );

            templateIds = {
                defaultMarker: {
                    A: _.uniqueId( "template_" ),
                    B: _.uniqueId( "template_" )
                },
                customMarker: {
                    A: _.uniqueId( "template_" ),
                    B: _.uniqueId( "template_" )
                },
                noMarker:  {
                    A: _.uniqueId( "template_" ),
                    B: _.uniqueId( "template_" )
                }
            };

            inlineTemplateA = createInlineTemplate( elDefinition, elContentA );
            inlineTemplateB = createInlineTemplate( elDefinition, elContentB );

            $templates = {
                defaultMarker: {
                    A: createTemplateNode( templateIds.defaultMarker.A, inlineTemplateA.html.fullContent, { "data-el-definition": "inline" } )
                        .appendTo( $head ),
                    B: createTemplateNode( templateIds.defaultMarker.B, inlineTemplateB.html.fullContent, { "data-el-definition": "inline" } )
                        .appendTo( $head )
                },
                customMarker: {
                    A: createTemplateNode( templateIds.customMarker.A, inlineTemplateA.html.fullContent, { type: "text/x-inline-template" } )
                        .appendTo( $head ),
                    B: createTemplateNode( templateIds.customMarker.B, inlineTemplateB.html.fullContent, { type: "text/x-inline-template" } )
                        .appendTo( $head )
                },
                noMarker:  {
                    A: createTemplateNode( templateIds.noMarker.A, inlineTemplateA.html.fullContent )
                        .appendTo( $head ),
                    B: createTemplateNode( templateIds.noMarker.B, inlineTemplateB.html.fullContent )
                        .appendTo( $head )
                }
            };

            expected = {
                processed: {
                    cacheA: _.extend( {}, elDefinition, { html: elContentA, compiled: undefined } ),
                    cacheB: _.extend( {}, elDefinition, { html: elContentB, compiled: undefined } )
                },
                unprocessed: {
                    cacheA: _.extend( {}, noElDefinition, { html: inlineTemplateA.html.fullContent, compiled: undefined } ),
                    cacheB: _.extend( {}, noElDefinition, { html: inlineTemplateB.html.fullContent, compiled: undefined } )
                }
            };
        } );

        afterEach( function () {
            if ( $templates ) {
                if ( $templates.defaultMarker ) _.invoke( $templates.defaultMarker, "remove" );
                if ( $templates.customMarker ) _.invoke( $templates.customMarker, "remove" );
                if ( $templates.noMarker ) _.invoke( $templates.noMarker, "remove" );
            }

            templateIds = elDataAttributes = elDefinition = inlineTemplateA = inlineTemplateB = $templates = undefined;
        } );

        describe( 'When the default marker is used, Backbone.Inline.Template', function () {

            it( 'processes all template nodes which are marked for processing with the default marker', function () {
                var normalizedCache;

                // Template A
                view = new Backbone.View( { template: "#" + templateIds.defaultMarker.A } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.exactElProperties( elDefinition );
                expect( normalizedCache ).to.eql( expected.processed.cacheA );

                // Template B
                view = new Backbone.View( { template: "#" + templateIds.defaultMarker.B } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.exactElProperties( elDefinition );
                expect( normalizedCache ).to.eql( expected.processed.cacheB );
            } );

            it( 'does not process template nodes which are not marked for processing', function () {
                var normalizedCache;

                // Template A
                view = new Backbone.View( { template: "#" + templateIds.noMarker.A } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.defaultEl;
                expect( normalizedCache ).to.eql( expected.unprocessed.cacheA );

                // Template B
                view = new Backbone.View( { template: "#" + templateIds.noMarker.B } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.defaultEl;
                expect( normalizedCache ).to.eql( expected.unprocessed.cacheB );
            } );
            
        } );

        describe( 'When a custom marker is used, Backbone.Inline.Template', function () {

            var _hasInlineEl;

            before( function () {
                _hasInlineEl = Backbone.InlineTemplate.hasInlineEl;

                Backbone.InlineTemplate.hasInlineEl = function ( $template ) {
                    return $template.attr( "type" ) === "text/x-inline-template";
                };
            } );

            after( function () {
                Backbone.InlineTemplate.hasInlineEl = _hasInlineEl;
            } );

            it( 'processes all template nodes which are marked for processing with the custom marker', function () {
                var normalizedCache;

                // Template A
                view = new Backbone.View( { template: "#" + templateIds.customMarker.A } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.exactElProperties( elDefinition );
                expect( normalizedCache ).to.eql( expected.processed.cacheA );

                // Template B
                view = new Backbone.View( { template: "#" + templateIds.customMarker.B } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.exactElProperties( elDefinition );
                expect( normalizedCache ).to.eql( expected.processed.cacheB );
            } );

            it( 'does not process template nodes which are marked with the default marker', function () {
                var normalizedCache;

                // Template A
                view = new Backbone.View( { template: "#" + templateIds.defaultMarker.A } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.defaultEl;
                expect( normalizedCache ).to.eql( expected.unprocessed.cacheA );

                // Template B
                view = new Backbone.View( { template: "#" + templateIds.defaultMarker.B } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.defaultEl;
                expect( normalizedCache ).to.eql( expected.unprocessed.cacheB );
            } );

            it( 'does not process template nodes which are not marked for processing', function () {
                var normalizedCache;

                // Template A
                view = new Backbone.View( { template: "#" + templateIds.noMarker.A } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.defaultEl;
                expect( normalizedCache ).to.eql( expected.unprocessed.cacheA );

                // Template B
                view = new Backbone.View( { template: "#" + templateIds.noMarker.B } );
                normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                expect( view ).to.have.defaultEl;
                expect( normalizedCache ).to.eql( expected.unprocessed.cacheB );
            } );

        } );

    } );

})();