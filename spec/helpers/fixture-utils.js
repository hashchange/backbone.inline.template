/**
 * Creates the inner content of a template, for use _inside of_ the `el`.
 * @param   {string} varStartDelimiter  start delimiter of a template variable (e.g. "{{" for Mustache)
 * @param   {string} varEndDelimiter    end delimiter of a template variable (e.g. "}}" for Mustache)
 * @param   {string} indentation        a string of whitespace, e.g. "   " or "" (no indentation)
 * @returns {string}
 */
function createInnerContent ( varStartDelimiter, varEndDelimiter, indentation ) {
    var indent = indentation || "",
        innerContent = indent + '<h1 class="header">This is a %%Header&&</h1>    \n' +
                       indent + 'Some random %%text&& with different line breaks.<br><br/><br />\n' +
                       indent + '<dl class="%%dl_class&&">\n' +
                       indent + '  <dt class="dtclass">%%dd_name&&</dt>\n' +
                       indent + '  <dd class="ddclass">%%dd_content&&</dd>\n' +
                       indent + '</dl>';

    return innerContent.replace( "%%", varStartDelimiter ).replace( "&&", varEndDelimiter );
}