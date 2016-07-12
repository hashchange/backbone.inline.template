# Backbone.Inline.Template

[Quick intro][quick-intro] – [Why?][use-case] – [Setup][setup] – [Framework integration][framework-integration] – [Selecting templates][selecting-templates] – [Cache][cache]<br>
[Limitations][fine-print-limitations] – [Alternative][set-element-as-alternative] – [Build and test][build]

It seems that quite a few people would like to see fully-formed templates in Backbone: templates which contain the root element of the template – the `el` in Backbone lingo – and not just the inner HTML of that element. It's been a popular feature request [for Backbone][backbone-546], and [for frameworks built on it][marionette-2357]. 

Backbone.Inline.Template is that feature.

## In a nutshell

Assume you want to set up a view with an `el` of `<p id="foo" class="bar">`. But you don't want to set up the `el` with Backbone's `tagName`, `id` and `className`, as you'd normally have to do. Instead, you want the `el` to be defined inside the template itself.

##### Classic Backbone

Here's how:

```html
<script id="some-template" type="text/x-template" data-el-definition="inline">
    <p id="foo" class="bar">
        Lots of fabulous <%= content %> here.
    </p>
</script>
```

Note the data attribute `data-el-definition="inline"`. That's how you tell your application that the `el` is defined inline in the template. (You can [change][selecting-templates] how such templates are marked.)

When you create a view with that template, its `el` will be the element you expect: `<p>`. It is already set up and available when `initialize()` is called, just like any other Backbone `el`.

That's it, really. For your own processing and rendering, proceed as you like. However, you can boost performance and avoid accessing the DOM again. Fetch the template from the [cache of Backbone.Inline.Template][cache] instead. E.g.

```js
// Tell Backbone.Inline.Template which template compiler function you use.
Backbone.InlineTemplate.custom.compiler = _.template;

// Pull the template content from the cache.
var BaseView = Backbone.View.extend( {
  initialize: function () {
    this.template = this.inlineTemplate.getCachedTemplate().compiled;
  }
} );
```

For more on the cache, [see below][cache].

##### Frameworks like Marionette

Now, let's assume that you are using a Backbone framework which takes care of template loading and rendering, but doesn't support `el` inlining. One such framework is Marionette. How do you undercut the framework magic and make it process your template format?

With a single statement. This one:

```js
Backbone.InlineTemplate.updateOriginalTemplates = true;
```

Now Backbone.Inline.Template sets up your `el` as it did before, but it also modifies the original template in place. By the time your framework kicks in, the HTML defining the `el` is no longer part of the template content. Instead, the framework sees a template it can understand: just the part which provides the inner HTML of the `el`.

For which Backbone frameworks does that work? Presumably for most. Backbone.Inline.Template kicks in at a very early stage during the life cycle of a view, so the chances are excellent that your framework of choice picks up the changes to the templates.

You'll find the details on framework integration and the `updateOriginalTemplates` option [below][framework-integration].

##### And finally...

Please have a brief look at the [fine print and limitations][fine-print-limitations], too.

## Why use it?

There are several reasons for wanting to see the `el` of a view inside a template.

##### Markup should stay out of Javascript.
  
The principle itself doesn't really need explaining, it is a basic tenet of clean design. And using Backbone view properties like `tagName`, `className` etc is in direct violation of that principle. 
  
However, there is more than one way to achieve a separation of markup and Javascript code. If that separation is all you want from fully self-contained templates, consider using [Backbone.Declarative.Views][] instead, which does the job very well. In fact, Backbone.Inline.Template is just a plug-in for it, adding an additional layer of template wrangling.

A definite plus of Backbone.Declarative.Views is that it works with zero configuration in virtually any Backbone application. Inlining the `el` might be even more intuitive with Backbone.Inline.Template, and some might favour it for reasons of style. But [Backbone frameworks typically require][framework-integration] the templates to be modified in place, which adds a bit of complexity. If you can do without, why not [do it][Backbone.Declarative.Views].

