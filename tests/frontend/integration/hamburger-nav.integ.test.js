const fs = require('fs');
const path = require('path');
const { setupJSDOMSpies, resetJSDOM } = require('../utils/jsdom-utils.js');
const htmlContent = require('../../../_includes/header.html')


const MOBILE_WIDTH = 375;
const DESKTOP_WIDTH = 1024;



describe('hamburger-nav integration', () => {
    let headerNav;
    let burgerImage;
    let burgerIcon;
    let burgerXIcon;

    /**********************
     * Test Helpers
     **********************/
    function setViewportWidth(width) {
        Object.defineProperty(document.body, 'clientWidth', {
            writable: true,
            configurable: true,
            value: width
        });
        window.dispatchEvent(new window.Event('resize'));
    }

    function getNavIcons() {
        return {
            burgerIcon: document.querySelector('#hamburger-nav'),
            burgerXIcon: document.querySelector(`#hamburger-nav-x`),
        };
    }


    beforeAll(() => {
        setupJSDOMSpies();
    });

    beforeEach(() => {
        // Setup the DOM
        resetJSDOM(htmlContent);

        // Clear the module cache
        jest.resetModules();

        // Import our script
        require('../../../assets/js/hamburger-nav.js');

        // Set clientWidth to mobile (otherwise defaults to 0)
        setViewportWidth(MOBILE_WIDTH);

        // Get our handles
        headerNav = document.querySelector('#headerNav');
        burgerImage = document.querySelector('#burgerImage');
    });


    it('should swap burger icons and headerNav visibility when burgerImage is clicked', () => {
        let {burgerIcon, burgerXIcon} = getNavIcons();

        // Confirm initial state (headerNav style is '', button expanded is null, icon is burger)
        expect(headerNav.style.display).toBe("");
        expect(burgerImage.getAttribute('aria-expanded')).toBeNull();
        expect(burgerIcon).not.toBeNull();
        expect(burgerXIcon).toBeNull();
        
        // Click burgerImage to open, re-grab our icon elements
        burgerImage.click();
        ({burgerIcon, burgerXIcon} = getNavIcons());

        // Confirm state now (headerNav style is flex, button expanded is true, icon is X)
        expect(headerNav.style.display).toBe('flex');
        expect(burgerImage.getAttribute('aria-expanded')).toBe('true');
        expect(burgerIcon).toBeNull();
        expect(burgerXIcon).not.toBeNull();
        
        // Click burgerImage to close, re-grab our icon elements
        burgerImage.click();
        ({burgerIcon, burgerXIcon} = getNavIcons());

        // Confirm state now (headerNav style is none, button expanded is false, icon is burger)
        expect(headerNav.style.display).toBe('none');
        expect(burgerImage.getAttribute('aria-expanded')).toBe('false');
        expect(burgerIcon).not.toBeNull();
        expect(burgerXIcon).toBeNull();
    });

    it('should reset the navbar properties when resizing the window >767', () => {
        let {burgerIcon, burgerXIcon} = getNavIcons();

        // Confirm initial state (headerNav style is '', button expanded is null, icon is burger)
        expect(headerNav.style.display).toBe("");
        expect(burgerImage.getAttribute('aria-expanded')).toBeNull();
        expect(burgerIcon).not.toBeNull();
        expect(burgerXIcon).toBeNull();

        // Click to update the style and icon
        burgerImage.click();
        ({burgerIcon, burgerXIcon} = getNavIcons());

        // Confirm state now (headerNav style is flex, button expanded is true, icon is X)
        expect(headerNav.style.display).toBe('flex');
        expect(burgerImage.getAttribute('aria-expanded')).toBe('true');
        expect(burgerIcon).toBeNull();
        expect(burgerXIcon).not.toBeNull();

        // Resize the Viewport
        setViewportWidth(1024);
        ({burgerIcon, burgerXIcon} = getNavIcons());

        // Confirm state now (headerNav style is null, button is expanded, icon is burger)
        expect(headerNav.style.display).toBe('');
        expect(burgerImage.getAttribute('aria-expanded')).toBe('true'); // doesn't get reset
        expect(burgerIcon).not.toBeNull();
        expect(burgerXIcon).toBeNull();
        
    });
});