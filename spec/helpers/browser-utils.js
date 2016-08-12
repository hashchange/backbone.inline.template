// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// No dependencies on other utils
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

/**
 * Detects if the browser supports touch events.
 *
 * @returns {boolean}
 */
function supportsTouchEvents () {
    return !!( "ontouchstart" in window );
}

/**
 * Detects if the browser supports pointer events.
 *
 * @returns {boolean}
 */
function supportsPointerEvents () {
    return !!( "onpointerdown" in window );
}

/**
 * Detects if the browser is capable of responding to touch input, at least in theory. (It doesn't necessarily mean that
 * the browser is running on a touch-enabled device.)
 *
 * @returns {boolean}
 */
function supportsTouchUI () {
    // NB We must explicitly exclude desktop IE. IE11 advertises its support of pointer events, but it doesn't respond
    // to (simulated) taps in a desktop environment.
    var isDesktopIE = isIE() && !isIEMobile();
    return ( supportsTouchEvents() || supportsPointerEvents() ) && !isDesktopIE;
}

/**
 * Detects if the browser is on iOS. Works for Safari as well as other browsers, say, Chrome on iOS.
 *
 * Required for some iOS behaviour which can't be feature-detected in any way.
 *
 * Can use a version requirement (major version only). A range can also be specified, e.g. with an option like
 * { gte: 8, lt: 11 }.
 *
 * @param {Object} [opts]
 * @param {number} [opts.eq]   the iOS version must be as specified
 * @param {number} [opts.lt]   the iOS version must be less than the one specified
 * @param {number} [opts.lte]  the iOS version must be less than or equal to the one specified
 * @param {number} [opts.gt]   the iOS version must be greater than the one specified
 * @param {number} [opts.gte]  the iOS version must be greater than or equal to the one specified
 *
 * @returns {boolean}
 */
function isIOS ( opts ) {
    var ver,
        isMatch = /iPad|iPhone|iPod/gi.test( navigator.userAgent );

    if ( isMatch && opts ) {

        ver = getIOSVersion();
        if ( opts.eq ) isMatch = ver === opts.eq;
        if ( isMatch && opts.lt ) isMatch = ver < opts.lt;
        if ( isMatch && opts.lte ) isMatch = ver <= opts.lte;
        if ( isMatch && opts.gt ) isMatch = ver > opts.gt;
        if ( isMatch && opts.gte ) isMatch = ver >= opts.gte;

    }

    return isMatch;
}

/**
 * Detects if the browser is on Android.
 *
 * @returns {boolean}
 */
function isAndroid () {
    return /Android/gi.test( navigator.userAgent );
}

/**
 * Detects if the browser is on Windows Phone.
 *
 * @returns {boolean}
 */
function isIEMobile () {
    return /IEMobile/gi.test( navigator.userAgent );
}

/**
 * Detects if the browser running on a phone or tablet.
 *
 * Using a short version, not exhaustive.
 *
 * For the list (long and short), and possible updates, see http://stackoverflow.com/a/3540295/508355 (community wiki)
 *
 * @returns {boolean}
 */
function isMobile () {
    return isIOS() || isAndroid() || isIEMobile() || /webOS|BlackBerry|Opera Mini/gi.test( navigator.userAgent );
}

/**
 * Detects IE.
 *
 * Can use a version requirement. A range can also be specified, e.g. with an option like { gte: 8, lt: 11 }.
 *
 * @param {Object} [opts]
 * @param {number} [opts.eq]   the IE version must be as specified
 * @param {number} [opts.lt]   the IE version must be less than the one specified
 * @param {number} [opts.lte]  the IE version must be less than or equal to the one specified
 * @param {number} [opts.gt]   the IE version must be greater than the one specified
 * @param {number} [opts.gte]  the IE version must be greater than or equal to the one specified
 *
 * @returns {boolean}
 */
function isIE ( opts ) {
    var ver = getIEVersion(),
        isMatch = ver !== 0;

    opts || ( opts = {} );

    if ( isMatch && opts.eq ) isMatch = ver === opts.eq;
    if ( isMatch && opts.lt ) isMatch = ver < opts.lt;
    if ( isMatch && opts.lte ) isMatch = ver <= opts.lte;
    if ( isMatch && opts.gt ) isMatch = ver > opts.gt;
    if ( isMatch && opts.gte ) isMatch = ver >= opts.gte;

    return isMatch;
}

/**
 * Detects the IE version. Returns the major version number, or 0 if the browser is not IE.
 *
 * Simple solution, solely based on UA sniffing. In a better implementation, conditional comments would be used to
 * detect IE6 to IE9 - see https://gist.github.com/cowboy/542301 for an example. UA sniffing would only serve as a
 * fallback to detect IE > 9. There are also other solutions to infer the version of IE > 9. For inspiration, see
 * http://stackoverflow.com/q/17907445/508355.
 */
function getIEVersion () {
    var ieMatch = /MSIE (\d+)/.exec( navigator.userAgent ) || /Trident\/.+? rv:(\d+)/.exec( navigator.userAgent );
    return ( ieMatch && ieMatch.length ) ? parseFloat( ieMatch[1] ) : 0;
}

/**
 * Detects the iOS version. Returns the major version number, or 0 if the browser is not running on iOS.
 *
 * Simple solution, solely based on UA sniffing.
 */
function getIOSVersion () {
    var iOSMatch = /(iPad|iPhone|iPod).* OS (\d+)/gi.exec( navigator.userAgent );
    return ( iOSMatch && iOSMatch.length > 1 ) ? parseFloat( iOSMatch[2] ) : 0;
}

function isSlimerJs () {
    return /SlimerJS/.test( navigator.userAgent );
}

function isPhantomJs () {
    return /PhantomJS/.test( navigator.userAgent );
}

// Legacy name, still around in old test code.
function inPhantomJs () {
    return isPhantomJs();
}