##### The `el` must be inline to make templates work on the server.

If you render your HTML on the server and slap on a Backbone application as a client-side progressive enhancement, you probably want to use the exact same templates on both ends. And your server-side app might require you to define the template root element, the `el`, inline. 

Backbone.Inline.Template is your new best friend in that case, and it saves you from the worries which burden [other approaches][set-element-as-alternative].

##### The `el` itself, and not just its content, depends on template variables.

That, too, is a legitimate requirement. But in that case, sadly, Backbone.Inline.Template is [not for you][no-el-vars]. Have a look at its [limitations][fine-print-limitations] to see why. [Alternatives exist][set-element-as-alternative], though at a cost.

## Dependencies and setup

Backbone.Inline.Template depends on [Backbone.Declarative.Views][] and the Backbone stack: [Backbone][], [Underscore][], and [jQuery][] or one of its replacements. Include backbone.inline.template.js after that lot.

Backbone.Inline.Template augments the Backbone.View base type, so its functionality is available in every view throughout your code. If you use other components which extend Backbone.View, load these components after Backbone.Inline.Template.

The stable version of Backbone.Inline.Template is available in the `dist` directory ([dev][dist-dev], [prod][dist-prod]), including an AMD build ([dev][dist-amd-dev], [prod][dist-amd-prod]). If you use Bower, fetch the files with `bower install backbone.inline.template`. With npm, it is `npm install backbone.inline.template`.

### With Marionette

Load backbone.inline.template.js after [Marionette][].

If you use AMD, please be aware that Marionette is not declared as a dependency in the AMD build of Backbone.Inline.Template. Declare it yourself by adding the following shim to your config:

```javascript
requirejs.config( {
    shim: {
        'backbone.inline.template': {
            deps: ['marionette']
        }
    }
} );
```

## Framework integration: `updateOriginalTemplates`

Backbone leaves it up to you how you deal with your templates. Frameworks built on top of Backbone, however, usually have specific expectations about what is in the template, and what isn't. The `el` of the view usually isn't.

So if your templates contain the `el` of the view initially, it has to be gone by the time the framework processes the template. Backbone.Inline.Template can sort that out for you. Set the configuration option 

```js
Backbone.InlineTemplate.updateOriginalTemplates = true;
```

and your original templates are modified. They just contain the inner HTML of the `el` once Backbone.Inline.Template is done with them.

Also set that option if you are working with pre-existing code which expects "normal" templates (ie, templates without the `el` inside).

##### How does it work?

Let's get the magic out of this process and look at an example. Suppose your original template looks like this:

```html
<script id="some-template" type="text/x-template" data-el-definition="inline">
    <p id="foo" class="bar">
        Lots of fabulous <%= content %> here.
    </p>
</script>
```

As soon as you instantiate a view which uses the template, Backbone.Inline.Template transforms the template into:

```html
<script id="some-template" type="text/x-template" 
    data-tag-name="p" data-id="foo" data-class-name="bar">
    Lots of fabulous <%= content %> here.
</script>
```

This transformed version is presented to the framework when it processes the template. As you can see, the `el` tag is no longer part of the template content – just the inner HTML of the `el` is left. 

Meanwhile, the `el` has morphed into a set of data attributes on the template element (`data-tag-name` etc). Backbone frameworks happily ignore the data attributes. However, they are picked up by [Backbone.Declarative.Views][Backbone.Declarative.Views], the engine behind Backbone.Inline.Template, whenever you instantiate a new view with this template. The `el` of the view is set up accordingly.

##### Limitations of `updateOriginalTemplates`

The `updateOriginalTemplates` option is global. If you use it, the transformation applies to all templates which are [marked for processing][selecting-templates] by Backbone.Inline.Template. You can't transform templates on a case-by-case basis.

Once the template is transformed, the original template element (`<script>` or `<template>`) is updated. So an actual template element needs to be present in the DOM. With `updateOriginalTemplates`, you can't use a raw HTML string as a template (you'll get an error if you do). Provide a node.

