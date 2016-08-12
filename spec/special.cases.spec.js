/*global describe, it */
(function () {
    "use strict";

    describe( 'Special cases', function () {

        var expected, view,
            $head = $( "head" );

        afterEach( function () {
            expected = view = undefined;
            Backbone.InlineTemplate.clearCache();
        } );

        describe( 'When an attribute of the `el` is set to an empty string value', function () {

            // NB Testing it for an attribute where it matters, e.g. `contenteditable`. In that particular case,
            // `contenteditable=""` means that it content editing is enabled, and the element is editable.

            var elDefinition, templateId, inlineTemplate, $originalTemplate, $template;

            beforeEach( function () {
                var elContent = createInnerContent( "{{", "}}" );

                elDefinition = {
                    tagName: "p",
                    className: "fooClass barClass",
                    id: "fooId",
                    attributes: {
                        lang: "fr",
                        contenteditable: ""     // this is the one we are focusing on
                    }
                };

                templateId = _.uniqueId( "template_" );
                inlineTemplate = createInlineTemplate( elDefinition, elContent );
                $originalTemplate = createTemplateNode( templateId, inlineTemplate.html.fullContent, { "data-el-definition": "inline" } )
                    .appendTo( $head );

                expected = {
                    el: {
                        content: elContent
                    },
                    cache: _.extend( {}, elDefinition, { html: elContent, compiled: undefined } )
                };
            } );

            afterEach( function () {
                if ( $originalTemplate ) $originalTemplate.remove();
                elDefinition = templateId = inlineTemplate = $originalTemplate = $template = undefined;
            } );

            describe( 'with `updateTemplateSource` disabled (default)', function () {

                beforeEach( function () {
                    view = new Backbone.View( { template: "#" + templateId } );
                } );

                it( 'the `el` is set up as defined in the template, including the empty string attribute', function () {
                    var normalizedElAttributes = normalizeAttributes( getAttributes( view.el ) );

                    expect( normalizedElAttributes ).to.have.a.property( "contenteditable" );
                    expect( normalizedElAttributes.contenteditable ).to.equal( "" );
                    expect( view ).to.have.exactElProperties( elDefinition );
                } );

                it( 'the cache entry is set to the values defined in the template, including the empty string attribute', function () {
                    var normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                    expect( normalizedCache.attributes ).to.have.a.property( "contenteditable" );
                    expect( normalizedCache.attributes.contenteditable ).to.equal( "" );
                    expect( normalizedCache ).to.eql( expected.cache );
                } );

            } );

            describe( 'with `updateTemplateSource` enabled', function () {

                var _updateTemplateSourceDefault;

                before( function () {
                    _updateTemplateSourceDefault = Backbone.InlineTemplate.updateTemplateSource;
                    Backbone.InlineTemplate.updateTemplateSource = true;
                } );

                after( function () {
                    Backbone.InlineTemplate.updateTemplateSource = _updateTemplateSourceDefault;
                } );

                beforeEach( function () {
                    view = new Backbone.View( { template: "#" + templateId } );

                    // We re-read the template from the DOM, so that the tests still work in case the original template
                    // node is deleted and replaced by an entirely new one (not currently the case, though).
                    $template = $( "#" + templateId );
                } );

                it( 'the `el` is set up as defined in the template, including the empty string attribute', function () {
                    var normalizedElAttributes = normalizeAttributes( getAttributes( view.el ) );

                    expect( normalizedElAttributes ).to.have.a.property( "contenteditable" );
                    expect( normalizedElAttributes.contenteditable ).to.equal( "" );
                    expect( view ).to.have.exactElProperties( elDefinition );
                } );

                it( 'the cache entry is set to the values defined in the template, including the empty string attribute', function () {
                    var normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                    expect( normalizedCache.attributes ).to.have.a.property( "contenteditable" );
                    expect( normalizedCache.attributes.contenteditable ).to.equal( "" );
                    expect( normalizedCache ).to.eql( expected.cache );
                } );

                it( 'the source template is updated with the `el` content', function () {
                    expect( $template.html() ).to.equal( expected.el.content );
                } );

                it( 'the `el` definition is converted into data attributes on the template tag, including the empty string attribute', function () {
                    var normalizedTemplateAttributes = normalizeAttributes( getAttributes( $template ) );

                    expect( normalizedTemplateAttributes["data-attributes"] ).to.contain( '"contenteditable":""' );
                    expect( normalizedTemplateAttributes ).to.containSubset( propertiesToDataAttributes( elDefinition ) );
                } );

            } );

        } );

        describeUnless( isIE( { lt: 11 } ), "Skipping tests in IE < 11 because it doesn't support the boolean `hidden` attribute.", 'When a true boolean attribute is present in the `el`, represented just by the attribute name without a value', function () {

            // NB IE < 11 is excluded for this test because it doesn't support the `hidden` attribute.

            // NB When checking attributes on the `el`, or in the cache, the `hidden` attribute can appear with an
            // empty string as its value, or with the name repeated (ie `hidden: ""` or `hidden: "hidden"`). Both
            // values are correct. The actual outcome may depend on the browser.

            var templateId, inlineTemplate, $originalTemplate, $template;

            beforeEach( function () {
                var elContent = createInnerContent( "{{", "}}" ),

                    tagName = "p",
                    className = "fooClass barClass",
                    id = "fooId",
                    keyValueAttributes = { lang: "fr", contenteditable: "true" },

                    elDefinitionWithBoolean = {
                        tagName: tagName,
                        className: className,
                        id: id,
                        attributes: keyValueAttributes,    // NB we can't set up the boolean attribute here
                        booleanAttributes: ["hidden"]
                    };

                templateId = _.uniqueId( "template_" );
                inlineTemplate = createInlineTemplate( elDefinitionWithBoolean, elContent );
                $originalTemplate = createTemplateNode( templateId, inlineTemplate.html.fullContent, { "data-el-definition": "inline" } )
                    .appendTo( $head );

                expected = {
                    el: {},
                    cache: {}
                };

                expected.el.content = elContent;
                expected.el.tagName = tagName;

                expected.el.propertiesWithoutAttributes = {
                    tagName: tagName,
                    className: className,
                    id: id
                };

                expected.el.attributesWithoutBoolean = keyValueAttributes;

                expected.el.fullAttributesWithoutBoolean = _.extend( {
                    className: className,
                    id: id
                }, keyValueAttributes );

                expected.cache.withoutAttributes = {
                    tagName: tagName,
                    className: className,
                    id: id,
                    html: elContent,
                    compiled: undefined
                };

                expected.cache.attributesWithoutBoolean = keyValueAttributes;
            } );

            afterEach( function () {
                if ( $originalTemplate ) $originalTemplate.remove();
                templateId = inlineTemplate = $originalTemplate = $template = undefined;
            } );

            describe( 'with `updateTemplateSource` disabled (default)', function () {

                beforeEach( function () {
                    view = new Backbone.View( { template: "#" + templateId } );
                } );

                it( 'the `el` is set up as defined in the template, including the boolean attribute', function () {
                    var normalizedElAttributes = normalizeAttributes( getAttributes( view.el ) );

                    expect( normalizedElAttributes ).to.have.a.property( "hidden" );
                    expect( normalizedElAttributes.hidden ).to.match( /^$|^hidden$/i );

                    expect( view.el.hidden ).to.be.true;
                    expect( view.$el.is( ":hidden" ) ).to.be.true;

                    expect( normalizedElAttributes ).to.containSubset( expected.el.fullAttributesWithoutBoolean );
                    expect( view.el.tagName.toLowerCase() ).to.equal( expected.el.tagName );
                } );

                it( 'the cache entry is set to the values defined in the template, including the boolean attribute', function () {
                    var normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                    expect( normalizedCache.attributes ).to.have.a.property( "hidden" );
                    expect( normalizedCache.attributes.hidden ).to.match( /^$|^hidden$/i );

                    expect( normalizedCache ).to.containSubset( expected.cache.withoutAttributes );
                    expect( normalizedCache.attributes ).to.containSubset( expected.cache.attributesWithoutBoolean );
                } );

            } );

            describe( 'with `updateTemplateSource` enabled', function () {

                var _updateTemplateSourceDefault;

                before( function () {
                    _updateTemplateSourceDefault = Backbone.InlineTemplate.updateTemplateSource;
                    Backbone.InlineTemplate.updateTemplateSource = true;
                } );

                after( function () {
                    Backbone.InlineTemplate.updateTemplateSource = _updateTemplateSourceDefault;
                } );

                beforeEach( function () {
                    view = new Backbone.View( { template: "#" + templateId } );

                    // We re-read the template from the DOM, so that the tests still work in case the original template
                    // node is deleted and replaced by an entirely new one (not currently the case, though).
                    $template = $( "#" + templateId );
                } );

                it( 'the `el` is set up as defined in the template, including the boolean attribute', function () {
                    var normalizedElAttributes = normalizeAttributes( getAttributes( view.el ) );

                    expect( normalizedElAttributes ).to.have.a.property( "hidden" );
                    expect( normalizedElAttributes.hidden ).to.match( /^$|^hidden$/i );

                    expect( view.el.hidden ).to.be.true;
                    expect( view.$el.is( ":hidden" ) ).to.be.true;

                    expect( normalizedElAttributes ).to.containSubset( expected.el.fullAttributesWithoutBoolean );
                    expect( view.el.tagName.toLowerCase() ).to.equal( expected.el.tagName );
                } );

                it( 'the cache entry is set to the values defined in the template, including the boolean attribute', function () {
                    var normalizedCache = normalizeCacheEntry( view.inlineTemplate.getCachedTemplate() );

                    expect( normalizedCache.attributes ).to.have.a.property( "hidden" );
                    expect( normalizedCache.attributes.hidden ).to.match( /^$|^hidden$/i );

                    expect( normalizedCache ).to.containSubset( expected.cache.withoutAttributes );
                    expect( normalizedCache.attributes ).to.containSubset( expected.cache.attributesWithoutBoolean );
                } );

                it( 'the source template is updated with the `el` content', function () {
                    expect( $template.html() ).to.equal( expected.el.content );
                } );

                it( 'the `el` definition is converted into data attributes on the template tag, including the boolean attribute', function () {
                    var normalizedTemplateAttributes = normalizeAttributes( getAttributes( $template ) );

                    expect( normalizedTemplateAttributes["data-attributes"] ).to.match( /"hidden":"(hidden)?"/ );
                    expect( JSON.parse( normalizedTemplateAttributes["data-attributes"] ) ).to.containSubset( expected.el.attributesWithoutBoolean );
                    expect( normalizedTemplateAttributes ).to.containSubset( propertiesToDataAttributes( expected.el.propertiesWithoutAttributes ) );
                } );

            } );

        } );

        describe( 'When the template is set to an empty string', function () {

            describe( 'and Backbone.Inline.Template is using the default marker for templates', function () {

                beforeEach( function () {
                    view = new Backbone.View( { template: "" } );
                } );

                it( 'an `el` with default attributes is created', function () {
                    expect( view ).to.have.defaultEl;
                } );

                it( 'the cache returns undefined', function () {
                    expect( view.inlineTemplate.getCachedTemplate() ).to.be.undefined;
                } );

            } );

            describe( 'and Backbone.Inline.Template is set to process all templates', function () {

                var _hasInlineEl;

                before( function () {
                    _hasInlineEl = Backbone.InlineTemplate.hasInlineEl;
                    Backbone.InlineTemplate.hasInlineEl = function () { return true; };
                } );

                after( function () {
                    Backbone.InlineTemplate.hasInlineEl = _hasInlineEl;
                } );

                beforeEach( function () {
                    view = new Backbone.View( { template: "" } );
                } );

                it( 'an `el` with default attributes is created', function () {
                    expect( view ).to.have.defaultEl;
                } );

                it( 'the cache returns undefined', function () {
                    expect( view.inlineTemplate.getCachedTemplate() ).to.be.undefined;
                } );

            } );

        } );

    } );

})();