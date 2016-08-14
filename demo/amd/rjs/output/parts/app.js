// base.js

define( 'local.base',[

    'underscore',
    'backbone',
    'usertiming',
    'backbone.declarative.views'

], function ( _, Backbone, performance ) {

    var eventBus = _.extend( {}, Backbone.Events ),

        Model = Backbone.Model.extend(),

        Collection = Backbone.Collection.extend(
            { model: Model },
            {
                create: function ( modelCount ) {
                    var i,
                        collection = new Collection(),
                        models = [];

                    for ( i = 0; i < modelCount; i++ ) models.push( new collection.model( { number: i + 1 } ) );
                    collection.reset( models );

                    return collection;
                }
            }
        ),

        StatsView = Backbone.View.extend( {

            template: "#stats-template",

            parent: ".stats",

            initialize: function ( options ) {
                var compiledTemplate = this.inlineTemplate.getCachedTemplate().compiled;
                this.template = compiledTemplate || _.template( this.inlineTemplate.getCachedTemplate(). html );

                options || ( options = {} );

                if ( options.parent ) this.parent = options.parent;
                this.$parent = Backbone.$( this.parent );
                this.$el.appendTo( this.$parent );

                this.listenTo( eventBus, "createStats", this.render );
            },

            render: function ( stats ) {
                stats.totalDuration = Math.round( this.getTotalDuration() );
                this.$el.html( this.template( stats ) );
            },

            getTotalDuration: function () {
                // Query the document height. This is to assess the true total render time, including the painting.
                // The calculation of the document height should be blocked by the browser until all item elements have
                // been painted.
                var docHeight = $( document ).height();

                performance.measure( "paint", "create-itemViews-start" );
                return performance.getEntriesByName( "paint" )[0].duration;
            }

        } );

    Backbone.DeclarativeViews.custom.compiler = _.template;

    return {
        Model: Model,
        Collection: Collection,
        StatsView: StatsView,
        eventBus: eventBus
    }

} );

// views-backbone.js

define( 'local.views-backbone',[
    
    'underscore',
    'backbone',
    'usertiming',
    'local.base',
    'backbone.declarative.views'

], function ( _, Backbone, performance, base ) {

    var ItemView = Backbone.View.extend( {

            initialize: function ( options ) {
                this.template = this.inlineTemplate.getCachedTemplate().compiled;
            },

            render: function () {
                this.$el.html( this.template( this.model.attributes ) );
                return this;
            },

            appendTo: function ( $parent ) {
                if ( !( $parent instanceof Backbone.$ ) ) $parent = Backbone.$( $parent );
                $parent.append( this.$el );
                return this;
            }

        } ),

        ListView = Backbone.View.extend( {
            
            initialize: function ( options ) {
                options || ( options = {} );                                // jshint ignore:line

                if ( options.ItemView ) this.ItemView = options.ItemView;
                if ( options.parent ) this.parent = options.parent;
                this.$parent = Backbone.$( this.parent );
            },

            render: function () {
                var duration, renderDuration,
                    els = [];

                this.itemViews = [];

                // Start timer
                performance.clearMarks();
                performance.clearMeasures();
                performance.mark( "create-itemViews-start" );

                this.collection.each( function ( model ) {
                    // Backbone.InlineTemplate.clearCache();
                    var itemView = new this.ItemView( { model: model } );
                    itemView.render();

                    this.itemViews.push( itemView );
                    els.push( itemView.el );
                }, this );

                // Measure itemView creation time
                performance.measure( "create-itemViews", "create-itemViews-start" );
                duration = performance.getEntriesByName( "create-itemViews" )[0].duration;

                this.$el.append( els );
                this.$el.appendTo( this.$parent );

                // Measure render duration time (total from beginning of itemView creation)
                performance.measure( "render", "create-itemViews-start" );
                renderDuration = performance.getEntriesByName( "render" )[0].duration;

                base.eventBus.trigger( "createStats", {
                    itemViewCount : this.itemViews.length,
                    duration: Math.round( duration ),
                    renderDuration: Math.round( renderDuration )
                } );
            },

            destroy: function () {
                _.each( this.itemViews, function ( itemView ) {
                    itemView.remove();
                } );

                this.remove();
            }

        } );

    return {
        ItemView: ItemView,
        ListView: ListView
    }

} );

// views-marionette.js

define( 'local.views-marionette',[

    'underscore',
    'backbone',
    'marionette',
    'usertiming',
    'local.base',
    'backbone.declarative.views'

], function ( _, Backbone, Marionette, performance, base ) {

    var ItemView = Marionette.ItemView.extend( {
        
            appendTo: function ( $parent ) {
                if ( !( $parent instanceof Backbone.$ ) ) $parent = Backbone.$( $parent );
                $parent.append( this.$el );
                return this;
            }
        
        } ),

        ListView = Marionette.CollectionView.extend( {
            
            initialize: function ( options ) {
                options || ( options = {} );                                // jshint ignore:line

                if ( options.parent ) this.parent = options.parent;
                this.$parent = Backbone.$( this.parent );
            },

            onBeforeRender: function () {
                // Start timer
                performance.clearMarks();
                performance.clearMeasures();
                performance.mark( "create-itemViews-start" );
            },

            onRender: function () {
                var duration;

                // Measure the time it took to create the itemViews
                performance.measure( "create-itemViews", "create-itemViews-start" );
                duration = performance.getEntriesByName( "create-itemViews" )[0].duration;

                if ( ! this.$el.parent().length ) this.$el.appendTo( this.$parent );

                base.eventBus.trigger( "createStats", { itemViewCount : this.children.length, duration: Math.round( duration ) } );
            }

        } );

    return {
        ItemView: ItemView,
        ListView: ListView
    }

} );

// main.js

require( [

    'backbone',
    'local.base',
    'local.views-backbone',
    'local.views-marionette',
    
    'backbone.inline.template'

], function ( Backbone, base, backboneViews, marionetteViews ) {

    // To make the inline `el` magic work with Marionette, the original template must be updated (modified).
    // Backbone-only views don't need this. Try it by commenting it out.
    Backbone.InlineTemplate.updateTemplateSource = true;

    var count = 10,

        BackboneListItemView = backboneViews.ItemView.extend( { template: "#item-template" } ),
        MarionetteListItemView = marionetteViews.ItemView.extend( { template: "#item-template" } ),

        backboneListView = new backboneViews.ListView( {
            template: "#list-template-backbone",
            parent: ".container.backbone",
            ItemView: BackboneListItemView,
            collection: base.Collection.create( count )
        } ),

        marionetteListView = new marionetteViews.ListView( {
            template: "#list-template-marionette",
            childView: MarionetteListItemView,
            parent: ".container.marionette",
            collection: base.Collection.create( count )
        } ),

        backboneReportView = new backboneViews.ItemView( {
            model: new Backbone.Model( {
                itemViewCount: count,
                framework: "Backbone"
            } ),
            template: "#report-template-backbone"
        } ),

        marionetteReportView = new marionetteViews.ItemView( {
            model: new Backbone.Model( {
                itemViewCount: count,
                framework: "Marionette"
            } ),
            template: "#report-template-marionette"
        } );

    backboneListView.render();
    marionetteListView.render();

    backboneReportView.render().appendTo( ".report.backbone" );
    marionetteReportView.render().appendTo( ".report.marionette" );

} );

define("local.main", function(){});