## Selecting templates for processing

By default, a template is recognized as having an inline `el` when the template node is marked up with the following data attribute: `data-el-definition: "inline"`. All other templates are left alone.

If that doesn't suit your needs, you can change it by overriding 

```js
Backbone.InlineTemplate.hasInlineEl 
```

with a custom function.

##### Provide a function for `hasInlineEl`

A custom `hasInlineEl` function receives the template node as argument, wrapped in a jQuery object. The function can examine the template node and must return a boolean.

For instance, assume you want templates to be handled by Backbone.Inline.Template if they have an attribute of `type="text/x-inline-template"`. Set it up like this: 

```js
Backbone.InlineTemplate.hasInlineEl = function ( $template ) {
    return $template.attr( "type" ) === "text/x-inline-template";
};
```

In order to treat all templates as having an inline `el`, the function just has to return true:

```js
Backbone.InlineTemplate.hasInlineEl = function () { return true; };
```

##### Provide a function for `removeInlineElMarker`

A second change has to go along with it. Backbone.Inline.Template must know how to remove the attribute, or whatever else you used, which told the application that a template has an inline `el`. 

So if you modify the default behaviour with your own `hasInlineEl` function, also provide a function which removes the "has-inline-el" marker, and override 

```js
Backbone.InlineTemplate.removeInlineElMarker
```

with it. The function receives the template node (wrapped in a jQuery object) as its argument. It must modify the node to make it look like a normal, non-inline template.

In the example above, where templates had their type attribute set to `"text/x-inline-template"`, the type would have to be changed to a standard `"text/x-template"` value:

```js
Backbone.InlineTemplate.removeInlineElMarker = function ( $template ) {
    $template.attr( "type", "text/x-template" );
};
```

In case all templates are treated as having an inline `el`, and hence there is no marker which needs to be removed, just get rid of the function altogether:

```js
Backbone.InlineTemplate.removeInlineElMarker = undefined;
```

## Cache

Backbone.Inline.Template is a plug-in for Backbone.Declarative.Views, which does all the real work. Unsurprisingly, both share the same cache. Backbone.Inline.Template just provides a number of aliases to access that cache.

In the documentation of Backbone.Declarative.Views, you'll find more [about the cache itself][Backbone.Declarative.Views-cache]. Below is a list of the available aliases.

- Tell Backbone.Inline.Template [which template compiler function to use][Backbone.Declarative.Views-compiler]:

  ```js
  // E.g. using _.template as your compiler:
  Backbone.InlineTemplate.custom.compiler = _.template;
  // Alias of 
  Backbone.DeclarativeViews.custom.compiler = _.template;
  ```

- Define a [custom template loader][Backbone.Declarative.Views-loader]:

  ```js
  Backbone.InlineTemplate.custom.loadTemplate = function () { /*...*/ };
  // Alias of 
  Backbone.DeclarativeViews.custom.loadTemplate = function () { /*...*/ };
  ```

- [Retrieve a cached template][Backbone.Declarative.Views-cache-access] in the context of a view:

  ```js
  initialize: function () {
    cachedTemplate = this.inlineTemplate.getCachedTemplate();
    // Alias of 
    cachedTemplate = this.declarativeViews.getCachedTemplate();
  }
  ```

- [Retrieve a cached template][Backbone.Declarative.Views-cache-access] independently of a view, by selector:

  ```js
  cachedTemplate = Backbone.InlineTemplate.getCachedTemplate( "#template" );
  // Alias of 
  cachedTemplate = Backbone.DeclarativeViews.getCachedTemplate( "#template" );
  ```

- [Clear a cached template][Backbone.Declarative.Views-clear-cache] in the context of a view:

  ```js
  someView.inlineTemplate.clearCachedTemplate();
  // Alias of 
  someView.declarativeViews.clearCachedTemplate();
  ```

