/**
 * Creates the inner content of a template, for use _inside of_ the `el`.
 *
 * @param   {string} varStartDelimiter         start delimiter of a template variable (e.g. "{{" for Mustache)
 * @param   {string} varEndDelimiter           end delimiter of a template variable (e.g. "}}" for Mustache)
 * @param   {object} [options]
 * @param   {string} [options.indentation=""]  a string of whitespace, e.g. "   " or "" (no indentation)
 * @param   {string} [options.insertion=""]    an additional string which is inserted somewhere in the middle of the
 *                                             content (if left undefined, a blank line, plus insertion, appears instead)
 * @returns {string}
 */
function createInnerContent ( varStartDelimiter, varEndDelimiter, options ) {
    var indent = options && options.indentation || "",
        insert = options && options.insertion || "",
        lines = [
            '<h1 class="header">This is a %%header&&</h1>    ',
            'Some random %%text&& with different line breaks.<br><br/><br />',
            insert,
            '<dl class="%%dl_class&&">',
            '  <dt class="dtclass">%%dd_name&&</dt>',
            '  <dd class="ddclass">%%dd_content&&</dd>',
            '</dl>'
        ],
        
        innerContent = _.map( lines, function ( line ) {
            return indent + line;
        } ).join( "\n" );

    return innerContent.replace( /%%/g, varStartDelimiter ).replace( /&&/g, varEndDelimiter );
}

/**
 * Creates a template node for a given ID and content and returns it as a jQuery object.
 *
 * Does not append it to the DOM.
 *
 * @param   {string} id              template ID
 * @param   {string} content         content of the template node
 * @param   {Object} [attributes]    additional attributes of the template node, e.g. { "data-el-definition": "inline" }
 * @param   {string} [tag="script"]  template tag, can be "script" or "template"
 * @returns {jQuery}
 */
function createTemplateNode ( id, content, attributes, tag ) {

    var templateTag = tag || "script",
        templateAttributes = _.extend( {
        id: id,
        type: "text/x-template"
    }, attributes || {} );

    return $( "<" + templateTag + " />" )
        .attr( templateAttributes )
        .text( content );
}

/**
 * Creates the HTML of an inline template and returns the characteristics of the template, including the full HTML, in a
 * hash.
 *
 * @param   {Object}  elDefinition
 * @param   {string}  elDefinition.tagName
 * @param   {string}  [elDefinition.className]            can also be passed in as part of elDefinition.attributes
 * @param   {string}  [elDefinition.id]                   can also be passed in as part of elDefinition.attributes
 * @param   {Object}  [elDefinition.attributes]           can be additional attributes only, as in the Backbone `attributes` property, or include className and id
 *
 * @param   {string}  [elContent=""]                      must not be passed in if the el is self-closing (or must be an empty string then)
 *
 * @param   {Object}  [elFormatting={}]
 * @param   {boolean} [elFormatting.isSelfClosing=false]  whether or not the `el` is self-closing. NB Self-closing els can't have any elContent, of course.
 * @param   {string}  [elFormatting.selfClosingChar=""]   the optional character for closing a self-closing tag, can be "/" (for style "<p/>") or "" (for style "<p>")
 * @param   {string}  [elFormatting.quoteStyle='"']       the quote style used for enclosing attribute values in the HTML, can be "'", '"', or "" (no quotes around attribute values!)
 * @param   {string}  [elFormatting.extraSpace=""]        redundant whitespace to be inserted into the el tag itself (e.g. between attributes), and outside of it
 *                                                        (before the tag is opened, and after it is closed)
 *
 * @returns {TestInlineTemplateCharacteristics}
 */
function createInlineTemplate ( elDefinition, elContent, elFormatting ) {
    var _elContent = elContent || "",
        _elFormatting = elFormatting || {},

        tagName = elDefinition.tagName,
        attrs = elDefinition.attributes || {},
        className = elDefinition.className || attrs.className,
        id = elDefinition.id || attrs.id,

        isSelfClosing = _elFormatting.isSelfClosing,
        selfClosingChar = isSelfClosing && _elFormatting.selfClosingChar || "",

        quoteStyle = _elFormatting.quoteStyle !== undefined ? _elFormatting.quoteStyle : '"',
        extraSpace = _elFormatting.extraSpace || "",

        customAttributes = _.omit( attrs, "className", "id" ),
        fullAttributes = _.extend( {}, customAttributes, { className: className, id: id } ),

        attributeString = _.reduce( fullAttributes, function ( reduced, attrValue, attrName ) {
            var name = attrName === "className" ? "class" : attrName;
            if ( attrValue !== undefined ) {
                reduced += " " + extraSpace + name + extraSpace + "=" + extraSpace + quoteStyle + attrValue + quoteStyle;
            }
            return reduced;
        }, "" ),

        elStartTag = extraSpace + "<" + tagName + attributeString + extraSpace + selfClosingChar + ">",
        elEndTag = isSelfClosing ? extraSpace : "</" + extraSpace + tagName + extraSpace + ">" + extraSpace,
        templateNodeInnerHtml = elStartTag + _elContent + elEndTag;

    if ( isSelfClosing && _elContent ) throw new Error( "createInlineTemplate: Inconsistent setup. A self-closing el tag can't have inner content, but both have been passed as arguments" );

    return {
        html: {
            fullContent: templateNodeInnerHtml,
            elStartTag: elStartTag,
            elEndTag: elEndTag
        },

        el: {
            tagName: tagName,
            className: className,
            id: id,
            attributes: _.size( customAttributes ) ? customAttributes : undefined,
            fullAttributes: _.size( fullAttributes ) ? fullAttributes : undefined
        }
    }
}

/**
 * @name  TestInlineTemplateCharacteristics
 * @type  {Object}
 *
 * @property {TestTemplateHtml} html
 * @property {TestTemplateEl}   el
 */

/**
 * @name  TestTemplateHtml
 * @type  {Object}
 *
 * @property {string} fullContent
 * @property {string} elStartTag
 * @property {string} elEndTag      empty string for self-closing tags
 */

/**
 * @name  TestTemplateEl
 * @type  {Object}
 *
 * @property {string}           tagName
 * @property {string|undefined} className
 * @property {string|undefined} id
 * @property {Object|undefined} attributes
 * @property {Object|undefined} fullAttributes
 */
