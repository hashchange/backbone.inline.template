/*global describe, it */
(function () {
    "use strict";

    describe( 'Processing the template', function () {

        var expected, view,
            $head = $( "head" );

        afterEach( function () {
            expected = view = undefined;
            Backbone.InlineTemplate.clearCache();
        } );

        describe( 'A template node in the DOM is used as the view template.', function () {

            var templateId, inlineTemplate, $originalTemplate, $template;

            beforeEach( function () {
                var elDefinition = {
                        tagName: "p",
                        className: "fooClass barClass",
                        id: "fooId",
                        attributes: { lang: "fr", contenteditable: "true" }
                    },

                    elContent = createInnerContent( "{{", "}}" );

                templateId = _.uniqueId( "template_" );
                inlineTemplate = createInlineTemplate( elDefinition, elContent );
                $originalTemplate = createTemplateNode( templateId, inlineTemplate.html.fullContent, { "data-el-definition": "inline" } )
                    .appendTo( $head );

                expected = {
                    el: {
                        tagName: elDefinition.tagName,
                        className: elDefinition.className,
                        id: elDefinition.id,
                        attributes: elDefinition.attributes,
                        fullAttributes: inlineTemplate.el.fullAttributes,
                        content: elContent
                    },
                    templateNode: {
                        domNode: $originalTemplate[0]
                    }

                };
            } );

            afterEach( function () {
                if ( $originalTemplate ) $originalTemplate.remove();
                templateId = inlineTemplate = $originalTemplate = $template = undefined;
            } );

            describe( 'The `updateTemplateSource` setting is left at its default, ie is disabled. Backbone.Inline.Template', function () {

                beforeEach( function () {
                    _.extend( expected.templateNode, {
                        content: inlineTemplate.html.fullContent,
                        attributes: getAttributes( $originalTemplate )
                    } );

                    view = new Backbone.View( { template: "#" + templateId } );

                    // We re-read the template from the DOM, so that the tests still work in case the original template
                    // node is deleted and replaced by an entirely new one (not currently the case, though).
                    $template = $( "#" + templateId );
                } );

                it( 'sets up the `el` as defined in the template', function () {
                    expect( view.el.tagName.toLowerCase() ).to.equal( expected.el.tagName.toLowerCase() );
                    expect( normalizeAttributes( getAttributes( view.el ) ) ).to.eql( expected.el.fullAttributes );
                } );

                it( 'leaves the `el` empty', function () {
                    expect( view.$el.html() ).to.equal( "" );
                } );

                it( 'sets the cached `el` properties to the values defined in the template', function () {
                    var cached = view.inlineTemplate.getCachedTemplate();

                    expect( cached.tagName ).to.equal( expected.el.tagName );
                    expect( cached.className ).to.equal( expected.el.className );
                    expect( cached.id ).to.equal( expected.el.id );
                    expect( normalizeAttributes( cached.attributes ) ).to.eql( expected.el.attributes );
                } );

                it( 'sets the cached template content to the `el` content', function () {
                    // Determined by checking the cache.
                    var cached = view.inlineTemplate.getCachedTemplate();
                    expect( cached.html ).to.equal( expected.el.content );
                } );

                it( 'leaves the source template unchanged (exact identity, including content, data attributes, all other attributes)', function () {
                    expect( $template[0] ).to.equal( expected.templateNode.domNode );
                    expect( getAttributes( $template ) ).to.eql( expected.templateNode.attributes );
                    expect( $template.html() ).to.equal( expected.templateNode.content );
                } );

            } );

            describe( 'The `updateTemplateSource` setting is enabled.', function () {

                var _updateTemplateSourceDefault;

                before( function () {
                    _updateTemplateSourceDefault = Backbone.InlineTemplate.updateTemplateSource;
                    Backbone.InlineTemplate.updateTemplateSource = true;
                } );

                after( function () {
                    Backbone.InlineTemplate.updateTemplateSource = _updateTemplateSourceDefault;
                } );

                beforeEach( function () {
                    _.extend( expected.templateNode, {
                        content: inlineTemplate.html.fullContent,
                        originalAttributes: getAttributes( $originalTemplate ),
                        elDataAttributes: propertiesToDataAttributes( _.pick( expected.el, "tagName", "className", "id", "attributes" ) )
                    } );

                    view = new Backbone.View( { template: "#" + templateId } );

                    // We re-read the template from the DOM, so that the tests still work in case the original template
                    // node is deleted and replaced by an entirely new one (not currently the case, though).
                    $template = $( "#" + templateId );
                } );

                describe( 'On first access, Backbone.Inline.Template', function () {

                    it( 'sets up the `el` as defined in the template', function () {
                        expect( view.el.tagName.toLowerCase() ).to.equal( expected.el.tagName.toLowerCase() );
                        expect( normalizeAttributes( getAttributes( view.el ) ) ).to.eql( expected.el.fullAttributes );
                    } );

                    it( 'leaves the `el` empty', function () {
                        expect( view.$el.html() ).to.equal( "" );
                    } );

                    it( 'sets the cached `el` properties to the values defined in the template', function () {
                        var cached = view.inlineTemplate.getCachedTemplate();

                        expect( cached.tagName ).to.equal( expected.el.tagName );
                        expect( cached.className ).to.equal( expected.el.className );
                        expect( cached.id ).to.equal( expected.el.id );
                        expect( normalizeAttributes( cached.attributes ) ).to.eql( expected.el.attributes );
                    } );

                    it( 'sets the cached template content to the `el` content', function () {
                        // Determined by checking the cache.
                        var cached = view.inlineTemplate.getCachedTemplate();
                        expect( cached.html ).to.equal( expected.el.content );
                    } );

                    it( 'updates the source template with the `el` content', function () {
                        expect( $template.html() ).to.equal( expected.el.content );
                    } );

                    it( 'converts the `el` definition into data attributes on the template tag', function () {
                        expect( normalizeAttributes( getAttributes( $template ) ) ).to.containSubset( expected.templateNode.elDataAttributes );
                    } );

                    it( 'leaves any other attributes on the template node in place (regular attributes, and data attributes)', function () {
                        expect( normalizeAttributes( getAttributes( $template ) ) ).to.containSubset( expected.templateNode.originalAttributes );
                    } );

                    it( 'adds a data attribute acting as a flag that processing of the inline `el `is done and must not be repeated', function () {
                        // NB This is an internal attribute and not to be relied upon. It is not part of a "semi-official"
                        // API even though it is specified by a test. The internal mechanism may change at any time without
                        // notice (including the test).
                        expect( normalizeAttributes( getAttributes( $template ) ) ).to.have.a.property( "data-bbit-internal-template-status", "updated" );
                    } );

                } );

                describe( 'On second access,', function () {

                    var view2, $templateAfterSecondAccess;

                    beforeEach( function () {
                        view = new Backbone.View( { template: "#" + templateId } );

                        // We re-read the template from the DOM, so that the tests still work in case the original template
                        // node is deleted and replaced by an entirely new one (not currently the case, though).
                        $template = $( "#" + templateId );

                        expected.cacheContent = {
                            // Cloning the cache object for preserving the values and testing value equality (values
                            // only, not the `compiled` function)
                            cachedProperties: _.omit( view.inlineTemplate.getCachedTemplate(), "compiled" )
                        };

                        expected.templateNode.afterFirstAccess = {
                            domNode: $template[0],
                            attributes: getAttributes( $template ),
                            content: $template.html()
                        };
                    } );

                    afterEach( function () {
                        view2 = $templateAfterSecondAccess = undefined;
                    } );

                    describe( 'with the template already in the cache, Backbone.Inline.Template', function () {

                        beforeEach( function () {
                            // Keeping the cache object for testing object identity
                            expected.cacheContent.cachedTemplate = view.inlineTemplate.getCachedTemplate();

                            // Create a second view
                            view2 = new Backbone.View( { template: "#" + templateId } );

                            // Again, we re-read the template from the DOM.
                            $templateAfterSecondAccess = $( "#" + templateId );

                        } );

                        it( 'sets up the `el` as defined in the template', function () {
                            expect( view2.el.tagName.toLowerCase() ).to.equal( expected.el.tagName.toLowerCase() );
                            expect( normalizeAttributes( getAttributes( view2.el ) ) ).to.eql( expected.el.fullAttributes );
                        } );

                        it( 'leaves the `el` empty', function () {
                            expect( view.$el.html() ).to.equal( "" );
                        } );

                        it( 'keeps the cached content as it has been after first access (exact identity)', function () {
                            var cached = view2.inlineTemplate.getCachedTemplate(),
                                properties = _.omit( cached, "compiled" );

                            expect( cached ).to.equal( expected.cacheContent.cachedTemplate );
                            expect( properties ).to.eql( expected.cacheContent.cachedProperties );
                        } );

                        it( 'updates the source no more than once, keeps the template node as it has been after first access (exact identity, with attributes and content unchanged)', function () {
                            expect( $templateAfterSecondAccess[0] ).to.equal( expected.templateNode.afterFirstAccess.domNode );
                            expect( getAttributes( $templateAfterSecondAccess ) ).to.eql( expected.templateNode.afterFirstAccess.attributes );
                            expect( $templateAfterSecondAccess.html() ).to.equal( expected.templateNode.afterFirstAccess.content );
                        } );

                    } );

                    describe( 'when the cache has been cleared before second access, Backbone.Inline.Template', function () {

                        beforeEach( function () {
                            // Clear the cache between runs so that the source must be accessed repeatedly, observe effect.
                            Backbone.InlineTemplate.clearCache();

                            // Create a second view
                            view2 = new Backbone.View( { template: "#" + templateId } );

                            // Again, we re-read the template from the DOM.
                            $templateAfterSecondAccess = $( "#" + templateId );
                        } );

                        it( 'sets up the `el` as defined in the template', function () {
                            expect( view2.el.tagName.toLowerCase() ).to.equal( expected.el.tagName.toLowerCase() );
                            expect( normalizeAttributes( getAttributes( view2.el ) ) ).to.eql( expected.el.fullAttributes );
                        } );

                        it( 'leaves the `el` empty', function () {
                            expect( view.$el.html() ).to.equal( "" );
                        } );

                        it( 'keeps the cached content as it has been after first access (recreated)', function () {
                            var cached = view2.inlineTemplate.getCachedTemplate(),
                                properties = _.omit( cached, "compiled" );

                            expect( properties ).to.eql( expected.cacheContent.cachedProperties );
                        } );

                        it( 'updates the source no more than once, keeps the template node as it has been after first access (exact identity, with attributes and content unchanged)', function () {
                            expect( $templateAfterSecondAccess[0] ).to.equal( expected.templateNode.afterFirstAccess.domNode );
                            expect( getAttributes( $templateAfterSecondAccess ) ).to.eql( expected.templateNode.afterFirstAccess.attributes );
                            expect( $templateAfterSecondAccess.html() ).to.equal( expected.templateNode.afterFirstAccess.content );
                        } );

                    } );

                } );

            } );
            
        } );

        describe( 'A raw HTML string is used as the view template.', function () {

            var templateHtml;

            afterEach( function () {
                templateHtml = undefined;
            } );

            describe( 'Backbone.Inline.Template is set to process all input, with `hasInlineTemplate` always returning true.', function () {

                // NB When Backbone.Inline.Template is set to process all input, raw HTML strings need not be marked
                // with a data attribute, placed in a comment, which would signal that Backbone.Inline.Template should
                // process the string.

                var _hasInlineEl;

                before( function () {
                    _hasInlineEl = Backbone.InlineTemplate.hasInlineEl;
                    Backbone.InlineTemplate.hasInlineEl = function () { return true; };
                } );

                after( function () {
                    Backbone.InlineTemplate.hasInlineEl = _hasInlineEl;
                } );

                beforeEach( function () {
                    var elDefinition = {
                            tagName: "p",
                            className: "fooClass barClass",
                            id: "fooId",
                            attributes: { lang: "fr", contenteditable: "true" }
                        },

                        elContent = createInnerContent( "{{", "}}" ),
                        inlineTemplate = createInlineTemplate( elDefinition, elContent );

                    templateHtml = inlineTemplate.html.fullContent;

                    expected = {
                        el: {
                            tagName: elDefinition.tagName,
                            className: elDefinition.className,
                            id: elDefinition.id,
                            attributes: elDefinition.attributes,
                            fullAttributes: inlineTemplate.el.fullAttributes,
                            content: elContent
                        }
                    };
                } );

                describe( 'The `updateTemplateSource` setting is left at its default, ie is disabled. Backbone.Inline.Template', function () {

                    beforeEach( function () {
                        view = new Backbone.View( { template: templateHtml } );
                    } );

                    it( 'sets up the `el` as defined in the template', function () {
                        expect( view.el.tagName.toLowerCase() ).to.equal( expected.el.tagName.toLowerCase() );
                        expect( normalizeAttributes( getAttributes( view.el ) ) ).to.eql( expected.el.fullAttributes );
                    } );

                    it( 'leaves the `el` empty', function () {
                        expect( view.$el.html() ).to.equal( "" );
                    } );

                    it( 'sets the cached `el` properties to the values defined in the template', function () {
                        var cached = view.inlineTemplate.getCachedTemplate();

                        expect( cached.tagName ).to.equal( expected.el.tagName );
                        expect( cached.className ).to.equal( expected.el.className );
                        expect( cached.id ).to.equal( expected.el.id );
                        expect( normalizeAttributes( cached.attributes ) ).to.eql( expected.el.attributes );
                    } );

                    it( 'sets the cached template content to the `el` content', function () {
                        // Determined by checking the cache.
                        var cached = view.inlineTemplate.getCachedTemplate();
                        expect( cached.html ).to.equal( expected.el.content );
                    } );

                } );

                describe( 'The `updateTemplateSource` setting is enabled. Backbone.Inline.Template', function () {

                    var _updateTemplateSourceDefault;

                    before( function () {
                        _updateTemplateSourceDefault = Backbone.InlineTemplate.updateTemplateSource;
                        Backbone.InlineTemplate.updateTemplateSource = true;
                    } );

                    after( function () {
                        Backbone.InlineTemplate.updateTemplateSource = _updateTemplateSourceDefault;
                    } );

                    it( 'throws an error when passed a raw HTML string as a template', function () {
                        expect( function () {
                            new Backbone.View( { template: templateHtml } );
                        } ).to.throw( Backbone.DeclarativeViews.TemplateError, "Backbone.Inline.Template: Can't update the template container because it doesn't exist in the DOM." );
                    } );

                } );

            } );

            describe( 'Backbone.Inline.Template is set to only process marked templates (default), and the template string contains the data attribute marker in a comment.', function () {

                beforeEach( function () {
                    var elDefinition = {
                            tagName: "p",
                            className: "fooClass barClass",
                            id: "fooId",
                            attributes: { lang: "fr", contenteditable: "true" }
                        },

                        elContent = createInnerContent( "{{", "}}" ),
                        inlineTemplate = createInlineTemplate( elDefinition, elContent );

                    templateHtml = '<!-- data-el-definition="inline" -->' +
                                   inlineTemplate.html.fullContent;

                    expected = {
                        el: {
                            tagName: elDefinition.tagName,
                            className: elDefinition.className,
                            id: elDefinition.id,
                            attributes: elDefinition.attributes,
                            fullAttributes: inlineTemplate.el.fullAttributes,
                            content: elContent
                        }
                    };
                } );

                describe( 'The `updateTemplateSource` setting is left at its default, ie is disabled. Backbone.Inline.Template', function () {

                    beforeEach( function () {
                        view = new Backbone.View( { template: templateHtml } );
                    } );

                    it( 'sets up the `el` as defined in the template', function () {
                        expect( view.el.tagName.toLowerCase() ).to.equal( expected.el.tagName.toLowerCase() );
                        expect( normalizeAttributes( getAttributes( view.el ) ) ).to.eql( expected.el.fullAttributes );
                    } );

                    it( 'leaves the `el` empty', function () {
                        expect( view.$el.html() ).to.equal( "" );
                    } );

                    it( 'sets the cached `el` properties to the values defined in the template', function () {
                        var cached = view.inlineTemplate.getCachedTemplate();

                        expect( cached.tagName ).to.equal( expected.el.tagName );
                        expect( cached.className ).to.equal( expected.el.className );
                        expect( cached.id ).to.equal( expected.el.id );
                        expect( normalizeAttributes( cached.attributes ) ).to.eql( expected.el.attributes );
                    } );

                    it( 'sets the cached template content to the `el` content', function () {
                        // Determined by checking the cache.
                        var cached = view.inlineTemplate.getCachedTemplate();
                        expect( cached.html ).to.equal( expected.el.content );
                    } );

                } );

                describe( 'The `updateTemplateSource` setting is enabled. Backbone.Inline.Template', function () {

                    var _updateTemplateSourceDefault;

                    before( function () {
                        _updateTemplateSourceDefault = Backbone.InlineTemplate.updateTemplateSource;
                        Backbone.InlineTemplate.updateTemplateSource = true;
                    } );

                    after( function () {
                        Backbone.InlineTemplate.updateTemplateSource = _updateTemplateSourceDefault;
                    } );

                    it( 'throws an error when passed a raw HTML string as a template', function () {
                        expect( function () {
                            new Backbone.View( { template: templateHtml } );
                        } ).to.throw( Backbone.DeclarativeViews.TemplateError, "Backbone.Inline.Template: Can't update the template container because it doesn't exist in the DOM." );
                    } );

                } );

            } );

            describe( 'Backbone.Inline.Template is set to only process marked templates (default), and the template string does not contain the marker.', function () {

                var _updateTemplateSourceDefault;

                beforeEach( function () {
                    _updateTemplateSourceDefault = Backbone.InlineTemplate.updateTemplateSource;
                } );

                afterEach( function () {
                    Backbone.InlineTemplate.updateTemplateSource = _updateTemplateSourceDefault;
                } );

                describe( 'a template string without data attributes is processed as it normally would be, creating a default `el` and leaving the template alone', function () {

                    beforeEach( function () {
                        templateHtml = "<section>" + createInnerContent( "{{", "}}" ) + "</section>";
                        view = new Backbone.View( { template: templateHtml } );
                    } );

                    it( 'with `updateTemplateSource` off (default)', function () {
                        expect( view ).to.have.defaultEl;
                        expect( view.template ).to.equal( templateHtml );
                    } );

                    it( 'with `updateTemplateSource` on', function () {
                        Backbone.InlineTemplate.updateTemplateSource = true;
                        expect( view ).to.have.defaultEl;
                        expect( view.template ).to.equal( templateHtml );
                    } );

                } );

                describe( 'a template string with data attributes in a comment is processed by Backbone.Declarative.Views as it normally would be, creating an `el` according to the data attributes and leaving the template alone', function () {

                    var _updateTemplateSourceDefault, elDefinition;

                    beforeEach( function () {
                        var elDataAttributes;

                        _updateTemplateSourceDefault = Backbone.InlineTemplate.updateTemplateSource;

                        elDefinition = {
                            tagName: "p",
                            className: "fooClass barClass",
                            id: "fooId",
                            attributes: { lang: "fr", contenteditable: "true" }
                        };

                        elDataAttributes = attributesHashToString( propertiesToDataAttributes( elDefinition ) );

                        templateHtml = "<!-- " + elDataAttributes + " -->" +
                                       "<section>" + createInnerContent( "{{", "}}" ) + "</section>";
                        view = new Backbone.View( { template: templateHtml } );
                    } );

                    afterEach( function () {
                        Backbone.InlineTemplate.updateTemplateSource = _updateTemplateSourceDefault;
                        elDefinition = undefined;
                    } );

                    it( 'with `updateTemplateSource` off (default)', function () {
                        expect( view ).to.have.exactElProperties( elDefinition );
                        expect( view.$el.html() ).to.equal( "" );
                        expect( view.template ).to.equal( templateHtml );
                    } );

                    it( 'with `updateTemplateSource` on', function () {
                        Backbone.InlineTemplate.updateTemplateSource = true;
                        expect( view ).to.have.exactElProperties( elDefinition );
                        expect( view.$el.html() ).to.equal( "" );
                        expect( view.template ).to.equal( templateHtml );
                    } );

                } );

            } );
        } );

    } );

})();