- [Clear a cached template][Backbone.Declarative.Views-clear-cache] independently of a view, by selector:

  ```js
  Backbone.InlineTemplate.clearCachedTemplate( "#template" );
  // Alias of 
  Backbone.DeclarativeViews.clearCachedTemplate( "#template" );
  ```

- [Clear the cache][Backbone.Declarative.Views-clear-cache]:

  ```js
  Backbone.InlineTemplate.clearCache();
  // Alias of 
  Backbone.DeclarativeViews.clearCache();
  ```

## Fine Print and Limitations

The idea behind Backbone.Inline.Template is that it should "just work" with a minimum of intervention. But there are things to keep in mind, and some use cases are beyond its scope. 

### Just one top-level tag inside the template

The top-level HTML element tag inside a template defines the `el` of the view, and there can just be one such `el`. **You must abide by that rule**.

Multiple top-level HTML elements inside a template will confuse the hell out of the template loader and lead to unexpected results, such as an empty template, invalid and disfigured HTML, or an error while creating the view.

So **don't** do this:

```html
<script id="some-template" type="text/x-template" data-el-definition="inline">
    <section id="main" class="bar">
        <p><%= content %></p>
    </section>
    <footer> <!-- WRONG, second top-level element! -->
        <%= boilerplate %>
    </footer>
</script>
```

However, you can add top-level HTML comments to the template. They are simply ignored.

```html
<script id="some-template" type="text/x-template" data-el-definition="inline">
    <!-- 
        A top-level comment like this doesn't break stuff. 
        It simply won't show up in the HTML output. 
    -->
    <section id="main" class="bar">
        <p><%= content %></p>
    </section>
</script>
```

### Don't use template variables in the `el` itself

Setting up the `el` of a view with template variables is a [valid use case][marionette-2357-comment-designermonkey], but unfortunately, Backbone.Inline.Template doesn't support it. 

Backbone creates the `el` as soon as the view is instantiated, even before `initialize()` is called (and [for a reason][backbone-546-comment-jashkenas]). The `el` already exists before any processing of template data can take place. The data may not even be available that early. In any event, it can't be used for the `el`.

So **don't** do this:

```html
<script id="some-template" type="text/x-template" data-el-definition="inline">
    <p class="<%= el_class %>"> <!-- WRONG, template var in el! -->
        <%= content %>          <!-- This part is OK, of course -->
    </p>
</script>
```

If you need to support template variables in the `el` itself, you have to go down a different route and swap out the `el` on render, when the data is there.

Backbone.Inline.Template can't help you with it and is not useful in that scenario. You can find an [alternative approach below][set-element-as-alternative], and additional inspiration e.g. [on Stack Overflow][so-set-element]. But [be aware of the pitfalls][set-element-cons].

### `el` attributes must be key-value pairs

If the `el` of the view has attributes, they must be key-value pairs. Boolean attributes are ignored. However, that limitation doesn't matter much because almost all attributes are key-value pairs anyway (e.g. `class="foo"`, `lang="en"`). Let's look at the edge cases, though.

- The `contenteditable` attribute must be set with a value, e.g. as `contenteditable="true"`. You can't add it as a boolean attribute (`<p contenteditable>`), or it would get lost when the `el` is created. That said, according to the spec, `contenteditable` [requires a value][mdn-contenteditable] anyway.

- The `hidden` attribute is a proper boolean, ie it is [used without a value][mdn-hidden] (`<p hidden>`). Unfortunately, you can't mark up an `el` with it.

Needless to say, you can use boolean attributes on elements _inside_ the `el`. They just don't work for the `el` itself.

### Leave the `el` in place when rendering

It may be quite obvious, but maybe warrants at least a mention: The `el` is already in place when you render, so don't throw it away needlessly. Nothing breaks if you do ([well, mostly][set-element-cons]), but you take a performance hit and have to face all sorts of event binding woes for no reason.

What does keeping the `el` imply? You defined the `el` inside the template. So if you compile that template as it is, the `el` element shows up in the result. Remove that element before you inject template content into the existing `el` of the view.

