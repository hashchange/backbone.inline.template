/**
 * Transforms a HTML5 data-* attributes hash to a hash of Javascript properties.
 *
 * - The key names are changed. The "data-" prefix is dropped, and hyphen notation is changed to camel case.
 * - Some values are changed. If a data attribute is used to store an object, it has been converted to a JSON string.
 *   So JSON-string values are converted back into actual objects.
 *
 * Example:
 *     {
 *         "data-my-prop": "some value",
 *         "data-hash":  '{ "foo": "nested foo", "bar": "nested bar" }'
 *     }
 * =>
 *     {
 *         myProp: "some value",
 *         hash:   { foo: "nested foo", bar: "nested bar" }
 *     }
 *
 * @param   {Object} dataAttributesHash
 * @returns {Object}
 */
function dataAttributesToProperties ( dataAttributesHash ) {
    var transformed = {};

    $.each( dataAttributesHash, function ( key, value ) {
        // Drop the "data-" prefix, then convert to camelCase
        key = key
            .replace( /^data-/, "" )
            .replace( /-([a-z])/gi, function ( $0, $1 ) {
                return $1.toUpperCase();
            } );

        try {
            value = $.parseJSON( value );
        } catch ( err ) {}

        transformed[key] = value;
    } );

    return transformed;
}

/**
 * Transforms a hash of Javascript properties into a HTML5 data-* attributes hash. Is the inverse function of
 * `dataAttributesToProperties()`.
 *
 * @param   {Object} attributesHash
 * @returns {Object}
 */
function propertiesToDataAttributes ( attributesHash ) {
    var transformed = {};

    $.each( attributesHash, function ( key, value ) {
        // Convert camelCase to dashed notation, then add the "data-" prefix
        key = "data-" + key.replace( /([a-z])([A-Z])/g, function ( $0, $1, $2 ) {
                return $1 + "-" + $2.toLowerCase();
            } );

        if ( $.isPlainObject( value ) ) value = JSON.stringify( value );

        transformed[key] = value;
    } );

    return transformed;
}

/**
 * Transforms a hash of HTML attributes - e.g., data attributes - into a string.
 *
 * The string has a trailing slash, but not a leading one.
 *
 * The string can be used to create the HTML of a tag with the given attributes. Data attributes containing a
 * stringified JSON structure are fully supported (simply by using single quotes around attribute values here).
 *
 * @param   {Object} attributesHash
 * @returns {string}
 */
function attributesHashToString ( attributesHash ) {
    return _.reduce( attributesHash, function ( attrString, value, key ) {
        return attrString + key + "='" + value + "' ";
    }, "" );
}

/**
 * Receives a HTML element and returns a hash of its attributes.
 *
 * A boolean attribute, e.g. `hidden`, is returned with an empty string as its value.
 *
 * For the full lowdown, see http://stackoverflow.com/a/38623847/508355
 *
 * @param   {jQuery|Element} node
 * @returns {Object}
 */
function getAttributes ( node ) {
    var attrs = {};

    if ( node instanceof $ ) node = node[0];
    $.each( node.attributes, function ( index, attribute ) {
        attrs[attribute.name] = attribute.value;
    } );

    return attrs;
}

/**
 * Normalizes an attributes hash, accounting for browser-dependent variations in attribute names. Also transforms the
 * "class" property to "className".
 *
 * As for browser-dependent variations, currently "contentEditable" (older IE, e.g. IE9) is normalized to
 * "contenteditable".
 *
 * @param   {Object|undefined} hash
 * @returns {Object|undefined}
 */
function normalizeAttributes ( hash ) {
    var normalized = {};

    // Bail out if not a hash, e.g. if undefined
    if ( hash === undefined ) return hash;

    $.each( hash, function ( key, value ) {
        if ( key.toLowerCase() === "contenteditable" ) key = "contenteditable";
        if ( key === "class" ) key = "className";
        normalized[key] = value;
    } );

    return normalized;
}

/**
 * Normalizes a cache entry, accounting for browser-dependent variations in attribute names. Does not alter the input
 * object, returns a (shallow) clone.
 *
 * Ie, the attributes property of a cache entry is normalized with normalizeAttributes(). See there for more.
 *
 * @param   {Object} entry
 * @returns {Object}
 */
function normalizeCacheEntry ( entry ) {
    var normalized = _.extend( {}, entry );

    if ( entry.attributes !== undefined ) normalized.attributes = normalizeAttributes( entry.attributes );

    return normalized;
}