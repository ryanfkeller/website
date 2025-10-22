/***************************************************************
 * JSDOM Utilities
 ***************************************************************/
/**
 * Storage for JSDOM document and window eventListeners and keys
 * added during tests so they can be removed during cleanup
 */
const jsdomSideEffects = {
    document: {
        addEventListener: {
            fn: document.addEventListener,
            refs: [],
        },
        keys: Object.keys(document),
    },
    window: {
        addEventListener: {
            fn: window.addEventListener,
            refs: [],
        },
        keys: Object.keys(window),
    },
};

/**
 * Sets up addEventListener spies to track event listeners added during tests.
 * Should be called in beforeAll
 */
function setupJSDOMSpies() {
    ['document', 'window'].forEach(obj => {
        const fn = jsdomSideEffects[obj].addEventListener.fn;
        const refs = jsdomSideEffects[obj].addEventListener.refs;

        function addEventListenerSpy(type, listener, options) {
            // Store listener reference
            refs.push({type, listener, options});

            // Call original addEventListener
            fn.call(global[obj], type, listener, options);
        }

        // Add default key array to prevent removal during reset
        jsdomSideEffects[obj].keys.push('addEventListener');

        // Replace addEventListener with spy
        global[obj].addEventListener = addEventListenerSpy;
    });
}

/**
 * Resets JSDOM to a clean state by
 * - Removing all attributes from document.documentElement
 * - Removing all DOM elements
 * - Removing event listeners added during tests
 * - Removing properties added to window/document
 * - Restoring the HTML structure specified
 * Should be called in beforeEach
 */
function resetJSDOM(htmlContent) {
    const rootElm = document.documentElement;

    // Remove attributes on root element
    [...rootElm.attributes].forEach(attr => rootElm.removeAttribute(attr.name));

    // Remove elements (faster than setting innerHTML)
    while (rootElm.firstChild) {
        rootElm.removeChild(rootElm.firstChild);
    }

    // Remove global listeners and keys
    ['document', 'window'].forEach(obj => {
        const refs = jsdomSideEffects[obj].addEventListener.refs;

        // Remove listeners
        while (refs.length) {
            const { type, listener, options } = refs.pop();
            global[obj].removeEventListener(type, listener, options);
        }

        // Remove added keys
        Object.keys(global[obj])
            .filter(key=> !jsdomSideEffects[obj].keys.includes(key))
            .forEach(key => {
                delete global[obj][key];
            });
    });
    rootElm.innerHTML = htmlContent;
}

/***************************************************************
 * General Utilities
 ***************************************************************/

/**
 * Adds the utils.js timeZoneText function into the document head
 * so it is accessible globally, as it would be in script executions
 */
function injectTimezoneShim() {
    const script = document.createElement('script');
    script.id = 'test-timezone-shim';
    script.textContent = `
      function timeZoneText() {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return tz ? 'Times are in your local time zone: ' + tz : 'Times are in your local time zone';
      }
    `;
    document.head.appendChild(script);
}

module.exports = {
    setupJSDOMSpies,
    resetJSDOM,
    injectTimezoneShim
};