Or better still, don't do any of this, don't (re-)compile the template yourself. There is a much easier and more efficient option: Pull the compiled template from the [built-in cache][cache] instead. There, the duplicate `el` tag is already removed for you.

## Alternative approach: `setElement()`

Backbone.Inline.Template and its cousin, [Backbone.Declarative.Views][], do their respective jobs in an unobtrusive way which is compatible with pretty much everything. But [there are limits][no-el-vars] to what they can do. Once once you hit these constraints, you need to find alternatives.

A well-known approach makes use of [`setElement()`][backbone-setelement], which is native to Backbone views, when rendering a view.

##### The pattern

With `setElement()`, you throw away the existing `el` which is provided by Backbone, and replace it with your own when you render the view. The basic pattern looks like this:

```js
render: function () {
    var $existingEl = this.$el,

        // Fill in the template vars and return the HTML of the view,
        // INCLUDING the outer `el`. It doesn't matter here how you 
        // get that done. The evaluated template is a string of HTML.
        evaluatedTemplate = this.template( this.model.attributes ),

        $replacementEl = $( evaluatedTemplate );
  
    // Make the view reference the new node as its `el`
    this.setElement( $replacementEl );

    // Replace the existing `el` node in the DOM with the new one 
    $existingEl.replaceWith( $replacementEl );
    
    // ... other stuff 
}
```

##### The pros

The `setElement()` pattern is unbeatable in one respect: you can use template variables for the `el` of a view.

For instance, assume you need an individual `id` for each `el`, along the lines of 

```html
<li id="item-{{itemNumber}}">
```

For that, you have to recreate the `el` when the template data is ready. The pattern above allows you to do it.

That's not exactly a long list of advantages, but for that one use case, `setElement()` is the way to go.

##### The cons

Relying on `setElement()` has a lot of drawbacks. None of these matter if your use case forces you to recreate the `el` (see [the pros][set-element-pros]). But there is a strong case against using `setElement()` if you have a choice.

For starters, compatibility – both with existing and future code – can quickly become an issue.

- Let's face it: defining the `el` in the template breaks with Backbone conventions. It may be fine for view code you have written yourself, but as soon as you pull third-party Backbone extensions like Marionette into a project, templates of that kind no longer work. You probably have to rewrite the render method of your would-be framework, at the very least, to adapt it.

  Backbone.Inline.Template does its processing very early during the life cycle of a view. That's why it is able to [present a cleaned-up, conventional template][framework-integration] to Backbone frameworks. With `setElement()`, however, you don't have that option. It forces you to keep the original template around until render time. 

- Backbone is not very prescriptive about how it is to be used. It gives its users a lot of flexibility, and expects them to figure out their own way of handling views in particular. As a result, there are many different approaches and implementations.

  Replacing a view's `el` with `setElement()`, on the other hand, requires very specific steps at a very specific time, and may clash with existing coding conventions. Expect problems when integrating it into legacy code. 

The second group of issues is about pitfalls when rendering views with `setElement()`. The devil here is in the details. These issues are solvable, but require attention (and additional code).

- `setElement()` [only rebinds][setelement-event-rebinding-jsbin] events set up with the `events` hash of the view, but not events set up in any other way. You have to remember taking care of them.

- `setElement()` screws up events in nested views. Even though a [good pattern exists][ian-storm-taylor-rendering-views] to deal with it, it's yet another pitfall to be aware of.

- Recreating the `el` and moving the delegated events around has a performance cost which matters as the number of render calls goes up (e.g. large lists).

That's quite a few things to consider, and the list is not even complete. [Long discussions][backbone-546] have taken place about defining the `el` inline, inside a template. The problems associated with re-assigning the `el` during render have come up repeatedly in these discussions. The Backbone team [decided against][backbone-546-comment-jashkenas] this approach back in 2012. For Marionette, [the debate][marionette-2357] is still going on – it has already lasted for years. 

## Build process and tests

If you'd like to fix, customize or otherwise improve the project: here are your tools.

### Setup

[npm][] and [Bower][] set up the environment for you.

- The only thing you've got to have on your machine is [Node.js]. Download the installer [here][Node.js].
- Open a command prompt in the project directory.
- Run `npm install`. (Creates the environment.)
- Run `bower install`. (Fetches the dependencies of the script.)

Your test and build environment is ready now. If you want to test against specific versions of Backbone, edit `bower.json` first.

### Running tests, creating a new build

#### Considerations for testing

To run the tests on remote clients (e.g. mobile devices), start a web server with `grunt interactive` and visit `http://[your-host-ip]:9400/web-mocha/` with the client browser. Running the tests in a browser like this is slow, so it might make sense to disable the power-save/sleep/auto-lock timeout on mobile devices. Use `grunt test` (see below) for faster local testing.

#### Tool chain and commands

The test tool chain: [Grunt][] (task runner), [Karma][] (test runner), [Mocha][] (test framework), [Chai][] (assertion library), [Sinon][] (mocking framework). The good news: you don't need to worry about any of this.

A handful of commands manage everything for you:

- Run the tests in a terminal with `grunt test`.
- Run the tests in a browser interactively, live-reloading the page when the source or the tests change: `grunt interactive`.
- If the live reload bothers you, you can also run the tests in a browser without it: `grunt webtest`.
- Run the linter only with `grunt lint` or `grunt hint`. (The linter is part of `grunt test` as well.)
- Build the dist files (also running tests and linter) with `grunt build`, or just `grunt`.
- Build continuously on every save with `grunt ci`.
- Change the version number throughout the project with `grunt setver --to=1.2.3`. Or just increment the revision with `grunt setver --inc`. (Remember to rebuild the project with `grunt` afterwards.)
- `grunt getver` will quickly tell you which version you are at.

Finally, if need be, you can set up a quick demo page to play with the code. First, edit the files in the `demo` directory. Then display `demo/index.html`, live-reloading your changes to the code or the page, with `grunt demo`. Libraries needed for the demo/playground should go into the Bower dev dependencies, in the project-wide `bower.json`, or else be managed by the dedicated `bower.json` in the demo directory.

_The `grunt interactive` and `grunt demo` commands spin up a web server, opening up the **whole project** to access via http._ So please be aware of the security implications. You can restrict that access to localhost in `Gruntfile.js` if you just use browsers on your machine.

### Changing the tool chain configuration

In case anything about the test and build process needs to be changed, have a look at the following config files:

- `karma.conf.js` (changes to dependencies, additional test frameworks)
- `Gruntfile.js`  (changes to the whole process)
- `web-mocha/_index.html` (changes to dependencies, additional test frameworks)

New test files in the `spec` directory are picked up automatically, no need to edit the configuration for that.

## Release notes

### v.0.1.0

- Initial public release

## License

MIT.

Copyright (c) 2016 Michael Heim.

[quick-intro]: #in-a-nutshell
[use-case]: #why-use-it
[setup]: #dependencies-and-setup
[framework-integration]: #framework-integration-updateoriginaltemplates
[selecting-templates]: #selecting-templates-for-processing
[cache]: #cache
[fine-print-limitations]: #fine-print-and-limitations
[no-el-vars]: #dont-use-template-variables-in-the-el-itself
[set-element-as-alternative]: #alternative-approach-setElement
[set-element-pros]: #the-pros
[set-element-cons]: #the-cons
[build]: #build-process-and-tests

[backbone-546]: https://github.com/jashkenas/backbone/issues/546 "Backbone Issue 546: Don't wrap views if using templates"
[backbone-546-comment-jashkenas]: https://github.com/jashkenas/backbone/issues/546#issuecomment-3604746 "Backbone Issue 546: Don't wrap views if using templates – Comment jashkenas"
[marionette-2357]: https://github.com/marionettejs/backbone.marionette/issues/2357 "Marionette Issue 2357: Use template as el"
[marionette-2357-comment-designermonkey]: https://github.com/marionettejs/backbone.marionette/issues/2357#issuecomment-75448937 "Marionette Issue 2357: Use template as el – Comment designermonkey"
[ian-storm-taylor-rendering-views]: https://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple "Rendering Views in Backbone.js Isn’t Always Simple – Ian Storm Taylor"
[so-set-element]: http://stackoverflow.com/questions/11594961/backbone-not-this-el-wrapping/11598543#11598543 "Backbone, not `this.el` wrapping, Answer by nikoshr – Stack Overflow"
[setelement-event-rebinding-jsbin]: http://jsbin.com/fakadan/8 "Rendering views with setElement: Do DOM events survive? – JS Bin"
[backbone-setelement]: http://backbonejs.org/#View-setElement "setElement() – Backbone.js"
[mdn-contenteditable]: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable "contenteditable – HTML | MDN"
[mdn-hidden]: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden "hidden – HTML | MDN"

[dist-dev]: https://raw.github.com/hashchange/backbone.inline.template/master/dist/backbone.inline.template.js "backbone.inline.template.js"
[dist-prod]: https://raw.github.com/hashchange/backbone.inline.template/master/dist/backbone.inline.template.min.js "backbone.inline.template.min.js"
[dist-amd-dev]: https://raw.github.com/hashchange/backbone.inline.template/master/dist/amd/backbone.inline.template.js "backbone.inline.template.js, AMD build"
[dist-amd-prod]: https://raw.github.com/hashchange/backbone.inline.template/master/dist/amd/backbone.inline.template.min.js "backbone.inline.template.min.js, AMD build"

[data-provider.js]: https://github.com/hashchange/backbone.inline.template/blob/master/spec/helpers/data-provider.js "Source code of data-provider.js"

[Underscore]: http://underscorejs.org/ "Underscore.js"
[jQuery]: http://jquery.com/ "jQuery"
[Backbone]: http://backbonejs.org/ "Backbone.js"
[Marionette]: https://github.com/marionettejs/backbone.marionette#readme "Marionette: a composite application library for Backbone.js"
[Backbone.Declarative.Views]: https://github.com/hashchange/backbone.declarative.views#readme "Backbone.Declarative.Views"

[Backbone.Declarative.Views-cache]: https://github.com/hashchange/backbone.declarative.views#performance-use-the-template-cache "Performance: Use the template cache – Backbone.Declarative.Views"
[Backbone.Declarative.Views-compiler]: https://github.com/hashchange/backbone.declarative.views#keeping-compiled-templates-in-the-cache "Keeping compiled templates in the cache – Backbone.Declarative.Views"
[Backbone.Declarative.Views-loader]: https://github.com/hashchange/backbone.declarative.views#using-a-custom-template-loader "Using a custom template loader – Backbone.Declarative.Views"
[Backbone.Declarative.Views-cache-access]: https://github.com/hashchange/backbone.declarative.views#reading-template-data-from-the-cache "Reading template data from the cache – Backbone.Declarative.Views"
[Backbone.Declarative.Views-clear-cache]: https://github.com/hashchange/backbone.declarative.views#clearing-the-cache "Clearing the cache – Backbone.Declarative.Views"

[Node.js]: http://nodejs.org/ "Node.js"
[Bower]: http://bower.io/ "Bower: a package manager for the web"
[npm]: https://npmjs.org/ "npm: Node Packaged Modules"
[Grunt]: http://gruntjs.com/ "Grunt: The JavaScript Task Runner"
[Karma]: http://karma-runner.github.io/ "Karma - Spectacular Test Runner for Javascript"
[Mocha]: http://visionmedia.github.io/mocha/ "Mocha - the fun, simple, flexible JavaScript test framework"
[Chai]: http://chaijs.com/ "Chai: a BDD / TDD assertion library"
[Sinon]: http://sinonjs.org/ "Sinon.JS - Versatile standalone test spies, stubs and mocks for JavaScript"
[JSHint]: http://www.jshint.com/ "JSHint, a JavaScript Code Quality Tool"